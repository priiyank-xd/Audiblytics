from unittest.mock import patch
from uuid import UUID, uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.models.recording import Recording
from app.services.r2_client import PresignedGetPlayback, PresignedPutUpload


def _recording_payload(recording_id: str | None = None) -> dict:
    return {
        "id": recording_id or str(uuid4()),
        "recordingDate": "2026-05-31T12:00:00.000Z",
        "paragraphId": str(uuid4()),
        "durationMs": 5000,
        "mimeType": "audio/webm",
        "dayOfUse": 1,
    }


@pytest.mark.asyncio
async def test_list_recordings_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/recordings")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_recordings_empty(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/api/v1/recordings")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_list_recordings_excludes_pending(auth_client: AsyncClient) -> None:
    recording_id = await _start_pending_recording(auth_client)
    response = await auth_client.get("/api/v1/recordings")
    assert response.status_code == 200
    assert response.json() == []

    await auth_client.post(f"/api/v1/recordings/{recording_id}/complete")
    response = await auth_client.get("/api/v1/recordings")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["id"] == recording_id
    assert body[0]["storageKey"] is not None


@pytest.mark.asyncio
async def test_start_upload_requires_auth(client: AsyncClient) -> None:
    response = await client.post("/api/v1/recordings", json=_recording_payload())
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_start_upload_success(auth_client: AsyncClient) -> None:
    recording_id = str(uuid4())
    payload = _recording_payload(recording_id)
    mock_presign = PresignedPutUpload(
        url="https://example.com/presigned-put",
        storage_key=f"recordings/x/{recording_id}.webm",
        expires_in=900,
    )
    with patch(
        "app.api.v1.recordings.presign_put_upload",
        return_value=mock_presign,
    ):
        response = await auth_client.post("/api/v1/recordings", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["recordingId"] == recording_id
    assert body["uploadUrl"] == mock_presign.url
    assert body["expiresIn"] == 900


@pytest.mark.asyncio
async def test_start_upload_persists_pending_row(auth_client: AsyncClient) -> None:
    from app.core.database import get_session_factory

    recording_id = str(uuid4())
    payload = _recording_payload(recording_id)
    with patch(
        "app.api.v1.recordings.presign_put_upload",
        return_value=PresignedPutUpload(
            url="https://example.com/put",
            storage_key="recordings/u/r.webm",
            expires_in=900,
        ),
    ):
        await auth_client.post("/api/v1/recordings", json=payload)

    factory = get_session_factory()
    async with factory() as session:
        result = await session.execute(select(Recording).where(Recording.id == UUID(recording_id)))
        row = result.scalar_one()
        assert row.storage_key is None
        assert row.duration_ms == 5000
        assert row.day_of_use == 1


@pytest.mark.asyncio
async def test_start_upload_idempotent_pending(auth_client: AsyncClient) -> None:
    recording_id = str(uuid4())
    payload = _recording_payload(recording_id)
    first = PresignedPutUpload(url="https://example.com/a", storage_key="k1", expires_in=900)
    second = PresignedPutUpload(url="https://example.com/b", storage_key="k2", expires_in=900)
    with patch("app.api.v1.recordings.presign_put_upload", side_effect=[first, second]):
        r1 = await auth_client.post("/api/v1/recordings", json=payload)
        r2 = await auth_client.post("/api/v1/recordings", json=payload)

    assert r1.status_code == 201
    assert r2.status_code == 201
    assert r1.json()["uploadUrl"] == first.url
    assert r2.json()["uploadUrl"] == second.url


@pytest.mark.asyncio
async def test_start_upload_conflict_when_complete(auth_client: AsyncClient) -> None:
    recording_id = str(uuid4())
    payload = _recording_payload(recording_id)
    with patch(
        "app.api.v1.recordings.presign_put_upload",
        return_value=PresignedPutUpload(url="https://x", storage_key="k", expires_in=900),
    ):
        await auth_client.post("/api/v1/recordings", json=payload)

    from app.core.database import get_session_factory

    factory = get_session_factory()
    async with factory() as session:
        result = await session.execute(select(Recording).where(Recording.id == UUID(recording_id)))
        row = result.scalar_one()
        row.storage_key = "recordings/u/r.webm"
        await session.commit()

    again = await auth_client.post("/api/v1/recordings", json=payload)
    assert again.status_code == 409
    assert again.json()["detail"]["error"]["kind"] == "conflict"


@pytest.mark.asyncio
async def test_start_upload_r2_not_configured(auth_client: AsyncClient) -> None:
    from app.services.r2_client import R2ConfigurationError

    with patch(
        "app.api.v1.recordings.presign_put_upload",
        side_effect=R2ConfigurationError("R2 is not configured"),
    ):
        response = await auth_client.post("/api/v1/recordings", json=_recording_payload())

    assert response.status_code == 503
    assert response.json()["detail"]["error"]["kind"] == "storage_error"


@pytest.mark.asyncio
async def test_start_upload_validation_error(auth_client: AsyncClient) -> None:
    payload = _recording_payload()
    payload["mimeType"] = "audio/wav"
    response = await auth_client.post("/api/v1/recordings", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_start_upload_cross_user_id_conflict(client: AsyncClient) -> None:
    recording_id = str(uuid4())
    payload = _recording_payload(recording_id)
    with patch(
        "app.api.v1.recordings.presign_put_upload",
        return_value=PresignedPutUpload(url="https://x", storage_key="k", expires_in=900),
    ):
        await client.post(
            "/api/v1/auth/register",
            json={"email": "user-a@example.com", "password": "password123"},
        )
        first = await client.post("/api/v1/recordings", json=payload)
        assert first.status_code == 201

        await client.post(
            "/api/v1/auth/register",
            json={"email": "user-b@example.com", "password": "password123"},
        )
        second = await client.post("/api/v1/recordings", json=payload)

    assert second.status_code == 409
    assert second.json()["detail"]["error"]["kind"] == "conflict"


@pytest.mark.asyncio
async def test_start_upload_metadata_drift_on_retry(auth_client: AsyncClient) -> None:
    recording_id = str(uuid4())
    payload = _recording_payload(recording_id)
    with patch(
        "app.api.v1.recordings.presign_put_upload",
        return_value=PresignedPutUpload(url="https://x", storage_key="k", expires_in=900),
    ):
        await auth_client.post("/api/v1/recordings", json=payload)
        drifted = {**payload, "durationMs": 9999}
        response = await auth_client.post("/api/v1/recordings", json=drifted)

    assert response.status_code == 409
    assert "different metadata" in response.json()["detail"]["error"]["message"]


@pytest.mark.asyncio
async def test_start_upload_presign_value_error(auth_client: AsyncClient) -> None:
    with patch(
        "app.api.v1.recordings.presign_put_upload",
        side_effect=ValueError("Unsupported mime type: audio/bad"),
    ):
        response = await auth_client.post("/api/v1/recordings", json=_recording_payload())

    assert response.status_code == 422
    assert response.json()["detail"]["error"]["kind"] == "validation_error"


async def _start_pending_recording(auth_client: AsyncClient, recording_id: str | None = None) -> str:
    rid = recording_id or str(uuid4())
    payload = _recording_payload(rid)
    with patch(
        "app.api.v1.recordings.presign_put_upload",
        return_value=PresignedPutUpload(url="https://example.com/put", storage_key="k", expires_in=900),
    ):
        response = await auth_client.post("/api/v1/recordings", json=payload)
    assert response.status_code == 201
    return rid


@pytest.mark.asyncio
async def test_complete_requires_auth(client: AsyncClient) -> None:
    response = await client.post(f"/api/v1/recordings/{uuid4()}/complete")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_complete_success(auth_client: AsyncClient) -> None:
    recording_id = await _start_pending_recording(auth_client)
    response = await auth_client.post(f"/api/v1/recordings/{recording_id}/complete")
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == recording_id
    assert body["storageKey"] is not None

    from app.core.database import get_session_factory

    factory = get_session_factory()
    async with factory() as session:
        result = await session.execute(select(Recording).where(Recording.id == UUID(recording_id)))
        row = result.scalar_one()
        assert row.storage_key is not None
        assert body["storageKey"] == row.storage_key
        assert row.storage_key.endswith(".webm")


@pytest.mark.asyncio
async def test_complete_idempotent(auth_client: AsyncClient) -> None:
    recording_id = await _start_pending_recording(auth_client)
    first = await auth_client.post(f"/api/v1/recordings/{recording_id}/complete")
    second = await auth_client.post(f"/api/v1/recordings/{recording_id}/complete")
    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["storageKey"] == second.json()["storageKey"]


@pytest.mark.asyncio
async def test_complete_not_found(auth_client: AsyncClient) -> None:
    response = await auth_client.post(f"/api/v1/recordings/{uuid4()}/complete")
    assert response.status_code == 404
    assert response.json()["detail"]["error"]["kind"] == "not_found"


@pytest.mark.asyncio
async def test_playback_url_requires_auth(client: AsyncClient) -> None:
    response = await client.get(f"/api/v1/recordings/{uuid4()}/playback-url")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_playback_url_success(auth_client: AsyncClient) -> None:
    recording_id = await _start_pending_recording(auth_client)
    await auth_client.post(f"/api/v1/recordings/{recording_id}/complete")

    mock_presign = PresignedGetPlayback(url="https://example.com/playback", expires_in=120)
    with patch("app.api.v1.recordings.presign_get_playback", return_value=mock_presign):
        response = await auth_client.get(f"/api/v1/recordings/{recording_id}/playback-url")

    assert response.status_code == 200
    body = response.json()
    assert body["playbackUrl"] == mock_presign.url
    assert body["expiresIn"] == 120


@pytest.mark.asyncio
async def test_playback_url_pending_conflict(auth_client: AsyncClient) -> None:
    recording_id = await _start_pending_recording(auth_client)
    response = await auth_client.get(f"/api/v1/recordings/{recording_id}/playback-url")
    assert response.status_code == 409
    assert response.json()["detail"]["error"]["kind"] == "conflict"


@pytest.mark.asyncio
async def test_playback_url_not_found(auth_client: AsyncClient) -> None:
    response = await auth_client.get(f"/api/v1/recordings/{uuid4()}/playback-url")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_playback_url_r2_not_configured(auth_client: AsyncClient) -> None:
    from app.services.r2_client import R2ConfigurationError

    recording_id = await _start_pending_recording(auth_client)
    await auth_client.post(f"/api/v1/recordings/{recording_id}/complete")

    with patch(
        "app.api.v1.recordings.presign_get_playback",
        side_effect=R2ConfigurationError("R2 is not configured"),
    ):
        response = await auth_client.get(f"/api/v1/recordings/{recording_id}/playback-url")

    assert response.status_code == 503
    assert response.json()["detail"]["error"]["kind"] == "storage_error"


@pytest.mark.asyncio
async def test_complete_cross_user_not_found(client: AsyncClient) -> None:
    recording_id = str(uuid4())
    payload = _recording_payload(recording_id)
    with patch(
        "app.api.v1.recordings.presign_put_upload",
        return_value=PresignedPutUpload(url="https://x", storage_key="k", expires_in=900),
    ):
        await client.post(
            "/api/v1/auth/register",
            json={"email": "complete-user-a@example.com", "password": "password123"},
        )
        await client.post("/api/v1/recordings", json=payload)

        await client.post(
            "/api/v1/auth/register",
            json={"email": "complete-user-b@example.com", "password": "password123"},
        )
        response = await client.post(f"/api/v1/recordings/{recording_id}/complete")

    assert response.status_code == 404
    assert response.json()["detail"]["error"]["kind"] == "not_found"


@pytest.mark.asyncio
async def test_complete_validation_error_bad_mime(auth_client: AsyncClient) -> None:
    recording_id = await _start_pending_recording(auth_client)

    from app.core.database import get_session_factory

    factory = get_session_factory()
    async with factory() as session:
        result = await session.execute(select(Recording).where(Recording.id == UUID(recording_id)))
        row = result.scalar_one()
        row.mime_type = "audio/bad"
        await session.commit()

    response = await auth_client.post(f"/api/v1/recordings/{recording_id}/complete")
    assert response.status_code == 422
    assert response.json()["detail"]["error"]["kind"] == "validation_error"
