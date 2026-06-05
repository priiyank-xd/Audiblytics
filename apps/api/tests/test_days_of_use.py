from datetime import datetime, timezone
from unittest.mock import patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_days_of_use_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/days-of-use")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_days_of_use_empty(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/api/v1/days-of-use")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_stamp_day_of_use_idempotent(auth_client: AsyncClient) -> None:
    first = await auth_client.post("/api/v1/days-of-use", json={})
    assert first.status_code == 201
    utc_date = first.json()["utcDate"]

    second = await auth_client.post("/api/v1/days-of-use", json={})
    assert second.status_code == 201
    assert second.json()["utcDate"] == utc_date

    listing = await auth_client.get("/api/v1/days-of-use")
    assert listing.json() == [utc_date]


@pytest.mark.asyncio
async def test_stamp_explicit_utc_date(auth_client: AsyncClient) -> None:
    with patch("app.api.v1.days_of_use.datetime") as mock_datetime:
        mock_datetime.now.return_value = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)
        mock_datetime.side_effect = lambda *args, **kwargs: datetime(*args, **kwargs)

        response = await auth_client.post(
            "/api/v1/days-of-use",
            json={"utcDate": "2026-05-15"},
        )
    assert response.status_code == 201
    assert response.json()["utcDate"] == "2026-05-15"

    listing = await auth_client.get("/api/v1/days-of-use")
    assert listing.json() == ["2026-05-15"]


@pytest.mark.asyncio
async def test_stamp_invalid_utc_date(auth_client: AsyncClient) -> None:
    response = await auth_client.post("/api/v1/days-of-use", json={"utcDate": "bad"})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_days_of_use_user_isolation(client: AsyncClient) -> None:
    await client.post(
        "/api/v1/auth/register",
        json={"email": "dou-a@example.com", "password": "password123"},
    )
    await client.post("/api/v1/days-of-use", json={"utcDate": "2026-05-20"})

    await client.post(
        "/api/v1/auth/register",
        json={"email": "dou-b@example.com", "password": "password123"},
    )
    assert (await client.get("/api/v1/days-of-use")).json() == []

    await client.post(
        "/api/v1/auth/login",
        json={"email": "dou-a@example.com", "password": "password123"},
    )
    assert (await client.get("/api/v1/days-of-use")).json() == ["2026-05-20"]
