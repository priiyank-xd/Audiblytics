# Audiblytics Web (`apps/web`)

Next.js 16 frontend (`@audiblytics/web`). Client spec: `_bmad-output/planning-artifacts/architecture.md`. ADRs: [`docs/decisions/`](../../docs/decisions/).

## Quick start — local mode (default)

Local storage + IndexedDB; LLM keys in browser `localStorage`.

**1. Install (once, from repo root)**

```bash
cd ../..   # repo root, if you are in apps/web
pnpm install
```

**2. Web**

```bash
cd apps/web
cp .env.example .env.local   # optional — defaults are fine for local mode
pnpm dev
```

Open http://localhost:3000

## API mode (auth + Postgres)

Requires the FastAPI server. See **[apps/api/README.md](../api/README.md)** for Postgres, migrations, and seed user.

**1. API** (separate terminal)

```bash
docker compose up -d postgres   # from repo root
cd apps/api
cp .env.example .env
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

**2. Web env**

In `apps/web/.env.local`:

```env
NEXT_PUBLIC_STORAGE_BACKEND=api
API_URL=http://localhost:8000
```

**3. Web**

```bash
cd apps/web
pnpm dev
```

Open http://localhost:3000/login

In API mode, paragraph generation runs on the server via Gemini (key in **Settings → Advanced**, or `GEMINI_API_KEY` in `apps/api/.env` as dev fallback).

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Turbopack dev server on http://localhost:3000 |
| `pnpm build` | Production build (see `next.config.ts` hard-scope guard) |
| `pnpm start` | Serve production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Unit tests (`tsx --test`) |

Offline pack generator (Story 8.1):

```bash
pnpm tsx scripts/generate-offline-pack.ts
```

Requires `OFFLINE_PACK_PROVIDER_KEY` in `apps/web/.env.local`.

## Deploy

Vercel — set **Root Directory** to `apps/web`. In API mode, set `NEXT_PUBLIC_STORAGE_BACKEND=api` and point `API_URL` at your deployed API origin.
