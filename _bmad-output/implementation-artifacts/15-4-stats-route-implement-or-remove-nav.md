# Story 15.4: Stats Route — Implement or Remove Nav

Status: done

## Decision

**A — implement** `/stats` with honest metrics from existing hooks.

## Acceptance Criteria

1. **AC1** — `/stats` shows streak, sessions completed, words practiced, Journey link.
2. **AC2** — Data from `useJourneyStats` / `useStreak` (via `JourneyStatsRow`).
3. **AC3** — Sidebar Stats nav remains; `aria-current` works on `/stats`.
4. **AC4** — Tests: sidebar active state for `/stats`.

## Tasks

- [x] Task 1 — `StatsPageClient` + page route
- [x] Task 2 — Nav/sidebar test
- [x] Task 3 — Verify tests + typecheck

## Dev Agent Record

### File List

- `apps/web/src/features/stats/stats-page-client.tsx` — Stats page client (JourneyStatsRow + Journey link)
- `apps/web/src/app/stats/page.tsx` — route entry
- `apps/web/src/lib/navigation/sidebar-nav.test.ts` — `/stats` active-state test
- `apps/web/src/features/journey/journey-stats-row.tsx` — optional `ariaLabel` prop
- `_bmad-output/implementation-artifacts/15-4-stats-route-implement-or-remove-nav.md` — story file

## Change Log

- 2026-06-01: CR patches — heading tokens, `ariaLabel` on `JourneyStatsRow`.
- 2026-06-01: Code review — 2 patch, 2 defer, 1 dismiss.
- 2026-06-01: Implemented Decision A — `/stats` with `JourneyStatsRow` and Journey deep link

### Review Findings (2026-06-01)

- [x] [Review][Patch] Stats page heading tokens mismatch [`stats-page-client.tsx:13-16`] — aligned with feature-route `text-primary` tokens.
- [x] [Review][Patch] Wrong stats grid aria-label on `/stats` [`journey-stats-row.tsx:46`] — optional `ariaLabel` prop; Stats passes `"Practice statistics"`.
- [x] [Review][Defer] `hasParagraphForTodayOnScreen` false off Today [`use-journey-stats.ts:29`] — today’s session count may omit on-screen paragraph edge; same as Journey page; StatStreakSurface semantics pre-date 15.4.
- [x] [Review][Defer] Stats grid `max-w-3xl` vs full-width Journey [`stats-page-client.tsx:11`] — intentional focused layout possible; align with Journey width in polish if desired.
- [x] [Review][Dismiss] No `StatsPageClient` render test — thin composition; `useJourneyStats` + nav helpers covered elsewhere.
