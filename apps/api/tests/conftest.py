import os

import pytest
from httpx import ASGITransport, AsyncClient

# Must set before app imports create engine
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")

from app.core.config import get_settings
from app.core.database import init_db, reset_engine
from app.main import create_app


@pytest.fixture
async def client() -> AsyncClient:
    os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
    get_settings.cache_clear()
    reset_engine()
    app = create_app()
    await init_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def auth_client(client: AsyncClient) -> AsyncClient:
    await client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "password123"},
    )
    return client
