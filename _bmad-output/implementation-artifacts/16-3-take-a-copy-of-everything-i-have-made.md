# Story 16.3: Take a Copy of Everything I Have Made

Status: done

## Story

As a user,
I want to download my recordings, saved words, day notes and paragraph history,
so that my practice is not hostage to this app continuing to exist (FR71).

**Scope:** `apps/api` (new `GET /export`) plus the Settings button that reaches it. No schema change, therefore no Alembic migration.

## Acceptance Criteria

1. **AC1 — One archive with audio and a machine-readable manifest** — `GET /api/v1/export` returns a ZIP containing `manifest.json` plus one file per completed recording under `recordings/<id>.<ext>`. The manifest covers settings, paragraph history, collection words, day completions and days of use.

2. **AC2 — Nothing from any other account** — Every query runs through the Story 16.1 tenant guard, and a test with two seeded accounts asserts the archive contains only the caller's rows and only the caller's audio files.

3. **AC3 — Empty succeeds** — A user with no data gets a 200 with a valid archive whose manifest arrays and maps are empty. It does not error.

4. **AC4 — Unreadable audio is stated, not hidden** — When an object cannot be read from R2 (misconfigured, missing, network failure), the export still succeeds and the recording's manifest entry carries `audioFile: null` with an `audioUnavailableReason`. A pending upload is reported the same way.

5. **AC5 — Authentication required** — An unauthenticated request is 401.

6. **AC6 — Reachable from the UI** — Settings → Data & Storage offers Export in API mode, downloads the ZIP with the server-supplied filename, and renders failures inline.

## Tasks / Subtasks

- [x] **Task 1 — R2 read helper** (AC1)
  - [x] 1.1 `services/r2_client.py::get_object_bytes(storage_key)` — reads one object into memory, which is safe here because recordings are capped at 60 seconds.

- [x] **Task 2 — Export route** (AC1, AC2, AC3, AC4, AC5)
  - [x] 2.1 `api/v1/export.py` — `GET /export` builds the ZIP in memory and returns it with a `Content-Disposition` filename.
  - [x] 2.2 Manifest rows reuse the existing response schemas (`SettingsResponse`, `ParagraphCacheResponse`, `CollectionWordResponse`, `RecordingResponse`) so the export shape cannot drift from the API shape.
  - [x] 2.3 No `user_id` predicates anywhere — the guard supplies them (AC2).
  - [x] 2.4 R2 read failures are caught per recording, logged, and reported in the manifest (AC4).
  - [x] 2.5 Register the router in `api/v1/router.py`.

- [x] **Task 3 — UI** (AC6)
  - [x] 3.1 `lib/api/account.ts::fetchAccountExport()` — raw `fetch` (not `apiFetch`, which parses JSON) returning the blob and the filename parsed from `Content-Disposition`.
  - [x] 3.2 `SettingsDataPage` Export button: enabled in API mode, spinner while preparing, inline error text on failure.

- [x] **Task 4 — Tests** (AC1–AC5)
  - [x] 4.1 `tests/test_export.py` — 401 unauthenticated; empty-manifest success; full archive with audio bytes; unreadable-audio path; two-account isolation.
  - [x] 4.2 `cd apps/api && pytest` green; `pnpm typecheck` and `pnpm test` green in `apps/web`.

## Dev Notes

### Why a ZIP built in memory

Recordings are capped at 60 seconds and this is an n=1 app, so streaming or a background job would be machinery without a payer. `zipfile` over a `BytesIO` keeps the endpoint a single function with no temp files to clean up. If recording volume ever grows, the natural next step is a streaming `ZipStream` — noted, not built.

### Why the manifest reuses response schemas

Hand-writing an export shape would be a second definition of every entity, free to drift from the API. Calling `RecordingResponse.from_row(...).model_dump()` means the export is exactly what the API already promises, plus two export-only fields (`audioFile`, `audioUnavailableReason`).

### Day notes

The epic mentions day notes. There is no server-side day-notes model yet — journey reflections and voice-journal notes are still `localStorage`-only and are unified in Epic 19. The manifest covers everything that exists server-side today; when Epic 19 adds the table it becomes another `select` through the same guard.

### Decision IDs

FR71 (export), NFR30 (the guard that makes AC2 true), BV4.2, ADR 0004 (ORM-enforced tenant scoping), ADR 0002 (audio in R2, not Postgres).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 16.3]
- [Source: docs/decisions/0004-orm-enforced-tenant-scoping.md]
- [Source: docs/decisions/0002-r2-presigned-blobs-not-postgres.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 5 (Cursor, bmad-dev-story workflow)

### Completion Notes List

- `apps/api` suite: **127 passed** (5 new here). `apps/web`: 164 passed, typecheck clean.
- The export deliberately does not fail when R2 is unreachable. An archive of every word, paragraph and completion is worth having even without the audio, and the manifest says plainly which files are missing and why.
- Pending uploads (`storage_key IS NULL`) appear in the manifest with `audioUnavailableReason: "Upload never completed."` rather than being silently dropped.

### File List

- `apps/api/app/api/v1/export.py` (new)
- `apps/api/app/api/v1/router.py`
- `apps/api/app/services/r2_client.py`
- `apps/api/tests/test_export.py` (new)
- `apps/web/src/lib/api/account.ts` (new)
- `apps/web/src/features/settings/settings-data-page.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-08-10: Story 16.3 implemented — `GET /export` returns a ZIP of audio plus a manifest built from the existing response schemas, scoped by the Story 16.1 guard; Export wired into Settings → Data & Storage (review).
- 2026-08-10: Code review passed with no changes requested — API 127 passed, web 164 passed, typecheck clean, no files changed (done).
