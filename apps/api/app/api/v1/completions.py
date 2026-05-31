from datetime import date

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.core.deps import CurrentUser, DbSession
from app.models.day_completion import DayCompletion
from app.schemas.completions import (
    DayCompletionBody,
    DayCompletionResponse,
    DayCompletionUpsert,
    parse_utc_date,
)

router = APIRouter(prefix="/completions", tags=["completions"])


def _parse_query_utc_date(value: str, param: str) -> date:
    try:
        return parse_utc_date(value)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": {"kind": "validation_error", "message": f"{param}: {exc}"}},
        ) from exc


def _apply_upsert(existing: DayCompletion, body: DayCompletionUpsert) -> None:
    if body.hasReadIt is not None:
        existing.has_read_it = existing.has_read_it or body.hasReadIt
    if body.hasRecording is not None:
        existing.has_recording = existing.has_recording or body.hasRecording
    if body.usedOfflinePack is not None:
        existing.used_offline_pack = existing.used_offline_pack or body.usedOfflinePack


@router.get("", response_model=dict[str, DayCompletionBody])
async def list_completions(
    user: CurrentUser,
    db: DbSession,
    from_date: str | None = Query(default=None, alias="from"),
    to_date: str | None = Query(default=None, alias="to"),
) -> dict[str, DayCompletionBody]:
    stmt = select(DayCompletion).where(DayCompletion.user_id == user.id)
    if from_date is not None:
        stmt = stmt.where(DayCompletion.utc_date >= _parse_query_utc_date(from_date, "from"))
    if to_date is not None:
        stmt = stmt.where(DayCompletion.utc_date <= _parse_query_utc_date(to_date, "to"))
    stmt = stmt.order_by(DayCompletion.utc_date.desc())

    result = await db.execute(stmt)
    rows = result.scalars().all()
    return {
        row.utc_date.isoformat(): DayCompletionBody(
            hasReadIt=row.has_read_it,
            hasRecording=row.has_recording,
            usedOfflinePack=row.used_offline_pack,
        )
        for row in rows
    }


@router.put("/{utc_date}", response_model=DayCompletionResponse)
async def upsert_completion(
    utc_date: str,
    body: DayCompletionUpsert,
    user: CurrentUser,
    db: DbSession,
) -> DayCompletionResponse:
    try:
        parsed_date = parse_utc_date(utc_date)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": {"kind": "validation_error", "message": str(exc)}},
        ) from exc

    result = await db.execute(
        select(DayCompletion).where(
            DayCompletion.user_id == user.id,
            DayCompletion.utc_date == parsed_date,
        )
    )
    existing = result.scalar_one_or_none()

    if existing is None:
        row = DayCompletion(
            user_id=user.id,
            utc_date=parsed_date,
            has_read_it=body.hasReadIt or False if body.hasReadIt is not None else False,
            has_recording=body.hasRecording or False if body.hasRecording is not None else False,
            used_offline_pack=body.usedOfflinePack or False if body.usedOfflinePack is not None else False,
        )
        db.add(row)
    else:
        row = existing
        _apply_upsert(row, body)

    await db.commit()
    await db.refresh(row)
    return DayCompletionResponse.from_row(parsed_date, row)
