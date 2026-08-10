"""Story 16.1 — the tenant guard itself (AC2, AC3, AC4)."""

from datetime import date, datetime, timezone
from uuid import UUID, uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import delete, select, update
from sqlalchemy.orm import selectinload

from app.core.database import get_session_factory
from app.core.tenant_scope import (
    TENANT_MODELS,
    TenantScopeError,
    assert_tenant,
    bind_tenant,
    current_tenant,
    unscoped,
)
from app.models.base import Base
from app.models.collection_word import CollectionWord
from app.models.day_completion import DayCompletion
from app.models.days_of_use import DaysOfUse
from app.models.paragraph_cache import ParagraphCache
from app.models.recording import Recording
from app.models.user import User

SEED_DAY = date(2026, 6, 1)


async def _register(client: AsyncClient, email: str) -> UUID:
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "password123"},
    )
    assert response.status_code == 201
    return UUID(response.json()["id"])


async def _seed_owned_rows(user_id: UUID, word: str) -> None:
    """One row per user-owned model. INSERT is outside the guard by design."""
    now = datetime.now(timezone.utc)
    factory = get_session_factory()
    async with factory() as session:
        session.add_all(
            [
                ParagraphCache(
                    id=uuid4(),
                    user_id=user_id,
                    paragraph="a paragraph",
                    hard_words=[],
                    theme="adventure",
                    persona="storyteller",
                    generated_at=now,
                ),
                Recording(
                    id=uuid4(),
                    user_id=user_id,
                    recording_date=now.replace(tzinfo=None),
                    paragraph_id=str(uuid4()),
                    duration_ms=1000,
                    mime_type="audio/webm",
                    storage_key=f"recordings/{user_id}/{uuid4()}.webm",
                    day_of_use=1,
                ),
                CollectionWord(
                    id=uuid4(),
                    user_id=user_id,
                    word=word,
                    ipa="/w/",
                    pronunciation_guide="wurd",
                    meaning="a word",
                    example_sentence="A word.",
                    saved_at=now,
                    review_count=0,
                    difficulty_rating=1,
                ),
                DayCompletion(user_id=user_id, utc_date=SEED_DAY, has_read_it=True),
                DaysOfUse(user_id=user_id, utc_date=SEED_DAY),
            ]
        )
        await session.commit()


@pytest.fixture
async def two_users(client: AsyncClient) -> tuple[UUID, UUID]:
    user_a = await _register(client, "scope-a@example.com")
    user_b = await _register(client, "scope-b@example.com")
    await _seed_owned_rows(user_a, "alpha")
    await _seed_owned_rows(user_b, "bravo")
    return user_a, user_b


def test_registry_covers_every_user_owned_model() -> None:
    """AC4 — a future table with a user_id cannot be added without registering it."""
    owned = {
        mapper.class_ for mapper in Base.registry.mappers if "user_id" in mapper.columns.keys()
    }
    assert owned == set(TENANT_MODELS)


async def test_unbound_session_fails_closed_for_every_model(client: AsyncClient) -> None:
    """AC3 — entity and column-only reads both raise when no tenant is bound."""
    factory = get_session_factory()
    for model in TENANT_MODELS:
        async with factory() as session:
            with pytest.raises(TenantScopeError):
                await session.execute(select(model))
        async with factory() as session:
            with pytest.raises(TenantScopeError):
                await session.execute(select(model.user_id))


async def test_unbound_session_can_still_read_users(client: AsyncClient) -> None:
    """AC3 — the tenant root table is unaffected."""
    await _register(client, "root-table@example.com")
    factory = get_session_factory()
    async with factory() as session:
        rows = (await session.execute(select(User))).scalars().all()
        assert len(rows) == 1


async def test_bound_session_filters_every_model(two_users: tuple[UUID, UUID]) -> None:
    """AC2 — unfiltered entity and column selects return only the bound tenant's rows."""
    user_a, _ = two_users
    factory = get_session_factory()
    async with factory() as session:
        bind_tenant(session, user_a)
        assert current_tenant(session) == user_a
        for model in TENANT_MODELS:
            rows = (await session.execute(select(model))).scalars().all()
            assert len(rows) == 1, model.__name__
            assert rows[0].user_id == user_a
            owners = (await session.execute(select(model.user_id))).scalars().all()
            assert set(owners) == {user_a}, model.__name__


async def test_session_get_cannot_reach_another_tenant(two_users: tuple[UUID, UUID]) -> None:
    """AC2 — primary-key lookup of another account's row returns None."""
    user_a, user_b = two_users
    factory = get_session_factory()
    async with factory() as session:
        bind_tenant(session, user_b)
        b_recording = (await session.execute(select(Recording))).scalar_one()

    async with factory() as session:
        bind_tenant(session, user_a)
        assert await session.get(Recording, b_recording.id) is None


async def test_join_from_users_stays_scoped(two_users: tuple[UUID, UUID]) -> None:
    """AC2 — reaching a tenant entity through a join from users is still filtered."""
    user_a, _ = two_users
    factory = get_session_factory()
    async with factory() as session:
        bind_tenant(session, user_a)
        rows = (
            await session.execute(
                select(Recording).select_from(User).join(Recording, Recording.user_id == User.id)
            )
        ).scalars().all()
        assert [row.user_id for row in rows] == [user_a]


async def test_orm_update_touches_only_bound_tenant(two_users: tuple[UUID, UUID]) -> None:
    """AC2 — an ORM UPDATE with no user filter cannot alter another account's rows."""
    user_a, user_b = two_users
    factory = get_session_factory()
    async with factory() as session:
        bind_tenant(session, user_a)
        await session.execute(
            update(CollectionWord).values(difficulty_rating=5).execution_options(
                synchronize_session=False
            )
        )
        await session.commit()

    async with factory() as session:
        with unscoped(session):
            rows = (await session.execute(select(CollectionWord))).scalars().all()
    ratings = {row.user_id: row.difficulty_rating for row in rows}
    assert ratings[user_a] == 5
    assert ratings[user_b] == 1


async def test_orm_delete_touches_only_bound_tenant(two_users: tuple[UUID, UUID]) -> None:
    """AC2 — an ORM DELETE with no user filter cannot remove another account's rows."""
    user_a, user_b = two_users
    factory = get_session_factory()
    async with factory() as session:
        bind_tenant(session, user_a)
        await session.execute(
            delete(DaysOfUse).execution_options(synchronize_session=False)
        )
        await session.commit()

    async with factory() as session:
        with unscoped(session):
            owners = (await session.execute(select(DaysOfUse.user_id))).scalars().all()
    assert owners == [user_b]


async def test_unscoped_lifts_then_restores(two_users: tuple[UUID, UUID]) -> None:
    user_a, _ = two_users
    factory = get_session_factory()
    async with factory() as session:
        bind_tenant(session, user_a)
        with unscoped(session):
            owners = (await session.execute(select(Recording.user_id))).scalars().all()
            assert len(owners) == 2
        scoped = (await session.execute(select(Recording.user_id))).scalars().all()
        assert scoped == [user_a]


async def test_unscoped_restores_after_exception(client: AsyncClient) -> None:
    factory = get_session_factory()
    async with factory() as session:
        with pytest.raises(RuntimeError):
            with unscoped(session):
                raise RuntimeError("boom")
        with pytest.raises(TenantScopeError):
            await session.execute(select(Recording))


async def test_assert_tenant_rejects_a_mismatch(client: AsyncClient) -> None:
    factory = get_session_factory()
    async with factory() as session:
        user_id = uuid4()
        bind_tenant(session, user_id)
        assert_tenant(session, user_id)
        with pytest.raises(TenantScopeError):
            assert_tenant(session, uuid4())


async def test_relationship_loads_are_not_guarded(two_users: tuple[UUID, UUID]) -> None:
    """Pins the documented boundary: User.<children> bypasses the guard.

    Safe because the parent users row is always the caller's own. If a future
    SQLAlchemy version changes this, it must surface here rather than in production.
    """
    user_a, user_b = two_users
    factory = get_session_factory()
    async with factory() as session:
        bind_tenant(session, user_a)
        user = (
            await session.execute(
                select(User).where(User.id == user_b).options(selectinload(User.recordings))
            )
        ).scalar_one()
        assert [row.user_id for row in user.recordings] == [user_b]
