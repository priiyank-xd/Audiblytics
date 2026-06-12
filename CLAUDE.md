# Audiblytics — agent rules (Claude Code)

**Repo identity:** Audiblytics is an **n=1 personal-use** browser app. API keys live in `localStorage`. Do not treat this as a production multi-tenant product without an explicit architecture change.

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
