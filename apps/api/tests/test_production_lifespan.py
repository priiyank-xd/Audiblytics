import os
from unittest.mock import AsyncMock, patch

import pytest

from app.core.config import get_settings
from app.core.database import reset_engine
from app.main import create_app


@pytest.mark.asyncio
async def test_production_lifespan_skips_init_db(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
    get_settings.cache_clear()
    reset_engine()

    with patch("app.main.init_db", new_callable=AsyncMock) as mock_init:
        app = create_app()
        async with app.router.lifespan_context(app):
            pass
        mock_init.assert_not_called()


@pytest.mark.asyncio
async def test_development_lifespan_runs_init_db(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ENVIRONMENT", "development")
    monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
    get_settings.cache_clear()
    reset_engine()

    with patch("app.main.init_db", new_callable=AsyncMock) as mock_init:
        app = create_app()
        async with app.router.lifespan_context(app):
            pass
        mock_init.assert_called_once()
