# Audiblytics

Monorepo for **Audiblytics** — daily voice-journal and paragraph companion.

```
Audiblytics/
  apps/
    web/          # Next.js 16 — pnpm install && pnpm dev here
    api/          # FastAPI — uvicorn here
  docs/           # ADRs
  _bmad-output/   # PRD, architecture, stories
  docker-compose.yml   # Path B: postgres + api + web (see below)
  .env.example         # ports + secrets for ./ax and docker compose
```

## Development

**Ports** — repo root `.env` (copy from `.env.example`) is the single source for local dev:

| Variable | Default | Used by |
|----------|---------|---------|
| `WEB_PORT` | `3000` | `./ax start`, docker compose web |
| `API_PORT` | `8000` | `./ax start`, docker compose api |
| `POSTGRES_PORT` | `5432` | `./ax start` (Postgres container), `apps/api/.env` on first create |
| `API_URL` | `http://127.0.0.1:8000` | Next.js API proxy (`apps/web`) |
| `CORS_ORIGINS` | `http://localhost:3000` | FastAPI CORS |

Changing `WEB_PORT`? Update `CORS_ORIGINS` to match (e.g. `http://localhost:3001`). `./ax start` syncs `API_URL` and `CORS_ORIGINS` into app env files.

**Web — one command from repo root:**

```bash
./ax           # start → http://localhost:3000 (installs deps on first run)
                 # when NEXT_PUBLIC_STORAGE_BACKEND=api in apps/web/.env.local,
                 # also starts Postgres (Docker) and FastAPI on :8000
./ax stop      # stop the dev server (and API when started by ./ax start)
```

**Full local stack in Docker (Path B — API mode):**

```bash
cp .env.example .env          # ports + JWT_SECRET, R2_*, GEMINI_API_KEY (optional)
docker compose up -d --build  # postgres → migrate → api → web
docker compose --profile setup run --rm seed   # first time only
```

Open http://localhost:3000/login (default seed: `you@example.com` / `changeme`). Configure R2 bucket CORS for `http://localhost:3000` (see `apps/api/README.md`).

**Test the stack:**

```bash
docker compose ps -a                    # migrate=Exited(0), api=healthy, web=Up
curl -f http://localhost:8000/api/v1/health
curl -f -o /dev/null -w '%{http_code}\n' http://localhost:3000/login

# Login through Next.js proxy (cookie auth)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"changeme"}' \
  -c /tmp/cookies.txt
curl -b /tmp/cookies.txt http://localhost:3000/api/v1/auth/me
```

**Reset (wipe DB volume)** — use if migrate fails with “relation already exists” from an old Postgres volume created by `./ax start` or local `init_db()`:

```bash
docker compose down -v
docker compose up -d --build
docker compose --profile setup run --rm seed
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
