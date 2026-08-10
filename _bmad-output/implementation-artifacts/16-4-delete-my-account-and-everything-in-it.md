# Story 16.4: Delete My Account and Everything In It

Status: done

## Story

As a user,
I want to permanently delete my account and all its data,
so that leaving means actually leaving (NFR19 revised).

**Scope:** `apps/api` (new `DELETE /auth/account`) plus the Settings action that reaches it. No schema change, therefore no Alembic migration.

## Acceptance Criteria

1. **AC1 — Every owned row goes** — After deletion, every user-owned table (`user_settings`, `paragraph_cache`, `recordings`, `collection_words`, `day_completions`, `days_of_use`) and the `users` row itself hold nothing for that account. Asserted by counting every table in `TENANT_MODELS`.

2. **AC2 — Every owned R2 object goes** — One `delete_object` call per recording with a storage key.

3. **AC3 — The session is invalidated** — The session cookie is cleared, and a follow-up request to any authenticated route returns 401.

4. **AC4 — A partial R2 failure is logged and reported, never swallowed** — A key that cannot be deleted is logged at error level with the key and the user id, and returned in `orphanedObjectKeys`. The row deletion still proceeds, so the account is genuinely gone even when storage misbehaves.

5. **AC5 — Safely repeatable** — Deleting the same object key twice is a no-op in S3/R2, and a second call to the endpoint is 401 because the session is gone. Nothing is left in a half-state that a retry would corrupt.

6. **AC6 — The email is reusable** — Registering with a deleted account's email succeeds and the new account starts empty, with default settings.

7. **AC7 — Other accounts are untouched** — A second account keeps every row and can still sign in and read its own data.

8. **AC8 — Reachable from the UI, behind a confirmation** — Settings → Data & Storage offers "Delete all" in API mode, requires a second explicit confirmation inline, then redirects to `/login`. Orphaned keys, if any, are shown rather than hidden.

## Tasks / Subtasks

- [x] **Task 1 — Deletion endpoint** (AC1, AC2, AC3, AC4)
  - [x] 1.1 `schemas/account.py::AccountDeletionResponse` — `deletedRecordings`, `orphanedObjectKeys`.
  - [x] 1.2 `api/v1/auth.py::delete_account` — collect storage keys through the guard, delete objects, then delete rows, then clear the cookie.
  - [x] 1.3 Row deletion iterates `TENANT_MODELS` and issues one guarded `delete(model)` per table, then deletes the `users` row.
  - [x] 1.4 Failed object deletions are logged with the key and collected into `orphanedObjectKeys` (AC4).

- [x] **Task 2 — UI** (AC8)
  - [x] 2.1 `lib/api/account.ts::deleteAccount()`.
  - [x] 2.2 `SettingsDataPage` — two-step inline confirmation, spinner while deleting, redirect to `/login` on success, inline error text on failure, and an inline list of orphaned keys when storage cleanup was incomplete.

- [x] **Task 3 — Tests** (AC1–AC7)
  - [x] 3.1 `tests/test_account_deletion.py` — 401 unauthenticated; every table emptied; session invalidated; orphaned keys reported; other accounts untouched; email reusable with an empty account afterwards.
  - [x] 3.2 `cd apps/api && pytest` green; `pnpm typecheck` and `pnpm test` green in `apps/web`.

## Dev Notes

### Why explicit per-table deletes instead of relying on cascade

Every foreign key already declares `ondelete="CASCADE"`, and on Postgres deleting the `users` row would be enough. On SQLite — which the whole test suite runs on — foreign keys are not enforced unless `PRAGMA foreign_keys=ON` is set per connection, so a cascade-only implementation would pass in production and silently orphan rows in tests, which is the worst of both worlds.

Iterating `TENANT_MODELS` and issuing one guarded `delete(model)` per table gives identical behaviour on both engines, is provable in tests, and reuses Story 16.1's guard to supply the `user_id` predicate. The database-level cascade remains as a backstop.

### Order of operations

Objects first, rows second. If the process dies between the two, the user still has their rows and can retry; the already-deleted objects delete again as a no-op. The reverse order would leave audio in R2 with no row pointing at it and no way to find it.

### Why the response reports orphans instead of failing

Returning 500 on an R2 failure would leave the user unable to delete their account because of a storage problem they cannot fix. Deleting the rows and handing back the exact keys that survived is both more useful and more honest: the account is gone, and the leftover is named.

### Decision IDs

NFR19 revised (recordings reachable only by the owning user, and destroyed on request), NFR30, BV4.2, ADR 0004 (ORM-enforced tenant scoping, including `unscoped()` as the administrative seam), ADR 0002 (R2 object lifecycle).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 16.4]
- [Source: docs/decisions/0004-orm-enforced-tenant-scoping.md]
- [Source: apps/api/app/services/recording_retention.py] — existing best-effort R2 delete precedent

## Dev Agent Record

### Agent Model Used

Claude Opus 5 (Cursor, bmad-dev-story workflow)

### Completion Notes List

- `apps/api` suite: **127 passed** (6 new here). `apps/web`: 164 passed, typecheck clean.
- `_row_counts()` in the test file reads every `TENANT_MODELS` table through `unscoped()`, so the "everything is gone" assertion is made from outside the tenant guard and cannot be satisfied by scoping alone.
- Deletion returns 200 with a body rather than 204, because AC4 requires the orphaned keys to be reported to the caller.

### File List

- `apps/api/app/api/v1/auth.py`
- `apps/api/app/schemas/account.py` (new)
- `apps/api/tests/test_account_deletion.py` (new)
- `apps/web/src/lib/api/account.ts`
- `apps/web/src/features/settings/settings-data-page.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-08-10: Story 16.4 implemented — `DELETE /auth/account` removes every owned R2 object then every owned row, invalidates the session, and reports orphaned object keys; wired into Settings behind an inline two-step confirmation (review).
- 2026-08-10: Code review passed with no changes requested — API 127 passed, web 164 passed, typecheck clean, no files changed (done).
