"""ORM-enforced tenant scoping (ADR 0004, NFR30, BV4.2).

Every ORM read/update/delete of a user-owned model is filtered by the tenant
bound to the session, so no route has to remember a `user_id` predicate. A
session with no tenant bound fails closed with `TenantScopeError`.
"""

from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
from typing import Any, TypeVar
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import ORMExecuteState, Session, with_loader_criteria

from app.models.base import Base
from app.models.collection_word import CollectionWord
from app.models.day_completion import DayCompletion
from app.models.days_of_use import DaysOfUse
from app.models.paragraph_cache import ParagraphCache
from app.models.recording import Recording
from app.models.user_settings import UserSettings

TENANT_SESSION_KEY = "tenant_user_id"
TENANT_BYPASS_KEY = "tenant_scope_bypass"

# Every user-owned table. `users` is the tenant root and stays out.
TENANT_MODELS: tuple[type[Any], ...] = (
    UserSettings,
    ParagraphCache,
    Recording,
    CollectionWord,
    DayCompletion,
    DaysOfUse,
)

SessionLike = Session | AsyncSession
ModelT = TypeVar("ModelT", bound=Base)


class TenantScopeError(RuntimeError):
    """A user-owned model was queried through a session with no tenant bound."""


def bind_tenant(session: SessionLike, user_id: UUID) -> None:
    session.info[TENANT_SESSION_KEY] = user_id


def current_tenant(session: SessionLike) -> UUID | None:
    return session.info.get(TENANT_SESSION_KEY)


def assert_tenant(session: SessionLike, user_id: UUID) -> None:
    bound = current_tenant(session)
    if bound != user_id:
        raise TenantScopeError(f"Session tenant {bound!r} is not the required tenant {user_id!r}.")


@contextmanager
def unscoped(session: SessionLike) -> Iterator[None]:
    """Lift the guard for administrative access (export, account deletion)."""
    had_previous = TENANT_BYPASS_KEY in session.info
    previous = session.info.get(TENANT_BYPASS_KEY)
    session.info[TENANT_BYPASS_KEY] = True
    try:
        yield
    finally:
        if had_previous:
            session.info[TENANT_BYPASS_KEY] = previous
        else:
            session.info.pop(TENANT_BYPASS_KEY, None)


def _apply_tenant_criteria(state: ORMExecuteState) -> None:
    if state.is_column_load or state.is_relationship_load:
        return
    if not (state.is_select or state.is_update or state.is_delete):
        return
    touched = [mapper.class_ for mapper in state.all_mappers if mapper.class_ in TENANT_MODELS]
    if not touched:
        return
    if state.session.info.get(TENANT_BYPASS_KEY):
        return
    tenant_id = state.session.info.get(TENANT_SESSION_KEY)
    if tenant_id is None:
        names = ", ".join(sorted(model.__name__ for model in touched))
        raise TenantScopeError(
            f"No tenant bound to this session; refusing to query {names}. "
            "Call bind_tenant(session, user_id), or unscoped(session) for administrative access."
        )
    for model in touched:
        state.statement = state.statement.options(
            with_loader_criteria(model, model.user_id == tenant_id, include_aliases=True)
        )


_guard_installed = False


def install_tenant_guard() -> None:
    """Idempotent — `database.py` calls this at import so every session is guarded."""
    global _guard_installed
    if _guard_installed:
        return
    # AsyncSession dispatches ORM execution through a sync Session and shares its `.info`.
    event.listen(Session, "do_orm_execute", _apply_tenant_criteria)
    _guard_installed = True


async def get_owned_or_404(
    db: AsyncSession,
    model: type[ModelT],
    obj_id: Any,
    *,
    message: str,
) -> ModelT:
    """Fetch by primary key through the guard. Another account's id is a 404, never a 403."""
    row = await db.get(model, obj_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"kind": "not_found", "message": message}},
        )
    return row
