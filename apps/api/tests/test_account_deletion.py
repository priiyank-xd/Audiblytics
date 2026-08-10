"""Story 16.4 — leaving means actually leaving."""

from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.core.database import get_session_factory
from app.core.tenant_scope import TENANT_MODELS, unscoped
from app.models.user import User
from app.schemas.paragraph import HardWord, ParagraphResult
from app.services.r2_client import PresignedPutUpload, R2ConfigurationError

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


def _recording_payload(recording_id: str) -> dict:
    return {
        "id": recording_id,
        "recordingDate": "2026-06-01T12:00:00.000Z",
        "paragraphId": str(uuid4()),
        "durationMs": 5000,
        "mimeType": "audio/webm",
        "dayOfUse": 1,
    }


def _word_payload(word: str) -> dict:
    return {
        "id": str(uuid4()),
        "word": word,
        "ipa": "/w/",
        "pronunciationGuide": "wurd",
        "meaning": "a word",
        "exampleSentence": "A word.",
        "savedAt": "2026-06-01T10:00:00.000Z",
        "sourceParagraphId": str(uuid4()),
        "reviewCount": 0,
        "lastReviewedAt": None,
        "difficultyRating": 1,
    }


async def _seed_one_of_everything(client: AsyncClient, word: str) -> str:
    with patch(
        "app.api.v1.paragraphs.generate_paragraph_with_gemini",
        new_callable=AsyncMock,
        return_value=SAMPLE_RESULT,
    ):
        await client.post("/api/v1/paragraphs/generate", json={"recycleWords": []})

    recording_id = str(uuid4())
    with patch("app.api.v1.recordings.presign_put_upload", return_value=PRESIGN_PUT):
        await client.post("/api/v1/recordings", json=_recording_payload(recording_id))
    await client.post(f"/api/v1/recordings/{recording_id}/complete")

    await client.post("/api/v1/collection", json=_word_payload(word))
    await client.put("/api/v1/completions/2026-06-01", json={"hasReadIt": True})
    await client.post("/api/v1/days-of-use", json={"utcDate": "2026-06-01"})
    return recording_id


async def _row_counts() -> dict[str, int]:
    """Count every user-owned table, ignoring the tenant guard."""
    factory = get_session_factory()
    counts: dict[str, int] = {}
    async with factory() as session:
        with unscoped(session):
            for model in TENANT_MODELS:
                rows = (await session.execute(select(model))).scalars().all()
                counts[model.__name__] = len(rows)
        counts["User"] = len((await session.execute(select(User))).scalars().all())
    return counts


@pytest.mark.asyncio
async def test_delete_account_requires_auth(client: AsyncClient) -> None:
    assert (await client.delete("/api/v1/auth/account")).status_code == 401


@pytest.mark.asyncio
async def test_delete_account_removes_every_row_and_object(auth_client: AsyncClient) -> None:
    await _seed_one_of_everything(auth_client, "alpha")
    before = await _row_counts()
    assert all(count > 0 for count in before.values()), before

    with patch("app.api.v1.auth.delete_object") as mock_delete:
        response = await auth_client.delete("/api/v1/auth/account")

    assert response.status_code == 200
    body = response.json()
    assert body["deletedRecordings"] == 1
    assert body["orphanedObjectKeys"] == []
    mock_delete.assert_called_once()

    assert all(count == 0 for count in (await _row_counts()).values())


@pytest.mark.asyncio
async def test_delete_account_invalidates_the_session(auth_client: AsyncClient) -> None:
    with patch("app.api.v1.auth.delete_object"):
        assert (await auth_client.delete("/api/v1/auth/account")).status_code == 200

    assert (await auth_client.get("/api/v1/auth/me")).status_code == 401
    assert (await auth_client.get("/api/v1/collection")).status_code == 401


@pytest.mark.asyncio
async def test_delete_account_reports_orphaned_objects_rather_than_swallowing(
    auth_client: AsyncClient,
) -> None:
    await _seed_one_of_everything(auth_client, "alpha")

    with patch(
        "app.api.v1.auth.delete_object",
        side_effect=R2ConfigurationError("R2 is not configured"),
    ):
        response = await auth_client.delete("/api/v1/auth/account")

    assert response.status_code == 200
    body = response.json()
    assert body["deletedRecordings"] == 1
    assert len(body["orphanedObjectKeys"]) == 1
    assert body["orphanedObjectKeys"][0].startswith("recordings/")

    # Rows still go, so the account is genuinely gone even when storage misbehaves.
    assert all(count == 0 for count in (await _row_counts()).values())


@pytest.mark.asyncio
async def test_delete_account_leaves_other_accounts_untouched(client: AsyncClient) -> None:
    await client.post(
        "/api/v1/auth/register", json={"email": "keep-me@example.com", "password": "password123"}
    )
    await _seed_one_of_everything(client, "alpha")

    await client.post(
        "/api/v1/auth/register", json={"email": "delete-me@example.com", "password": "password123"}
    )
    await _seed_one_of_everything(client, "bravo")

    with patch("app.api.v1.auth.delete_object"):
        assert (await client.delete("/api/v1/auth/account")).status_code == 200

    counts = await _row_counts()
    assert counts["User"] == 1
    assert counts["Recording"] == 1
    assert counts["CollectionWord"] == 1

    login = await client.post(
        "/api/v1/auth/login", json={"email": "keep-me@example.com", "password": "password123"}
    )
    assert login.status_code == 200
    assert [row["word"] for row in (await client.get("/api/v1/collection")).json()] == ["alpha"]


@pytest.mark.asyncio
async def test_email_is_reusable_after_deletion(client: AsyncClient) -> None:
    await client.post(
        "/api/v1/auth/register", json={"email": "recycled@example.com", "password": "password123"}
    )
    await _seed_one_of_everything(client, "alpha")

    with patch("app.api.v1.auth.delete_object"):
        assert (await client.delete("/api/v1/auth/account")).status_code == 200

    again = await client.post(
        "/api/v1/auth/register", json={"email": "recycled@example.com", "password": "password123"}
    )
    assert again.status_code == 201
    assert (await client.get("/api/v1/collection")).json() == []
    assert (await client.get("/api/v1/recordings")).json() == []
    assert (await client.get("/api/v1/settings")).json()["theme"] == "adventure"
