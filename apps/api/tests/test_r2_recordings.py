from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from sqlalchemy import inspect

from app.core.config import Settings, get_settings
from app.schemas.recording import RecordingCreateRequest, RecordingResponse
from app.core.database import get_engine, init_db, reset_engine
from app.services.r2_client import (
    PRESIGN_GET_EXPIRES_SECONDS,
    PRESIGN_PUT_EXPIRES_SECONDS,
    PresignedGetPlayback,
    PresignedPutUpload,
    R2ConfigurationError,
    build_storage_key,
    mime_type_to_extension,
    presign_get_playback,
    presign_put_upload,
)


def test_recording_schema_validators() -> None:
    paragraph_id = str(uuid4())
    RecordingCreateRequest(
        id=str(uuid4()),
        recordingDate="2026-05-31T12:00:00.000Z",
        paragraphId=paragraph_id,
        durationMs=5000,
        mimeType="audio/webm",
        dayOfUse=1,
    )
    RecordingCreateRequest(
        id=str(uuid4()),
        recordingDate="2026-05-31T12:00:00.000Z",
        paragraphId="warmup-deadbeef-pen",
        durationMs=5000,
        mimeType="audio/webm",
        dayOfUse=1,
    )
    with pytest.raises(ValueError):
        RecordingCreateRequest(
            id=str(uuid4()),
            recordingDate="2026-05-31T12:00:00.000Z",
            paragraphId="not-a-valid-id",
            durationMs=5000,
            mimeType="audio/webm",
            dayOfUse=1,
        )
    with pytest.raises(ValueError, match="recordingDate"):
        RecordingCreateRequest(
            id=str(uuid4()),
            recordingDate="not-a-date",
            paragraphId=paragraph_id,
            durationMs=5000,
            mimeType="audio/webm",
            dayOfUse=1,
        )
    with pytest.raises(ValueError, match="mimeType"):
        RecordingCreateRequest(
            id=str(uuid4()),
            recordingDate="2026-05-31T12:00:00.000Z",
            paragraphId=paragraph_id,
            durationMs=5000,
            mimeType="audio/wav",
            dayOfUse=1,
        )

    RecordingResponse(
        id=str(uuid4()),
        recordingDate="2026-05-31T12:00:00.000Z",
        paragraphId=paragraph_id,
        durationMs=5000,
        mimeType="audio/webm",
        dayOfUse=1,
        storageKey=None,
    )


def test_mime_type_to_extension() -> None:
    assert mime_type_to_extension("audio/webm") == "webm"
    assert mime_type_to_extension("audio/webm;codecs=opus") == "webm"
    assert mime_type_to_extension("audio/mp4") == "mp4"
    assert mime_type_to_extension("audio/ogg") == "ogg"


def test_mime_type_to_extension_unsupported() -> None:
    with pytest.raises(ValueError, match="Unsupported mime type"):
        mime_type_to_extension("audio/wav")


def test_build_storage_key() -> None:
    user_id = uuid4()
    recording_id = uuid4()
    key = build_storage_key(user_id, recording_id, "audio/webm;codecs=opus")
    assert key == f"recordings/{user_id}/{recording_id}.webm"


def test_presign_put_upload_missing_config() -> None:
    settings = Settings(
        r2_account_id="",
        r2_access_key_id="",
        r2_secret_access_key="",
        r2_bucket="",
    )
    with pytest.raises(R2ConfigurationError, match="R2 is not configured"):
        presign_put_upload(uuid4(), uuid4(), "audio/webm", settings=settings)


@patch("app.services.r2_client.boto3.client")
def test_presign_put_upload_success(mock_boto_client: MagicMock) -> None:
    user_id = uuid4()
    recording_id = uuid4()
    settings = Settings(
        r2_account_id="acct",
        r2_access_key_id="key",
        r2_secret_access_key="secret",
        r2_bucket="audiblytics-recordings",
    )
    mock_client = MagicMock()
    mock_client.generate_presigned_url.return_value = "https://example.com/presigned"
    mock_boto_client.return_value = mock_client

    result = presign_put_upload(user_id, recording_id, "Audio/MP4", settings=settings)

    assert result.url == "https://example.com/presigned"
    assert result.storage_key == f"recordings/{user_id}/{recording_id}.mp4"
    assert result.expires_in == PRESIGN_PUT_EXPIRES_SECONDS
    assert PRESIGN_PUT_EXPIRES_SECONDS <= 900

    mock_boto_client.assert_called_once()
    call_kwargs = mock_boto_client.call_args.kwargs
    assert call_kwargs["endpoint_url"] == "https://acct.r2.cloudflarestorage.com"
    assert call_kwargs["region_name"] == "auto"

    presign_kwargs = mock_client.generate_presigned_url.call_args
    assert presign_kwargs[0] == ("put_object",)
    assert presign_kwargs[1]["ExpiresIn"] == 900
    params = presign_kwargs[1]["Params"]
    assert params["Bucket"] == "audiblytics-recordings"
    assert params["Key"] == result.storage_key
    assert params["ContentType"] == "audio/mp4"

    result_webm = presign_put_upload(user_id, recording_id, "audio/webm;codecs=opus", settings=settings)
    webm_params = mock_client.generate_presigned_url.call_args[1]["Params"]
    assert webm_params["ContentType"] == "audio/webm"


@patch("app.services.r2_client.boto3.client")
def test_presign_get_playback_success(mock_boto_client: MagicMock) -> None:
    settings = Settings(
        r2_account_id="acct",
        r2_access_key_id="key",
        r2_secret_access_key="secret",
        r2_bucket="audiblytics-recordings",
    )
    mock_client = MagicMock()
    mock_client.generate_presigned_url.return_value = "https://example.com/get"
    mock_boto_client.return_value = mock_client

    storage_key = "recordings/u/r.webm"
    result = presign_get_playback(storage_key, settings=settings)

    assert isinstance(result, PresignedGetPlayback)
    assert result.url == "https://example.com/get"
    assert result.expires_in == PRESIGN_GET_EXPIRES_SECONDS
    assert 60 <= PRESIGN_GET_EXPIRES_SECONDS <= 300

    presign_kwargs = mock_client.generate_presigned_url.call_args
    assert presign_kwargs[0] == ("get_object",)
    assert presign_kwargs[1]["ExpiresIn"] == PRESIGN_GET_EXPIRES_SECONDS
    params = presign_kwargs[1]["Params"]
    assert params["Bucket"] == "audiblytics-recordings"
    assert params["Key"] == storage_key


def test_presign_get_playback_missing_config() -> None:
    settings = Settings(
        r2_account_id="",
        r2_access_key_id="",
        r2_secret_access_key="",
        r2_bucket="",
    )
    with pytest.raises(R2ConfigurationError, match="R2 is not configured"):
        presign_get_playback("recordings/u/r.webm", settings=settings)


@patch("app.services.r2_client.boto3.client")
def test_delete_object_success(mock_boto_client: MagicMock) -> None:
    settings = Settings(
        r2_account_id="acct",
        r2_access_key_id="key",
        r2_secret_access_key="secret",
        r2_bucket="audiblytics-recordings",
    )
    mock_client = MagicMock()
    mock_boto_client.return_value = mock_client

    from app.services.r2_client import delete_object

    delete_object("recordings/u/r.webm", settings=settings)

    mock_client.delete_object.assert_called_once_with(
        Bucket="audiblytics-recordings",
        Key="recordings/u/r.webm",
    )


def test_delete_object_missing_config() -> None:
    from app.services.r2_client import delete_object

    settings = Settings(
        r2_account_id="",
        r2_access_key_id="",
        r2_secret_access_key="",
        r2_bucket="",
    )
    with pytest.raises(R2ConfigurationError, match="R2 is not configured"):
        delete_object("recordings/u/r.webm", settings=settings)


@pytest.mark.asyncio
async def test_recordings_table_exists_after_init_db() -> None:
    import os

    os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
    get_settings.cache_clear()
    reset_engine()
    await init_db()

    def check_tables(sync_conn) -> None:
        table_names = inspect(sync_conn).get_table_names()
        assert "recordings" in table_names
        columns = {col["name"]: col for col in inspect(sync_conn).get_columns("recordings")}
        assert columns["storage_key"]["nullable"] is True
        assert columns["id"]["nullable"] is False

    async with get_engine().connect() as conn:
        await conn.run_sync(check_tables)
