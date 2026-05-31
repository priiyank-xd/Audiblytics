# ADR 0003: Strangler migration via `STORAGE_BACKEND` flag

**Status:** Accepted  
**Date:** 2026-05-31  
**Decision IDs:** BV0 (Scope transition), BV9 (Frontend integration)

## Context

The v1 app is a deliberate **client-only** MVP: Dexie, `localStorage`, browser-direct LLM calls (AR15). Rewriting everything at once would be high-risk. v2 adds FastAPI + Neon + R2 while the product must keep working for daily n=1 use.

## Decision

- Introduce **`NEXT_PUBLIC_STORAGE_BACKEND=local|api`** (web) as the single capability switch.
- Use **`isApiStorageBackend()`** (`apps/web/src/lib/config/storage-backend.ts`) as the capability switch; feature hooks call API clients or Dexie/localStorage per domain (BV9 phased strangler — formal repository ports are the target shape, not yet fully extracted).
- Migrate in **phased slices** (no dual-write):
  1. Auth + settings  
  2. Collection + completions + paragraphs  
  3. Recordings (R2)  
  4. Day-14 / offline pack (deferred client-side)
- When `api`: LLM keys live in server env (`GEMINI_API_KEY`), not browser `localStorage` (BV4.4).
- v1 `architecture.md` remains valid for `local`; `architecture-v2-fastapi-backend.md` is authoritative for `api`.

## Consequences

**Positive**

- Incremental demo path for interviews (“strangler fig”).
- Local dev unchanged without Postgres/R2 until explicitly enabled.
- Reduces blast radius per epic/story.

**Negative / trade-offs**

- Two code paths to maintain until local mode is retired.
- Some features still Dexie-only in API mode (documented deferrals — e.g. archived-day drill-in).
- Hard-scope guards (AR15) still apply to **local** mode; API mode shifts trust boundary to server.

## References

- `apps/web/src/lib/config/storage-backend.ts` — `NEXT_PUBLIC_STORAGE_BACKEND` guard
- `apps/web/src/components/audiblytics/AppGate.tsx` — `AuthGate` vs `ProviderKeysGate`
- Feature hooks (e.g. `use-collection.ts`, `use-save-recording.ts`, `use-generate-paragraph.ts`) — API vs local branches
- `_bmad-output/planning-artifacts/architecture-v2-fastapi-backend.md` § BV0, BV9
- `_bmad-output/planning-artifacts/architecture.md` § Hard-Scope-Boundary (AR15)
