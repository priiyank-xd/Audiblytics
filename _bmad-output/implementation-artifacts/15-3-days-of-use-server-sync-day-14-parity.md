# Story 15.3: Days-of-Use Server Sync (Day-14 Parity)

Status: done

## Story

As Priyank,
I want distinct practice days stored on the server when in API mode,
so that Day-14 trigger and journey stats survive reload and match Postgres truth (BVR18, FR37).

## Acceptance Criteria

1. **AC1** — `days_of_use` table via Alembic (`user_id`, `utc_date` PK).
2. **AC2** — `GET/POST /api/v1/days-of-use`; idempotent stamp.
3. **AC3** — `recordDayOfUse()` stamps server + local in API mode.
4. **AC4** — `distinctDaysOfUse` / `useDistinctDayOfUse` read server ∪ local in API mode.

## Tasks

- [x] Task 1 — Model + migration `20260601_0007` + routes + pytest (6 tests)
- [x] Task 2 — `lib/api/days-of-use.ts` + server cache + `useServerDaysOfUse`
- [x] Task 3 — `recordDayOfUse` / `distinctDaysOfUse` / `dayOfUseAtRecordingSave` API-aware
- [x] Task 4 — **98 pytest**, **149 web**, typecheck green

## Dev Agent Record

### Completion Notes

- `DaysOfUse` model; `GET/POST /days-of-use`.
- `recordDayOfUse` → local + `stampDayOfUse` API; `notifyDaysOfUseMutated`.
- `useDistinctDayOfUse` merges server ∪ local; local-only while server loading.
- Alembic head → `20260601_0007`.

### File List

- `apps/api/app/models/days_of_use.py`
- `apps/api/app/models/user.py`
- `apps/api/app/models/__init__.py`
- `apps/api/app/schemas/days_of_use.py`
- `apps/api/app/api/v1/days_of_use.py`
- `apps/api/app/api/v1/router.py`
- `apps/api/app/core/database.py`
- `apps/api/alembic/env.py`
- `apps/api/alembic/versions/20260601_0007_days_of_use.py`
- `apps/api/tests/test_days_of_use.py`
- `apps/api/tests/test_alembic_revisions.py`
- `apps/web/src/lib/api/days-of-use.ts`
- `apps/web/src/lib/api/days-of-use.test.ts`
- `apps/web/src/lib/day-counter/index.ts`
- `apps/web/src/lib/day-counter/merge-days-of-use.ts`
- `apps/web/src/lib/day-counter/merge-days-of-use.test.ts`
- `apps/web/src/lib/day-counter/days-of-use-server-cache.ts`
- `apps/web/src/lib/day-counter/days-of-use-server-cache.test.ts`
- `apps/web/src/lib/day-counter/days-of-use-mutated.ts`
- `apps/web/src/lib/day-counter/use-server-days-of-use.ts`
- `apps/web/src/lib/day-counter/use-distinct-day-of-use.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Review Findings (2026-06-01)

- [x] [Review][Patch] Stamp cache race [`appendServerDaysOfUseCache`, `days-of-use-mutated.ts`] — append on stamp; notify no longer invalidates.
- [x] [Review][Patch] API-mode tests [`day-counter.test.ts`, `days-of-use-server-cache.test.ts`].
- [x] [Review][Defer] Day14 `hasDay1Recording` Dexie-only in API mode [`use-day-14-trigger.ts:25-28`] — out of 15.3 scope; recordings API follow-up.
- [x] [Review][Defer] Server stamp failure → local ahead of server until reload — AC allows local fallback.
- [x] [Review][Defer] POST returns 201 on duplicate stamp — idempotent behavior OK for n=1.
- [x] [Review][Dismiss] `useServerDaysOfUse` only loads when `useDistinctDayOfUse` mounts — shell/Today mount suffices.

## Change Log

- 2026-06-01: CR patches — append cache on stamp, API tests (152 web).
- 2026-06-01: Code review — 2 patch, 2 defer, 1 dismiss.
- 2026-06-01: Story 15.3 — days-of-use server sync (98 pytest, 149 web).
