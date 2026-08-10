import logging
from uuid import uuid4

from botocore.exceptions import BotoCoreError, ClientError
from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import selectinload

from app.core.deps import CurrentUser, DbSession, session_cookie_kwargs
from app.core.security import create_access_token, hash_password, verify_password
from app.core.tenant_scope import TENANT_MODELS, bind_tenant
from app.models.recording import Recording
from app.models.user import User
from app.models.user_settings import UserSettings
from app.schemas.account import AccountDeletionResponse
from app.schemas.auth import LoginRequest, RegisterRequest, UserResponse
from app.services.r2_client import R2ConfigurationError, delete_object
from app.services.recording_retention import prune_expired_recordings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


def user_to_response(user: User) -> UserResponse:
    return UserResponse(id=str(user.id), email=user.email)


async def _prune_recordings_best_effort(db: DbSession, user: User) -> None:
    try:
        await prune_expired_recordings(db, user)
    except SQLAlchemyError:
        await db.rollback()
        logger.exception("Recording retention prune failed for user %s", user.id)
    except Exception:
        logger.exception("Recording retention prune failed for user %s", user.id)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, response: Response, db: DbSession) -> UserResponse:
    user = User(id=uuid4(), email=body.email.lower(), password_hash=hash_password(body.password))
    user.settings = UserSettings(user_id=user.id)
    db.add(user)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": {"kind": "conflict", "message": "Email already registered."}},
        ) from exc
    bind_tenant(db, user.id)
    await db.refresh(user)
    token = create_access_token(user.id)
    response.set_cookie(value=token, **session_cookie_kwargs())
    return user_to_response(user)


@router.post("/login", response_model=UserResponse)
async def login(body: LoginRequest, response: Response, db: DbSession) -> UserResponse:
    result = await db.execute(
        select(User).options(selectinload(User.settings)).where(User.email == body.email.lower())
    )
    user = result.scalar_one_or_none()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"kind": "unauthorized", "message": "Invalid email or password."}},
        )
    bind_tenant(db, user.id)
    token = create_access_token(user.id)
    response.set_cookie(value=token, **session_cookie_kwargs())
    await _prune_recordings_best_effort(db, user)
    return user_to_response(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response) -> None:
    kwargs = session_cookie_kwargs()
    response.delete_cookie(key=kwargs["key"], path=kwargs["path"])


@router.get("/me", response_model=UserResponse)
async def me(user: CurrentUser, db: DbSession) -> UserResponse:
    await _prune_recordings_best_effort(db, user)
    return user_to_response(user)


@router.delete("/account", response_model=AccountDeletionResponse)
async def delete_account(user: CurrentUser, db: DbSession, response: Response) -> AccountDeletionResponse:
    """
    Story 16.4 — remove every owned row and every owned R2 object, then invalidate the session.

    Rows are deleted per table through the tenant guard rather than relying on the
    database's ON DELETE CASCADE, so the outcome is identical on SQLite and Postgres.
    Object deletion is attempted first: a key that cannot be removed is logged and
    returned as orphaned, and deleting the same key again is a no-op, so the caller
    can safely repeat the operation.
    """
    storage_keys = (
        await db.execute(select(Recording.storage_key).where(Recording.storage_key.is_not(None)))
    ).scalars().all()

    orphaned: list[str] = []
    for key in storage_keys:
        try:
            delete_object(key)
        except (R2ConfigurationError, BotoCoreError, ClientError, ValueError):
            logger.exception(
                "Account deletion left an orphaned R2 object: key=%s user=%s", key, user.id
            )
            orphaned.append(key)

    for model in TENANT_MODELS:
        await db.execute(delete(model).execution_options(synchronize_session=False))
    await db.execute(delete(User).where(User.id == user.id))
    await db.commit()

    kwargs = session_cookie_kwargs()
    response.delete_cookie(key=kwargs["key"], path=kwargs["path"])
    return AccountDeletionResponse(
        deletedRecordings=len(storage_keys),
        orphanedObjectKeys=orphaned,
    )
