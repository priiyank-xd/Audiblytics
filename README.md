# Audiblytics

Monorepo for **Audiblytics** — daily voice-journal and paragraph companion.

```
Audiblytics/
  apps/
    web/          # Next.js 16 frontend (@audiblytics/web)
    api/          # FastAPI backend (audiblytics-api)
  _bmad-output/   # PRD, architecture, stories
```

## Development

From the repo root:

```bash
pnpm install
pnpm dev          # Next.js at http://localhost:3000 (local storage mode by default)
```

### Phase 1 — API mode (auth + Postgres settings)

```bash
docker compose up -d postgres
cd apps/api && cp .env.example .env && pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

In `apps/web/.env.local` set `NEXT_PUBLIC_STORAGE_BACKEND=api` and `API_URL=http://localhost:8000`, then `pnpm dev` and visit `/login`.

See `apps/api/README.md` for seed user and tests.

## Architecture

| Document | Scope |
|----------|--------|
| `_bmad-output/planning-artifacts/architecture.md` | Client app (Dexie / localStorage era) |
| `_bmad-output/planning-artifacts/architecture-v2-fastapi-backend.md` | Backend v2 — FastAPI, Neon, R2 |

## Personal-use boundary

The **web** app still supports n=1 client-only mode (`localStorage` + IndexedDB). Public deployment with browser-held API keys remains gated until `NEXT_PUBLIC_STORAGE_BACKEND=api` and the FastAPI proxy are fully wired. See `architecture.md` § Hard-Scope-Boundary (AR15).

## Vercel

Set **Root Directory** to `apps/web` for frontend deploys.
