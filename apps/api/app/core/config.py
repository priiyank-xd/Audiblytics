from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+asyncpg://audiblytics:audiblytics@localhost:5432/audiblytics"
    jwt_secret: str = "change-me-in-production"
    jwt_expire_minutes: int = 60 * 24 * 7
    cookie_name: str = "audiblytics_session"
    cookie_secure: bool = False
    cors_origins: str = "http://localhost:3000"
    environment: str = "development"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
