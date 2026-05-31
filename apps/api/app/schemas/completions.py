import re
from datetime import date

from pydantic import BaseModel, ConfigDict, Field, field_validator

UTC_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def parse_utc_date(value: str) -> date:
    if not UTC_DATE_RE.match(value):
        raise ValueError("utc_date must be YYYY-MM-DD")
    return date.fromisoformat(value)


class DayCompletionBody(BaseModel):
    """Mirrors `dayCompletionSchema` (camelCase JSON)."""

    model_config = ConfigDict(populate_by_name=True)

    hasReadIt: bool = False
    hasRecording: bool = False
    usedOfflinePack: bool = False


class DayCompletionUpsert(BaseModel):
    """PUT /completions/{utc_date} — partial flags merge with OR semantics."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    hasReadIt: bool | None = None
    hasRecording: bool | None = None
    usedOfflinePack: bool | None = None


class DayCompletionResponse(DayCompletionBody):
    utcDate: str = Field(min_length=10, max_length=10)

    @field_validator("utcDate")
    @classmethod
    def validate_utc_date(cls, value: str) -> str:
        parse_utc_date(value)
        return value

    @classmethod
    def from_row(cls, utc_date: date, row: "DayCompletionRow") -> "DayCompletionResponse":
        from app.models.day_completion import DayCompletion

        assert isinstance(row, DayCompletion)
        return cls(
            utcDate=utc_date.isoformat(),
            hasReadIt=row.has_read_it,
            hasRecording=row.has_recording,
            usedOfflinePack=row.used_offline_pack,
        )


DayCompletionRow = object


class CompletionsMapResponse(BaseModel):
    """Deprecated wrapper — GET returns flat dict keyed by UTC date."""

    model_config = ConfigDict(populate_by_name=True)

    completions: dict[str, DayCompletionBody] = Field(default_factory=dict)
