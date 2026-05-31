from dataclasses import dataclass
from uuid import UUID

import boto3

from app.core.config import Settings, get_settings

PRESIGN_PUT_EXPIRES_SECONDS = 900
PRESIGN_GET_EXPIRES_SECONDS = 120

MIME_TO_EXTENSION: dict[str, str] = {
    "audio/webm": "webm",
    "video/webm": "webm",
    "audio/mp4": "mp4",
    "audio/ogg": "ogg",
}


class R2ConfigurationError(Exception):
    """Raised when presign is requested but R2 env vars are incomplete."""


@dataclass(frozen=True)
class PresignedPutUpload:
    url: str
    storage_key: str
    expires_in: int


@dataclass(frozen=True)
class PresignedGetPlayback:
    url: str
    expires_in: int


def mime_type_to_extension(mime_type: str) -> str:
    base = mime_type.split(";", maxsplit=1)[0].strip().lower()
    ext = MIME_TO_EXTENSION.get(base)
    if ext is None:
        raise ValueError(f"Unsupported mime type: {mime_type}")
    return ext


def build_storage_key(user_id: UUID, recording_id: UUID, mime_type: str) -> str:
    ext = mime_type_to_extension(mime_type)
    return f"recordings/{user_id}/{recording_id}.{ext}"


def _require_r2_settings(settings: Settings) -> None:
    if not settings.r2_configured:
        raise R2ConfigurationError(
            "R2 is not configured: set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, "
            "R2_SECRET_ACCESS_KEY, and R2_BUCKET"
        )


def _create_s3_client(settings: Settings):
    _require_r2_settings(settings)
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.r2_account_id.strip()}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.r2_access_key_id.strip(),
        aws_secret_access_key=settings.r2_secret_access_key.strip(),
        region_name="auto",
    )


def presign_put_upload(
    user_id: UUID,
    recording_id: UUID,
    mime_type: str,
    *,
    settings: Settings | None = None,
) -> PresignedPutUpload:
    resolved = settings or get_settings()
    storage_key = build_storage_key(user_id, recording_id, mime_type)
    client = _create_s3_client(resolved)
    content_type = mime_type.split(";", maxsplit=1)[0].strip().lower()
    url = client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": resolved.r2_bucket.strip(),
            "Key": storage_key,
            "ContentType": content_type,
        },
        ExpiresIn=PRESIGN_PUT_EXPIRES_SECONDS,
    )
    return PresignedPutUpload(
        url=url,
        storage_key=storage_key,
        expires_in=PRESIGN_PUT_EXPIRES_SECONDS,
    )


def presign_get_playback(
    storage_key: str,
    *,
    settings: Settings | None = None,
) -> PresignedGetPlayback:
    resolved = settings or get_settings()
    client = _create_s3_client(resolved)
    url = client.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": resolved.r2_bucket.strip(),
            "Key": storage_key,
        },
        ExpiresIn=PRESIGN_GET_EXPIRES_SECONDS,
    )
    return PresignedGetPlayback(url=url, expires_in=PRESIGN_GET_EXPIRES_SECONDS)


def delete_object(
    storage_key: str,
    *,
    settings: Settings | None = None,
) -> None:
    """Delete one R2 object by storage key. Raises R2ConfigurationError when env incomplete."""
    resolved = settings or get_settings()
    client = _create_s3_client(resolved)
    client.delete_object(Bucket=resolved.r2_bucket.strip(), Key=storage_key)
