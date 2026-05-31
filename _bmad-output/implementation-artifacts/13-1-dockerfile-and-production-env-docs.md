# Story 13.1: Dockerfile and Production Env Docs

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want a production `Dockerfile` and updated README deploy docs,
so that I can deploy the FastAPI API to Railway or Fly.io with a verifiable health check (BVR15, BV15).

## Acceptance Criteria

> Sourced from `epics.md` § Story 13.1 and `architecture-v2-fastapi-backend.md` BV15/BV17. Numbered for task traceability.

1. **AC1 — `apps/api/Dockerfile` exists** — Multi-stage not required; image builds from `apps/api` context. Base image Python **3.12** (matches `pyproject.toml` `requires-python`). Installs project via `pip install -e .` (or equivalent) from `pyproject.toml` + `app/` package layout.

2. **AC2 — Container runs uvicorn** — Default `CMD` starts `uvicorn app.main:app` bound to `0.0.0.0` on port from env **`PORT`** (default `8000`) so Railway/Fly inject `PORT` without Dockerfile edits.

3. **AC3 — Health check** — `HEALTHCHECK` (or platform doc equivalent) probes **`GET /api/v1/health`** and expects `200` with body `{"status":"ok"}` (see `app/api/v1/health.py`, mounted at prefix `/api/v1` in `app/main.py`).

4. **AC4 — Production env documentation** — `apps/api/README.md` gains a **Deploy** section listing every `Settings` env var from `app/core/config.py` with production guidance:
   - `DATABASE_URL` — Neon `postgresql+asyncpg://...` (note: convert Neon `postgresql://` if needed)
   - `JWT_SECRET` — strong random, never commit
   - `COOKIE_SECURE=true` when HTTPS
   - `CORS_ORIGINS` — Vercel frontend origin(s), comma-separated
   - `ENVIRONMENT=production`
   - `GEMINI_API_KEY` / `GEMINI_MODEL` — server fallback
   - R2 quartet: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`
   - Reference host env injection (Railway/Fly), not committed `.env`

5. **AC5 — Root README deploy pointer** — `README.md` links to `apps/api/README.md` Deploy section and states topology: Vercel (web) + Railway/Fly (API) + Neon + R2 per BV15.

6. **AC6 — `.dockerignore`** — Excludes `.venv`, `__pycache__`, `.pytest_cache`, `.env`, `*.egg-info`, tests optional (may include tests in image — prefer **exclude** tests to shrink image).

7. **AC7 — Production startup safety** — `lifespan` must **not** call `init_db()` / `create_all` when `ENVIRONMENT=production` (Alembic is source of truth; Story 13.2 covers `alembic upgrade head`). Dev/local behavior unchanged.

8. **AC8 — Tests** — Existing `pytest` suite remains green. Add at least one automated check: either (a) pytest that imports `create_app` and hits `/api/v1/health` (already covered by `test_health`), plus (b) **documented** `docker build` + `docker run` smoke in Dev Agent Record, **or** a small `tests/test_dockerfile.py` that asserts Dockerfile contains `uvicorn`, `HEALTHCHECK`, and `/api/v1/health` string (static file test — no Docker daemon required in CI).

9. **AC9 — Scope boundary** — No Neon migration run in container entrypoint (13.2). No ADRs (13.3). No Vercel config changes. No frontend code changes unless required for deploy docs cross-link only.

## Tasks / Subtasks

- [x] **Task 1 — Gate `init_db` for production** (AC: 7)
  - [x] 1.1 In `app/main.py` `lifespan`, call `init_db()` only when `get_settings().environment != "production"`.
  - [x] 1.2 Add pytest: with `ENVIRONMENT=production`, app starts without `create_all` (mock/spy `init_db` or assert no table creation side effect).

- [x] **Task 2 — Dockerfile + dockerignore** (AC: 1, 2, 3, 6)
  - [x] 2.1 Create `apps/api/Dockerfile` (build context = `apps/api`).
  - [x] 2.2 Create `apps/api/.dockerignore`.
  - [x] 2.3 `HEALTHCHECK` → `curl -f http://localhost:${PORT}/api/v1/health` (install `curl` in image if base lacks it, or use `wget`/`python -c`).

- [x] **Task 3 — Deploy documentation** (AC: 4, 5)
  - [x] 3.1 Expand `apps/api/README.md` Deploy section (replace stub L78–81) with env table + Railway/Fly notes + `docker build` / `docker run` examples.
  - [x] 3.2 Update root `README.md` with BV15 topology and link.

- [x] **Task 4 — Dockerfile smoke test** (AC: 8)
  - [x] 4.1 Add `tests/test_dockerfile.py` static assertions on Dockerfile contents (AC8 option b).
  - [x] 4.2 Run full `pytest` in `apps/api`.

- [x] **Task 5 — Manual verification** (AC: 3, 8)
  - [x] 5.1 `docker build -t audiblytics-api apps/api`
  - [x] 5.2 `docker run` with minimal env (`DATABASE_URL` can point at host postgres via `host.docker.internal` or skip DB-dependent routes — health must return 200 even if DB unreachable? **Note:** lifespan may connect DB on startup only if init_db gated; health route has no DB dependency — should work.)
  - [x] 5.3 Record results in Dev Agent Record.

### Review Findings (2026-05-31)

- [x] [Review][Patch] Deploy table omits `COOKIE_NAME` [`apps/api/README.md:86-100`] — AC4 requires every `Settings` field; `cookie_name` defaults to `audiblytics_session` but should be documented for custom cookie naming.
- [x] [Review][Defer] `CMD`/`HEALTHCHECK` use `sh -c` — Docker warns JSONArgsRecommended; graceful SIGTERM to uvicorn may need `exec` or `tini` [`apps/api/Dockerfile:17-20`] — n=1 deploy; revisit if platform reports slow shutdown.
- [x] [Review][Defer] Image runs as root, no `USER` directive [`apps/api/Dockerfile`] — acceptable for personal Railway/Fly demo.
- [x] [Review][Defer] `.dockerignore` excludes `uv.lock` — builds resolve deps from `pyproject.toml` minimums only [`apps/api/.dockerignore:9`] — pin via lockfile in follow-up if reproducibility matters.
- [x] [Review][Defer] `ENVIRONMENT` gate is exact string `production` only [`apps/api/app/main.py:14`] — `staging`/`prod` typos would run `create_all`; docs mandate `ENVIRONMENT=production`.

## Dev Notes

### Authoritative health route

```6:8:apps/api/app/api/v1/health.py
@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
```

Router prefix: `app.include_router(api_router, prefix="/api/v1")` → full path **`/api/v1/health`**.

Epic AC says `/api/v1/health` — **not** `/health` (BV15 table says `GET /health` — treat epic/story AC as authoritative for this story).

### Settings env vars (from `app/core/config.py`)

| Env | Production notes |
|-----|------------------|
| `DATABASE_URL` | Neon async URL; `postgresql+asyncpg://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | `openssl rand -hex 32` |
| `JWT_EXPIRE_MINUTES` | Default 10080 ok |
| `COOKIE_SECURE` | `true` on HTTPS hosts |
| `CORS_ORIGINS` | `https://<vercel-app>.vercel.app` (+ preview URLs if needed) |
| `ENVIRONMENT` | `production` — gates `init_db` after Task 1 |
| `GEMINI_API_KEY` | Server fallback for paragraph gen |
| `GEMINI_MODEL` | Default `gemini-2.5-flash` |
| `R2_*` | Required for recordings in API mode |

### Dockerfile sketch (implementer guide — not copy-paste gospel)

```dockerfile
FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
COPY pyproject.toml .
COPY app ./app
RUN pip install --no-cache-dir -e .
ENV PORT=8000
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f "http://localhost:${PORT}/api/v1/health" || exit 1
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
```

Adjust if setuptools needs `README.md` or additional copy paths for `pip install -e .`.

### Railway / Fly quick notes

| Platform | Set env | Notes |
|----------|---------|-------|
| Railway | `PORT` auto | Health check path `/api/v1/health` |
| Fly.io | `[http_service] internal_port` = `PORT` | `fly deploy` from `apps/api` or monorepo with `dockerfile` path |

Run migrations **before** or **after** first deploy via CI/manual — Story 13.2.

### Previous epic intelligence (12.2)

- 68 pytest baseline — do not regress.
- `init_db()` + Alembic coexist locally; production must use Alembic only.
- Cookie auth + CORS: production frontend on Vercel must list exact origin in `CORS_ORIGINS`.

### Architecture compliance

- **BV15:** FastAPI on Railway/Fly; secrets in host env.
- **BV17:** No secrets in image layers; no LLM/R2 keys in client.
- **AR15 (web):** Unchanged — personal-use guard stays on Next.js; API deploy is n=1 backend.

### Project structure notes

| Action | Path |
|--------|------|
| NEW | `apps/api/Dockerfile` |
| NEW | `apps/api/.dockerignore` |
| NEW | `tests/test_dockerfile.py` (optional static) |
| UPDATE | `apps/api/app/main.py` |
| UPDATE | `apps/api/README.md` |
| UPDATE | `README.md` |

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` § Epic 13 / Story 13.1]
- [Source: `_bmad-output/planning-artifacts/architecture-v2-fastapi-backend.md` § BV15, BV17]
- [Source: `apps/api/app/core/config.py`]
- [Source: `apps/api/.env.example`]
- [Source: `_bmad-output/implementation-artifacts/12-2-day-completions-api.md` — pytest baseline, init_db caution]

## Dev Agent Record

### Agent Model Used

composer-2.5-fast

### Completion Notes List

- `lifespan` gates `init_db()` when `ENVIRONMENT=production`.
- `Dockerfile` (python:3.12-slim), `.dockerignore`, `HEALTHCHECK` + `PORT` via `sh -c`.
- Deploy docs: env table, Docker/Railway/Fly notes in `apps/api/README.md`; BV15 table in root `README.md`.
- **72 pytest** (+4: `test_production_lifespan`, `test_dockerfile`).
- Docker smoke: `docker build` OK; `curl localhost:18000/api/v1/health` → `{"status":"ok"}`.
- CR: added `COOKIE_NAME` to Deploy env table (AC4 complete).

### File List

- `apps/api/app/main.py`
- `apps/api/Dockerfile`
- `apps/api/.dockerignore`
- `apps/api/README.md`
- `apps/api/tests/test_production_lifespan.py`
- `apps/api/tests/test_dockerfile.py`
- `README.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/13-1-dockerfile-and-production-env-docs.md`

## Change Log

- 2026-05-31: CR patch — added `COOKIE_NAME` to Deploy env table.
- 2026-05-31: Implemented Dockerfile, production env docs, init_db gate (72 pytest; docker smoke OK).
- 2026-05-31: Story created — Epic 13 kickoff; Dockerfile + production env docs (ready-for-dev).

## AI Engineering Record

| Phase | AI-Tool | Story-Ref |
|-------|---------|-----------|
| code | cursor/composer-2.5-fast | 13-1-dockerfile-and-production-env-docs |
| test | cursor/composer-2.5-fast | 13-1-dockerfile-and-production-env-docs |
| review | cursor/composer-2.5-fast | 13-1-dockerfile-and-production-env-docs |
