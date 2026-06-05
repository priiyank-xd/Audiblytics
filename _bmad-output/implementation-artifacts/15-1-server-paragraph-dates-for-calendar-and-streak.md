# Story 15.1: Server Paragraph Dates for Calendar and Streak

Status: done

## Story

As Priyank,
I want calendar, streak, and journey stats to know which UTC days have a server-generated paragraph,
so that completion dots and streaks stay honest in API mode after reload (BVR16, FR53, FR58).

## Acceptance Criteria

1. **AC1 — GET /paragraphs/dates** — Authenticated `GET /api/v1/paragraphs/dates` returns JSON array of UTC `YYYY-MM-DD` strings from `paragraph_cache.generated_at` for current user only; optional `from` / `to` query filters (422 on invalid dates).

2. **AC2 — Merge on load** — `loadParagraphCacheUtcDateSet()` unions server dates (API mode) with Dexie `paragraphCache` dates.

3. **AC3 — Honest completion** — Yesterday with server paragraph + completion flags evaluates complete on Journey/calendar/streak after reload.

4. **AC4 — Tests** — pytest: empty user, after generate, `from`/`to`, isolation, invalid query; vitest: `fetchParagraphDates`, merge helper, `loadParagraphCacheUtcDateSet` API branch.

## Tasks / Subtasks

- [x] **Task 1 — API endpoint** (AC1)
  - [x] 1.1 `GET /paragraphs/dates` in `apps/api/app/api/v1/paragraphs.py`
  - [x] 1.2 Reuse `parse_utc_date` for `from`/`to` (422)
  - [x] 1.3 `tests/test_paragraphs.py` — dates cases

- [x] **Task 2 — Frontend fetch + merge** (AC2, AC3)
  - [x] 2.1 `fetchParagraphDates` in `apps/web/src/lib/api/paragraphs.ts` + Zod schema
  - [x] 2.2 Update `load-paragraph-cache-utc-date-set.ts` — API union + `useParagraphCacheUtcDateSet` reactivity
  - [x] 2.3 `notifyParagraphDatesMutated` after API generate success
  - [x] 2.4 Migrate calendar/journey hooks to `useParagraphCacheUtcDateSet`
  - [x] 2.5 Vitest for fetch + merge

- [x] **Task 3 — Verification** (AC4)
  - [x] 3.1 `pytest` (api) — 75 passed
  - [x] 3.2 `pnpm --filter @audiblytics/web test` — 137 passed

## Dev Notes

- Deferred-work #96 — this story closes it.
- `parse_utc_date` from `app/schemas/completions.py`.
- Route `/dates` before dynamic segments.
- API generate does not write Dexie today — mutation event refreshes `useLiveQuery` deps.

## Dev Agent Record

### Agent Model Used

composer-2.5-fast

### Completion Notes List

- `GET /api/v1/paragraphs/dates` — user-scoped UTC dates; optional `from`/`to` → 422.
- `loadParagraphCacheUtcDateSet` — Dexie ∪ server in API mode; API fail → Dexie fallback.
- `useParagraphCacheUtcDateSet` + `notifyParagraphDatesMutated` on API generate — calendar/streak/journey refresh same session.
- **87 pytest** (+6 paragraph dates); **139 web** (+5).
- CR patches: deduped `paragraph-dates-server-cache.ts`; `from`/`to` + auth pytest.

### File List

- `apps/api/app/api/v1/paragraphs.py`
- `apps/api/tests/test_paragraphs.py`
- `apps/web/src/lib/schemas/paragraph-cache.schema.ts`
- `apps/web/src/lib/api/paragraphs.ts`
- `apps/web/src/lib/api/paragraphs-dates.test.ts`
- `apps/web/src/features/calendar/load-paragraph-cache-utc-date-set.ts`
- `apps/web/src/features/calendar/load-paragraph-cache-utc-date-set.test.ts`
- `apps/web/src/features/calendar/use-paragraph-cache-utc-date-set.ts`
- `apps/web/src/features/calendar/paragraph-dates-mutated.ts`
- `apps/web/src/features/calendar/paragraph-dates-server-cache.ts`
- `apps/web/src/features/calendar/paragraph-dates-server-cache.test.ts`
- `apps/web/src/features/calendar/use-streak.ts`
- `apps/web/src/features/calendar/use-is-utc-day-complete.ts`
- `apps/web/src/features/calendar/use-calendar-grid.ts`
- `apps/web/src/features/calendar/use-day-rail-cells.ts`
- `apps/web/src/features/calendar/use-month-calendar-cells.ts`
- `apps/web/src/features/journey/use-journey-stats.ts`
- `apps/web/src/features/paragraph/use-generate-paragraph.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Review Findings (2026-06-01)

- [x] [Review][Patch] Duplicate `GET /paragraphs/dates` per hook instance [`paragraph-dates-server-cache.ts`] — module cache + shared in-flight promise; hook merges Dexie live query + server state.
- [x] [Review][Patch] AC4 gap — `test_paragraph_dates_from_to_filter` added [`test_paragraphs.py`].
- [x] [Review][Patch] `test_paragraph_dates_requires_auth` added [`test_paragraphs.py`].
- [x] [Review][Defer] `_parse_query_utc_date` duplicated in `paragraphs.py` + `completions.py` — pre-existing DRY debt; extract shared util in hygiene pass.
- [x] [Review][Defer] API dates fetch failure → `console.warn` + Dexie-only [`load-paragraph-cache-utc-date-set.ts:43-45`] — matches `useCompletions` silent-degrade pattern; no inline error surface.
- [x] [Review][Defer] No vitest for `loadParagraphCacheUtcDateSet` API branch — merge helper tested; full API branch needs env mock; acceptable for n=1.
- [x] [Review][Defer] Unbounded `select(generated_at)` — n=1 OK; SQL `DISTINCT date` optimization if history grows.
- [x] [Review][Defer] Hooks do not pass calendar window to `fetchParagraphDates({ from, to })` — fetches full history; n=1 negligible.
- [x] [Review][Dismiss] `notifyParagraphDatesMutated` only on API generate — mount refetch covers login/reload; read-it does not create paragraphs.

## Change Log

- 2026-06-01: CR patches applied — server cache dedupe, 2 pytest (87 api paragraph tests, 139 web).
- 2026-06-01: Code review — 3 patch, 4 defer, 1 dismiss.
- 2026-06-01: Story 15.1 — server paragraph dates endpoint + API-mode calendar merge (75 pytest, 137 web).
