# Story 14.8: Journey Page (Calendar + Timeline)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want a Journey page combining calendar/timeline with session detail,
so that progress tracking matches the journey mockups (**UX-V2-UI8**).

## Acceptance Criteria

> Sourced from `epics.md` § Story 14.8, **UX-V2-UI8** (Journey — not UX-V2-UI7, which is Settings), and `_bmad-output/design/ui-mockups-v2/ChatGPT_Image_May_28__2026__12_35_51_PM-*.png` (calendar) + `ChatGPT_Image_May_28__2026__12_38_01_PM-*.png` (timeline). Builds on **14.1** shell, Epic 4 calendar/completion (FR55–FR58), and Story 4.5 archived-day drill-in. **Brownfield:** `/journey` is a placeholder stub; full calendar UX lives at `/calendar` today.

1. **AC1 — Replace journey stub** — Given `/journey`, when rendered, then replace placeholder copy with full Journey UI inside `FeatureRouteShell`. Header: **"Journey"** + subtitle **"Your practice over time — completion from your log only."** (honest FR58 posture). Global **`StatRail` remains visible** on `/journey` (not suppressed). Loading skeletons while calendar cells / archived snapshot are undefined (same pattern as **14.4** / **14.5**).

2. **AC2 — Top stats row** — Given Journey loads, when stats row renders, then four **soft cards** (`bg-surface-card rounded-lg border-divider`) show honest values:
   - **Current streak** — `useStreak()` (FR57; same predicate as StatRail)
   - **Sessions completed** — count of UTC dates where `evaluateCompletion` is true across all known completion sources (completions map + paragraph cache dates + today ephemeral flag via `useStatStreakSurface` — reuse shared helper, do not invent a looser rule)
   - **Longest streak** — new pure `longestStreak(anchor, isUtcDayComplete)` in `lib/day-counter/` (scan completed UTC dates; 0 when none)
   - **Words practiced** — collection entries with `reviewCount > 0` (Dexie `useCollection` / API collection hook); show `—` while loading
   No fake targets or percentages unless derived from real data.

3. **AC3 — Calendar / timeline toggle** — Given main content, when user switches segmented control **Calendar | Timeline**, then:
   - **Calendar view:** month grid via **`useMonthCalendarCells`** + existing **`CalendarDayCell`** (`labelStyle="day-only"`). Only **completed** days are selectable (same rule as `/calendar` — incomplete cells not buttons). Month navigation: prev/next month controls updating anchor month (extend `buildUtcMonthGrid` usage — do not fork completion math).
   - **Timeline view:** reverse-chronological list of **completed** sessions only (last 90 UTC days window OK). Each row: UTC date (long label), completion icon (check; offline badge when `usedOfflinePack`), optional theme/persona line from paragraph cache when available. Incomplete days **omitted** (not grey shame rows in timeline — honesty without pile-up).
   - Toggle state in URL search param `view=calendar|timeline` (default `calendar`) so deep links work; invalid `view` → `calendar`.

4. **AC4 — Day selection + detail panel** — Given a **completed** day is selected (calendar cell or timeline row), when `xl+`, then **two-column layout**: left = calendar or timeline, right = **sticky detail panel**. Below `xl`, panel stacks below. Detail panel includes:
   - **Session summary** — reuse **`useArchivedDay`** + **`ArchivedDayPanel`** content (excerpt, theme/persona, words saved count, recordings list with `hideCompare`) **or** extract shared `JourneyDayDetail` wrapper so calendar route can share later
   - **Reflection note** — per-day textarea persisted in **`audiblytics.journeyReflections`** via new Zod schema `journey-reflections.schema.ts` (`{ notesByUtcDate: Record<string, string> }`); load/save with `useLocalStorage`; key = selected `utcDate`
   - **View full archive** link → `/calendar?day={utcDate}` (Epic 4 FR56; keeps existing archive route working)
   When selection incomplete or loading: skeleton or *"No session on this day."* (italic serif per UX-DR34) — same as `calendar-page-client.tsx`
   Auto-select **most recent completed day** in current month when none selected (first visit only).

5. **AC5 — API mode honesty** — Given `isApiStorageBackend()`, when archived snapshot loads, then:
   - Completions + streak stats use API paths (`useCompletions`, etc.) — already supported
   - **`useArchivedDay` is Dexie-only today** (`deferred-work.md`) — do **not** fake paragraph/recordings. Show honest inline copy in detail panel: **"Archived session details are available in local mode only."** when API mode; stats row + timeline/calendar completion cells still work from API completions + paragraph API if dates exist in cache hook — if paragraph cache empty in API mode, excerpt/recordings sections empty with tertiary caption (no mock data)
   Do not block 14.8 on full server archived-day API (follow-up story).

6. **AC6 — Export journey (UI8)** — Mockup shows export action. Render **Export journey** button **disabled** with caption **"Not available in this build."** (no CSV/json fake download). Place top-right of header or below stats row per mockup.

7. **AC7 — `/calendar` route** — **Keep `/calendar` working** (bookmark compatibility). Optional polish: add prominent link on legacy calendar page **"Open in Journey"** → `/journey?view=calendar` — not required for AC pass. Do **not** remove `/calendar` in this story.

8. **AC8 — Regression** — Must not break: `useStreak`, `StatRailCalendar`, `DayRail`, Today streak surface (`useStatStreakSurface`), Home dashboard stats, `/calendar?day=` archived panel, completion predicates in tests (Story 4.2). Sidebar **Journey** nav → `/journey`.

9. **AC9 — Tests** — Pure helpers in `apps/web/src/lib/journey/` (or `lib/day-counter/` for streak):
   - `longestStreak` — gaps, single day, all complete window
   - `countCompletedSessions` — matches `evaluateCompletion` inputs
   - `buildTimelineEntries` — filters incomplete, sorts desc
   - `journey-reflections.schema` parse defaults
   `pnpm --filter @audiblytics/web test` + `typecheck` green.

10. **AC10 — Scope boundary** — **Out of scope:** server archived-day API; PDF/CSV export; mood emoji; Smart Reflection LLM copy; merging `/calendar` redirect-only; 90/60/30 window toggle (use month grid + 90-day timeline); new completion rules; **14.9** stretch meters. No toasts for reflection save (inline/autosave on blur OK).

## Tasks / Subtasks

- [x] **Task 1 — Journey stats domain** (AC: 2, 9)
  - [x] 1.1 `longestStreakFromCompletedDates` in `lib/day-counter/longest-streak.ts` + tests.
  - [x] 1.2 `count-completed-sessions.ts`, `completion-sources.ts`, `use-journey-stats.ts`.
  - [x] 1.3 `JourneyStatsRow.tsx`.

- [x] **Task 2 — Reflections schema** (AC: 4, 9)
  - [x] 2.1 `journey-reflections.schema.ts`.
  - [x] 2.2 `use-journey-reflection.ts`.

- [x] **Task 3 — Timeline builder** (AC: 3, 9)
  - [x] 3.1 `build-timeline-entries.ts`.
  - [x] 3.2 `JourneyTimeline.tsx`.
  - [x] 3.3 Tests in `count-completed-sessions.test.ts`.

- [x] **Task 4 — Calendar month UI** (AC: 3, 4)
  - [x] 4.1 `JourneyCalendar.tsx` — lifted `anchorMonth`; `useMonthCalendarCells(anchor)` extended.
  - [x] 4.2 `view` + `day` search params in `journey-page-client.tsx`.

- [x] **Task 5 — Detail panel** (AC: 4, 5)
  - [x] 5.1 `JourneyDayDetailPanel.tsx` — API banner, reflection, `ArchivedDayPanel`, archive link.
  - [x] 5.2 No `ArchivedDayPanel` refactor (reused as-is).

- [x] **Task 6 — Page compose** (AC: 1, 3, 6, 8)
  - [x] 6.1 `app/journey/page.tsx` + `JourneyPageClient`.
  - [x] 6.2 Toggle, xl two-column grid, auto-select latest completed in month.
  - [x] 6.3 Disabled export in header.

- [x] **Task 7 — Verification** (AC: 9, all)
  - [x] 7.1 `pnpm test` — 131 pass
  - [x] 7.2 `pnpm typecheck` — green
  - [x] 7.3 Manual smoke (author deferred; automated green).

### Review Findings (2026-05-31)

- [x] [Review][Patch] Duplicate `useMonthCalendarCells` in page + calendar [`journey-calendar.tsx`, `journey-page-client.tsx`] — single hook at page; pass slots into calendar.
- [x] [Review][Patch] Timeline selection did not move calendar month [`journey-page-client.tsx`] — `selectDay` sets `anchorMonth` from `utcDate`.
- [x] [Review][Patch] Auto-select blocked when local state set but URL had no `day` [`journey-page-client.tsx`] — gate on `selectedFromUrl !== null`.
- [x] [Review][Patch] Redundant `onBlur` on reflection textarea [`journey-day-detail-panel.tsx`] — removed.
- [x] [Review][Dismiss] `ArchivedDayPanel` top border inside card — cosmetic; acceptable.
- [x] [Review][Defer] API mode archive link → `/calendar` still Dexie-only — matches `deferred-work.md`; banner on Journey is sufficient.
- [x] [Review][Defer] Reflection writes localStorage on every keystroke — fine for n=1.

## Dev Notes

### Authority stack (read in order)

1. `epics.md` § Story 14.8 + **UX-V2-UI8**
2. Mockups: `_bmad-output/design/ui-mockups-v2/index.md` (Journey calendar + timeline PNGs)
3. `4-4-calendar-route-30-60-90-day-toggle-grid-with-honest-empty-cells.md` + `4-5-archived-day-view-drill-into-past-day-details.md`
4. `14-5-collection-master-detail.md` — master-detail + sticky panel pattern
5. `14-1-design-tokens-and-app-shell-v2.md` — Journey nav target; StatRail rules
6. `architecture.md` § Implementation Patterns — Zod, semantic tokens, inline errors, `Result<T,E>`

### Epic ID correction

| Doc | ID | Screen |
|-----|-----|--------|
| `epics.md` story 14.8 line | wrongly cites UX-V2-UI7 | Journey |
| `epics.md` UX table line ~294 | **UX-V2-UI8** | Journey page |
| UX-V2-UI7 | Settings hub | 14.7 |

### Brownfield baseline

| Asset | State | 14.8 action |
|-------|--------|-------------|
| `app/journey/page.tsx` | Placeholder stub | Full client page |
| `app/calendar/calendar-page-client.tsx` | 30/60/90 grid + `?day=` archive | **Reuse hooks/components**; keep route |
| `useMonthCalendarCells` | Month grid + FR55 completion | Journey calendar view |
| `useCalendarGrid` | Trailing window cells | Timeline source (90d) |
| `useArchivedDay` | Dexie paragraph + recordings | Detail panel; API honesty banner |
| `ArchivedDayPanel` | FR56 UI | Reuse in Journey detail |
| `useStreak` | FR57 | Stats row + unchanged elsewhere |
| `VoiceJournalNotesCard` | Global notes only | **Not** per-day; Journey gets new per-day schema |
| `longestStreak` | **Missing** | Add pure function |
| `deferred-work.md` | `useArchivedDay` API gap | AC5 banner, no fake data |

### Mockup → implementation map

| Mockup element | Implementation |
|----------------|----------------|
| Stats row (4 tiles) | `JourneyStatsRow` |
| Calendar / Timeline tabs | URL `view` + segmented control |
| Month grid | `JourneyCalendar` + `useMonthCalendarCells` |
| Timeline list | `JourneyTimeline` + `buildTimelineEntries` |
| Session detail card | `JourneyDayDetailPanel` + `ArchivedDayPanel` |
| Reflection textarea | `journey-reflections.schema` + `useLocalStorage` |
| Export journey | Disabled button (AC6) |

### Completion predicate (do not fork)

Reuse **`evaluateCompletion`** / **`isUtcDayCompleteFromInputs`** with the same `hasParagraphForDate` sources as `useCalendarGrid`:

```typescript
paragraphDates.has(utcDate) ||
completions[utcDate]?.usedOfflinePack === true ||
(utcDate === todayUtc && hasParagraphForTodayOnScreen)
```

### `longestStreak` algorithm sketch

Collect all UTC dates where `isUtcDayComplete(d) === true` (from daysOfUse ∪ paragraph cache ∪ completions keys), sort ascending, scan runs of consecutive calendar days (`addUtcCalendarDays`), return max run length. Empty → 0.

### `sessions completed` definition

Count distinct UTC dates in the union of dates checked above where `evaluateCompletion` is true (not merely `daysOfUse` without engagement — align with FR58).

### `words practiced`

`collection.filter(w => w.reviewCount > 0).length` — document in Dev Agent Record if product prefers sum of `reviewCount` instead (default: distinct words ever reviewed).

### Suggested file layout

```
apps/web/src/
  app/journey/page.tsx              # client page or shell
  features/journey/
    journey-page-client.tsx
    journey-stats-row.tsx
    journey-calendar.tsx
    journey-timeline.tsx
    journey-day-detail-panel.tsx
    use-journey-stats.ts
  lib/journey/
    build-timeline-entries.ts
    count-completed-sessions.ts
  lib/schemas/journey-reflections.schema.ts
  lib/day-counter/index.ts          # + longestStreak
```

### Previous story intelligence (14.7)

- Card-row chrome pattern from `SettingsCardRow` — optional reuse for stats tiles
- Master-detail sticky panel from Collection **14.5**
- Do not suppress StatRail on feature routes except `/today` and `/review`

## References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 14.8]
- [Source: `_bmad-output/design/ui-mockups-v2/index.md`]
- [Source: `apps/web/src/app/calendar/calendar-page-client.tsx`]
- [Source: `apps/web/src/features/calendar/use-month-calendar-cells.ts`]
- [Source: `apps/web/src/features/calendar/use-archived-day.ts`]
- [Source: `apps/web/src/features/calendar/use-streak.ts`]
- [Source: `_bmad-output/implementation-artifacts/deferred-work.md`]
