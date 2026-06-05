from datetime import date, datetime, timezone

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.deps import CurrentUser, DbSession
from app.models.days_of_use import DaysOfUse
from app.schemas.completions import parse_utc_date
from app.schemas.days_of_use import DaysOfUseStampRequest, DaysOfUseStampResponse

router = APIRouter(prefix="/days-of-use", tags=["days-of-use"])


def _parse_body_utc_date(value: str | None, param: str) -> date:
    if value is None:
        now = datetime.now(timezone.utc)
        return date(now.year, now.month, now.day)
    try:
        return parse_utc_date(value)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": {"kind": "validation_error", "message": f"{param}: {exc}"}},
        ) from exc


@router.get("", response_model=list[str])
async def list_days_of_use(user: CurrentUser, db: DbSession) -> list[str]:
    result = await db.execute(
        select(DaysOfUse.utc_date)
        .where(DaysOfUse.user_id == user.id)
        .order_by(DaysOfUse.utc_date.asc())
    )
    return [row.isoformat() for (row,) in result.all()]


@router.post("", response_model=DaysOfUseStampResponse, status_code=status.HTTP_201_CREATED)
async def stamp_day_of_use(
    user: CurrentUser,
    db: DbSession,
    body: DaysOfUseStampRequest | None = None,
) -> DaysOfUseStampResponse:
    parsed_date = _parse_body_utc_date(body.utcDate if body else None, "utcDate")

    result = await db.execute(
        select(DaysOfUse).where(
            DaysOfUse.user_id == user.id,
            DaysOfUse.utc_date == parsed_date,
        )
    )
    existing = result.scalar_one_or_none()

    if existing is None:
        db.add(DaysOfUse(user_id=user.id, utc_date=parsed_date))
        await db.commit()

    return DaysOfUseStampResponse(utcDate=parsed_date.isoformat())
