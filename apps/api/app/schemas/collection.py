from datetime import datetime, timezone
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _validate_iso_datetime(value: str, field_name: str) -> str:
    normalized = value.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError as exc:
        raise ValueError(f"{field_name} must be an ISO 8601 UTC datetime string") from exc
    if parsed.tzinfo is None:
        raise ValueError(f"{field_name} must include a timezone offset (UTC preferred)")
    utc = parsed.astimezone(timezone.utc)
    return utc.isoformat(timespec="milliseconds").replace("+00:00", "Z")


def datetime_from_iso(iso: str) -> datetime:
    """Parse validated ISO datetime (Z-normalized) for DB storage."""
    normalized = iso.replace("Z", "+00:00")
    return datetime.fromisoformat(normalized).astimezone(timezone.utc)


class CollectionWordResponse(BaseModel):
    """Mirrors `collection.schema.ts` (camelCase JSON)."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    word: str = Field(min_length=1)
    ipa: str = Field(min_length=1)
    pronunciationGuide: str = Field(min_length=1)
    meaning: str = Field(min_length=1)
    exampleSentence: str = Field(min_length=1)
    savedAt: str
    sourceParagraphId: str | None = None
    reviewCount: int = Field(ge=0, default=0)
    lastReviewedAt: str | None = None
    difficultyRating: int = Field(ge=0, le=2, default=1)

    @field_validator("savedAt")
    @classmethod
    def validate_saved_at(cls, value: str) -> str:
        return _validate_iso_datetime(value, "savedAt")

    @field_validator("lastReviewedAt")
    @classmethod
    def validate_last_reviewed_at(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _validate_iso_datetime(value, "lastReviewedAt")

    @field_validator("sourceParagraphId")
    @classmethod
    def validate_source_paragraph_id(cls, value: str | None) -> str | None:
        if value is None:
            return None
        UUID(value)
        return value

    @classmethod
    def from_row(cls, row: "CollectionWordRow") -> "CollectionWordResponse":
        from app.models.collection_word import CollectionWord

        assert isinstance(row, CollectionWord)
        saved_at = row.saved_at
        if saved_at.tzinfo is None:
            saved_at = saved_at.replace(tzinfo=timezone.utc)
        else:
            saved_at = saved_at.astimezone(timezone.utc)
        saved_iso = saved_at.isoformat(timespec="milliseconds").replace("+00:00", "Z")

        last_reviewed_iso: str | None = None
        if row.last_reviewed_at is not None:
            last_reviewed = row.last_reviewed_at
            if last_reviewed.tzinfo is None:
                last_reviewed = last_reviewed.replace(tzinfo=timezone.utc)
            else:
                last_reviewed = last_reviewed.astimezone(timezone.utc)
            last_reviewed_iso = last_reviewed.isoformat(timespec="milliseconds").replace("+00:00", "Z")

        return cls(
            id=str(row.id),
            word=row.word,
            ipa=row.ipa,
            pronunciationGuide=row.pronunciation_guide,
            meaning=row.meaning,
            exampleSentence=row.example_sentence,
            savedAt=saved_iso,
            sourceParagraphId=str(row.source_paragraph_id) if row.source_paragraph_id else None,
            reviewCount=row.review_count,
            lastReviewedAt=last_reviewed_iso,
            difficultyRating=row.difficulty_rating,
        )


CollectionWordRow = object


class CollectionWordCreate(BaseModel):
    """POST /collection body — mirrors client `collectionWordSchema`."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    id: str
    word: str = Field(min_length=1)
    ipa: str = Field(min_length=1)
    pronunciationGuide: str = Field(min_length=1)
    meaning: str = Field(min_length=1)
    exampleSentence: str = Field(min_length=1)
    savedAt: str
    sourceParagraphId: str | None = None
    reviewCount: int = Field(ge=0, default=0)
    lastReviewedAt: str | None = None
    difficultyRating: int = Field(ge=0, le=2, default=1)

    @field_validator("id")
    @classmethod
    def validate_id(cls, value: str) -> str:
        UUID(value)
        return value

    @field_validator("savedAt")
    @classmethod
    def validate_saved_at(cls, value: str) -> str:
        return _validate_iso_datetime(value, "savedAt")

    @field_validator("lastReviewedAt")
    @classmethod
    def validate_last_reviewed_at(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _validate_iso_datetime(value, "lastReviewedAt")

    @field_validator("sourceParagraphId")
    @classmethod
    def validate_source_paragraph_id(cls, value: str | None) -> str | None:
        if value is None:
            return None
        UUID(value)
        return value
