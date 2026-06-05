from datetime import date, datetime, timezone
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.core.deps import CurrentUser, DbSession
from app.models.paragraph_cache import ParagraphCache
from app.schemas.completions import parse_utc_date
from app.schemas.paragraph import (
    ParagraphCacheResponse,
    ParagraphGenerateRequest,
    ParagraphGenerateResponse,
    ParagraphResult,
)
from app.services.gemini_paragraph import LlmServiceError, generate_paragraph_with_gemini

router = APIRouter(prefix="/paragraphs", tags=["paragraphs"])


def _parse_query_utc_date(value: str, param: str) -> date:
    try:
        return parse_utc_date(value)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": {"kind": "validation_error", "message": f"{param}: {exc}"}},
        ) from exc


def _utc_day_bounds_for_date(utc_date: date) -> tuple[datetime, datetime]:
    start = datetime(utc_date.year, utc_date.month, utc_date.day, tzinfo=timezone.utc)
    end = datetime(utc_date.year, utc_date.month, utc_date.day, 23, 59, 59, 999999, tzinfo=timezone.utc)
    return start, end


def _utc_date_from_generated_at(generated_at: datetime) -> str:
    if generated_at.tzinfo is None:
        generated_at = generated_at.replace(tzinfo=timezone.utc)
    else:
        generated_at = generated_at.astimezone(timezone.utc)
    return generated_at.strftime("%Y-%m-%d")


def _utc_day_bounds(now: datetime | None = None) -> tuple[datetime, datetime]:
    now = now or datetime.now(timezone.utc)
    start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    end = datetime(now.year, now.month, now.day, 23, 59, 59, 999999, tzinfo=timezone.utc)
    return start, end


@router.get("/dates", response_model=list[str])
async def list_paragraph_dates(
    user: CurrentUser,
    db: DbSession,
    from_date: str | None = Query(default=None, alias="from"),
    to_date: str | None = Query(default=None, alias="to"),
) -> list[str]:
    stmt = select(ParagraphCache.generated_at).where(ParagraphCache.user_id == user.id)
    if from_date is not None:
        start, _ = _utc_day_bounds_for_date(_parse_query_utc_date(from_date, "from"))
        stmt = stmt.where(ParagraphCache.generated_at >= start)
    if to_date is not None:
        _, end = _utc_day_bounds_for_date(_parse_query_utc_date(to_date, "to"))
        stmt = stmt.where(ParagraphCache.generated_at <= end)

    result = await db.execute(stmt)
    dates: set[str] = set()
    for (generated_at,) in result.all():
        dates.add(_utc_date_from_generated_at(generated_at))
    return sorted(dates)


@router.get("/by-date/{utc_date}", response_model=ParagraphCacheResponse)
async def get_paragraph_by_utc_date(
    utc_date: str,
    user: CurrentUser,
    db: DbSession,
) -> ParagraphCacheResponse:
    parsed_date = _parse_query_utc_date(utc_date, "utc_date")
    start, end = _utc_day_bounds_for_date(parsed_date)
    result = await db.execute(
        select(ParagraphCache)
        .where(ParagraphCache.user_id == user.id)
        .where(ParagraphCache.generated_at >= start)
        .where(ParagraphCache.generated_at <= end)
        .order_by(ParagraphCache.generated_at.desc())
        .limit(1)
    )
    row = result.scalar_one_or_none()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"kind": "not_found", "message": "No paragraph cached for that date."}},
        )
    return ParagraphCacheResponse.from_row(row)


@router.get("/today", response_model=ParagraphCacheResponse)
async def get_paragraph_today(user: CurrentUser, db: DbSession) -> ParagraphCacheResponse:
    start, end = _utc_day_bounds()
    result = await db.execute(
        select(ParagraphCache)
        .where(ParagraphCache.user_id == user.id)
        .where(ParagraphCache.generated_at >= start)
        .where(ParagraphCache.generated_at <= end)
        .order_by(ParagraphCache.generated_at.desc())
        .limit(1)
    )
    row = result.scalar_one_or_none()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"kind": "not_found", "message": "No paragraph cached for today."}},
        )
    return ParagraphCacheResponse.from_row(row)


@router.post("/generate", response_model=ParagraphGenerateResponse, status_code=status.HTTP_201_CREATED)
async def generate_paragraph(
    body: ParagraphGenerateRequest,
    user: CurrentUser,
    db: DbSession,
) -> ParagraphGenerateResponse:
    settings_row = user.settings
    if settings_row is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"kind": "storage_error", "message": "User settings missing."}},
        )

    recycle_for_prompt = body.recycleWords if len(body.recycleWords) >= 2 else []

    try:
        result: ParagraphResult = await generate_paragraph_with_gemini(
            theme=settings_row.theme,
            persona=settings_row.persona,
            length=settings_row.length,
            recycle_words=recycle_for_prompt,
            api_key=settings_row.gemini_api_key,
        )
    except LlmServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=exc.to_detail(),
        ) from exc

    paragraph_id = UUID(body.paragraphId) if body.paragraphId else uuid4()
    generated_at = datetime.now(timezone.utc)
    row = ParagraphCache(
        id=paragraph_id,
        user_id=user.id,
        paragraph=result.paragraph,
        hard_words=[hw.model_dump(by_alias=True) for hw in result.hardWords],
        theme=settings_row.theme,
        persona=settings_row.persona,
        generated_at=generated_at,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)

    base = ParagraphCacheResponse.from_row(row)
    return ParagraphGenerateResponse(
        **base.model_dump(),
        recycleWordTexts=recycle_for_prompt,
    )
