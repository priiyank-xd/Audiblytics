from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.schemas.paragraph import HardWord, ParagraphResult

SAMPLE_RESULT = ParagraphResult(
    paragraph="The arboreal creature leaped between branches.",
    hardWords=[
        HardWord(
            word="arboreal",
            ipa="/ɑːrˈbɔːriəl/",
            pronunciationGuide="ar-BOR-ee-ul",
            meaning="adjective · living in trees",
            exampleSentence="Arboreal monkeys rarely touch the ground.",
        ),
    ],
)


@pytest.mark.asyncio
async def test_generate_and_today(auth_client: AsyncClient) -> None:
    with patch(
        "app.api.v1.paragraphs.generate_paragraph_with_gemini",
        new_callable=AsyncMock,
        return_value=SAMPLE_RESULT,
    ):
        generated = await auth_client.post(
            "/api/v1/paragraphs/generate",
            json={"paragraphId": str(uuid4()), "recycleWords": []},
        )
    assert generated.status_code == 201
    body = generated.json()
    assert body["paragraph"] == SAMPLE_RESULT.paragraph
    assert body["theme"] == "adventure"
    assert body["recycleWordTexts"] == []

    today = await auth_client.get("/api/v1/paragraphs/today")
    assert today.status_code == 200
    assert today.json()["id"] == body["id"]

    miss = await auth_client.get("/api/v1/paragraphs/today")
    assert miss.status_code == 200


@pytest.mark.asyncio
async def test_generate_requires_gemini_key(auth_client: AsyncClient) -> None:
    with patch("app.services.gemini_paragraph.get_settings") as mock_settings:
        mock_settings.return_value.gemini_api_key = ""
        mock_settings.return_value.gemini_model = "gemini-2.5-flash"
        response = await auth_client.post(
            "/api/v1/paragraphs/generate",
            json={},
        )
    assert response.status_code == 502
    assert response.json()["detail"]["error"]["kind"] == "auth"


@pytest.mark.asyncio
async def test_generate_uses_user_gemini_key(auth_client: AsyncClient) -> None:
    await auth_client.patch(
        "/api/v1/settings",
        json={"geminiApiKey": "user-test-key"},
    )
    with patch(
        "app.api.v1.paragraphs.generate_paragraph_with_gemini",
        new_callable=AsyncMock,
        return_value=SAMPLE_RESULT,
    ) as mock_gen:
        response = await auth_client.post(
            "/api/v1/paragraphs/generate",
            json={},
        )
    assert response.status_code == 201
    mock_gen.assert_called_once()
    assert mock_gen.call_args.kwargs["api_key"] == "user-test-key"


@pytest.mark.asyncio
async def test_paragraph_dates_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/paragraphs/dates")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_paragraph_dates_empty(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/api/v1/paragraphs/dates")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_paragraph_dates_after_generate(auth_client: AsyncClient) -> None:
    with patch(
        "app.api.v1.paragraphs.generate_paragraph_with_gemini",
        new_callable=AsyncMock,
        return_value=SAMPLE_RESULT,
    ):
        await auth_client.post(
            "/api/v1/paragraphs/generate",
            json={"paragraphId": str(uuid4()), "recycleWords": []},
        )

    response = await auth_client.get("/api/v1/paragraphs/dates")
    assert response.status_code == 200
    dates = response.json()
    assert len(dates) == 1
    assert len(dates[0]) == 10
    assert dates[0][4] == "-"
    assert dates[0][7] == "-"


@pytest.mark.asyncio
async def test_paragraph_dates_from_to_filter(auth_client: AsyncClient) -> None:
    generate_times = [
        datetime(2026, 5, 10, 12, 0, 0, tzinfo=timezone.utc),
        datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc),
    ]

    with (
        patch(
            "app.api.v1.paragraphs.generate_paragraph_with_gemini",
            new_callable=AsyncMock,
            return_value=SAMPLE_RESULT,
        ),
        patch("app.api.v1.paragraphs.datetime") as mock_datetime,
    ):
        mock_datetime.now.side_effect = generate_times
        mock_datetime.side_effect = lambda *args, **kwargs: datetime(*args, **kwargs)
        for _ in generate_times:
            generated = await auth_client.post(
                "/api/v1/paragraphs/generate",
                json={"paragraphId": str(uuid4()), "recycleWords": []},
            )
            assert generated.status_code == 201

    in_may = await auth_client.get(
        "/api/v1/paragraphs/dates",
        params={"from": "2026-05-01", "to": "2026-05-31"},
    )
    assert in_may.status_code == 200
    assert in_may.json() == ["2026-05-10"]

    in_june = await auth_client.get(
        "/api/v1/paragraphs/dates",
        params={"from": "2026-06-01", "to": "2026-06-30"},
    )
    assert in_june.status_code == 200
    assert in_june.json() == ["2026-06-01"]


@pytest.mark.asyncio
async def test_paragraph_dates_invalid_from(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/api/v1/paragraphs/dates", params={"from": "not-a-date"})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_paragraph_dates_user_isolation(client: AsyncClient) -> None:
    await client.post(
        "/api/v1/auth/register",
        json={"email": "para-a@example.com", "password": "password123"},
    )
    with patch(
        "app.api.v1.paragraphs.generate_paragraph_with_gemini",
        new_callable=AsyncMock,
        return_value=SAMPLE_RESULT,
    ):
        await client.post("/api/v1/paragraphs/generate", json={})

    await client.post(
        "/api/v1/auth/register",
        json={"email": "para-b@example.com", "password": "password123"},
    )
    dates_b = (await client.get("/api/v1/paragraphs/dates")).json()
    assert dates_b == []

    await client.post(
        "/api/v1/auth/login",
        json={"email": "para-a@example.com", "password": "password123"},
    )
    dates_a = (await client.get("/api/v1/paragraphs/dates")).json()
    assert len(dates_a) == 1


@pytest.mark.asyncio
async def test_paragraph_by_date_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/paragraphs/by-date/2026-05-31")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_paragraph_by_date_after_generate(auth_client: AsyncClient) -> None:
    with patch(
        "app.api.v1.paragraphs.generate_paragraph_with_gemini",
        new_callable=AsyncMock,
        return_value=SAMPLE_RESULT,
    ):
        generated = await auth_client.post(
            "/api/v1/paragraphs/generate",
            json={"paragraphId": str(uuid4()), "recycleWords": []},
        )
    assert generated.status_code == 201

    today = await auth_client.get("/api/v1/paragraphs/today")
    assert today.status_code == 200
    utc_date = today.json()["generatedAt"][:10]

    by_date = await auth_client.get(f"/api/v1/paragraphs/by-date/{utc_date}")
    assert by_date.status_code == 200
    assert by_date.json()["id"] == generated.json()["id"]


@pytest.mark.asyncio
async def test_paragraph_by_date_404_when_empty(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/api/v1/paragraphs/by-date/2020-01-01")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_paragraph_by_date_invalid(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/api/v1/paragraphs/by-date/not-a-date")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_paragraph_by_date_user_isolation(client: AsyncClient) -> None:
    await client.post(
        "/api/v1/auth/register",
        json={"email": "bydate-a@example.com", "password": "password123"},
    )
    with patch(
        "app.api.v1.paragraphs.generate_paragraph_with_gemini",
        new_callable=AsyncMock,
        return_value=SAMPLE_RESULT,
    ):
        await client.post("/api/v1/paragraphs/generate", json={})

    await client.post(
        "/api/v1/auth/register",
        json={"email": "bydate-b@example.com", "password": "password123"},
    )
    assert (await client.get("/api/v1/paragraphs/by-date/2020-01-01")).status_code == 404

    await client.post(
        "/api/v1/auth/login",
        json={"email": "bydate-a@example.com", "password": "password123"},
    )
    today = await client.get("/api/v1/paragraphs/today")
    assert today.status_code == 200
    utc_date = today.json()["generatedAt"][:10]
    by_date = await client.get(f"/api/v1/paragraphs/by-date/{utc_date}")
    assert by_date.status_code == 200


@pytest.mark.asyncio
async def test_today_404_when_empty(client: AsyncClient) -> None:
    await client.post(
        "/api/v1/auth/register",
        json={"email": "empty@example.com", "password": "password123"},
    )
    response = await client.get("/api/v1/paragraphs/today")
    assert response.status_code == 404
