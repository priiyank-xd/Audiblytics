import re
from datetime import datetime, timezone
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.services.r2_client import MIME_TO_EXTENSION

WARMUP_RECORDING_ID_RE = re.compile(r"^warmup-[0-9a-f]{8}-(pen|nop)$")


def _validate_paragraph_id(value: str) -> str:
    try:
        UUID(value)
        return value
    except ValueError:
        if WARMUP_RECORDING_ID_RE.match(value):
            return value
        raise ValueError("paragraphId must be a UUID or warmup recording id")


def _validate_recording_date(value: str) -> str:
    normalized = value.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError as exc:
        raise ValueError("recordingDate must be an ISO 8601 UTC datetime string") from exc
    if parsed.tzinfo is None:
        raise ValueError("recordingDate must include a timezone offset (UTC preferred)")
    utc = parsed.astimezone(timezone.utc)
    return utc.isoformat(timespec="milliseconds").replace("+00:00", "Z")


def _validate_mime_type(value: str) -> str:
    base = value.split(";", maxsplit=1)[0].strip().lower()
    if base not in MIME_TO_EXTENSION:
        supported = ", ".join(sorted(MIME_TO_EXTENSION))
        raise ValueError(f"mimeType must be a supported audio type ({supported})")
    return value


class RecordingResponse(BaseModel):
    """Mirrors `recording.schema.ts` (camelCase JSON, no blob)."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    recordingDate: str
    paragraphId: str
    durationMs: int = Field(ge=0)
    mimeType: str = Field(min_length=1)
    dayOfUse: int = Field(gt=0)
    storageKey: str | None = None

    @field_validator("recordingDate")
    @classmethod
    def validate_recording_date(cls, value: str) -> str:
        return _validate_recording_date(value)

    @field_validator("paragraphId")
    @classmethod
    def validate_paragraph_id(cls, value: str) -> str:
        return _validate_paragraph_id(value)

    @field_validator("mimeType")
    @classmethod
    def validate_mime_type(cls, value: str) -> str:
        return _validate_mime_type(value)

    @classmethod
    def from_row(cls, row: "RecordingRow") -> "RecordingResponse":
        from app.models.recording import Recording

        assert isinstance(row, Recording)
        recording_date = row.recording_date
        if recording_date.tzinfo is None:
            recording_date = recording_date.replace(tzinfo=timezone.utc)
        else:
            recording_date = recording_date.astimezone(timezone.utc)
        iso = recording_date.isoformat(timespec="milliseconds").replace("+00:00", "Z")
        return cls(
            id=str(row.id),
            recordingDate=iso,
            paragraphId=row.paragraph_id,
            durationMs=row.duration_ms,
            mimeType=row.mime_type,
            dayOfUse=row.day_of_use,
            storageKey=row.storage_key,
        )


RecordingRow = object


class RecordingCreateRequest(BaseModel):
    """Metadata for Story 11.2 POST /recordings (validated here for contract parity)."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    id: str
    recordingDate: str
    paragraphId: str
    durationMs: int = Field(ge=0)
    mimeType: str = Field(min_length=1)
    dayOfUse: int = Field(gt=0)

    @field_validator("id")
    @classmethod
    def validate_id(cls, value: str) -> str:
        UUID(value)
        return value

    @field_validator("recordingDate")
    @classmethod
    def validate_recording_date(cls, value: str) -> str:
        return _validate_recording_date(value)

    @field_validator("paragraphId")
    @classmethod
    def validate_paragraph_id(cls, value: str) -> str:
        return _validate_paragraph_id(value)

    @field_validator("mimeType")
    @classmethod
    def validate_mime_type(cls, value: str) -> str:
        return _validate_mime_type(value)


def recording_date_from_iso(iso: str) -> datetime:
    """Parse validated recordingDate (Z-normalized) for DB storage."""
    normalized = iso.replace("Z", "+00:00")
    return datetime.fromisoformat(normalized).astimezone(timezone.utc)


class RecordingUploadStartResponse(BaseModel):
    """POST /recordings — presigned upload start (pending row)."""

    model_config = ConfigDict(populate_by_name=True)

    recordingId: str
    uploadUrl: str
    expiresIn: int


class RecordingPlaybackUrlResponse(BaseModel):
    """GET /recordings/{id}/playback-url — short-lived presigned GET."""

    model_config = ConfigDict(populate_by_name=True)

    playbackUrl: str
    expiresIn: int
