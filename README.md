# Audiblytics

Monorepo for **Audiblytics** — daily voice-journal and paragraph companion.

```
Audiblytics/
  apps/
    web/          # Next.js 16 — pnpm install && pnpm dev here
    api/          # FastAPI — uvicorn here
  docs/           # ADRs
  _bmad-output/   # PRD, architecture, stories
  docker-compose.yml   # local Postgres (API mode)
```

## Development

**Web — one command from repo root:**

```bash
./dev          # start → http://localhost:3000 (installs deps on first run)
                 # when NEXT_PUBLIC_STORAGE_BACKEND=api in apps/web/.env.local,
                 # also starts Postgres (Docker) and FastAPI on :8000
./dev stop     # stop the dev server (and API when started by ./dev)
```

**Or run each app from its folder:**

| App | Folder | Install | Start |
|-----|--------|---------|-------|
| Web | `apps/web` | `pnpm install` | `pnpm dev` → http://localhost:3000 |
| API | `apps/api` | `pip install -e ".[dev]"` | `uvicorn app.main:app --reload --port 8000` |

| Guide | Scope |
|-------|-------|
| **[apps/web/README.md](apps/web/README.md)** | Local mode, API mode env, scripts, deploy |
| **[apps/api/README.md](apps/api/README.md)** | Postgres, migrations, seed user, tests, deploy |

## Architecture

| Document | Scope |
|----------|-------|
| `_bmad-output/planning-artifacts/architecture.md` | Client app (Dexie / localStorage era) |
| `_bmad-output/planning-artifacts/architecture-v2-fastapi-backend.md` | Backend v2 — FastAPI, Neon, R2 |
| `_bmad-output/planning-artifacts/ux-design-specification.md` | Client UX spec (Direction A) |
| `_bmad-output/planning-artifacts/ux-v2-mockups-addendum.md` | UI refresh mockups (Epic 14) + API-mode notes |
| [`docs/decisions/`](docs/decisions/) | ADRs (auth, R2 blobs, strangler migration) — BV4, BV6, BV9 |

## Personal-use boundary

The **web** app supports n=1 **local mode** (`localStorage` + IndexedDB, browser LLM keys) and **API mode** (`NEXT_PUBLIC_STORAGE_BACKEND=api` with FastAPI, Postgres, and server-side Gemini). Public deployment with browser-held API keys in local mode remains gated per `architecture.md` § Hard-Scope-Boundary (AR15).

## Deploy (BV15)

| Component | Host |
|-----------|------|
| Next.js (`apps/web`) | Vercel — set **Root Directory** to `apps/web` |
| FastAPI (`apps/api`) | Railway or Fly.io — Docker image from `apps/api/Dockerfile` |
| Postgres | Neon |
| Audio blobs | Cloudflare R2 |

See app READMEs for env vars and platform steps.
