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
async def test_today_404_when_empty(client: AsyncClient) -> None:
    await client.post(
        "/api/v1/auth/register",
        json={"email": "empty@example.com", "password": "password123"},
    )
    response = await client.get("/api/v1/paragraphs/today")
    assert response.status_code == 404
