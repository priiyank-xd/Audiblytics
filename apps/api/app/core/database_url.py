"""Normalize DATABASE_URL for async SQLAlchemy + Alembic (Neon, Railway, etc.)."""

from __future__ import annotations

from typing import Any
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

# libpq-only query params — asyncpg rejects these when passed via SQLAlchemy URL.
_LIBPQ_QUERY_KEYS = frozenset({"sslmode", "channel_binding", "options", "target_session_attrs"})


def _to_asyncpg_scheme(url: str) -> str:
    if url.startswith("postgresql+asyncpg://"):
        return url
    if url.startswith("postgresql://"):
        return "postgresql+asyncpg://" + url[len("postgresql://") :]
    if url.startswith("postgres://"):
        return "postgresql+asyncpg://" + url[len("postgres://") :]
    return url


def _asyncpg_connect_args(query_params: dict[str, list[str]]) -> dict[str, Any]:
    sslmode = (query_params.get("sslmode") or [None])[0]
    if sslmode is None:
        return {}
    if sslmode in {"disable", "allow"}:
        return {"ssl": False}
    return {"ssl": True}


def prepare_async_database_url(url: str) -> tuple[str, dict[str, Any]]:
    """Return asyncpg-safe URL and SQLAlchemy ``connect_args`` for Neon/libpq URLs."""
    trimmed = url.strip()
    if not trimmed.startswith(("postgresql://", "postgres://", "postgresql+asyncpg://")):
        return trimmed, {}

    parsed = urlparse(_to_asyncpg_scheme(trimmed))
    query_params = parse_qs(parsed.query, keep_blank_values=True)
    connect_args = _asyncpg_connect_args(query_params)

    filtered = {key: values for key, values in query_params.items() if key not in _LIBPQ_QUERY_KEYS}
    clean_query = urlencode(filtered, doseq=True)
    clean_url = urlunparse(parsed._replace(query=clean_query))
    return clean_url, connect_args


def normalize_async_database_url(url: str) -> str:
    """Convert sync Postgres schemes to ``postgresql+asyncpg://`` and strip libpq query params."""
    clean_url, _ = prepare_async_database_url(url)
    return clean_url
