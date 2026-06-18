from functools import lru_cache
from typing import Any

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.database_url import prepare_async_database_url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+asyncpg://audiblytics:audiblytics@localhost:5432/audiblytics"
    database_connect_args: dict[str, Any] = Field(default_factory=dict, exclude=True)

    @model_validator(mode="before")
    @classmethod
    def _prepare_database_url(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        raw_url = data.get("database_url")
        if isinstance(raw_url, str):
            url, connect_args = prepare_async_database_url(raw_url)
            data["database_url"] = url
            data["database_connect_args"] = connect_args
        return data

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
