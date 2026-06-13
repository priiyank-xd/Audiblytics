# Audiblytics

voice journal and paragraph companion;
Monorepo: Next.js (`apps/web`) + FastAPI (`apps/api`).

```
Audiblytics/
  apps/
    web/                # Next.js 16 — pnpm install && pnpm dev here
    api/                # FastAPI — uvicorn here
  docs/                 # ADRs
  _bmad-output/         # PRD, architecture, stories
  docker-compose.yml    # Path 2: postgres + api + web (see Development)
  .env.example          # ports + secrets for ./ax and docker compose
```

## Development

Pick one way to run the stack. All paths read ports from repo root `.env` (auto-created from `.env.example` on first `./ax` run).

App-specific env, scripts, and deploy: **[apps/web/README.md](apps/web/README.md)** · **[apps/api/README.md](apps/api/README.md)**

### Configuration

| Variable | Default | Used by |
|----------|---------|---------|
| `WEB_PORT` | `3000` | `./ax`, docker compose web |
| `API_PORT` | `8000` | `./ax`, docker compose api |
| `POSTGRES_PORT` | `5432` | `./ax`, docker compose postgres |
| `API_URL` | `http://127.0.0.1:8000` | Next.js API proxy (`apps/web`) |
| `CORS_ORIGINS` | `http://localhost:3000` | FastAPI CORS |

If you change `WEB_PORT`, set `CORS_ORIGINS` to match (e.g. `http://localhost:3001`). `./ax start` syncs `API_URL` and `CORS_ORIGINS` into app env files when present.

### Path 1 — `./ax`

From repo root. Installs web deps on first run. Set in `apps/web/.env.local`:

```env
NEXT_PUBLIC_STORAGE_BACKEND=api
```

```bash
./ax start   # Postgres + API (:8000) + web → http://localhost:3000/login
./ax stop
```

Requires **pnpm**, **Docker** (Postgres), and **Python 3.12+**.

### Path 2 — Docker Compose (full stack)

Everything in containers — good for parity with deploy or when you do not want local Python/Node processes beyond Docker.

```bash
cp .env.example .env            # ports + JWT_SECRET, R2_*, GEMINI_API_KEY 

docker compose up -d --build    # postgres → migrate → api → web
docker compose --profile setup run --rm seed   # first time only
```

Open http://localhost:3000/login (default seed: `you@example.com` / `changeme`). Configure R2 bucket CORS for `http://localhost:3000` (see `apps/api/README.md`).

**Verify:**

```bash
docker compose ps -a
curl -f http://localhost:8000/api/v1/health 
```

**Reset DB** (e.g. migrate fails with “relation already exists” from an old volume shared with `./ax start`):

```bash
docker compose down -v
docker compose up -d --build
docker compose --profile setup run --rm seed
```

### Path 3 — Manual (per app)

Run each service yourself — useful when debugging one layer.

| App | Folder | Install | Start |
|-----|--------|---------|-------|
| Web | `apps/web` | `pnpm install` | `pnpm dev` → http://localhost:3000 |
| API | `apps/api` | `pip install -e ".[dev]"` | `uvicorn app.main:app --reload --port 8000` |

Start Postgres from repo root (`docker compose up -d postgres`), run the API from `apps/api`, set `NEXT_PUBLIC_STORAGE_BACKEND=api` and `API_URL` in `apps/web/.env.local`, then `pnpm dev`. Step-by-step: **[apps/web/README.md](apps/web/README.md)** · **[apps/api/README.md](apps/api/README.md)**.

## Architecture

### Stack (at a glance)

```
Browser
   │
   ▼
Next.js (apps/web)     UI, login, /api/v1/* proxy
   │
   ▼
FastAPI (apps/api)     REST API + JWT session cookie
   ├── Postgres        users, settings, words, completions, paragraphs
   ├── Cloudflare R2   voice journal recordings
   └── Gemini          paragraph generation (key on server)
```

Auth: httpOnly cookie. The web app never talks to Postgres or R2 directly — only through the API.

### Planning docs

| Doc | What it covers |
|-----|----------------|
| [`architecture-v2-fastapi-backend.md`](_bmad-output/planning-artifacts/architecture-v2-fastapi-backend.md) | System design, API routes, data model, deploy |
| [`ux-v2-mockups-addendum.md`](_bmad-output/planning-artifacts/ux-v2-mockups-addendum.md) | Current UI — sidebar shell, soft-card layout, screen mockups |

### ADRs

Short decision records in [`docs/decisions/`](docs/decisions/): JWT cookie auth (BV4), audio in R2 not Postgres (BV6), storage migration flag (BV9).



## Deploy (BV15)

| Component | Host |
|-----------|------|
| Next.js (`apps/web`) | Vercel — set **Root Directory** to `apps/web` |
| FastAPI (`apps/api`) | Railway or Fly.io — Docker image from `apps/api/Dockerfile` |
| Postgres | Neon |
| Audio blobs | Cloudflare R2 |

See app READMEs for env vars and platform steps.
