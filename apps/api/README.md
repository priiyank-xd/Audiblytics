# Audiblytics API (`apps/api`)

FastAPI backend. Spec: `_bmad-output/planning-artifacts/architecture-v2-fastapi-backend.md`.

## Phase 1 — auth + settings

- `POST /api/v1/auth/register|login|logout`
- `GET /api/v1/auth/me`
- `GET|PATCH /api/v1/settings`
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
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

Tables are created on startup via `init_db()`.

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
