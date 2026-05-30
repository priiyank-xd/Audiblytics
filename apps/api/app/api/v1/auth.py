from uuid import uuid4

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.deps import CurrentUser, DbSession, session_cookie_kwargs
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.models.user_settings import UserSettings
from app.schemas.auth import LoginRequest, RegisterRequest, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


def user_to_response(user: User) -> UserResponse:
    return UserResponse(id=str(user.id), email=user.email)


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
    await db.refresh(user)
    token = create_access_token(user.id)
    response.set_cookie(value=token, **session_cookie_kwargs())
    return user_to_response(user)


@router.post("/login", response_model=UserResponse)
async def login(body: LoginRequest, response: Response, db: DbSession) -> UserResponse:
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"kind": "unauthorized", "message": "Invalid email or password."}},
        )
    token = create_access_token(user.id)
    response.set_cookie(value=token, **session_cookie_kwargs())
    return user_to_response(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response) -> None:
    kwargs = session_cookie_kwargs()
    response.delete_cookie(key=kwargs["key"], path=kwargs["path"])


@router.get("/me", response_model=UserResponse)
async def me(user: CurrentUser) -> UserResponse:
    return user_to_response(user)
