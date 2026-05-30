import asyncio
import json
from dataclasses import dataclass
from typing import Any

import httpx

from app.core.config import get_settings
from app.schemas.paragraph import LlmErrorKind, ParagraphResult
from app.services.paragraph_prompt import build_prompt

_GEMINI_RESPONSE_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "paragraph": {"type": "string"},
        "hardWords": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "word": {"type": "string"},
                    "ipa": {"type": "string"},
                    "pronunciationGuide": {"type": "string"},
                    "meaning": {"type": "string"},
                    "exampleSentence": {"type": "string"},
                },
                "required": [
                    "word",
                    "ipa",
                    "pronunciationGuide",
                    "meaning",
                    "exampleSentence",
                ],
            },
        },
    },
    "required": ["paragraph", "hardWords"],
}


@dataclass(frozen=True)
class LlmServiceError(Exception):
    kind: LlmErrorKind
    message: str
    provider_code: str
    retryable: bool

    def to_detail(self) -> dict[str, Any]:
        return {
            "error": {
                "kind": self.kind,
                "message": self.message,
                "providerCode": self.provider_code,
                "retryable": self.retryable,
            }
        }


def resolve_gemini_api_key(*, user_key: str | None) -> str:
    user = (user_key or "").strip()
    if user:
        return user
    return get_settings().gemini_api_key.strip()


async def generate_paragraph_with_gemini(
    *,
    theme: str,
    persona: str,
    length: int,
    recycle_words: list[str],
    api_key: str | None = None,
) -> ParagraphResult:
    settings = get_settings()
    resolved_key = resolve_gemini_api_key(user_key=api_key)
    if not resolved_key:
        raise LlmServiceError(
            kind="auth",
            message="Add your Gemini API key in Settings (saved to your account).",
            provider_code="missing_api_key",
            retryable=False,
        )

    prompt = build_prompt(theme=theme, persona=persona, length=length, recycle_words=recycle_words)
    backoff_ms = (1000, 3000)
    last_error: LlmServiceError | None = None

    for attempt in range(len(backoff_ms) + 1):
        try:
            return await _call_gemini_once(
                api_key=resolved_key,
                model=settings.gemini_model,
                prompt=prompt,
            )
        except LlmServiceError as exc:
            last_error = exc
            if not exc.retryable or attempt >= len(backoff_ms):
                raise
            await asyncio.sleep(backoff_ms[attempt] / 1000)

    assert last_error is not None
    raise last_error


async def _call_gemini_once(*, api_key: str, model: str, prompt: str) -> ParagraphResult:
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        f"?key={api_key}"
    )
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": _GEMINI_RESPONSE_SCHEMA,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload)
    except httpx.RequestError as exc:
        raise LlmServiceError(
            kind="network",
            message=str(exc) or "Network error calling Gemini.",
            provider_code="network_error",
            retryable=True,
        ) from exc

    if response.status_code == 429:
        raise LlmServiceError(
            kind="rate_limit",
            message="Gemini rate limit exceeded.",
            provider_code="429",
            retryable=True,
        )
    if response.status_code in {401, 403}:
        raise LlmServiceError(
            kind="auth",
            message="Gemini rejected the API key.",
            provider_code=str(response.status_code),
            retryable=False,
        )
    if response.status_code >= 500:
        raise LlmServiceError(
            kind="network",
            message="Gemini service unavailable.",
            provider_code=str(response.status_code),
            retryable=True,
        )
    if response.status_code >= 400:
        raise LlmServiceError(
            kind="unknown",
            message=_extract_gemini_error_message(response),
            provider_code=str(response.status_code),
            retryable=False,
        )

    try:
        data = response.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        parsed = json.loads(text)
    except (KeyError, IndexError, json.JSONDecodeError, TypeError) as exc:
        raise LlmServiceError(
            kind="malformed_response",
            message="Gemini returned an unreadable paragraph payload.",
            provider_code="parse_error",
            retryable=True,
        ) from exc

    try:
        return ParagraphResult.model_validate(parsed)
    except Exception as exc:
        raise LlmServiceError(
            kind="malformed_response",
            message=f"Paragraph validation failed: {exc}",
            provider_code="validation_error",
            retryable=True,
        ) from exc


def _extract_gemini_error_message(response: httpx.Response) -> str:
    try:
        body = response.json()
        return body.get("error", {}).get("message", response.text) or response.reason_phrase
    except json.JSONDecodeError:
        return response.text or response.reason_phrase
