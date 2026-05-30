from typing import Annotated
from uuid import UUID

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user_id(
    db: DbSession,
    audiblytics_session: Annotated[
        str | None,
        Cookie(alias=get_settings().cookie_name),
    ] = None,
) -> UUID:
    if not audiblytics_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"kind": "unauthorized", "message": "Not signed in."}},
        )
    user_id = decode_access_token(audiblytics_session)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"kind": "unauthorized", "message": "Session expired."}},
        )
    result = await db.execute(select(User.id).where(User.id == user_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"kind": "unauthorized", "message": "User not found."}},
        )
    return user_id


async def get_current_user(
    db: DbSession,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> User:
    result = await db.execute(
        select(User).options(selectinload(User.settings)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"kind": "unauthorized", "message": "User not found."}},
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def session_cookie_kwargs() -> dict:
    settings = get_settings()
    return {
        "key": settings.cookie_name,
        "httponly": True,
        "secure": settings.cookie_secure,
        "samesite": "lax",
        "max_age": settings.jwt_expire_minutes * 60,
        "path": "/",
    }
