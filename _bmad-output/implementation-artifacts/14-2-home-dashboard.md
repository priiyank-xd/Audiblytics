# Story 14.2: Home Dashboard

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want a home dashboard with greeting, start session CTA, and continue cards,
so that daily entry matches the home mockup (UX-V2-UI2).

## Acceptance Criteria

> Sourced from `epics.md` § Story 14.2, UX-V2-UI2, and `_bmad-output/design/ui-mockups-v2/` home mockup. Builds on **14.1** shell (`AppSidebar`, `StatRail`, `bg-surface-card` token).

1. **AC1 — Time-of-day greeting + display name** — Given `/`, when `HomeDashboard` renders, then greeting line uses **local time** phrase (`Good morning` / `Good afternoon` / `Good evening`) + display name from same rules as sidebar profile (`resolveSidebarProfileLabel` + `useAuth` / API mode). **No hardcoded "Neal".** Loading state: `Good morning…` or omit name until resolved.

2. **AC2 — Hero + primary CTA** — Hero shows mockup-aligned headline **"Let's build your confidence today."**, supporting copy, and primary button **"Start Today's Session"** linking to `/today` with play icon. Metadata row retains estimated **3 min** + streak encouragement (existing hooks/copy OK).

3. **AC3 — Continue cards (soft white)** — Section **"Continue where you left off"** renders **three** link cards (Review, Collection, Voice Journal) using **`bg-surface-card`** + `rounded-lg border-divider`. Live counts from existing hooks:
   - Review: queue length + caption (existing `useReviewQueue` logic)
   - Collection: word count + last word caption (`useCollection`)
   - Voice Journal: last recording label + total sessions (`useRecordings`)
   Review card shows honest **progress indicator** when `queue.length > 0` (simple bar or fraction — no fake percentages).

4. **AC4 — Home right rail widgets** — Given `/` at `xl+`, `StatRail` shows (via `AppShell`, not duplicated in center column):
   - **Calendar mini** — existing `StatRailCalendar` (unchanged behavior; links `/calendar`)
   - **Featured streak card** — forest background (`bg-primary` / `text-on-primary`), current streak from `useStreak()`, honest empty copy when 0
   - **Today's focus** — static card: title **"Clarity over speed"**, body **"Speak slow, speak clear."** (no LLM; UX-V2 stretch copy)
   - **Progress this month** — recordings count, words in collection, days practiced (`useDistinctDayOfUse` capped 30), horizontal progress bar for `dayOfUse/30`

5. **AC5 — Non-home StatRail unchanged** — Given routes other than `/` and `/today`, StatRail keeps existing `StatRailCalendar` + `StatRailCards` overview (no home-only widgets leaking).

6. **AC6 — Route alias** — Optional `GET /home` redirects to `/` (Next.js `redirect` in `app/home/page.tsx`) OR `/home` renders same `HomeDashboard` — pick redirect (simpler).

7. **AC7 — Tests** — Pure helpers in `lib/navigation/home-greeting.ts`: `resolveTimeOfDayGreeting(hour)`, `formatHomeGreeting(timePhrase, displayName, loading)`. `node:test` coverage. `pnpm --filter @audiblytics/web test` + `typecheck` green.

8. **AC8 — Scope boundary** — No hero 3D illustration asset, no new backend APIs, no Today layout (14.3). Decorative sparkline in Today's focus may be static CSS/SVG placeholder only.

## Tasks / Subtasks

- [x] **Task 1 — Greeting helpers** (AC: 1, 7)
  - [x] 1.1 Create `apps/web/src/lib/navigation/home-greeting.ts` with `resolveTimeOfDayGreeting(hour: number)` (0–23 local) and `formatHomeGreeting(...)`.
  - [x] 1.2 Add `home-greeting.test.ts` — morning (9), afternoon (14), evening (20), loading omits name.

- [x] **Task 2 — HomeDashboard v2** (AC: 2, 3)
  - [x] 2.1 Update `HomeDashboard.tsx`: wire greeting via helpers + `useAuth` / `isApiStorageBackend` / `resolveSidebarProfileLabel`.
  - [x] 2.2 Replace headline/subcopy per AC2; keep `/today` CTA pattern (`buttonVariants`).
  - [x] 2.3 Continue cards → `bg-surface-card`; extract optional `HomeContinueCard` subcomponent in same file if it reduces duplication.
  - [x] 2.4 Review card: add honest progress bar (`queue.length` vs `REVIEW_BATCH_SIZE` or collectionCount — document choice in Dev Agent Record).

- [x] **Task 3 — Home StatRail panel** (AC: 4, 5)
  - [x] 3.1 Create `StatRailHome.tsx` composing: `StatRailCalendar`, featured `StreakStatCard` (extend with `variant="featured"` forest surface), `TodaysFocusCard` (static), `MonthlyProgressCard` (recordings/words/days + bar).
  - [x] 3.2 Extend `StreakStatCard.tsx` — optional `variant: 'default' | 'featured'`; featured uses `bg-primary text-on-primary rounded-lg` per mockup.
  - [x] 3.3 Update `AppShell.tsx`: when `pathname === '/'`, render `StatRailHome`; else existing `StatRailCalendar` + `StatRailCards`. `/today` still suppresses rail.

- [x] **Task 4 — `/home` alias** (AC: 6)
  - [x] 4.1 Add `apps/web/src/app/home/page.tsx` with `redirect('/')`.

- [x] **Task 5 — Verification** (AC: 7, all)
  - [x] 5.1 `pnpm --filter @audiblytics/web test`
  - [x] 5.2 `pnpm --filter @audiblytics/web typecheck`
  - [x] 5.3 Manual: `/` greeting name matches sidebar profile; rail widgets on home only; continue cards navigate correctly.

### Review Findings (2026-05-31)

- [x] [Review][Defer] Featured streak duplicate copy when streak &gt; 0 [`StreakStatCard.tsx:34-37`] — headline and body both state day count; hide body when streak &gt; 0 in polish pass.
- [x] [Review][Defer] Greeting hour phrase fixed at mount [`HomeDashboard.tsx:99`] — `getHours()` not re-evaluated on long-lived tab; acceptable for n=1.
- [x] [Review][Dismiss] Review progress bar caps at `REVIEW_BATCH_SIZE` — matches story Dev Notes; honest batch fill not queue-total.
- [x] [Review][Dismiss] "Progress this month" uses journey `useDistinctDayOfUse` — AC4 explicit; not calendar-month scoped.

## Dev Notes

### Authority stack

1. `epics.md` § Story 14.2 + UX-V2-UI2
2. Home mockup: `_bmad-output/design/ui-mockups-v2/ChatGPT_Image_May_28__2026__02_57_40_PM-*.png`
3. `14-1-design-tokens-and-app-shell-v2.md` — shell, tokens, profile helpers
4. `architecture.md` § Implementation Patterns — semantic tokens, no toasts, named exports

### Brownfield baseline

| File | State | 14.2 delta |
|------|-------|------------|
| `HomeDashboard.tsx` | Functional hub; hardcoded "Neal"; `bg-surface` cards | Mockup copy; `bg-surface-card`; dynamic greeting |
| `AppShell.tsx` | StatRail on all routes except `/today` | Home-specific `StatRailHome` |
| `StatRailCalendar.tsx` | Month grid + week dots | Reuse as-is on home |
| `StatRailCards.tsx` | Generic overview list | Keep for non-home routes |
| `StreakStatCard.tsx` | Light card via `StatCardLight` | Add `featured` variant for home |
| `sidebar-profile.ts` | Profile label rules | Reuse in greeting — do not duplicate label logic |

### Mockup → implementation map

| Mockup element | Implementation |
|----------------|----------------|
| "Good morning, Neal" | `formatHomeGreeting(resolveTimeOfDayGreeting(localHour), profileLabel, loading)` |
| Hero headline | "Let's build your confidence today." |
| Start Today's Session | Existing Link → `/today` |
| White continue cards | `bg-surface-card rounded-lg border-divider` |
| Review progress bar | `min(queue.length, REVIEW_BATCH_SIZE) / REVIEW_BATCH_SIZE` width |
| Right calendar | `StatRailCalendar` |
| Dark streak card | `StreakStatCard variant="featured"` |
| Today's focus | Static `TodaysFocusCard` — no API |
| Progress this month | `MonthlyProgressCard` — hooks from `StatRailCards` today |
| Hero 3D illustration | **Out of scope** (AC8) |
| Bottom "Consistency…" banner | Already in `StatRailCards` quote; **do not duplicate** in main column unless removing from non-home rail |

### Greeting hour buckets (local time)

| Hour (local) | Phrase |
|--------------|--------|
| 5–11 | Good morning |
| 12–16 | Good afternoon |
| 17–23, 0–4 | Good evening |

Use `new Date().getHours()` in client component; pure `resolveTimeOfDayGreeting(hour)` for tests.

### Display name reuse

```ts
import { resolveSidebarProfileLabel } from '@/lib/navigation/sidebar-profile';

// In HomeDashboard — same inputs as AppSidebar useSidebarProfile
const displayName = resolveSidebarProfileLabel({ apiMode, userEmail: user?.email, loading: apiMode && loading });
// formatHomeGreeting: "Good morning, priyank" or "Good morning" when loading/Personal use without comma awkwardness
```

For **"Personal use"** (Dexie mode), greeting: **"Good morning."** without personal name OR **"Good morning, friend."** — use **"Good morning."** only (no fake name).

### Featured streak card (mockup)

```tsx
<StreakStatCard variant="featured" />
// featured: bg-primary text-on-primary p-5 rounded-lg; body "Start your streak today!" when streak === 0
```

### AppShell branch (exact)

```tsx
const isHome = pathname === '/';
// ...
{!isToday ? (
  <StatRail>
    {isHome ? <StatRailHome /> : (<><StatRailCalendar /><StatRailCards /></>)}
  </StatRail>
) : null}
```

### Previous story intelligence (14.1 CR deferrals)

- **Fix Neal in HomeDashboard** — explicit AC1 here.
- **`/calendar` nav gap** — home rail calendar still links `/calendar` via `StatRailCalendar`; OK until 14.8.

### Anti-patterns

- New `HomeDashboardV2.tsx` — mutate existing file
- Hardcoded user names
- Fake progress/streak numbers when hooks return 0/undefined — use `—` or honest copy
- LLM-generated "today's focus" copy
- Duplicating StatRail calendar in center column

### Testing

```ts
// home-greeting.test.ts
assert.equal(resolveTimeOfDayGreeting(9), 'Good morning');
assert.equal(formatHomeGreeting('Good morning', 'priyank', false), 'Good morning, priyank');
assert.equal(formatHomeGreeting('Good morning', '…', true), 'Good morning…');
assert.equal(formatHomeGreeting('Good morning', 'Personal use', false), 'Good morning.');
```

### References

- [Source: `epics.md` § Story 14.2]
- [Source: `_bmad-output/design/ui-mockups-v2/index.md`]
- [Source: `apps/web/src/components/audiblytics/HomeDashboard.tsx`]
- [Source: `apps/web/src/components/audiblytics/StatRailCalendar.tsx`]
- [Source: `14-1-design-tokens-and-app-shell-v2.md` § Review Findings]

## AI Engineering Record

| AI-Phase | AI-Tool | Story-Ref |
|---|---|---|
| story | cursor/composer-2.5-fast | 14-2-home-dashboard |
| code | cursor/composer-2.5-fast | 14-2-home-dashboard |
| test | cursor/composer-2.5-fast | 14-2-home-dashboard |
| review | cursor/composer-2.5-fast | 14-2-home-dashboard |
| deploy | pending | |

## Dev Agent Record

### Agent Model Used

composer-2.5-fast

### Debug Log References

### Completion Notes List

- `home-greeting.ts` + 4 tests; profile label reused from 14.1.
- `HomeDashboard`: mockup copy, `HomeContinueCard`, review bar = `min(queue, REVIEW_BATCH_SIZE)/REVIEW_BATCH_SIZE`.
- `StatRailHome` + widgets; `StreakStatCard variant="featured"`.
- `AppShell` branches on `pathname === '/'`.
- `/home` → `/` redirect.
- **95 tests** pass; typecheck green.

### File List

- `apps/web/src/lib/navigation/home-greeting.ts`
- `apps/web/src/lib/navigation/home-greeting.test.ts`
- `apps/web/src/components/audiblytics/HomeDashboard.tsx`
- `apps/web/src/components/audiblytics/StatRailHome.tsx`
- `apps/web/src/components/audiblytics/StatRailHomeWidgets.tsx`
- `apps/web/src/components/audiblytics/StreakStatCard.tsx`
- `apps/web/src/components/audiblytics/AppShell.tsx`
- `apps/web/src/app/home/page.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/14-2-home-dashboard.md`

## Change Log

- 2026-05-31: CR — approved; 2 defer, 2 dismiss; status → done.
- 2026-05-31: Home dashboard v2 — greeting, soft cards, StatRailHome, /home redirect (95 tests).
- 2026-05-31: Story created — home dashboard v2 mockup alignment (ready-for-dev).
