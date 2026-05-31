from datetime import datetime, timedelta, timezone
from unittest.mock import patch
from uuid import UUID, uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_session_factory
from app.models.recording import Recording
from app.models.user import User
from app.models.user_settings import UserSettings
from app.services.recording_retention import (
    ROLLING_RETENTION_DAYS,
    prune_expired_recordings,
    rolling_retention_cutoff,
)


def _old_recording_date() -> datetime:
    return (datetime.now(timezone.utc) - timedelta(days=ROLLING_RETENTION_DAYS + 1)).replace(tzinfo=None)


def _recent_recording_date() -> datetime:
    return (datetime.now(timezone.utc) - timedelta(days=1)).replace(tzinfo=None)


async def _insert_recording(
    user_id: UUID,
    *,
    recording_date: datetime,
    storage_key: str | None | object = ...,
) -> Recording:
    resolved_storage_key: str | None
    if storage_key is ...:
        resolved_storage_key = f"recordings/{user_id}/{uuid4()}.webm"
    else:
        resolved_storage_key = storage_key  # type: ignore[assignment]

    row = Recording(
        id=uuid4(),
        user_id=user_id,
        recording_date=recording_date.replace(tzinfo=None),
        paragraph_id=str(uuid4()),
        duration_ms=5000,
        mime_type="audio/webm",
        storage_key=resolved_storage_key,
        day_of_use=1,
    )
    factory = get_session_factory()
    async with factory() as session:
        session.add(row)
        await session.commit()
        await session.refresh(row)
    return row


async def _get_user_id(email: str = "test@example.com") -> UUID:
    factory = get_session_factory()
    async with factory() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one()
        return user.id


async def _set_retention(user_id: UUID, retention: str) -> None:
    factory = get_session_factory()
    async with factory() as session:
        result = await session.execute(select(UserSettings).where(UserSettings.user_id == user_id))
        settings = result.scalar_one()
        settings.retention = retention
        await session.commit()


async def test_rolling_retention_cutoff_is_90_days_utc() -> None:
    now = datetime(2026, 5, 31, 12, 0, tzinfo=timezone.utc)
    cutoff = rolling_retention_cutoff(now=now)
    assert cutoff == now - timedelta(days=90)


@pytest.mark.asyncio
async def test_prune_deletes_old_completed_recordings(auth_client: AsyncClient) -> None:
    user_id = await _get_user_id()
    old = await _insert_recording(user_id, recording_date=_old_recording_date())
    recent = await _insert_recording(user_id, recording_date=_recent_recording_date())

    factory = get_session_factory()
    async with factory() as session:
        result = await session.execute(
            select(User).where(User.id == user_id).options(selectinload(User.settings))
        )
        user = result.scalar_one()

        with patch("app.services.recording_retention.delete_object") as mock_delete:
            deleted = await prune_expired_recordings(session, user)

    assert deleted == 1
    mock_delete.assert_called_once_with(old.storage_key)

    async with factory() as session:
        remaining = (
            await session.execute(select(Recording).where(Recording.user_id == user_id))
        ).scalars().all()
        remaining_ids = {row.id for row in remaining}
        assert recent.id in remaining_ids
        assert old.id not in remaining_ids


@pytest.mark.asyncio
async def test_prune_skips_indefinite_policy(auth_client: AsyncClient) -> None:
    user_id = await _get_user_id()
    await _set_retention(user_id, "indefinite")
    old = await _insert_recording(user_id, recording_date=_old_recording_date())

    factory = get_session_factory()
    async with factory() as session:
        result = await session.execute(
            select(User).where(User.id == user_id).options(selectinload(User.settings))
        )
        user = result.scalar_one()

        with patch("app.services.recording_retention.delete_object") as mock_delete:
            deleted = await prune_expired_recordings(session, user)

    assert deleted == 0
    mock_delete.assert_not_called()

    async with factory() as session:
        row = (
            await session.execute(select(Recording).where(Recording.id == old.id))
        ).scalar_one()
        assert row.id == old.id


@pytest.mark.asyncio
async def test_prune_deletes_old_pending_without_r2(auth_client: AsyncClient) -> None:
    user_id = await _get_user_id()
    old_pending = await _insert_recording(
        user_id,
        recording_date=_old_recording_date(),
        storage_key=None,
    )

    factory = get_session_factory()
    async with factory() as session:
        result = await session.execute(
            select(User).where(User.id == user_id).options(selectinload(User.settings))
        )
        user = result.scalar_one()

        with patch("app.services.recording_retention.delete_object") as mock_delete:
            deleted = await prune_expired_recordings(session, user)

    assert deleted == 1
    mock_delete.assert_not_called()

    async with factory() as session:
        row = (
            await session.execute(select(Recording).where(Recording.id == old_pending.id))
        ).scalar_one_or_none()
        assert row is None


@pytest.mark.asyncio
async def test_login_prunes_old_recordings(client: AsyncClient) -> None:
    await client.post(
        "/api/v1/auth/register",
        json={"email": "prune-login@example.com", "password": "password123"},
    )
    user_id = await _get_user_id("prune-login@example.com")
    old = await _insert_recording(user_id, recording_date=_old_recording_date())

    with patch("app.services.recording_retention.delete_object"):
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "prune-login@example.com", "password": "password123"},
        )

    assert response.status_code == 200

    factory = get_session_factory()
    async with factory() as session:
        row = (
            await session.execute(select(Recording).where(Recording.id == old.id))
        ).scalar_one_or_none()
        assert row is None


@pytest.mark.asyncio
async def test_me_prunes_old_recordings(auth_client: AsyncClient) -> None:
    user_id = await _get_user_id()
    old = await _insert_recording(user_id, recording_date=_old_recording_date())

    with patch("app.services.recording_retention.delete_object"):
        response = await auth_client.get("/api/v1/auth/me")

    assert response.status_code == 200

    factory = get_session_factory()
    async with factory() as session:
        row = (
            await session.execute(select(Recording).where(Recording.id == old.id))
        ).scalar_one_or_none()
        assert row is None


@pytest.mark.asyncio
async def test_prune_does_not_touch_other_users(auth_client: AsyncClient, client: AsyncClient) -> None:
    user_a_id = await _get_user_id()
    old_a = await _insert_recording(user_a_id, recording_date=_old_recording_date())

    await client.post(
        "/api/v1/auth/register",
        json={"email": "other-prune@example.com", "password": "password123"},
    )
    user_b_id = await _get_user_id("other-prune@example.com")
    old_b = await _insert_recording(user_b_id, recording_date=_old_recording_date())

    factory = get_session_factory()
    async with factory() as session:
        result = await session.execute(
            select(User).where(User.id == user_a_id).options(selectinload(User.settings))
        )
        user_a = result.scalar_one()

        with patch("app.services.recording_retention.delete_object"):
            deleted = await prune_expired_recordings(session, user_a)

    assert deleted == 1

    async with factory() as session:
        row_b = (
            await session.execute(select(Recording).where(Recording.id == old_b.id))
        ).scalar_one()
        row_a = (
            await session.execute(select(Recording).where(Recording.id == old_a.id))
        ).scalar_one_or_none()
        assert row_a is None
        assert row_b.id == old_b.id


@pytest.mark.asyncio
async def test_login_succeeds_when_prune_raises(client: AsyncClient) -> None:
    await client.post(
        "/api/v1/auth/register",
        json={"email": "prune-fail-login@example.com", "password": "password123"},
    )
    with patch(
        "app.api.v1.auth.prune_expired_recordings",
        side_effect=RuntimeError("prune failed"),
    ):
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "prune-fail-login@example.com", "password": "password123"},
        )

    assert response.status_code == 200
    assert response.json()["email"] == "prune-fail-login@example.com"


@pytest.mark.asyncio
async def test_me_succeeds_when_prune_raises(auth_client: AsyncClient) -> None:
    with patch(
        "app.api.v1.auth.prune_expired_recordings",
        side_effect=RuntimeError("prune failed"),
    ):
        response = await auth_client.get("/api/v1/auth/me")

    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"
