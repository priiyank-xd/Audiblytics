from uuid import UUID, uuid4

import pytest
from httpx import AsyncClient


def _word_payload(
    word_id: str | None = None,
    *,
    word: str = "serendipity",
    saved_at: str = "2026-05-31T10:00:00.000Z",
) -> dict:
    return {
        "id": word_id or str(uuid4()),
        "word": word,
        "ipa": "/ˌsɛrənˈdɪpɪti/",
        "pronunciationGuide": "ser-en-DIP-i-tee",
        "meaning": "pleasant surprise",
        "exampleSentence": "Finding the book was pure serendipity.",
        "savedAt": saved_at,
        "sourceParagraphId": str(uuid4()),
        "reviewCount": 0,
        "lastReviewedAt": None,
        "difficultyRating": 1,
    }


@pytest.mark.asyncio
async def test_list_collection_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/collection")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_collection_empty(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/api/v1/collection")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_create_and_list_collection_word(auth_client: AsyncClient) -> None:
    payload = _word_payload()
    create = await auth_client.post("/api/v1/collection", json=payload)
    assert create.status_code == 201
    body = create.json()
    assert body["id"] == payload["id"]
    assert body["word"] == payload["word"]

    listing = await auth_client.get("/api/v1/collection")
    assert listing.status_code == 200
    rows = listing.json()
    assert len(rows) == 1
    assert rows[0]["id"] == payload["id"]


@pytest.mark.asyncio
async def test_list_collection_recency_order(auth_client: AsyncClient) -> None:
    older = _word_payload(word="alpha", saved_at="2026-05-30T10:00:00.000Z")
    newer = _word_payload(word="beta", saved_at="2026-05-31T12:00:00.000Z")
    assert (await auth_client.post("/api/v1/collection", json=older)).status_code == 201
    assert (await auth_client.post("/api/v1/collection", json=newer)).status_code == 201

    rows = (await auth_client.get("/api/v1/collection")).json()
    assert [row["word"] for row in rows] == ["beta", "alpha"]


@pytest.mark.asyncio
async def test_post_idempotent_by_word(auth_client: AsyncClient) -> None:
    first_id = str(uuid4())
    second_id = str(uuid4())
    payload = _word_payload(first_id, word="ephemeral")
    assert (await auth_client.post("/api/v1/collection", json=payload)).status_code == 201

    duplicate = _word_payload(second_id, word="ephemeral")
    response = await auth_client.post("/api/v1/collection", json=duplicate)
    assert response.status_code == 200
    assert response.json()["id"] == first_id

    rows = (await auth_client.get("/api/v1/collection")).json()
    assert len(rows) == 1


@pytest.mark.asyncio
async def test_post_idempotent_by_id(auth_client: AsyncClient) -> None:
    word_id = str(uuid4())
    payload = _word_payload(word_id)
    assert (await auth_client.post("/api/v1/collection", json=payload)).status_code == 201
    retry = await auth_client.post("/api/v1/collection", json=payload)
    assert retry.status_code == 200
    assert retry.json()["id"] == word_id


@pytest.mark.asyncio
async def test_post_id_conflict(auth_client: AsyncClient) -> None:
    word_id = str(uuid4())
    payload = _word_payload(word_id, word="luminous")
    assert (await auth_client.post("/api/v1/collection", json=payload)).status_code == 201

    conflict = _word_payload(word_id, word="luminous")
    conflict["meaning"] = "different meaning"
    response = await auth_client.post("/api/v1/collection", json=conflict)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_delete_collection_word(auth_client: AsyncClient) -> None:
    payload = _word_payload()
    assert (await auth_client.post("/api/v1/collection", json=payload)).status_code == 201

    delete = await auth_client.delete(f"/api/v1/collection/{payload['id']}")
    assert delete.status_code == 204

    rows = (await auth_client.get("/api/v1/collection")).json()
    assert rows == []


@pytest.mark.asyncio
async def test_delete_collection_word_not_found(auth_client: AsyncClient) -> None:
    response = await auth_client.delete(f"/api/v1/collection/{uuid4()}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_collection_user_isolation(client: AsyncClient) -> None:
    await client.post(
        "/api/v1/auth/register",
        json={"email": "user-a@example.com", "password": "password123"},
    )
    payload_a = _word_payload(word="isolated")
    create_a = await client.post("/api/v1/collection", json=payload_a)
    assert create_a.status_code == 201

    await client.post(
        "/api/v1/auth/register",
        json={"email": "user-b@example.com", "password": "password123"},
    )
    rows_b = (await client.get("/api/v1/collection")).json()
    assert rows_b == []

    delete_b = await client.delete(f"/api/v1/collection/{payload_a['id']}")
    assert delete_b.status_code == 404

    await client.post(
        "/api/v1/auth/login",
        json={"email": "user-a@example.com", "password": "password123"},
    )
    rows_a = (await client.get("/api/v1/collection")).json()
    assert len(rows_a) == 1
    assert rows_a[0]["word"] == "isolated"
