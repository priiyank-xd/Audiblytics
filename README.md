# Audiblytics

> **PERSONAL USE ONLY — n=1.** API keys live in browser `localStorage`; deploying this app publicly is forbidden until a backend proxy is introduced. See `architecture.md` § Hard-Scope-Boundary (AR15).

## Development

This repo was scaffolded with:

```bash
pnpm create next-app@latest <project> --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --use-pnpm
```

Day to day:

- `pnpm dev` — Turbopack dev server (http://localhost:3000)
- `pnpm build` — production build
- `pnpm start` — serve the `.next` output locally

**Where to put new code:** follow the folder decision tree in `architecture.md` § Structure Patterns (lines 641–656) — capability areas under `src/features/`, shared UI composites under `src/components/audiblytics/`, cross-cutting code under `src/lib/`.

**Architecture (source of truth):** `_bmad-output/planning-artifacts/architecture.md` — especially § Implementation Patterns and § Enforcement Guidelines.

**Script-only env:** see root `.env.example` (`OFFLINE_PACK_PROVIDER_KEY` for the offline-pack generator; not used by the Next.js app at runtime).
