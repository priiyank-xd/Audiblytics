from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.deps import CurrentUser, DbSession
from app.models.paragraph_cache import ParagraphCache
from app.schemas.paragraph import (
    ParagraphCacheResponse,
    ParagraphGenerateRequest,
    ParagraphGenerateResponse,
    ParagraphResult,
)
from app.services.gemini_paragraph import LlmServiceError, generate_paragraph_with_gemini

router = APIRouter(prefix="/paragraphs", tags=["paragraphs"])


def _utc_day_bounds(now: datetime | None = None) -> tuple[datetime, datetime]:
    now = now or datetime.now(timezone.utc)
    start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    end = datetime(now.year, now.month, now.day, 23, 59, 59, 999999, tzinfo=timezone.utc)
    return start, end


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
