from datetime import timezone
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.deps import CurrentUser, DbSession
from app.models.recording import Recording
from app.schemas.recording import (
    RecordingCreateRequest,
    RecordingPlaybackUrlResponse,
    RecordingResponse,
    RecordingUploadStartResponse,
    recording_date_from_iso,
)
from app.services.r2_client import (
    R2ConfigurationError,
    build_storage_key,
    presign_get_playback,
    presign_put_upload,
)

router = APIRouter(prefix="/recordings", tags=["recordings"])


async def _get_user_recording(recording_id: UUID, user_id: UUID, db: DbSession) -> Recording | None:
    result = await db.execute(
        select(Recording).where(Recording.id == recording_id, Recording.user_id == user_id)
    )
    return result.scalar_one_or_none()


def _metadata_matches(existing: Recording, body: RecordingCreateRequest) -> bool:
    body_date = recording_date_from_iso(body.recordingDate)
    existing_date = existing.recording_date
    if existing_date.tzinfo is None:
        existing_date = existing_date.replace(tzinfo=timezone.utc)
    else:
        existing_date = existing_date.astimezone(timezone.utc)
    return (
        existing.paragraph_id == body.paragraphId
        and existing.duration_ms == body.durationMs
        and existing.mime_type == body.mimeType
        and existing.day_of_use == body.dayOfUse
        and existing_date == body_date
    )


@router.get("", response_model=list[RecordingResponse])
async def list_recordings(user: CurrentUser, db: DbSession) -> list[RecordingResponse]:
    result = await db.execute(
        select(Recording)
        .where(Recording.user_id == user.id, Recording.storage_key.is_not(None))
        .order_by(Recording.recording_date.desc())
    )
    rows = result.scalars().all()
    return [RecordingResponse.from_row(row) for row in rows]


@router.post("", response_model=RecordingUploadStartResponse, status_code=status.HTTP_201_CREATED)
async def start_recording_upload(
    body: RecordingCreateRequest,
    user: CurrentUser,
    db: DbSession,
) -> RecordingUploadStartResponse:
    recording_id = UUID(body.id)
    result = await db.execute(
        select(Recording).where(Recording.id == recording_id, Recording.user_id == user.id)
    )
    existing = result.scalar_one_or_none()

    if existing is not None:
        if existing.storage_key is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error": {
                        "kind": "conflict",
                        "message": "Recording upload already completed.",
                    }
                },
            )
        if not _metadata_matches(existing, body):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error": {
                        "kind": "conflict",
                        "message": "Recording id reused with different metadata.",
                    }
                },
            )
        mime_type = existing.mime_type
    else:
        row = Recording(
            id=recording_id,
            user_id=user.id,
            recording_date=recording_date_from_iso(body.recordingDate),
            paragraph_id=body.paragraphId,
            duration_ms=body.durationMs,
            mime_type=body.mimeType,
            storage_key=None,
            day_of_use=body.dayOfUse,
        )
        db.add(row)
        try:
            await db.commit()
        except IntegrityError as exc:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error": {
                        "kind": "conflict",
                        "message": "Recording id already exists.",
                    }
                },
            ) from exc
        mime_type = body.mimeType

    try:
        presigned = presign_put_upload(user.id, recording_id, mime_type)
    except R2ConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error": {"kind": "storage_error", "message": str(exc)}},
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": {"kind": "validation_error", "message": str(exc)}},
        ) from exc

    return RecordingUploadStartResponse(
        recordingId=str(recording_id),
        uploadUrl=presigned.url,
        expiresIn=presigned.expires_in,
    )


@router.post("/{recording_id}/complete", response_model=RecordingResponse)
async def complete_recording_upload(
    recording_id: UUID,
    user: CurrentUser,
    db: DbSession,
) -> RecordingResponse:
    row = await _get_user_recording(recording_id, user.id, db)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"kind": "not_found", "message": "Recording not found."}},
        )

    if row.storage_key is None:
        try:
            row.storage_key = build_storage_key(user.id, recording_id, row.mime_type)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"error": {"kind": "validation_error", "message": str(exc)}},
            ) from exc
        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
            row = await _get_user_recording(recording_id, user.id, db)
            if row is None or row.storage_key is None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "error": {
                            "kind": "conflict",
                            "message": "Recording upload already completed.",
                        }
                    },
                )
        else:
            await db.refresh(row)

    return RecordingResponse.from_row(row)


@router.get("/{recording_id}/playback-url", response_model=RecordingPlaybackUrlResponse)
async def get_recording_playback_url(
    recording_id: UUID,
    user: CurrentUser,
    db: DbSession,
) -> RecordingPlaybackUrlResponse:
    row = await _get_user_recording(recording_id, user.id, db)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"kind": "not_found", "message": "Recording not found."}},
        )

    if row.storage_key is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": {
                    "kind": "conflict",
                    "message": "Recording upload not completed.",
                }
            },
        )

    try:
        presigned = presign_get_playback(row.storage_key)
    except R2ConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error": {"kind": "storage_error", "message": str(exc)}},
        ) from exc

    return RecordingPlaybackUrlResponse(
        playbackUrl=presigned.url,
        expiresIn=presigned.expires_in,
    )
