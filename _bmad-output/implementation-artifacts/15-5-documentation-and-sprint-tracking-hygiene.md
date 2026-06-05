# Story 15.5: Documentation and Sprint Tracking Hygiene

Status: done

## Story

As Priyank,
I want docs and sprint status to reflect shipped v2 + UI work,
So that the repo is interview-ready and agents see accurate epic state (BVR20).

## Acceptance Criteria

1. **AC1** — Root `README.md` Phase 2: primary Gemini path is Settings → Postgres (`gemini_api_key`); `GEMINI_API_KEY` in `.env` documented as optional dev fallback only.
2. **AC2** — `sprint-status.yaml`: epics 1–8 and 11 with all stories `done` → epic rows `done`.
3. **AC3** — Optional `ux-v2-mockups-addendum.md` links mockup folder + notes API-mode login/settings.
4. **AC4** — Retroactive story files for Epics 9–10 (9.1–9.6, 10.1–10.5) in `implementation-artifacts/`.

## Tasks

- [x] Task 1 — README Phase 2 Gemini path
- [x] Task 2 — Sprint epic status hygiene (epics 1–8, 11)
- [x] Task 3 — `ux-v2-mockups-addendum.md`
- [x] Task 4 — Retroactive story files 9.1–10.5
- [x] Task 5 — Verify tests/typecheck

## Dev Agent Record

### Completion Notes

- README Phase 2 documents Settings → Postgres as primary Gemini path; `.env` fallback optional.
- Sprint: `epic-1`, `epic-2`, `epic-4`, `epic-5`, `epic-7` → `done` (all child stories already done); `epic-11` was already `done`.
- Added `ux-v2-mockups-addendum.md` + README architecture table link.
- Eleven retroactive Epic 9–10 story files with ACs copied from `epics.md`.

### File List

- `README.md` — Phase 2 Gemini path; architecture doc links
- `_bmad-output/planning-artifacts/ux-v2-mockups-addendum.md` — new
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — epic status hygiene
- `_bmad-output/implementation-artifacts/9-1-fastapi-scaffold-health-and-postgres.md` — retroactive
- `_bmad-output/implementation-artifacts/9-2-users-model-jwt-auth-routes-and-seed-script.md` — retroactive
- `_bmad-output/implementation-artifacts/9-3-alembic-migrations-for-users-and-user-settings.md` — retroactive
- `_bmad-output/implementation-artifacts/9-4-nextjs-login-authprovider-and-appgate.md` — retroactive
- `_bmad-output/implementation-artifacts/9-5-settings-api-and-api-mode-settings-form.md` — retroactive
- `_bmad-output/implementation-artifacts/9-6-nextjs-api-proxy-for-same-origin-cookies.md` — retroactive
- `_bmad-output/implementation-artifacts/10-1-paragraph-cache-migration-and-model.md` — retroactive
- `_bmad-output/implementation-artifacts/10-2-post-paragraphs-generate-gemini-proxy.md` — retroactive
- `_bmad-output/implementation-artifacts/10-3-get-paragraphs-today-same-day-cache.md` — retroactive
- `_bmad-output/implementation-artifacts/10-4-frontend-api-paragraph-hooks.md` — retroactive
- `_bmad-output/implementation-artifacts/10-5-paragraph-route-tests.md` — retroactive
- `_bmad-output/implementation-artifacts/15-5-documentation-and-sprint-tracking-hygiene.md` — story file

## Change Log

- 2026-06-01: CR patches — README Phase 1/2 order, personal-use boundary updated; Epic 15 closed.
- 2026-06-01: Code review — 2 patch, 2 defer, 1 dismiss.
- 2026-06-01: Story 15.5 — docs + sprint hygiene + Epic 9–10 retroactive story files

### Review Findings (2026-06-01)

- [x] [Review][Patch] README section order [`README.md`] — Phase 1 before Phase 2; deduped migration note.
- [x] [Review][Patch] Personal-use boundary [`README.md`] — documents local vs API mode; local browser keys still gated.
- [x] [Review][Defer] No `ux-design-specification.md` cross-link to addendum — AC3 satisfied by standalone `ux-v2-mockups-addendum.md`; optional frontmatter pointer in polish pass.
- [x] [Review][Defer] Retroactive 9.x/10.x files omit File List — AC4 requires traceability + ACs only; full file lists optional for retroactive entries.
- [x] [Review][Dismiss] Hex palette values in addendum — mockup reference doc, not app styling (semantic tokens rule applies to code only).
