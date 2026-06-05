# Audiblytics

Monorepo for **Audiblytics** — daily voice-journal and paragraph companion.

```
Audiblytics/
  apps/
    web/          # Next.js 16 frontend — run `pnpm dev` here
    api/          # FastAPI backend — run `uvicorn` here
  docs/           # ADRs
  _bmad-output/   # PRD, architecture, stories
  docker-compose.yml   # local Postgres (API mode)
```

## Development

**Install once** from the repo root (pnpm workspace):

```bash
pnpm install
```

**Run each app from its own folder** — same pattern for web and API:

| App | Folder | Start |
|-----|--------|-------|
| Web | `apps/web` | `pnpm dev` → http://localhost:3000 |
| API | `apps/api` | `uvicorn app.main:app --reload --port 8000` |

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
