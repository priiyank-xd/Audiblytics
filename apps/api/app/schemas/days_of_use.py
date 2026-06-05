from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.completions import parse_utc_date


class DaysOfUseStampRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    utcDate: str | None = None

    @field_validator("utcDate")
    @classmethod
    def validate_utc_date(cls, value: str | None) -> str | None:
        if value is None:
            return None
        parse_utc_date(value)
        return value


class DaysOfUseStampResponse(BaseModel):
    utcDate: str = Field(min_length=10, max_length=10)
