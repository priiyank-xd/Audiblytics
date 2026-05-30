# Alembic

Migrations for Postgres (local Docker or Neon). Matches `app.models` / BV5.

## Local

```bash
docker compose up -d postgres
cd apps/api
cp .env.example .env
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
python -m alembic upgrade head
```

`init_db()` on API startup still creates tables in development if you skip Alembic; use migrations before production deploy.

If tables already exist from `init_db()`, stamp instead of re-running create:

```bash
alembic stamp head
```

## New revision

```bash
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```
