# Story 12.2: Day Completions API

Status: done

## Story

As Priyank,
I want completion state upserted per UTC date on the server,
so that calendar and streak work cross-device (BVR13, FR53–FR57).

## Acceptance Criteria

1. **AC1 — `day_completions` table** — Alembic migration creates table per BV5: composite PK `(user_id, utc_date)`, booleans `has_read_it`, `has_recording`, `used_offline_pack`, FK CASCADE.

2. **AC2 — GET /completions** — Authenticated user gets flat map `{ "YYYY-MM-DD": { hasReadIt, hasRecording, usedOfflinePack } }` camelCase per BV10; user-scoped.

3. **AC3 — PUT /completions/{utc_date}** — Upsert with OR-merge semantics (flags once true stay true); validates `YYYY-MM-DD`; returns `DayCompletionResponse`.

4. **AC4 — Frontend API mode** — `useCompletions()` loads from API; writers use `upsertDayCompletion` + `notifyCompletionsMutated`:
   - `use-mark-read-it.ts` (hasReadIt)
   - `use-save-recording.ts` (hasRecording)
   - Calendar/streak consumers: `use-streak`, `use-calendar-grid`, `use-is-utc-day-complete`, `use-day-rail-cells`, `use-month-calendar-cells`, `TodaySessionStatus`, `VoiceJournalList`

5. **AC5 — Local mode unchanged** — Dexie/localStorage completions path preserved.

6. **AC6 — Tests** — pytest: auth, CRUD, merge, isolation, invalid date; vitest for `lib/api/completions.ts`. All green.

## Tasks / Subtasks

- [x] Task 1: Model + Alembic `20260531_0006_day_completions.py` (AC1)
- [x] Task 2: Pydantic `schemas/completions.py` (AC3)
- [x] Task 3: Routes `GET/PUT /completions` + router (AC2, AC3)
- [x] Task 4: `tests/test_completions.py` — 67 pytest total (AC6)
- [x] Task 5: `lib/api/completions.ts` + `completions-mutated.ts` + tests (AC6)
- [x] Task 6: `use-completions.ts` + hook migrations (AC4, AC5)
- [x] Task 7: Verification — 67 pytest, 84 web tests (AC6)

### Review Findings (2026-05-31)

- [x] [Review][Patch] GET `from`/`to` query params unvalidated [`completions.py:35-38`] — invalid dates raise uncaught `ValueError` → 500; wrap `parse_utc_date` → 422.
- [x] [Review][Patch] API `markReadIt` races `recordDayOfUse` [`use-mark-read-it.ts:45-60`] — `recordDayOfUse()` runs before PUT completes; await upsert then stamp day-of-use.
- [x] [Review][Defer] `loadParagraphCacheUtcDateSet` Dexie-only [`load-paragraph-cache-utc-date-set.ts`] — calendar `hasParagraphForDate` wrong in API mode until paragraph cache server sync; Epic 10 server cache exists, cross-device calendar follow-up.
- [x] [Review][Defer] `fetchCompletions` load failure → empty map [`use-completions.ts:38-42`] — same pattern as collection/recordings 12.1; no inline error.
- [x] [Review][Defer] Upsert failure silent in `markReadIt` / recording stamp — no inline error surface on PUT fail.
- [x] [Review][Defer] No pytest for GET `from`/`to` range filters — optional coverage.

## Dev Agent Record

### Agent Model Used

composer-2.5-fast

### Completion Notes List

- `DayCompletion` model + migration `0006`; composite PK `(user_id, utc_date)`.
- `GET /api/v1/completions` flat map; `PUT /api/v1/completions/{utc_date}` OR-merge flags.
- `useCompletions()` + `upsertDayCompletion`; all calendar/streak/read surfaces migrated.
- **68 pytest** (+7); **84 web** (+3).
- CR patches: GET `from`/`to` → 422 on invalid date; `markReadIt` awaits upsert before `recordDayOfUse`.

### File List

- `apps/api/app/models/day_completion.py`
- `apps/api/app/models/user.py`
- `apps/api/app/models/__init__.py`
- `apps/api/app/schemas/completions.py`
- `apps/api/app/api/v1/completions.py`
- `apps/api/app/api/v1/router.py`
- `apps/api/app/core/database.py`
- `apps/api/alembic/env.py`
- `apps/api/alembic/versions/20260531_0006_day_completions.py`
- `apps/api/tests/test_completions.py`
- `apps/web/src/lib/api/completions.ts`
- `apps/web/src/lib/api/completions.test.ts`
- `apps/web/src/features/calendar/completions-mutated.ts`
- `apps/web/src/features/calendar/use-completions.ts`
- `apps/web/src/features/calendar/use-mark-read-it.ts`
- `apps/web/src/features/calendar/use-streak.ts`
- `apps/web/src/features/calendar/use-is-utc-day-complete.ts`
- `apps/web/src/features/calendar/use-calendar-grid.ts`
- `apps/web/src/features/calendar/use-day-rail-cells.ts`
- `apps/web/src/features/calendar/use-month-calendar-cells.ts`
- `apps/web/src/components/audiblytics/TodaySessionStatus.tsx`
- `apps/web/src/components/audiblytics/VoiceJournalList.tsx`
- `apps/web/src/features/voice-journal/use-save-recording.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-05-31: CR patches — GET date validation 422; markReadIt ordering fix (68 pytest, 84 web).
- 2026-05-31: Implemented day completions API + API-mode calendar/streak hooks (67 pytest, 84 web).
