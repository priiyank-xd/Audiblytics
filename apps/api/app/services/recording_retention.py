from datetime import datetime, timedelta, timezone

from botocore.exceptions import BotoCoreError, ClientError
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.recording import Recording
from app.models.user import User
from app.models.user_settings import DEFAULT_RETENTION
from app.services.r2_client import R2ConfigurationError, delete_object

ROLLING_RETENTION_DAYS = 90


def rolling_retention_cutoff(*, now: datetime | None = None) -> datetime:
    anchor = now or datetime.now(timezone.utc)
    if anchor.tzinfo is None:
        anchor = anchor.replace(tzinfo=timezone.utc)
    else:
        anchor = anchor.astimezone(timezone.utc)
    return anchor - timedelta(days=ROLLING_RETENTION_DAYS)


def _retention_policy(user: User) -> str:
    if user.settings is None:
        return DEFAULT_RETENTION
    return user.settings.retention


async def prune_expired_recordings(db: AsyncSession, user: User) -> int:
    """
    Delete recordings older than the rolling 90-day window for users on 90-day-rolling policy.
    Idempotent: returns 0 when nothing qualifies or policy is indefinite.
    """
    if _retention_policy(user) != "90-day-rolling":
        return 0

    # Naive UTC cutoff matches SQLite test storage and Postgres timestamptz UTC writes.
    cutoff = rolling_retention_cutoff().replace(tzinfo=None)
    result = await db.execute(
        select(Recording).where(
            Recording.user_id == user.id,
            Recording.recording_date < cutoff,
        )
    )
    rows = list(result.scalars().all())
    if not rows:
        return 0

    for row in rows:
        if row.storage_key:
            try:
                delete_object(row.storage_key)
            except (R2ConfigurationError, BotoCoreError, ClientError, ValueError):
                # Best-effort R2 cleanup; still remove metadata so list views stay honest.
                pass

    await db.execute(
        delete(Recording).where(
            Recording.user_id == user.id,
            Recording.recording_date < cutoff,
        )
    )
    await db.commit()
    return len(rows)
