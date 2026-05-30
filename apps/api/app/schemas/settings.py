from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Theme = Literal[
    "horror",
    "comedy",
    "adventure",
    "mythic-quest",
    "survival",
    "travelogue",
    "mystery",
    "sci-fi",
    "slice-of-life",
]
Persona = Literal[
    "gre-aspirant",
    "business-english",
    "storyteller",
    "campfire-narrator",
    "news-reader",
    "debate-coach",
    "casual-conversationalist",
]
RetentionPolicy = Literal["90-day-rolling", "indefinite"]
ActiveProvider = Literal["gemini", "openai", "anthropic", "openrouter", "ollama"]


class SettingsResponse(BaseModel):
    """Mirrors apps/web `settingsSchema` + activeProvider (camelCase JSON)."""

    theme: Theme
    persona: Persona
    length: int = Field(ge=100, le=200)
    retention: RetentionPolicy
    voiceURI: str | None = None
    activeProvider: ActiveProvider
    hasGeminiApiKey: bool = False

    @classmethod
    def from_row(cls, row: "UserSettings") -> "SettingsResponse":
        from app.models.user_settings import UserSettings as UserSettingsModel

        assert isinstance(row, UserSettingsModel)
        return cls(
            theme=row.theme,  # type: ignore[arg-type]
            persona=row.persona,  # type: ignore[arg-type]
            length=row.length,
            retention=row.retention,  # type: ignore[arg-type]
            voiceURI=row.voice_uri,
            activeProvider=row.active_provider,  # type: ignore[arg-type]
            hasGeminiApiKey=bool(row.gemini_api_key and row.gemini_api_key.strip()),
        )


class SettingsPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    theme: Theme | None = None
    persona: Persona | None = None
    length: int | None = Field(default=None, ge=100, le=200)
    retention: RetentionPolicy | None = None
    voiceURI: str | None = None
    activeProvider: ActiveProvider | None = None
    geminiApiKey: str | None = None
