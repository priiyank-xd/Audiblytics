#!/usr/bin/env bash
# Apply all Alembic migrations (local Postgres, Neon, CI).
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required (Neon: postgresql://… is auto-converted to postgresql+asyncpg://)" >&2
  exit 1
fi

python -m alembic upgrade head
python -m alembic current
