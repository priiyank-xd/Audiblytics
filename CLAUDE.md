# Audiblytics — agent rules (Claude Code)

**Repo identity:** Audiblytics is an **n=1 personal-use** app. The Gemini key lives server-side. Do not treat this as a production multi-tenant product without an explicit architecture change.

**Repo layout:** Monorepo — Next.js frontend in `apps/web/` (`@audiblytics/web`); FastAPI backend in `apps/api/`. All Node/pnpm commands (`pnpm install`, `pnpm dev`, etc.) run from `apps/web`; `uvicorn` runs from `apps/api`. Backend spec: `architecture-v2-fastapi-backend.md`.

**Canonical doc:** `_bmad-output/planning-artifacts/architecture.md`

Before writing or editing code, read **`architecture.md` § Implementation Patterns** (lines 571–873): naming, folder placement (capability-area colocation per NFR28), error handling (`Result<T, E>` discriminated unions; no throws for app-level failures), styling (semantic tokens only; no arbitrary Tailwind values), state management (decision tree in § Communication Patterns), and § Enforcement Guidelines.

## Mandatory rules (§ Enforcement Guidelines)

All implementers MUST:

1. Read `architecture.md` § Implementation Patterns before writing code.
2. Use exported Zod schemas as the source of truth for any persisted shape — never hand-write a parallel TS type.
3. Place new files using the folder decision tree (`architecture.md` § Structure Patterns, lines 641–656) under `apps/web/src/`.
4. Use namespaced `audiblytics.*` localStorage keys via the `useLocalStorage` hook.
5. Return `Result<T, E>` discriminated unions for fallible operations; throw only for programmer errors.
6. Render errors via the appropriate inline surface — never via toast/modal/alert.
7. Use semantic tokens for color/spacing/typography — never arbitrary hex/px values.
8. Anchor all persisted dates to UTC ISO strings; convert at the display boundary only.
9. Mark client components with `'use client'` only when needed (browser API, hook, state).
10. Reference `architecture.md` decision IDs in PR/story descriptions when adding new modules.

## Hard-scope boundary

Public deployment and bypassing the n=1 boundary are forbidden until a backend proxy exists. See `architecture.md` § Hard-Scope-Boundary (AR15) and NFR14.

## Commands

- Full stack: `./ax start` / `./ax stop` from repo root (Postgres + API :8000 + web :3000; needs pnpm, Docker, Python 3.12+). Or `docker compose up -d --build` (+ `docker compose --profile setup run --rm seed` once). k8s manifests in `k8s/`.
- Web (`apps/web`): `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (`tsx --test "src/**/*.test.ts"`).
- API (`apps/api`): `uvicorn` from that dir; Alembic migrations in `apps/api/alembic/`.

## Architecture at a glance

- **API-only storage**: the web app reads/writes exclusively through FastAPI + Postgres (server-side Gemini). The old local mode (IndexedDB/Dexie, browser LLM keys, offline pack, Day-14, journey reflections) was removed (ADR 0003 completed). `localStorage` remains only for UI prefs via `useLocalStorage`.
- **Web** `apps/web/src/`: `app/` routes (home, today, journal, collection, review, journey, stats, settings/*), `features/` (capability-area colocation), `components/ui/` (shared primitives; `cn()` is the most-used helper), `lib/` (config, ai providers, Result helpers `ok()`/`err()`). Next.js proxies `/api/v1/*` to the API (`app/api/v1/[...path]`).
- **API** `apps/api/app/`: `api/v1/` routers (auth, settings, paragraphs, completions, collection, recordings, days_of_use, health), `models/` (SQLAlchemy), `schemas/` (Pydantic), `services/` (Gemini paragraph generation, R2 presigned uploads, recording retention pruning), `core/` (config, security, db).
- **ADRs** `docs/decisions/`: 0001 JWT httpOnly cookie auth, 0002 R2 presigned blobs (not Postgres), 0003 strangler storage-backend flag.
- **Planning docs** `_bmad-output/planning-artifacts/`: `prd.md`, `architecture.md`, `architecture-v2-fastapi-backend.md`, `epics.md`, `ux-design-specification.md`; stories in `_bmad-output/implementation-artifacts/`; mockups in `_bmad-output/design/`.

## Knowledge graph (graphify)

A graph of code + docs lives in `graphify-out/` (`GRAPH_REPORT.md`, `graph.json`, `graph.html`). For architecture or "how does X connect to Y" questions, read `GRAPH_REPORT.md` or run `graphify query "<question>"` before grepping. Refresh with `/graphify . --update`. `.graphifyignore` excludes BMAD tooling (`.agents/`, `_bmad/`, `.cursor/`).
