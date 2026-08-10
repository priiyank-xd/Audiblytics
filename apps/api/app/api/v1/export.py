"""Story 16.3 — take a copy of everything I have made (FR71).

One ZIP: `manifest.json` plus every recording's audio. Every query runs through
the Story 16.1 tenant guard, so the archive cannot contain another account's data.
"""

import io
import json
import logging
import zipfile
from datetime import datetime, timezone

from botocore.exceptions import BotoCoreError, ClientError
from fastapi import APIRouter, Response
from sqlalchemy import select

from app.core.deps import CurrentUser, DbSession
from app.models.collection_word import CollectionWord
from app.models.day_completion import DayCompletion
from app.models.days_of_use import DaysOfUse
from app.models.paragraph_cache import ParagraphCache
from app.models.recording import Recording
from app.schemas.collection import CollectionWordResponse
from app.schemas.paragraph import ParagraphCacheResponse
from app.schemas.recording import RecordingResponse
from app.schemas.settings import SettingsResponse
from app.services.r2_client import R2ConfigurationError, get_object_bytes, mime_type_to_extension

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/export", tags=["export"])

MANIFEST_NAME = "manifest.json"
AUDIO_DIR = "recordings"


def _audio_path(recording: Recording) -> str:
    try:
        extension = mime_type_to_extension(recording.mime_type)
    except ValueError:
        extension = "bin"
    return f"{AUDIO_DIR}/{recording.id}.{extension}"


@router.get("", response_class=Response)
async def export_account_data(user: CurrentUser, db: DbSession) -> Response:
    paragraphs = (
        await db.execute(select(ParagraphCache).order_by(ParagraphCache.generated_at.asc()))
    ).scalars().all()
    words = (
        await db.execute(select(CollectionWord).order_by(CollectionWord.saved_at.asc()))
    ).scalars().all()
    completions = (
        await db.execute(select(DayCompletion).order_by(DayCompletion.utc_date.asc()))
    ).scalars().all()
    days_of_use = (
        await db.execute(select(DaysOfUse.utc_date).order_by(DaysOfUse.utc_date.asc()))
    ).scalars().all()
    recordings = (
        await db.execute(select(Recording).order_by(Recording.recording_date.asc()))
    ).scalars().all()

    recording_entries: list[dict] = []
    audio_files: list[tuple[str, bytes]] = []

    for row in recordings:
        entry = RecordingResponse.from_row(row).model_dump()
        if row.storage_key is None:
            entry["audioFile"] = None
            entry["audioUnavailableReason"] = "Upload never completed."
        else:
            path = _audio_path(row)
            try:
                audio_files.append((path, get_object_bytes(row.storage_key)))
            except (R2ConfigurationError, BotoCoreError, ClientError) as exc:
                # An export that omits audio is still worth having; say so rather than fail.
                logger.warning(
                    "Export could not read R2 object %s for user %s: %s", row.storage_key, user.id, exc
                )
                entry["audioFile"] = None
                entry["audioUnavailableReason"] = "Audio could not be read from storage."
            else:
                entry["audioFile"] = path
                entry["audioUnavailableReason"] = None
        recording_entries.append(entry)

    exported_at = datetime.now(timezone.utc)
    manifest = {
        "exportedAt": exported_at.isoformat(timespec="milliseconds").replace("+00:00", "Z"),
        "account": {"id": str(user.id), "email": user.email},
        "settings": (
            SettingsResponse.from_row(user.settings).model_dump() if user.settings else None
        ),
        "paragraphs": [ParagraphCacheResponse.from_row(row).model_dump() for row in paragraphs],
        "collectionWords": [CollectionWordResponse.from_row(row).model_dump() for row in words],
        "completions": {
            row.utc_date.isoformat(): {
                "hasReadIt": row.has_read_it,
                "hasRecording": row.has_recording,
                "usedOfflinePack": row.used_offline_pack,
            }
            for row in completions
        },
        "daysOfUse": [value.isoformat() for value in days_of_use],
        "recordings": recording_entries,
    }

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr(MANIFEST_NAME, json.dumps(manifest, indent=2, sort_keys=True))
        for path, payload in audio_files:
            archive.writestr(path, payload)

    filename = f"audiblytics-export-{exported_at.strftime('%Y%m%d')}.zip"
    return Response(
        content=buffer.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
