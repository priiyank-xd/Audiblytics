# Audiblytics API (`apps/api`)

FastAPI backend. Spec: `_bmad-output/planning-artifacts/architecture-v2-fastapi-backend.md`.

## Phase 1 — auth + settings

- `POST /api/v1/auth/register|login|logout`
- `GET /api/v1/auth/me`
- `GET|PATCH /api/v1/settings`
- `POST /api/v1/paragraphs/generate` — Gemini proxy (Gemini key in **Settings**, or `GEMINI_API_KEY` in `.env` as fallback)
- `GET /api/v1/paragraphs/today` — same-day cache hit
- JWT in httpOnly cookie `audiblytics_session`

## Quick start

**1. Postgres (local)**

```bash
docker compose up -d postgres
```

**2. API**

```bash
cd apps/api
cp .env.example .env
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

`alembic` and `uvicorn` live in `.venv` — activate it first, or use `python -m alembic` / `python -m uvicorn`.

Tables are created on startup via `init_db()` (dev), or apply migrations:

```bash
source .venv/bin/activate
python -m alembic upgrade head
```

If tables already exist from `init_db()` but Alembic errors with “already exists”, stamp instead:

```bash
python -m alembic stamp head
```

**3. Seed user (optional)**

```bash
python scripts/seed_user.py --email you@example.com --password your-password
```

**4. Web (API mode)**

In `apps/web/.env.local`:

```env
NEXT_PUBLIC_STORAGE_BACKEND=api
API_URL=http://localhost:8000
```

```bash
pnpm dev
```

Open http://localhost:3000/login — register or sign in. Settings persist in Postgres.

## Tests

```bash
cd apps/api
pytest
```

Uses in-memory SQLite; no Docker required for tests.

## Deploy

- Docker image name: `audiblytics-api`
- Set `COOKIE_SECURE=true` and a strong `JWT_SECRET` in production
