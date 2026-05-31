from datetime import timezone
from uuid import UUID

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.deps import CurrentUser, DbSession
from app.models.collection_word import CollectionWord
from app.schemas.collection import CollectionWordCreate, CollectionWordResponse, datetime_from_iso

router = APIRouter(prefix="/collection", tags=["collection"])


async def _get_user_word(word_id: UUID, user_id: UUID, db: DbSession) -> CollectionWord | None:
    result = await db.execute(
        select(CollectionWord).where(CollectionWord.id == word_id, CollectionWord.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def _get_user_word_by_text(word: str, user_id: UUID, db: DbSession) -> CollectionWord | None:
    result = await db.execute(
        select(CollectionWord).where(CollectionWord.user_id == user_id, CollectionWord.word == word)
    )
    return result.scalar_one_or_none()


def _metadata_matches(existing: CollectionWord, body: CollectionWordCreate) -> bool:
    body_saved_at = datetime_from_iso(body.savedAt)
    existing_saved_at = existing.saved_at
    if existing_saved_at.tzinfo is None:
        existing_saved_at = existing_saved_at.replace(tzinfo=timezone.utc)
    else:
        existing_saved_at = existing_saved_at.astimezone(timezone.utc)

    body_source = UUID(body.sourceParagraphId) if body.sourceParagraphId else None
    body_last_reviewed: datetime | None = None
    if body.lastReviewedAt is not None:
        body_last_reviewed = datetime_from_iso(body.lastReviewedAt)

    existing_last_reviewed = existing.last_reviewed_at
    if existing_last_reviewed is not None:
        if existing_last_reviewed.tzinfo is None:
            existing_last_reviewed = existing_last_reviewed.replace(tzinfo=timezone.utc)
        else:
            existing_last_reviewed = existing_last_reviewed.astimezone(timezone.utc)

    return (
        existing.word == body.word
        and existing.ipa == body.ipa
        and existing.pronunciation_guide == body.pronunciationGuide
        and existing.meaning == body.meaning
        and existing.example_sentence == body.exampleSentence
        and existing_saved_at == body_saved_at
        and existing.source_paragraph_id == body_source
        and existing.review_count == body.reviewCount
        and existing_last_reviewed == body_last_reviewed
        and existing.difficulty_rating == body.difficultyRating
    )


def _row_from_body(body: CollectionWordCreate, user_id: UUID) -> CollectionWord:
    source_id = UUID(body.sourceParagraphId) if body.sourceParagraphId else None
    last_reviewed = datetime_from_iso(body.lastReviewedAt) if body.lastReviewedAt else None
    return CollectionWord(
        id=UUID(body.id),
        user_id=user_id,
        word=body.word,
        ipa=body.ipa,
        pronunciation_guide=body.pronunciationGuide,
        meaning=body.meaning,
        example_sentence=body.exampleSentence,
        saved_at=datetime_from_iso(body.savedAt),
        source_paragraph_id=source_id,
        review_count=body.reviewCount,
        last_reviewed_at=last_reviewed,
        difficulty_rating=body.difficultyRating,
    )


@router.get("", response_model=list[CollectionWordResponse])
async def list_collection_words(user: CurrentUser, db: DbSession) -> list[CollectionWordResponse]:
    result = await db.execute(
        select(CollectionWord)
        .where(CollectionWord.user_id == user.id)
        .order_by(CollectionWord.saved_at.desc())
    )
    rows = result.scalars().all()
    return [CollectionWordResponse.from_row(row) for row in rows]


@router.post("", response_model=CollectionWordResponse)
async def save_collection_word(
    body: CollectionWordCreate,
    user: CurrentUser,
    db: DbSession,
    response: Response,
) -> CollectionWordResponse:
    word_id = UUID(body.id)

    existing_by_id = await _get_user_word(word_id, user.id, db)
    if existing_by_id is not None:
        if not _metadata_matches(existing_by_id, body):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error": {
                        "kind": "conflict",
                        "message": "Collection word id reused with different metadata.",
                    }
                },
            )
        response.status_code = status.HTTP_200_OK
        return CollectionWordResponse.from_row(existing_by_id)

    existing_by_word = await _get_user_word_by_text(body.word, user.id, db)
    if existing_by_word is not None:
        response.status_code = status.HTTP_200_OK
        return CollectionWordResponse.from_row(existing_by_word)

    row = _row_from_body(body, user.id)
    db.add(row)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        existing_by_id = await _get_user_word(word_id, user.id, db)
        if existing_by_id is not None:
            if _metadata_matches(existing_by_id, body):
                response.status_code = status.HTTP_200_OK
                return CollectionWordResponse.from_row(existing_by_id)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error": {
                        "kind": "conflict",
                        "message": "Collection word id reused with different metadata.",
                    }
                },
            )
        existing_by_word = await _get_user_word_by_text(body.word, user.id, db)
        if existing_by_word is not None:
            response.status_code = status.HTTP_200_OK
            return CollectionWordResponse.from_row(existing_by_word)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": {
                    "kind": "conflict",
                    "message": "Collection word could not be saved.",
                }
            },
        )

    await db.refresh(row)
    response.status_code = status.HTTP_201_CREATED
    return CollectionWordResponse.from_row(row)


@router.delete("/{word_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection_word(word_id: UUID, user: CurrentUser, db: DbSession) -> None:
    row = await _get_user_word(word_id, user.id, db)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"kind": "not_found", "message": "Collection word not found."}},
        )
    await db.delete(row)
    await db.commit()
