"""Normalize DATABASE_URL for async SQLAlchemy + Alembic (Neon, Railway, etc.)."""


def normalize_async_database_url(url: str) -> str:
    """Convert sync Postgres schemes to ``postgresql+asyncpg://``."""
    trimmed = url.strip()
    if trimmed.startswith("postgresql+asyncpg://"):
        return trimmed
    if trimmed.startswith("postgresql://"):
        return "postgresql+asyncpg://" + trimmed[len("postgresql://") :]
    if trimmed.startswith("postgres://"):
        return "postgresql+asyncpg://" + trimmed[len("postgres://") :]
    return trimmed
