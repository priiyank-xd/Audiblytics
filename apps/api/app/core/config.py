from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.database_url import normalize_async_database_url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+asyncpg://audiblytics:audiblytics@localhost:5432/audiblytics"

    @field_validator("database_url", mode="before")
    @classmethod
    def _normalize_database_url(cls, value: str) -> str:
        if not isinstance(value, str):
            return value
        return normalize_async_database_url(value)
    jwt_secret: str = "change-me-in-production"
    jwt_expire_minutes: int = 60 * 24 * 7
    cookie_name: str = "audiblytics_session"
    cookie_secure: bool = False
    cors_origins: str = "http://localhost:3000"
    environment: str = "development"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket: str = ""

    @property
    def r2_configured(self) -> bool:
        return bool(
            self.r2_account_id.strip()
            and self.r2_access_key_id.strip()
            and self.r2_secret_access_key.strip()
            and self.r2_bucket.strip()
        )

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
