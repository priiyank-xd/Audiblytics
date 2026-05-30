from datetime import datetime, timezone
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.settings import Persona, Theme

LlmErrorKind = Literal[
    "rate_limit",
    "quota_exceeded",
    "auth",
    "network",
    "malformed_response",
    "unknown",
]


class HardWord(BaseModel):
    """Mirrors `hardWordSchema` (camelCase JSON)."""

    word: str = Field(min_length=1)
    ipa: str = Field(min_length=1)
    pronunciationGuide: str = Field(min_length=1)
    meaning: str = Field(min_length=1)
    exampleSentence: str = Field(min_length=1)


class ParagraphResult(BaseModel):
    """Mirrors `paragraphSchema`."""

    paragraph: str = Field(min_length=1)
    hardWords: list[HardWord] = Field(min_length=1, max_length=10)


class ParagraphGenerateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    paragraphId: str | None = None
    recycleWords: list[str] = Field(default_factory=list, max_length=10)

    @field_validator("paragraphId")
    @classmethod
    def validate_paragraph_id(cls, value: str | None) -> str | None:
        if value is None:
            return None
        UUID(value)
        return value

    @field_validator("recycleWords")
    @classmethod
    def strip_recycle_words(cls, words: list[str]) -> list[str]:
        return [w.strip() for w in words if w.strip()]


class ParagraphCacheResponse(BaseModel):
    """Mirrors `cachedParagraphSchema` (camelCase JSON)."""

    id: str
    paragraph: str
    hardWords: list[HardWord]
    theme: Theme
    persona: Persona
    generatedAt: str

    @classmethod
    def from_row(cls, row: "ParagraphCacheRow") -> "ParagraphCacheResponse":
        from app.models.paragraph_cache import ParagraphCache

        assert isinstance(row, ParagraphCache)
        generated_at = row.generated_at
        if generated_at.tzinfo is None:
            generated_at = generated_at.replace(tzinfo=timezone.utc)
        else:
            generated_at = generated_at.astimezone(timezone.utc)
        iso = generated_at.isoformat(timespec="milliseconds").replace("+00:00", "Z")
        return cls(
            id=str(row.id),
            paragraph=row.paragraph,
            hardWords=[HardWord.model_validate(hw) for hw in row.hard_words],
            theme=row.theme,  # type: ignore[arg-type]
            persona=row.persona,  # type: ignore[arg-type]
            generatedAt=iso,
        )


# Type alias for model import in from_row
ParagraphCacheRow = object


class ParagraphGenerateResponse(ParagraphCacheResponse):
    recycleWordTexts: list[str]
