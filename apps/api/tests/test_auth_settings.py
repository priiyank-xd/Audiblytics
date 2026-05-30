import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_register_login_and_settings(auth_client: AsyncClient) -> None:
    me = await auth_client.get("/api/v1/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == "test@example.com"

    settings = await auth_client.get("/api/v1/settings")
    assert settings.status_code == 200
    body = settings.json()
    assert body["theme"] == "adventure"
    assert body["length"] == 150

    patched = await auth_client.patch(
        "/api/v1/settings",
        json={"theme": "comedy", "length": 160},
    )
    assert patched.status_code == 200
    assert patched.json()["theme"] == "comedy"
    assert patched.json()["length"] == 160


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient) -> None:
    await client.post(
        "/api/v1/auth/register",
        json={"email": "other@example.com", "password": "password123"},
    )
    bad = await client.post(
        "/api/v1/auth/login",
        json={"email": "other@example.com", "password": "wrong-password"},
    )
    assert bad.status_code == 401
