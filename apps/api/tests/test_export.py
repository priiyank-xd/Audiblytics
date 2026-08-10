"""Story 16.3 — export contains everything the caller made, and nothing anyone else made."""

import io
import json
import zipfile
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest
from httpx import AsyncClient

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
AUDIO_BYTES = b"fake-webm-audio"


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


def _read_archive(content: bytes) -> tuple[dict, list[str]]:
    archive = zipfile.ZipFile(io.BytesIO(content))
    manifest = json.loads(archive.read("manifest.json"))
    return manifest, archive.namelist()


async def _seed_one_of_everything(client: AsyncClient, word: str) -> str:
    with patch(
        "app.api.v1.paragraphs.generate_paragraph_with_gemini",
        new_callable=AsyncMock,
        return_value=SAMPLE_RESULT,
    ):
        assert (
            await client.post("/api/v1/paragraphs/generate", json={"recycleWords": []})
        ).status_code == 201

    recording_id = str(uuid4())
    with patch("app.api.v1.recordings.presign_put_upload", return_value=PRESIGN_PUT):
        assert (
            await client.post("/api/v1/recordings", json=_recording_payload(recording_id))
        ).status_code == 201
    assert (await client.post(f"/api/v1/recordings/{recording_id}/complete")).status_code == 200

    assert (await client.post("/api/v1/collection", json=_word_payload(word))).status_code == 201
    assert (
        await client.put("/api/v1/completions/2026-06-01", json={"hasReadIt": True})
    ).status_code == 200
    assert (
        await client.post("/api/v1/days-of-use", json={"utcDate": "2026-06-01"})
    ).status_code == 201
    return recording_id


@pytest.mark.asyncio
async def test_export_requires_auth(client: AsyncClient) -> None:
    assert (await client.get("/api/v1/export")).status_code == 401


@pytest.mark.asyncio
async def test_export_with_no_data_succeeds_with_empty_manifest(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/api/v1/export")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/zip"

    manifest, names = _read_archive(response.content)
    assert names == ["manifest.json"]
    assert manifest["paragraphs"] == []
    assert manifest["collectionWords"] == []
    assert manifest["completions"] == {}
    assert manifest["daysOfUse"] == []
    assert manifest["recordings"] == []
    assert manifest["account"]["email"] == "test@example.com"
    assert manifest["settings"]["theme"] == "adventure"


@pytest.mark.asyncio
async def test_export_contains_audio_and_full_manifest(auth_client: AsyncClient) -> None:
    recording_id = await _seed_one_of_everything(auth_client, "alpha")

    with patch("app.api.v1.export.get_object_bytes", return_value=AUDIO_BYTES):
        response = await auth_client.get("/api/v1/export")
    assert response.status_code == 200

    manifest, names = _read_archive(response.content)
    audio_path = f"recordings/{recording_id}.webm"
    assert audio_path in names

    archive = zipfile.ZipFile(io.BytesIO(response.content))
    assert archive.read(audio_path) == AUDIO_BYTES

    assert len(manifest["paragraphs"]) == 1
    assert [row["word"] for row in manifest["collectionWords"]] == ["alpha"]
    assert manifest["completions"]["2026-06-01"]["hasReadIt"] is True
    assert manifest["daysOfUse"] == ["2026-06-01"]
    assert len(manifest["recordings"]) == 1
    assert manifest["recordings"][0]["audioFile"] == audio_path
    assert manifest["recordings"][0]["audioUnavailableReason"] is None


@pytest.mark.asyncio
async def test_export_succeeds_and_says_so_when_audio_is_unreadable(
    auth_client: AsyncClient,
) -> None:
    await _seed_one_of_everything(auth_client, "alpha")

    with patch(
        "app.api.v1.export.get_object_bytes",
        side_effect=R2ConfigurationError("R2 is not configured"),
    ):
        response = await auth_client.get("/api/v1/export")
    assert response.status_code == 200

    manifest, names = _read_archive(response.content)
    assert names == ["manifest.json"]
    assert manifest["recordings"][0]["audioFile"] is None
    assert manifest["recordings"][0]["audioUnavailableReason"] == (
        "Audio could not be read from storage."
    )


@pytest.mark.asyncio
async def test_export_excludes_other_accounts(client: AsyncClient) -> None:
    await client.post(
        "/api/v1/auth/register", json={"email": "export-a@example.com", "password": "password123"}
    )
    await _seed_one_of_everything(client, "alpha")

    await client.post(
        "/api/v1/auth/register", json={"email": "export-b@example.com", "password": "password123"}
    )
    b_recording = await _seed_one_of_everything(client, "bravo")

    with patch("app.api.v1.export.get_object_bytes", return_value=AUDIO_BYTES):
        response = await client.get("/api/v1/export")
    assert response.status_code == 200

    manifest, names = _read_archive(response.content)
    assert manifest["account"]["email"] == "export-b@example.com"
    assert [row["word"] for row in manifest["collectionWords"]] == ["bravo"]
    assert [row["id"] for row in manifest["recordings"]] == [b_recording]
    assert names == ["manifest.json", f"recordings/{b_recording}.webm"]
    assert len(manifest["paragraphs"]) == 1
