# Audiblytics API (`apps/api`)

FastAPI backend. Spec: `_bmad-output/planning-artifacts/architecture-v2-fastapi-backend.md`. ADRs: [`docs/decisions/`](../../docs/decisions/).

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
cd apps/web
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

Production topology (BV15): **Vercel** (Next.js) + **Railway / Fly.io** (this API) + **Neon** (Postgres) + **Cloudflare R2** (audio). Set secrets in the host dashboard — never commit `.env` to the image.

### Environment variables

All variables map to `app/core/config.py` (`Settings`). Use host env injection on Railway/Fly.

| Variable | Required | Production notes |
|----------|----------|------------------|
| `DATABASE_URL` | Yes | Neon URL: paste dashboard `postgresql://…` or `postgres://…` as-is — auto-normalized to `postgresql+asyncpg://` (`app/core/database_url.py`). Include `?sslmode=require` when Neon provides it. |
| `JWT_SECRET` | Yes | Strong random (`openssl rand -hex 32`). Never use the dev default. |
| `JWT_EXPIRE_MINUTES` | No | Default `10080` (7 days). |
| `COOKIE_NAME` | No | Default `audiblytics_session`; change only if coordinating with the Next.js proxy/cookie config. |
| `COOKIE_SECURE` | Yes | `true` when the API is served over HTTPS. |
| `CORS_ORIGINS` | Yes | Comma-separated Vercel origin(s), e.g. `https://your-app.vercel.app`. |
| `ENVIRONMENT` | Yes | `production` — skips `create_all` on startup; use Alembic for schema (see below). |
| `GEMINI_API_KEY` | For paragraphs | Server fallback when the user has not saved a key in Settings. |
| `GEMINI_MODEL` | No | Default `gemini-2.5-flash`. |
| `R2_ACCOUNT_ID` | For recordings | Cloudflare R2 S3 API. |
| `R2_ACCESS_KEY_ID` | For recordings | R2 access key. |
| `R2_SECRET_ACCESS_KEY` | For recordings | R2 secret. |
| `R2_BUCKET` | For recordings | Bucket name (e.g. `audiblytics-recordings`). |
| `PORT` | Auto on Railway/Fly | Injected by the platform. Default `8000` locally and in Docker. |

### Neon production database

1. Create a Neon project and copy the connection string from the dashboard (often `postgresql://…` with `?sslmode=require`).
2. Set `DATABASE_URL` on your machine or CI — **no manual scheme edit needed**: the API normalizes `postgresql://` and `postgres://` to `postgresql+asyncpg://` automatically (`app/core/database_url.py`).
3. Apply migrations (required before first API deploy with `ENVIRONMENT=production`):

```bash
cd apps/api
export DATABASE_URL='postgresql://USER:PASS@ep-….neon.tech/neondb?sslmode=require'
./scripts/migrate.sh
```

Or: `python -m alembic upgrade head` (same effect).

4. Seed your login user (idempotent — skips if email exists):

```bash
python scripts/seed_user.py --email you@example.com --password 'your-secure-password'
```

`seed_user.py` does **not** call `create_all`; it expects Alembic schema. Local dev may still use `init_db()` on API startup when `ENVIRONMENT` is not `production`.

CI: `.github/workflows/api-migrations.yml` runs `alembic upgrade head` against Postgres on every API change.

### Database migrations (local)

Run **before** or immediately after first deploy (not in the container entrypoint):

```bash
cd apps/api
./scripts/migrate.sh   # requires DATABASE_URL in .env or environment
```

Point `DATABASE_URL` at local Docker Postgres or Neon. Seed a user if needed: `python scripts/seed_user.py`.

### Docker

Build context is `apps/api`:

```bash
docker build -t audiblytics-api apps/api
```

Run locally (health only — set a real `DATABASE_URL` for auth routes):

```bash
docker run --rm -p 8000:8000 \
  -e ENVIRONMENT=production \
  -e JWT_SECRET=local-smoke-secret \
  -e DATABASE_URL=postgresql+asyncpg://audiblytics:audiblytics@host.docker.internal:5432/audiblytics \
  -e CORS_ORIGINS=http://localhost:3000 \
  audiblytics-api
```

Verify: `curl -f http://localhost:8000/api/v1/health` → `{"status":"ok"}`.

The image includes a `HEALTHCHECK` on `/api/v1/health`. On Railway, set the HTTP health check path to `/api/v1/health`.

### R2 bucket CORS (required for browser uploads)

The web app uploads audio **directly** to R2 via presigned PUT URLs. Without bucket CORS, the browser shows `Storage write failed. Failed to fetch` even when API presign succeeds.

In **Cloudflare Dashboard → R2 → your bucket → Settings → CORS policy**, add:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://127.0.0.1:3000"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

For production, add your Vercel origin (e.g. `https://your-app.vercel.app`) to `AllowedOrigins`.

### Platform notes

| Host | Health check | `PORT` |
|------|--------------|--------|
| Railway | Path `/api/v1/health` | Set automatically |
| Fly.io | `http_service` checks on `/api/v1/health` | Match `internal_port` to `PORT` |

Image name suggestion: `audiblytics-api`.
