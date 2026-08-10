"""Story 16.1 — every authenticated user-owned route is isolated (AC5, AC6, AC7).

User A creates data on every write route, then user B attempts each read and
write route. Cross-account identifiers are 404, never 403, and A's data is
still intact afterwards.
"""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.schemas.paragraph import HardWord, ParagraphResult
from app.services.r2_client import PresignedGetPlayback, PresignedPutUpload

PASSWORD = "password123"
USER_A = "isolation-a@example.com"
USER_B = "isolation-b@example.com"

SAMPLE_RESULT = ParagraphResult(
    paragraph="The arboreal creature leaped between branches.",
    hardWords=[
        HardWord(
            word="arboreal",
            ipa="/ɑːrˈbɔːriəl/",
            pronunciationGuide="ar-BOR-ee-ul",
            meaning="adjective · living in trees",
            exampleSentence="Arboreal monkeys rarely touch the ground.",
        ),
    ],
)

PRESIGN_PUT = PresignedPutUpload(url="https://example.com/put", storage_key="k", expires_in=900)
PRESIGN_GET = PresignedGetPlayback(url="https://example.com/get", expires_in=120)


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _recording_payload(recording_id: str) -> dict:
    return {
        "id": recording_id,
        "recordingDate": f"{_today()}T12:00:00.000Z",
        "paragraphId": str(uuid4()),
        "durationMs": 5000,
        "mimeType": "audio/webm",
        "dayOfUse": 1,
    }


def _word_payload(word_id: str, word: str) -> dict:
    return {
        "id": word_id,
        "word": word,
        "ipa": "/ˌsɛrənˈdɪpɪti/",
        "pronunciationGuide": "ser-en-DIP-i-tee",
        "meaning": "pleasant surprise",
        "exampleSentence": "Finding the book was pure serendipity.",
        "savedAt": f"{_today()}T10:00:00.000Z",
        "sourceParagraphId": str(uuid4()),
        "reviewCount": 0,
        "lastReviewedAt": None,
        "difficultyRating": 1,
    }


async def _register(client: AsyncClient, email: str) -> None:
    response = await client.post("/api/v1/auth/register", json={"email": email, "password": PASSWORD})
    assert response.status_code == 201


async def _login(client: AsyncClient, email: str) -> None:
    response = await client.post("/api/v1/auth/login", json={"email": email, "password": PASSWORD})
    assert response.status_code == 200


async def _seed_user_a(client: AsyncClient) -> dict[str, str]:
    """Create one row on every user-owned write route as user A."""
    with patch(
        "app.api.v1.paragraphs.generate_paragraph_with_gemini",
        new_callable=AsyncMock,
        return_value=SAMPLE_RESULT,
    ):
        generated = await client.post("/api/v1/paragraphs/generate", json={"recycleWords": []})
    assert generated.status_code == 201

    recording_id = str(uuid4())
    with patch("app.api.v1.recordings.presign_put_upload", return_value=PRESIGN_PUT):
        started = await client.post("/api/v1/recordings", json=_recording_payload(recording_id))
    assert started.status_code == 201
    completed = await client.post(f"/api/v1/recordings/{recording_id}/complete")
    assert completed.status_code == 200

    word_id = str(uuid4())
    saved = await client.post("/api/v1/collection", json=_word_payload(word_id, "alpha"))
    assert saved.status_code == 201

    completion = await client.put(f"/api/v1/completions/{_today()}", json={"hasReadIt": True})
    assert completion.status_code == 200

    stamped = await client.post("/api/v1/days-of-use", json={"utcDate": _today()})
    assert stamped.status_code == 201

    patched = await client.patch("/api/v1/settings", json={"theme": "mystery"})
    assert patched.status_code == 200

    return {
        "paragraphId": generated.json()["id"],
        "recordingId": recording_id,
        "wordId": word_id,
    }


@pytest.fixture
async def seeded(client: AsyncClient) -> dict[str, str]:
    """A's data created, then B registered — the client cookie now belongs to B."""
    await _register(client, USER_A)
    ids = await _seed_user_a(client)
    await _register(client, USER_B)
    return ids


@pytest.mark.asyncio
async def test_cross_user_identifiers_return_404_not_403(
    client: AsyncClient, seeded: dict[str, str]
) -> None:
    """AC5 — an identifier belonging to A is indistinguishable from one that never existed."""
    recording_id = seeded["recordingId"]

    complete = await client.post(f"/api/v1/recordings/{recording_id}/complete")
    playback = await client.get(f"/api/v1/recordings/{recording_id}/playback-url")
    removal = await client.delete(f"/api/v1/collection/{seeded['wordId']}")
    by_date = await client.get(f"/api/v1/paragraphs/by-date/{_today()}")

    for response in (complete, playback, removal, by_date):
        assert response.status_code == 404, response.request.url
        assert response.json()["detail"]["error"]["kind"] == "not_found"


@pytest.mark.asyncio
async def test_read_routes_return_only_callers_rows(
    client: AsyncClient, seeded: dict[str, str]
) -> None:
    """AC6 — every read route is empty for B while A holds a row."""
    assert (await client.get("/api/v1/recordings")).json() == []
    assert (await client.get("/api/v1/collection")).json() == []
    assert (await client.get("/api/v1/completions")).json() == {}
    assert (await client.get("/api/v1/days-of-use")).json() == []
    assert (await client.get("/api/v1/paragraphs/dates")).json() == []

    today = await client.get("/api/v1/paragraphs/today")
    assert today.status_code == 404
    assert today.json()["detail"]["error"]["kind"] == "not_found"

    settings = await client.get("/api/v1/settings")
    assert settings.status_code == 200
    assert settings.json()["theme"] == "adventure"


@pytest.mark.asyncio
async def test_write_routes_touch_only_callers_rows(
    client: AsyncClient, seeded: dict[str, str]
) -> None:
    """AC6 — B writing the same dates and settings creates B's own rows only."""
    patched = await client.patch("/api/v1/settings", json={"theme": "comedy"})
    assert patched.status_code == 200
    assert patched.json()["theme"] == "comedy"

    completion = await client.put(f"/api/v1/completions/{_today()}", json={"hasReadIt": False})
    assert completion.status_code == 200
    assert completion.json()["hasReadIt"] is False

    stamped = await client.post("/api/v1/days-of-use", json={"utcDate": _today()})
    assert stamped.status_code == 201
    assert (await client.get("/api/v1/days-of-use")).json() == [_today()]

    saved = await client.post("/api/v1/collection", json=_word_payload(str(uuid4()), "alpha"))
    assert saved.status_code == 201

    with patch(
        "app.api.v1.paragraphs.generate_paragraph_with_gemini",
        new_callable=AsyncMock,
        return_value=SAMPLE_RESULT,
    ):
        generated = await client.post("/api/v1/paragraphs/generate", json={"recycleWords": []})
    assert generated.status_code == 201
    assert (await client.get("/api/v1/paragraphs/dates")).json() == [_today()]

    with patch("app.api.v1.recordings.presign_put_upload", return_value=PRESIGN_PUT):
        started = await client.post("/api/v1/recordings", json=_recording_payload(str(uuid4())))
    assert started.status_code == 201

    await _login(client, USER_A)
    assert (await client.get("/api/v1/settings")).json()["theme"] == "mystery"
    assert (await client.get("/api/v1/completions")).json()[_today()]["hasReadIt"] is True
    assert len((await client.get("/api/v1/collection")).json()) == 1
    assert len((await client.get("/api/v1/recordings")).json()) == 1
    assert (await client.get("/api/v1/days-of-use")).json() == [_today()]

    playback_url = f"/api/v1/recordings/{seeded['recordingId']}/playback-url"
    with patch("app.api.v1.recordings.presign_get_playback", return_value=PRESIGN_GET):
        playback = await client.get(playback_url)
    assert playback.status_code == 200
    assert (await client.get(f"/api/v1/paragraphs/by-date/{_today()}")).status_code == 200


@pytest.mark.asyncio
async def test_client_supplied_id_collision_does_not_confirm_ownership(
    client: AsyncClient, seeded: dict[str, str]
) -> None:
    """AC7 — a create still conflicts, but the message does not assert the id exists."""
    with patch("app.api.v1.recordings.presign_put_upload", return_value=PRESIGN_PUT):
        recording = await client.post(
            "/api/v1/recordings", json=_recording_payload(seeded["recordingId"])
        )
    assert recording.status_code == 409
    recording_error = recording.json()["detail"]["error"]
    assert recording_error["kind"] == "conflict"
    assert recording_error["message"] == "Recording id unavailable."

    word = await client.post("/api/v1/collection", json=_word_payload(seeded["wordId"], "bravo"))
    assert word.status_code == 409
    word_error = word.json()["detail"]["error"]
    assert word_error["kind"] == "conflict"
    assert word_error["message"] == "Collection word id unavailable."


@pytest.mark.asyncio
async def test_no_route_returns_403(client: AsyncClient, seeded: dict[str, str]) -> None:
    """AC5 — 403 is not part of this API's vocabulary."""
    responses = [
        await client.post(f"/api/v1/recordings/{seeded['recordingId']}/complete"),
        await client.get(f"/api/v1/recordings/{seeded['recordingId']}/playback-url"),
        await client.delete(f"/api/v1/collection/{seeded['wordId']}"),
        await client.get(f"/api/v1/paragraphs/by-date/{_today()}"),
        await client.get("/api/v1/paragraphs/today"),
        await client.get("/api/v1/settings"),
    ]
    assert all(response.status_code != 403 for response in responses)
