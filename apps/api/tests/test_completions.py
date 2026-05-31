import pytest
from httpx import AsyncClient


def _upsert_body(**kwargs: bool) -> dict:
    return {
        "hasReadIt": kwargs.get("hasReadIt", False),
        "hasRecording": kwargs.get("hasRecording", False),
        "usedOfflinePack": kwargs.get("usedOfflinePack", False),
    }


@pytest.mark.asyncio
async def test_list_completions_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/completions")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_completions_empty(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/api/v1/completions")
    assert response.status_code == 200
    assert response.json() == {}


@pytest.mark.asyncio
async def test_upsert_and_list_completion(auth_client: AsyncClient) -> None:
    utc_date = "2026-05-31"
    upsert = await auth_client.put(
        f"/api/v1/completions/{utc_date}",
        json=_upsert_body(hasReadIt=True),
    )
    assert upsert.status_code == 200
    body = upsert.json()
    assert body["utcDate"] == utc_date
    assert body["hasReadIt"] is True
    assert body["hasRecording"] is False

    listing = await auth_client.get("/api/v1/completions")
    assert listing.status_code == 200
    data = listing.json()
    assert data[utc_date]["hasReadIt"] is True


@pytest.mark.asyncio
async def test_upsert_merges_flags_or_semantics(auth_client: AsyncClient) -> None:
    utc_date = "2026-05-30"
    assert (
        await auth_client.put(
            f"/api/v1/completions/{utc_date}",
            json={"hasReadIt": True},
        )
    ).status_code == 200

    merge = await auth_client.put(
        f"/api/v1/completions/{utc_date}",
        json={"hasRecording": True, "hasReadIt": False},
    )
    assert merge.status_code == 200
    merged = merge.json()
    assert merged["hasReadIt"] is True
    assert merged["hasRecording"] is True


@pytest.mark.asyncio
async def test_upsert_invalid_date(auth_client: AsyncClient) -> None:
    response = await auth_client.put(
        "/api/v1/completions/not-a-date",
        json={"hasReadIt": True},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_completions_invalid_from_date(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/api/v1/completions", params={"from": "not-a-date"})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_completions_user_isolation(client: AsyncClient) -> None:
    await client.post(
        "/api/v1/auth/register",
        json={"email": "comp-a@example.com", "password": "password123"},
    )
    assert (
        await client.put(
            "/api/v1/completions/2026-05-31",
            json={"hasReadIt": True},
        )
    ).status_code == 200

    await client.post(
        "/api/v1/auth/register",
        json={"email": "comp-b@example.com", "password": "password123"},
    )
    rows_b = (await client.get("/api/v1/completions")).json()
    assert rows_b == {}

    await client.post(
        "/api/v1/auth/login",
        json={"email": "comp-a@example.com", "password": "password123"},
    )
    rows_a = (await client.get("/api/v1/completions")).json()
    assert rows_a["2026-05-31"]["hasReadIt"] is True
