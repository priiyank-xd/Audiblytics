# Story 15.2: Archived Day Detail in API Mode

Status: done

## Story

As Priyank,
I want Journey (and calendar drill-down) to show paragraph excerpt and recordings for a past UTC day in API mode,
so that historical session detail matches local mode (BVR17, FR56).

## Acceptance Criteria

1. **AC1 — Paragraph by date API** — `GET /api/v1/paragraphs/by-date/{utc_date}` returns `ParagraphCacheResponse` for latest row that UTC day; 404 when none; 422 invalid date; auth required.

2. **AC2 — API archived snapshot** — `useArchivedDay` loads paragraph + `GET /recordings` filtered by UTC date + collection count in API mode.

3. **AC3 — Journey panel** — `JourneyDayDetailPanel` uses `useArchivedDay` in API mode; no "local mode only" banner.

4. **AC4 — Empty state** — No paragraph on server → quiet tertiary excerpt line (UX-DR34); no toast.

5. **AC5 — Playback** — `VoiceJournalList` + `fetchRecordingPlaybackUrl` (Epic 11).

6. **AC6 — Tests** — pytest paragraph by-date; vitest fetch/filter/enrich helpers.

## Tasks / Subtasks

- [x] **Task 1 — API `GET /paragraphs/by-date/{utc_date}`** (AC1)
- [x] **Task 2 — `fetchParagraphByUtcDate` + tests** (AC1, AC4)
- [x] **Task 3 — API `useArchivedDay` branch** (AC2, AC5)
- [x] **Task 4 — `JourneyDayDetailPanel`** (AC3)
- [x] **Task 5 — Verification** (AC6) — 14 paragraph pytest; 144 web; typecheck green

## Dev Agent Record

### Agent Model Used

composer-2.5-fast

### Completion Notes List

- `GET /api/v1/paragraphs/by-date/{utc_date}` — latest row per UTC day; 404/422/auth.
- `use-archived-day-api.ts` — paragraph + recordings filter + collection count; reload on `RECORDINGS_MUTATED_EVENT`.
- `JourneyDayDetailPanel` — removed API-mode block; `ArchivedDayPanel` in API mode.
- `enrichRecordingsForArchivedDay` — theme from day paragraph (not Dexie).

### File List

- `apps/api/app/api/v1/paragraphs.py`
- `apps/api/tests/test_paragraphs.py`
- `apps/web/src/lib/api/paragraphs.ts`
- `apps/web/src/lib/api/paragraphs-by-date.test.ts`
- `apps/web/src/lib/voice-journal/filter-recordings-for-utc-date.ts`
- `apps/web/src/lib/voice-journal/filter-recordings-for-utc-date.test.ts`
- `apps/web/src/features/voice-journal/enrich-recordings-with-theme.ts`
- `apps/web/src/features/voice-journal/enrich-recordings-for-archived-day.test.ts`
- `apps/web/src/features/calendar/use-archived-day.ts`
- `apps/web/src/features/calendar/use-archived-day-api.ts`
- `apps/web/src/features/journey/journey-day-detail-panel.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/deferred-work.md`

### Review Findings (2026-06-01)

- [x] [Review][Patch] Collection reload flickers detail panel [`use-archived-day-api.ts`] — load deps `[utcDate]` only; `savedWordsCount` patched in second effect; recording reload without skeleton.
- [x] [Review][Patch] `test_paragraph_by_date_user_isolation` added [`test_paragraphs.py`].
- [x] [Review][Defer] Full `fetchRecordings()` per day select [`use-archived-day-api.ts:44`] — client filter OK for n=1; server `?date=` later if needed.
- [x] [Review][Defer] Catch block → `EMPTY_SNAPSHOT` on any failure [`use-archived-day-api.ts:53-57`] — network error hides partial data; same silent-degrade as `useCompletions`.
- [x] [Review][Defer] No listen for `PARAGRAPH_DATES_MUTATED_EVENT` — cross-tab paragraph regen won't refresh panel until re-select; edge case.
- [x] [Review][Defer] `/calendar?day=` link 404 [`journey-day-detail-panel.tsx:92`] — no `/calendar` route in app; pre-14.8; Journey is canonical archive UI.
- [x] [Review][Dismiss] `enrichRecordingsForArchivedDay` single theme for all rows — correct when one paragraph/day; regen edge rare.

## Change Log

- 2026-06-01: CR patches — collection flicker fix, isolation pytest (15 paragraph tests, 144 web).
- 2026-06-01: Code review — 2 patch, 3 defer, 1 dismiss.
- 2026-06-01: Story 15.2 — API archived day detail for Journey (14 paragraph tests, 144 web).
