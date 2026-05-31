import pytest

from app.core.config import get_settings
from app.core.database_url import normalize_async_database_url


def test_normalize_postgresql_scheme() -> None:
    url = "postgresql://user:pass@ep-neon.aws.neon.tech/neondb?sslmode=require"
    assert normalize_async_database_url(url) == (
        "postgresql+asyncpg://user:pass@ep-neon.aws.neon.tech/neondb?sslmode=require"
    )


def test_normalize_postgres_scheme() -> None:
    url = "postgres://user:pass@host/db"
    assert normalize_async_database_url(url) == "postgresql+asyncpg://user:pass@host/db"


def test_passthrough_asyncpg() -> None:
    url = "postgresql+asyncpg://localhost/db"
    assert normalize_async_database_url(url) == url


def test_passthrough_sqlite() -> None:
    url = "sqlite+aiosqlite:///:memory:"
    assert normalize_async_database_url(url) == url


def test_settings_applies_neon_normalization(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql://user:pass@ep-neon.aws.neon.tech/neondb?sslmode=require",
    )
    get_settings.cache_clear()
    assert get_settings().database_url.startswith("postgresql+asyncpg://")
    get_settings.cache_clear()
