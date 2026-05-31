# Story 11.5: Server-Side 90-Day Retention Prune

Status: done

## Story

As Priyank,
I want old recordings deleted on server when retention is 90-day rolling,
so that FR41 holds in API mode (BVR14).

## Acceptance Criteria

1. **AC1 — Rolling policy prune** — Given user `retention=90-day-rolling` and completed recordings with `recording_date < now() - 90 days` (UTC), when prune runs on login or session restore (`GET /auth/me`), then matching Postgres rows are deleted and R2 objects removed when `storage_key` is set.

2. **AC2 — Indefinite policy no-op** — Given user `retention=indefinite`, when prune runs, then no recordings are deleted.

3. **AC3 — Pending rows** — Given pending uploads (`storage_key IS NULL`) older than 90 days under rolling policy, when prune runs, then Postgres rows are deleted (no R2 call).

4. **AC4 — User scope** — Prune affects only the authenticated user's recordings; other users' rows untouched.

5. **AC5 — Client skip in API mode** — `usePruneOnMount` / `RetentionPruneOnMount` skip Dexie prune when `isApiStorageBackend()` (server owns retention in API mode per architecture-v2).

6. **AC6 — Tests** — pytest covers rolling delete, indefinite no-op, R2 delete mocked, login + `/auth/me` triggers; all existing tests green.

## Tasks / Subtasks

- [x] **Task 1 — R2 delete helper** (AC1, AC3)
  - [x] 1.1 Add `delete_object(storage_key)` to `app/services/r2_client.py` with `R2ConfigurationError` on missing config.

- [x] **Task 2 — Retention prune service** (AC1–AC4)
  - [x] 2.1 Create `app/services/recording_retention.py` with `prune_expired_recordings(db, user) -> int`.
  - [x] 2.2 Use 90-day UTC cutoff matching client `prune-recordings.ts`.
  - [x] 2.3 Skip when `user.settings.retention != "90-day-rolling"`.

- [x] **Task 3 — Auth hooks** (AC1, AC6)
  - [x] 3.1 Call prune after successful `POST /auth/login` (load settings via `selectinload`).
  - [x] 3.2 Call prune from `GET /auth/me` for session-restore parity with client mount hook.

- [x] **Task 4 — Frontend API-mode skip** (AC5)
  - [x] 4.1 Update `use-prune-on-mount.ts` to return early when `isApiStorageBackend()`.

- [x] **Task 5 — Tests + verification** (AC6)
  - [x] 5.1 Add `tests/test_recording_retention.py`.
  - [x] 5.2 Run full `pytest` in `apps/api` — **49 passed**.

### Review Findings (2026-05-31)

- [x] [Review][Patch] Prune failure can break auth responses [`app/api/v1/auth.py:54,66`] — fixed: `_prune_recordings_best_effort` wraps prune; rollback + log on SQLAlchemyError; auth continues.
- [x] [Review][Defer] Sync boto3 `delete_object` blocks async event loop [`app/services/recording_retention.py:53`] — same pattern as 11.1 presign; acceptable for n=1 until volume grows.
- [x] [Review][Defer] R2 delete failures swallowed with no logging [`app/services/recording_retention.py:54-56`] — orphan R2 objects possible; story documents best-effort; add logging if ghosts appear.
- [x] [Review][Defer] Naive UTC cutoff for SQL compare [`app/services/recording_retention.py:39`] — SQLite test compat; Postgres timestamptz + UTC host assumed for n=1.
- [x] [Review][Defer] R2 deleted before DB commit — partial failure leaves ghost rows [`app/services/recording_retention.py:50-64`] — rare; idempotent retry on next login/me.
- [x] [Review][Defer] No web unit test for API-mode prune skip [`use-prune-on-mount.ts:24`] — AC6 scoped to pytest; trivial vitest optional.
- [x] [Review][Defer] Retention change via PATCH /settings defers prune until next login/me — matches client mount-hook semantics; acceptable.

## Dev Notes

- Architecture-v2 L365–366: on login or daily cron; n=1 uses login + `/auth/me` (no cron).
- Retention enum: `"90-day-rolling"` | `"indefinite"` in `user_settings.retention`.
- R2 delete best-effort: log/skip R2 failure but still remove DB row to avoid ghost list entries.
- Cross-story: uses `Recording` model (11.1), `r2_client` (11.1), auth (Epic 9).

## Dev Agent Record

### Agent Model Used

composer-2.5-fast

### Completion Notes List

- `delete_object` in `r2_client.py`; mocked in tests.
- `recording_retention.prune_expired_recordings` — 90-day naive-UTC cutoff, user-scoped, best-effort R2 then bulk DELETE.
- Auth: prune on `POST /auth/login` + `GET /auth/me`.
- Frontend: `use-prune-on-mount.ts` no-op when `isApiStorageBackend()`.
- **49 pytest passed** (7 retention + 2 delete_object + 40 existing).

- CR 2026-05-31: `_prune_recordings_best_effort` — auth survives prune failures; +2 tests; **51 pytest passed**.

### File List

- `apps/api/app/services/r2_client.py`
- `apps/api/app/services/recording_retention.py`
- `apps/api/app/api/v1/auth.py`
- `apps/api/tests/test_recording_retention.py`
- `apps/api/tests/test_r2_recordings.py`
- `apps/web/src/lib/hooks/use-prune-on-mount.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/deferred-work.md`

## Change Log

- 2026-05-31: Story created and implemented — server retention prune + API-mode client skip (49 pytest).
- 2026-05-31: CR patch — best-effort prune wrapper on auth routes (51 pytest).
