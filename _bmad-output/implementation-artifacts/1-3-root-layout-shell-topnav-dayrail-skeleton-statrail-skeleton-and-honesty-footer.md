# Story 1.3: Root Layout Shell, TopNav, DayRail Skeleton, StatRail Skeleton, and Honesty Footer

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want the three-column editorial layout shell (sticky 80px DayRail + 1fr center column + sticky 288px StatRail + top-right TopNav + mono honesty footer) wired into `src/app/layout.tsx` and rendering on every route,
so that the visual scaffolding is in place before any feature content lands, the dev gallery surface (`/_dev/components`) can validate components in isolation, and stories 1.4+ can drop new content into the center column without touching shell concerns.

## Acceptance Criteria

> Sourced verbatim from `epics.md § Story 1.3` (lines 468–498). Re-formatted as numbered AC for traceability against tasks.

1. **AC1 — Layout uses three-column grid at `≥lg`:** `src/app/layout.tsx` (or a child shell component it renders) applies Tailwind `grid` with `lg:grid-cols-[80px_1fr_288px]` at the `≥lg` (1024px) breakpoint and collapses to a single column below `lg` (per UX-DR6, UX-DR7, UX spec lines 706–737, 2045–2061). Page horizontal padding is `lg:px-12` / `md:px-6` / `px-4` (per UX spec lines 703–704). Reading column uses `max-w-[640px] mx-auto` inside the center column (per UX spec line 734).

2. **AC2 — `app/layout.tsx` stays a server component AND continues to host fonts + globals.css:** `src/app/layout.tsx` MUST NOT add `'use client'` (architecture lines 425–428). It continues to host the three `next/font` loaders from Story 1.2, imports `globals.css`, and defines `<html lang="en">` + `<body>`. Any interactive shell behavior (e.g. active-route detection, sticky scroll math if ever needed) lives in client child components, not in `layout.tsx` itself.

3. **AC3 — Route `page.tsx` files mark themselves `'use client'`:** All NEW route page files this story creates (`/_dev/components/page.tsx`) MUST start with `'use client';` (per AR18 / architecture lines 425–426). The pre-existing `src/app/page.tsx` (create-next-app default landing) is left untouched by this story — it gets replaced wholesale by Story 1.10 (Today route).

4. **AC4 — `<TopNav>` renders at top-right on every route:** `src/components/audiblytics/TopNav.tsx` is a named-export client component rendering a `<nav aria-label="Main navigation">` with four text links: `Today` (`/`), `Collection` (`/collection`), `Review` (`/review`), `Settings` (`/settings`) — in that order (per UX-DR19, UX-DR32, UX spec lines 1453–1476). Active link receives `aria-current="page"`, a 2px forest underline (`border-b-2 border-primary`), and a slightly bolder weight (`font-medium`). Hover state shifts the link color to `text-primary`. NEVER collapses to a hamburger at any viewport ≥320px (per UX-DR32 + UX spec line 2006). On `<lg` viewports the links wrap to 2 lines (text only, still no hamburger). The component is mounted by the layout shell so it appears on every route.

5. **AC5 — `<DayRail>` skeleton renders 30 numbered cells in `future` state:** `src/components/audiblytics/DayRail.tsx` is a named-export client component rendering a `<nav aria-label="30-day progress">` with 30 cells, each labeled `Day 1` … `Day 30`. **All 30 cells render in the `future` state for this story** (faint `--ink-faint` micro-dot + `text-ink-faint` label, non-interactive — per UX-DR9 + UX spec lines 1183–1220). The `completed`/`completed-offline`/`missed`/`today` states are NOT rendered yet (no day-counter wiring yet — that lands in Story 3.2 + Story 4.3). At `≥lg` the rail is sticky vertical (`lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:w-20`); below `lg` it collapses to a horizontal-scroll strip pinned to the top of the page (`flex overflow-x-auto`) per UX-DR7 + UX spec lines 2051, 2066. Each cell carries screen-reader text `"Day N, upcoming"` (per UX spec line 1218 future-cell phrasing).

6. **AC6 — Right-rail StatRail skeleton placeholder region exists:** `src/components/audiblytics/StatRail.tsx` is a named-export client component that mounts the right-rail container — at `≥lg` it is `lg:sticky lg:top-0 lg:w-72 lg:h-screen lg:overflow-y-auto`, below `lg` it stacks below the center column (`flex flex-col gap-3` mobile / `md:grid md:grid-cols-2 md:gap-3` per UX spec line 2057). For this story it accepts `children` and renders **a single placeholder card** (a `bg-surface-elevated border border-divider p-4 text-ui-sm text-text-tertiary` block with copy `"Stats appear here"`) so the right column visually occupies its allotted width and the layout is verifiable at `/_dev/components`. The actual stat-card stack (StatCardDark + 3× StatCardLight + ProviderChip per UX spec lines 717–725) lands when `StatCardDark` / `StatCardLight` are built in Stories 4.3, 2.2, etc. **This story does NOT create `StatCardDark` or `StatCardLight`** — only the rail container.

7. **AC7 — `<HonestyFooter>` renders at bottom of every route:** `src/components/audiblytics/HonestyFooter.tsx` is a named-export client component rendering `<footer role="contentinfo">` with mono `text-ink-faint` copy `~5 min daily · $0 today · ProviderChip · v0.1.0`, top border (`border-t border-divider`), per UX-DR18 + UX spec lines 1434–1450 + epics line 487. **For this story, `ProviderChip` is rendered inline as plain text `gemini-2.5-flash · free`** (the actual `ProviderChip` component is built later when Settings provider state exists). The version string `v0.1.0` is hardcoded for now (read from `package.json#version` is acceptable but not required). Below `lg` the footer wraps to 2–3 lines (per UX spec line 2058) — all four cells (`~5 min daily`, `$0 today`, provider, version) are space-separated by `·` on `≥lg`.

8. **AC8 — No horizontal scroll at any width ≥320px:** When the page renders at viewports 320 / 375 / 768 / 1024 / 1280 / 1536 px wide (DevTools device emulation), no horizontal scrollbar appears on `<html>` or `<body>`. Verified specifically that the DayRail's `<lg` horizontal-scroll behavior is contained (the rail itself scrolls horizontally, but the page does not). Per UX-DR7 + UX spec lines 2065 (rule 1).

9. **AC9 — `/_dev/components` route renders when `NEXT_PUBLIC_DEV_GALLERY=true`:** `src/app/_dev/components/page.tsx` exists as a `'use client'` route page (per UX-DR42 + AR19 + epics line 497–498). When `process.env.NEXT_PUBLIC_DEV_GALLERY === 'true'` at build/dev time, navigating to `http://localhost:3000/_dev/components` renders a gallery page that mounts each new shell component in isolation: `<TopNav>`, `<DayRail>`, `<StatRail>`, `<HonestyFooter>` — each with a section heading (`text-headline-2`) and a brief caption (`text-caption text-text-tertiary`) so Priyank can visually verify them side-by-side against the spec. When the env is unset or `'false'`, the route's default export returns `notFound()` (Next.js's dynamic 404) so the page is unreachable in production builds without the flag. Note: `next/dynamic` excludes pages it can't tree-shake; using `notFound()` is the simplest unbypassable gate that keeps the route file in the repo for dev convenience.

10. **AC10 — Layout composes shell + page slot correctly:** `src/app/layout.tsx` (or a thin shell component it renders) places `<TopNav>` in the top row, then a content row that on `≥lg` is the three-column grid `[80px_1fr_288px]` with `<DayRail>` in column 1, `{children}` (centered, max-w 640px) in column 2, `<StatRail>` in column 3 — and at `<lg` stacks `<DayRail>` (horizontal strip) on top, then `{children}`, then `<StatRail>`. `<HonestyFooter>` is the final row, full-width across all columns. Page-level vertical rhythm matches UX spec lines 701–702 (`mb-16` / `mb-24` between sections).

11. **AC11 — All shell components use semantic tokens only:** No hex literals, no arbitrary Tailwind values (`bg-[#xxx]`, `p-[17px]`), no inline `style={{}}` for color/typography (positioning OK if dynamic — none expected this story) appear in `TopNav`, `DayRail`, `StatRail`, `HonestyFooter`, or the layout edits (per architecture lines 814–828). Verified by `rg "bg-\[#|text-\[#|border-\[#|style={{" src/components/audiblytics/ src/app/layout.tsx src/app/_dev/` returning zero matches for color/typography uses. Tokens used: `bg-surface`, `bg-surface-elevated`, `text-text-primary`, `text-text-secondary`, `text-text-tertiary`, `border-divider`, `border-primary`, `text-primary`, plus the named type classes `text-ui`, `text-ui-sm`, `text-rail`, `text-micro-label`, `text-headline-2`, `text-caption` from Story 1.2.

12. **AC12 — `pnpm dev` and `pnpm build` succeed; layout renders cleanly on `/`:** With all edits applied, `pnpm dev` boots cleanly, `http://localhost:3000` renders the create-next-app default landing wrapped in the new shell (TopNav top-right, DayRail left strip/rail, StatRail placeholder right, HonestyFooter bottom). Browser console is free of errors and React hydration warnings. `pnpm build` exits 0 with zero new warnings. `/_dev/components` (with `NEXT_PUBLIC_DEV_GALLERY=true`) renders all four shell components in their isolation gallery.

### BDD format (verbatim mirror of `epics.md § Story 1.3` lines 474–498)

**Given** `app/layout.tsx` is opened
**When** the file is read
**Then** the layout uses `grid-cols-[80px_1fr_288px]` at `≥lg` (1024px) breakpoint and collapses to single column below (per UX-DR6, UX-DR7)
**And** the layout is a server component that hosts `next/font` and imports `globals.css`
**And** route `page.tsx` files mark themselves `'use client'` per AR18

**Given** the user navigates to any route
**When** the page renders at ≥1024px viewport
**Then** `<TopNav>` (text-link Today/Collection/Review/Settings, top-right, no hamburger ever — per UX-DR19, UX-DR32) is visible
**And** `<DayRail>` skeleton shows 30 numbered cells in a vertical sticky strip (cells render in `future` state for now per UX-DR9)
**And** the right rail shows a placeholder stat-card stack region
**And** `<HonestyFooter>` (mono ink-faint footer with `~5 min daily · $0 today · ProviderChip · v0.1.0`, per UX-DR18) is visible at bottom

**Given** the viewport is <1024px
**When** the page renders
**Then** the day-rail collapses to a horizontal-scroll strip pinned to top
**And** the right rail stacks below center content
**And** no horizontal scroll appears at any width ≥320px (per UX-DR7)

**Given** `NEXT_PUBLIC_DEV_GALLERY=true` is set
**When** the developer navigates to `/_dev/components`
**Then** the dev gallery route renders (per UX-DR42, AR19)
**And** when the env is unset or false, the route is excluded from production builds

## Tasks / Subtasks

- [ ] **Task 1 — Build `<TopNav>` client component** (AC: 4, 11)
  - [ ] 1.1 Create `src/components/audiblytics/TopNav.tsx`. Start with `'use client';` (architecture line 426 — TopNav reads `usePathname` for active-link detection, so it must be client). Use named export per architecture lines 680, 924–928.
  - [ ] 1.2 Implement using `next/link` for navigation (App Router idiom; preserves SPA-style transitions and Turbopack prefetch). Active detection via `usePathname()` from `next/navigation`. The four links are pinned in this exact order: `Today` → `/`, `Collection` → `/collection`, `Review` → `/review`, `Settings` → `/settings` (per UX spec lines 1455–1463 + UX-DR19).
  - [ ] 1.3 Sketch:
    ```tsx
    'use client';

    import Link from 'next/link';
    import { usePathname } from 'next/navigation';
    import { cn } from '@/lib/utils';

    type NavItem = { href: string; label: string };

    const NAV_ITEMS: NavItem[] = [
      { href: '/',           label: 'Today' },
      { href: '/collection', label: 'Collection' },
      { href: '/review',     label: 'Review' },
      { href: '/settings',   label: 'Settings' },
    ];

    export function TopNav() {
      const pathname = usePathname();
      return (
        <nav
          aria-label="Main navigation"
          className="flex flex-wrap justify-end gap-x-6 gap-y-2 px-4 py-4 lg:px-12"
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'text-ui text-text-primary hover:text-primary',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
                  isActive && 'border-b-2 border-primary font-medium pb-px',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      );
    }
    ```
    Notes: `flex-wrap justify-end` keeps links right-aligned and wraps on `<sm` (per UX spec line 2050); `gap-x-6` = 24px between links matches UX spec horizontal rhythm; `pb-px` keeps the underline visually flush so the wrapping doesn't shift baseline.
  - [ ] 1.4 Active-detection edge case: `pathname.startsWith('/')` would always be true. Treat `/` (Today) specially with strict equality. For `/collection`, `/review`, `/settings`, `startsWith` is fine — there are no nested routes under them yet (Story 4.5 will add `/calendar` with `?day=N` query, not `/calendar/...`).
  - [ ] 1.5 NEVER add a hamburger menu, mobile drawer, or `<Sheet>` even on narrow viewports (per UX-DR32 + epics line 484). The links wrap; that is the entire mobile strategy.

- [ ] **Task 2 — Build `<DayRail>` skeleton** (AC: 5, 8, 11)
  - [ ] 2.1 Create `src/components/audiblytics/DayRail.tsx`. `'use client';` directive at top (it doesn't currently need client APIs, but it will once day-counter wiring lands in Story 3.2 / 4.3 — marking it client now avoids re-marking later, and Next.js handles client-component overhead trivially for this size).
  - [ ] 2.2 Render 30 cells via `Array.from({ length: 30 }, (_, i) => i + 1).map(...)`. For this story every cell is in the `future` state — non-interactive, faint dot + faint label. Type the future state explicitly so Story 4.3 can replace it with real state derivation:
    ```tsx
    'use client';

    type DayCellState = 'future' | 'completed' | 'completed-offline' | 'missed' | 'today';

    type DayCellProps = {
      day: number;
      state: DayCellState;
    };

    function DayCell({ day, state }: DayCellProps) {
      const screenReaderText: Record<DayCellState, string> = {
        future:             `Day ${day}, upcoming`,
        completed:          `Day ${day}, completed`,
        'completed-offline':`Day ${day}, completed via offline pack`,
        missed:             `Day ${day}, missed`,
        today:              `Day ${day}, today`,
      };

      const dotClass = {
        future:             'bg-text-tertiary/60',
        completed:          'bg-primary',
        'completed-offline':'bg-primary',
        missed:             'border border-divider bg-transparent',
        today:              'bg-primary ring-2 ring-primary-soft',
      }[state];

      return (
        <div
          className={cn(
            'flex items-center gap-2 px-2 py-1',
            'lg:flex-row lg:justify-between lg:py-1.5',
            'shrink-0 min-w-[44px] lg:min-w-0',
          )}
          role="presentation"
        >
          <span
            className={cn(
              'text-rail',
              state === 'future' || state === 'missed' ? 'text-text-tertiary' : 'text-text-primary',
            )}
          >
            Day {day}
          </span>
          <span className={cn('h-1.5 w-1.5 rounded-sm shrink-0', dotClass)} aria-hidden="true" />
          <span className="sr-only">{screenReaderText[state]}</span>
        </div>
      );
    }

    export function DayRail() {
      const days = Array.from({ length: 30 }, (_, i) => i + 1);
      return (
        <nav
          aria-label="30-day progress"
          className={cn(
            'border-b border-divider bg-surface',
            'flex flex-row gap-1 overflow-x-auto px-4 py-2',
            'lg:sticky lg:top-0 lg:h-screen lg:w-20 lg:flex-col lg:gap-0 lg:overflow-y-auto lg:overflow-x-visible',
            'lg:border-b-0 lg:border-r lg:px-2 lg:py-4',
          )}
        >
          {days.map((day) => (
            <DayCell key={day} day={day} state="future" />
          ))}
        </nav>
      );
    }
    ```
    Notes:
    - `text-rail` (mono 0.75rem) is the named class from Story 1.2 Task 4 — use it; do NOT inline `font-mono text-xs`.
    - `bg-text-tertiary/60` for the future-state dot uses Tailwind v4 alpha-channel syntax (`/60` = 60% opacity). Acceptable per architecture line 826 because it modulates an existing semantic token (not introducing a new color).
    - Dots are square (`rounded-sm`) not circular (`rounded-full`) per UX spec line 399 (no rounded-full anywhere) — even though "dot" reads round, the spec mandates the square primitive across the whole UI.
    - The mobile horizontal-scroll mode requires `min-w-[44px]` per cell so each cell hits the 44×44 touch-target floor (UX spec line 2074). At `≥lg`, the cell's height-padding satisfies the same floor.
    - `lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto` — the rail occupies its own scroll context at desktop so all 30 cells are reachable even when the rest of the page scrolls (UX spec line 1220).
  - [ ] 2.3 The horizontal-scroll mobile mode contains its own scroll. Verify the page does not get a horizontal scrollbar — `<nav>` itself has `overflow-x-auto`, but its parent wrapper in the layout MUST have `overflow-x-hidden` or be flex-confined. See Task 4.
  - [ ] 2.4 Auto-scroll-into-view of "today's cell" is required on mobile per UX spec line 2066. **Defer to Story 4.3** when day-counter wiring lands — there's no concept of "today" at the data layer until then. Document this defer in the dev-notes section of the file.

- [ ] **Task 3 — Build `<StatRail>` placeholder container** (AC: 6, 11)
  - [ ] 3.1 Create `src/components/audiblytics/StatRail.tsx`. Named export. `'use client';` directive (consistent with the rest of the audiblytics composites — architecture line 427).
  - [ ] 3.2 Define props: `type StatRailProps = { children?: React.ReactNode }`. The container is generic; routes pass their own card stack into it (today's route eventually passes `StatCardDark` + 3× `StatCardLight` + `ProviderChip`).
  - [ ] 3.3 For this story, when `children` is undefined OR when rendering on `/` with no concrete stat data wired, render a single placeholder card so the column visually fills:
    ```tsx
    'use client';

    import { cn } from '@/lib/utils';

    export type StatRailProps = {
      children?: React.ReactNode;
    };

    function PlaceholderCard() {
      return (
        <aside
          aria-label="Stat rail placeholder"
          className="rounded-sm border border-divider bg-surface-elevated p-4"
        >
          <span className="text-micro-label text-text-tertiary">Stats</span>
          <p className="mt-2 text-ui-sm text-text-secondary">Stats appear here</p>
        </aside>
      );
    }

    export function StatRail({ children }: StatRailProps) {
      return (
        <div
          className={cn(
            'flex flex-col gap-3 px-4 py-4 lg:px-0',
            'md:grid md:grid-cols-2 md:gap-3 lg:flex lg:flex-col',
            'lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:overflow-y-auto lg:py-6 lg:pl-6 lg:pr-4',
          )}
        >
          {children ?? <PlaceholderCard />}
        </div>
      );
    }
    ```
    Notes:
    - Mobile: vertical stack. Tablet (`md`): 2-column grid (per UX spec line 2057 mobile/tablet rule). Desktop (`lg`): vertical flex stack again because the rail is now a narrow 288px column.
    - `text-micro-label` (Story 1.2 — uppercase 0.75rem with `letter-spacing: 0.08em`) is the canonical label style for stat-cards per UX spec lines 1396, 1417.
  - [ ] 3.4 **Do NOT** create `StatCardDark` or `StatCardLight` files in this story — they're explicitly deferred to Stories 4.3 (StatCardDark + Day-counter card), 2.2 (Streak / Words Saved cards), 3.4 (Recordings card). The placeholder card is throwaway — it gets removed when the first real card lands.

- [ ] **Task 4 — Build `<HonestyFooter>` with inline ProviderChip placeholder** (AC: 7, 11)
  - [ ] 4.1 Create `src/components/audiblytics/HonestyFooter.tsx`. Named export. `'use client';` directive — `ProviderChip` (when fully wired in Settings stories) reads `useSettings()`; declaring client now keeps the swap mechanical.
  - [ ] 4.2 Render a `<footer role="contentinfo">` with mono `text-rail` (Story 1.2 named class) copy, `text-text-tertiary` color, top border `border-t border-divider`, and four `·`-separated cells.
    ```tsx
    'use client';

    import { cn } from '@/lib/utils';

    const APP_VERSION = 'v0.1.0';

    export function HonestyFooter() {
      return (
        <footer
          role="contentinfo"
          className={cn(
            'border-t border-divider bg-surface px-4 py-4 lg:px-12',
            'flex flex-wrap items-center justify-center gap-x-3 gap-y-1',
            'text-rail text-text-tertiary',
          )}
        >
          <span>~5 min daily</span>
          <span aria-hidden="true">·</span>
          <span>$0 today</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-sm bg-primary" aria-hidden="true" />
            gemini-2.5-flash · free
          </span>
          <span aria-hidden="true">·</span>
          <span>{APP_VERSION}</span>
        </footer>
      );
    }
    ```
    Notes:
    - The forest dot before `gemini-2.5-flash · free` simulates `ProviderChip` per UX spec lines 1416–1421. When the real `ProviderChip` lands in a later story (likely 1.8 onboarding or 1.10 today), replace the inline span with `<ProviderChip />` and delete the simulated dot.
    - Hardcoded `gemini-2.5-flash · free` is acceptable for this story (Settings persistence isn't wired until Story 1.4 + 1.9). Annotate the literal with a `// PLACEHOLDER: replace with <ProviderChip /> when Settings persistence lands` comment so the swap is greppable.
    - `flex-wrap` + `gap-y-1` handles the mobile 2–3 line wrap per UX spec line 2058.
  - [ ] 4.3 The version `v0.1.0` is the MVP semver per the spec (epics line 487). Do NOT read from `package.json#version` dynamically this story — `package.json` is currently `0.1.0` from `create-next-app` and exposing it would couple `next.config.ts` build-time injection into a story whose only output is presentational. A later story can add a `NEXT_PUBLIC_APP_VERSION` env injection if version drift becomes a concern.

- [ ] **Task 5 — Wire shell into `app/layout.tsx`** (AC: 1, 2, 3, 8, 10, 12)
  - [ ] 5.1 Open `src/app/layout.tsx`. **Confirm it is still a server component** (no `'use client'` — architecture lines 425–428). The file currently (post Story 1.2) contains the three `next/font` loaders, the `<html>` root, the `<body>` with the three font CSS variables, and `import './globals.css'`. **Preserve all of that.** Do NOT add a `'use client'` directive — if you find yourself wanting one, you've put logic in the wrong file.
  - [ ] 5.2 Compose the shell inside `<body>`:
    ```tsx
    // src/app/layout.tsx
    import './globals.css';
    import { EB_Garamond, Inter, JetBrains_Mono } from 'next/font/google';
    import { TopNav } from '@/components/audiblytics/TopNav';
    import { DayRail } from '@/components/audiblytics/DayRail';
    import { StatRail } from '@/components/audiblytics/StatRail';
    import { HonestyFooter } from '@/components/audiblytics/HonestyFooter';
    import type { ReactNode } from 'react';

    // ... existing next/font loader calls from Story 1.2 ...

    export const metadata = {
      title: 'Audiblytics',
      description: 'A 30-day editorial reading + voice-journal ritual.',
    };

    export default function RootLayout({ children }: { children: ReactNode }) {
      return (
        <html lang="en" className={`${fontSerif.variable} ${fontSans.variable} ${fontMono.variable}`}>
          <body className="min-h-screen bg-surface text-text-primary flex flex-col overflow-x-hidden">
            <TopNav />
            <div className="flex-1 lg:grid lg:grid-cols-[80px_1fr_288px]">
              <DayRail />
              <main className="min-w-0 px-4 py-6 md:px-6 lg:px-12">
                <div className="mx-auto w-full max-w-[640px]">{children}</div>
              </main>
              <StatRail />
            </div>
            <HonestyFooter />
          </body>
        </html>
      );
    }
    ```
    Notes:
    - `min-h-screen flex flex-col` ensures `<HonestyFooter>` sticks to the bottom of the viewport even when the page content is short (per UX spec line 1440 "persistent bottom-of-page status row").
    - `overflow-x-hidden` on `<body>` is the page-level guard against horizontal scroll on mobile when the DayRail's internal `overflow-x-auto` could otherwise bleed (AC8).
    - `min-w-0` on `<main>` is critical: without it, long words inside paragraphs in a CSS Grid cell can force the column wider than its track. Defensive default — apply it now while the layout shell is being authored.
    - `mx-auto w-full max-w-[640px]` inside `<main>` enforces the reading-column rule (UX spec line 734) globally. Routes that need wider center content (Calendar grid, Day14 takeover) will override at their own page level — but the default is 640px.
    - Order in the DOM: `<TopNav>`, the three-column row (`<DayRail>` first, `<main>` second, `<StatRail>` third), `<HonestyFooter>`. Tab order follows DOM order per UX spec line 2193.
  - [ ] 5.3 Verify route `page.tsx` files mark themselves `'use client'`. The pre-existing `src/app/page.tsx` (create-next-app default) is left UNTOUCHED in this story. Story 1.10 replaces it with the Today route as a `'use client'` component. The only NEW route page this story creates is `src/app/_dev/components/page.tsx` — that one MUST start with `'use client';` (Task 6.2).
  - [ ] 5.4 **DO NOT** add a `<Day14Gate>` mount at this layout. That's Story 7.2 (`Day-14 Gate at Layout Level`). Story 1.3 builds the visual shell; Story 7.2 wraps `{children}` with `<Day14Gate>` (architecture lines 460–470).
  - [ ] 5.5 **DO NOT** call `useDistinctDayOfUse()` or any day-counter hook from `app/layout.tsx`. The layout stays server-only; any reactive shell concerns live in client child components.

- [ ] **Task 6 — Create `/_dev/components` route page** (AC: 9)
  - [ ] 6.1 Create `src/app/_dev/components/page.tsx`. **First line:** `'use client';` (per AR18 / architecture lines 425–426 / AC3).
  - [ ] 6.2 Implementation:
    ```tsx
    'use client';

    import { notFound } from 'next/navigation';
    import { TopNav } from '@/components/audiblytics/TopNav';
    import { DayRail } from '@/components/audiblytics/DayRail';
    import { StatRail } from '@/components/audiblytics/StatRail';
    import { HonestyFooter } from '@/components/audiblytics/HonestyFooter';

    export default function DevComponentsPage() {
      if (process.env.NEXT_PUBLIC_DEV_GALLERY !== 'true') {
        notFound();
      }

      return (
        <article className="space-y-12">
          <header className="space-y-2">
            <h1 className="text-headline-2">Dev Component Gallery</h1>
            <p className="text-caption text-text-tertiary">
              Visual QA surface for shell components. Gated by NEXT_PUBLIC_DEV_GALLERY=true.
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-headline-3">TopNav</h2>
            <p className="text-caption text-text-tertiary">
              Top-right text-link nav. Active link gets forest underline + bolder weight.
            </p>
            <div className="rounded-sm border border-divider">
              <TopNav />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-headline-3">DayRail</h2>
            <p className="text-caption text-text-tertiary">
              30 cells, all in the &quot;future&quot; state for this story.
            </p>
            <div className="rounded-sm border border-divider">
              <DayRail />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-headline-3">StatRail (placeholder)</h2>
            <p className="text-caption text-text-tertiary">
              Right-rail container. Real stat cards land in stories 4.3 / 2.2 / 3.4.
            </p>
            <div className="rounded-sm border border-divider">
              <StatRail />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-headline-3">HonestyFooter</h2>
            <p className="text-caption text-text-tertiary">
              Mono ink-faint footer. ProviderChip is inlined for now.
            </p>
            <div className="rounded-sm border border-divider">
              <HonestyFooter />
            </div>
          </section>
        </article>
      );
    }
    ```
    Notes:
    - `notFound()` is the simplest unbypassable gate. Calling it inside the component (not at module top) is the App Router idiom — the function throws a `NEXT_NOT_FOUND` error caught by Next.js and rendered as a 404.
    - Putting the env-gate inside the component body (not at module load) means hot-reload of an env change requires a dev-server restart — acceptable for a dev-only surface. Alternative: a build-time conditional via `next.config.ts`'s `pageExtensions` filter — overkill for this story.
    - Each section wraps the component in `rounded-sm border border-divider` so the gallery has visible boundaries between components without using shadow tokens (UX spec line 398 bans shadows).
  - [ ] 6.3 Set `NEXT_PUBLIC_DEV_GALLERY=true` for verification: either export it inline (`NEXT_PUBLIC_DEV_GALLERY=true pnpm dev`) or add a `.env.development.local` (gitignored — confirm `.env*.local` in `.gitignore` first, which Story 1.1 Task 11.2 ensures). **DO NOT** commit `.env.development.local`. **DO NOT** add a default `NEXT_PUBLIC_DEV_GALLERY=true` to `.env.example` — the gallery being unreachable by default is the whole point of the gate.
  - [ ] 6.4 Note on production builds: `notFound()` does not "exclude" the route from the production bundle the way `pageExtensions` filtering would — the `_dev/components/page.tsx` file IS bundled, but it returns 404 unless the env flag is set at runtime. This satisfies AC9's "excluded from production builds" intent (the route is unreachable in production without the flag). If a stricter exclusion is wanted later, the post-MVP path is `next.config.ts` with `pageExtensions` filtering on `process.env.NODE_ENV === 'production'`.

- [ ] **Task 7 — Visual verification at all viewports** (AC: 1, 8, 12)
  - [ ] 7.1 Run `pnpm dev`. Open `http://localhost:3000`.
  - [ ] 7.2 At default desktop width (≥1280px), verify:
    - TopNav links are top-right, no underline on default routes (the `/` route — Today — is the active path, so `Today` shows the forest underline + medium weight).
    - DayRail occupies 80px on the left, sticky, vertical, with 30 cells labeled `Day 1` through `Day 30` in faint ink-faint with square forest-tertiary dots.
    - Center column shows the create-next-app default landing centered at max 640px.
    - Right rail occupies 288px with the placeholder card visible.
    - HonestyFooter spans full width at the bottom with the four cells separated by `·`.
    - Total page renders with cream background, no horizontal scroll.
  - [ ] 7.3 At 1024px (`lg` breakpoint floor), confirm the three-column layout still applies and remains usable (no clipping, no overlap).
  - [ ] 7.4 At 1023px (just below `lg`), confirm:
    - DayRail collapses to a horizontal-scroll strip pinned at the top below TopNav.
    - StatRail stacks below `<main>` (and its placeholder card renders centered/full-width).
    - No horizontal scrollbar appears on `<html>`/`<body>`.
  - [ ] 7.5 At 768px (`md`), verify the StatRail switches to a 2-column grid (visible only when ≥1 child card exists; with just the placeholder, the grid is half-filled — acceptable).
  - [ ] 7.6 At 375px (iPhone SE) and 320px (theoretical floor), verify still no horizontal scroll. The TopNav links wrap. The DayRail strip scrolls horizontally inside its own scroll context. The HonestyFooter wraps.
  - [ ] 7.7 Tab through the page: TopNav links → DayRail (no tab stop — cells are non-interactive in `future` state) → main → footer. Each interactive element shows a forest 2px focus ring (the ring style established in Story 1.2 AC10).
  - [ ] 7.8 Browser console must be free of errors. Specifically watch for:
    - React hydration warnings (`Warning: Text content did not match`) — usually caused by reading `pathname` server-side in a client component before mount; if seen, wrap the active-link logic in a `useEffect` + state pattern OR use `useSyncExternalStore`. Should NOT happen with `usePathname()` from `next/navigation` (it's hydration-safe).
    - Tailwind unknown-class warnings — would indicate a token from Story 1.2 is missing or misnamed.

- [ ] **Task 8 — Dev-gallery verification** (AC: 9)
  - [ ] 8.1 Stop the dev server. Restart with the env flag: `NEXT_PUBLIC_DEV_GALLERY=true pnpm dev` (or via `.env.development.local`).
  - [ ] 8.2 Navigate to `http://localhost:3000/_dev/components`. The gallery page renders with TopNav, DayRail, StatRail, HonestyFooter each in their own section. Each component is wrapped in a thin divider border so isolated visual review is possible.
  - [ ] 8.3 Restart `pnpm dev` WITHOUT the env flag. Navigate to `/_dev/components`. The Next.js 404 page renders (`This page could not be found.`). This satisfies AC9's exclusion-from-production intent (route is unreachable without the flag).
  - [ ] 8.4 Compare the gallery rendering side-by-side with the prototype `_bmad-output/planning-artifacts/ux-design-directions.html` (Direction A panel, top-left of the showcase). The `lg` 3-column layout shape, TopNav placement, DayRail vertical strip, and HonestyFooter mono text should visually match.

- [ ] **Task 9 — Build + token-discipline audit** (AC: 11, 12)
  - [ ] 9.1 Run `pnpm build`. Expect exit 0 and zero new warnings beyond what Story 1.1 + 1.2 already produced. Bundle-size delta should be small (~10-20KB for `next/link` + the four shell components).
  - [ ] 9.2 Grep audit: `rg "bg-\[#|text-\[#|border-\[#" src/components/audiblytics/ src/app/layout.tsx src/app/_dev/` — must return zero matches. (Story 1.2 Task 7.1 already ran a similar audit; this story's edits expand the audit's scope.)
  - [ ] 9.3 Grep audit: `rg "rounded-full" src/components/audiblytics/ src/app/layout.tsx src/app/_dev/` — must return zero matches (UX spec line 399 ban).
  - [ ] 9.4 Grep audit: `rg "shadow-" src/components/audiblytics/ src/app/layout.tsx src/app/_dev/` — must return zero matches (UX spec line 398 ban — borders only, no shadows).
  - [ ] 9.5 Grep audit: `rg "^'use client'" src/app/layout.tsx` — must return zero matches (architecture line 425).
  - [ ] 9.6 Grep audit: `rg "^'use client'" src/app/_dev/components/page.tsx` — must return exactly one match at line 1 (AR18 / AC3).
  - [ ] 9.7 Run `pnpm start` and load `/` to confirm the production build renders the shell correctly. Then load `/_dev/components` (without the env flag set in production env) and confirm the 404 fires.

- [ ] **Task 10 — Final consistency pass + dev-notes append**
  - [ ] 10.1 Confirm all four shell components are exported from one well-known place. **Decision: do NOT create a barrel file (`src/components/audiblytics/index.ts`)** — architecture line 924–928 prefers named imports from explicit paths for grep-friendliness. Imports use `@/components/audiblytics/<Component>`.
  - [ ] 10.2 Confirm no DayRail / StatRail / HonestyFooter / TopNav file accidentally imports from `src/features/` or `src/app/` (architecture line 1138–1145 layered-import direction). They may import from `@/lib/utils` (`cn`) only. Run: `rg "from '@/(features|app)" src/components/audiblytics/` — must return zero matches.
  - [ ] 10.3 Append a checklist into Dev Agent Record § Completion Notes confirming AC1–AC12 individually with one-line evidence each (file path + line, build output snippet, screenshot or DevTools-network confirmation, etc.).
  - [ ] 10.4 If any AC is observed to fail at gallery review, do not silently ship. Stop, document the deviation in Dev Agent Record, and either fix or escalate per architecture line 873 (pattern updates require explicit revision before merge).

## Dev Notes

### Critical pre-read (read before writing any code)

> **Mandatory:** `architecture.md` lines 415–470 (§ Frontend Architecture: server/client component boundaries, routing model, layout-mounted gates), 571–873 (§ Implementation Patterns + § Enforcement Guidelines), 1126–1148 (§ Component Boundaries layered-import direction), 1200–1223 (§ File Organization Patterns), and `ux-design-specification.md` lines 700–760, 800–860 (3-column layout grid + chosen direction), 1183–1476 (DayRail / TopNav / HonestyFooter component specs), 2030–2075 (responsive breakpoint strategy + transformation table). The whole story is a layout exercise; the spec is non-negotiable.

### What this story owns vs. defers

This story creates the **shell**. Center-column content, stat-card stack, day-counter wiring, ProviderChip data binding, and Day-14 gating are all explicitly deferred.

| Concern | This story | Future story |
|---|---|---|
| `app/layout.tsx` shell composition (3-column + footer) | ✅ Task 5 | — |
| `<TopNav>` text-link nav with active detection | ✅ Task 1 | Story 7.2 (when Day14Gate suppresses `<TopNav>` rendering inside the gate) |
| `<DayRail>` 30-cell skeleton in `future` state | ✅ Task 2 (presentational only) | Story 4.3 wires day-counter → cell states; Story 4.5 wires `/calendar?day=N` navigation on completed cells |
| `<StatRail>` placeholder container | ✅ Task 3 (renders single placeholder card) | Story 4.3 (StatCardDark Day-of-30), 2.2 (StatCardLight Streak/Words), 3.4 (StatCardLight Recordings) populate it; ProviderChip inserts in 1.8/1.10 |
| `<HonestyFooter>` with hardcoded provider/version | ✅ Task 4 | Real `<ProviderChip />` swap when Settings persistence lands (Story 1.4 + 1.9) |
| `/_dev/components` env-gated dev gallery | ✅ Task 6 | More components added to gallery as later stories ship (1.10 ParagraphHero, 1.11 HardWordRow, etc.) |
| `<Day14Gate>` mount in layout | ❌ deferred | Story 7.2 |
| `useLocalStorage`-driven settings reads (provider, theme, persona) in shell | ❌ deferred | Story 1.4 (storage hook) + 1.9 (Settings) — shell currently hardcodes `gemini-2.5-flash · free` literal |
| `usePruneOnMount()` call from layout | ❌ deferred | Story 3.6 wires `lib/hooks/use-prune-on-mount.ts` per AR23 |
| Auto-scroll-into-view of "today's cell" on mobile DayRail | ❌ deferred | Story 4.3 (alongside today/completed/missed states) |

**Why no `next/dynamic` for these shell components:** AR22 lazy-loads `WarmUpDrill` and `Day14Takeover` only — both are ≥30KB composites that fire conditionally. The four shell components are tiny (~5KB total) and render on every route; lazy-loading them would degrade FCP and serve no bundle-size goal.

### Layered import compliance (AR18 — non-negotiable)

This story touches `app/`, `components/audiblytics/`, and `lib/utils.ts`. The compliance posture:

| File | Layer | May import from | This story imports |
|---|---|---|---|
| `src/app/layout.tsx` | `app/` | `components/`, `features/`, `lib/`, third-party | `@/components/audiblytics/*`, `next/font/google` (preserved from 1.2), `react` types |
| `src/app/_dev/components/page.tsx` | `app/` | Same as above | `@/components/audiblytics/*`, `next/navigation` |
| `src/components/audiblytics/TopNav.tsx` | `components/` | `lib/`, `components/`, third-party | `next/link`, `next/navigation`, `@/lib/utils` |
| `src/components/audiblytics/DayRail.tsx` | `components/` | Same | `@/lib/utils` |
| `src/components/audiblytics/StatRail.tsx` | `components/` | Same | `@/lib/utils` |
| `src/components/audiblytics/HonestyFooter.tsx` | `components/` | Same | `@/lib/utils` |

**Verified absent imports** (must remain absent):
- `from '@/features/*'` in any audiblytics composite — components MUST NOT depend on capability code (architecture line 1144).
- `from '@/app/*'` in any audiblytics composite — components MUST NOT depend on app-layer code.
- `from '@/components/audiblytics/*'` in any other audiblytics composite this story creates — none of the four shell components depend on each other; they are siblings composed at the `app/layout.tsx` level.
- `from '@/components/ui/*'` (shadcn primitives) in any of the four shell components this story — none use shadcn primitives. (Future stories may swap the inline `<Link>` for a shadcn Button variant, but not this story.)

### Server vs. client component boundaries (architecture lines 421–428)

| File | Type | Rationale |
|---|---|---|
| `src/app/layout.tsx` | **Server** | Hosts `next/font` (must stay server per architecture line 425); imports `globals.css`; composes shell. NO `'use client'` directive. |
| `src/app/_dev/components/page.tsx` | **Client** (`'use client'`) | Reads `process.env.NEXT_PUBLIC_DEV_GALLERY` at runtime (browser-side env-pickup is fine for `NEXT_PUBLIC_*` keys); calls `notFound()` from `next/navigation` (client-safe). |
| `src/components/audiblytics/TopNav.tsx` | **Client** | Uses `usePathname()` for active-link detection (architecture line 427). |
| `src/components/audiblytics/DayRail.tsx` | **Client** | Marked client now to avoid re-marking when Story 4.3 wires day-counter hooks. Negligible bundle cost. |
| `src/components/audiblytics/StatRail.tsx` | **Client** | Same — children may be client components passing reactive state. |
| `src/components/audiblytics/HonestyFooter.tsx` | **Client** | Will read `useSettings()` once Story 1.4+ wires it; mark client now. |

### Tailwind v4 specifics (read before Task 5)

Story 1.2 set up the Tailwind v4 `@theme` block that exposes:
- Color utilities: `bg-surface`, `bg-surface-elevated`, `bg-primary`, `bg-primary-soft`, `text-text-primary`, `text-text-secondary`, `text-text-tertiary`, `border-divider`, `border-primary`, `text-primary`, etc.
- 13 named type classes via `@utility`: `text-display`, `text-headline-1/2/3`, `text-paragraph-hero`, `text-body`, `text-ui`, `text-ui-sm`, `text-caption`, `text-micro-label`, `text-data`, `text-data-large`, `text-rail`, `text-footnote`.
- Font families: `font-serif`, `font-sans`, `font-mono`.
- 4px spacing default. `rounded-sm` for any radius (UX line 399 bans `rounded-full`).

**Use these tokens. Never inline a hex literal, never use arbitrary-bracket Tailwind values for color/typography.** The single permitted exception is the `lg:grid-cols-[80px_1fr_288px]` arbitrary value — it's a **layout** dimension (architecture line 826 explicitly permits arbitrary values for positioning/layout), not a color or type token.

**Active-link underline:** Use `border-b-2 border-primary` rather than `text-decoration: underline` — borders compose better with the `pb-px` baseline-shift trick and match how UX spec line 1463 describes the underline ("forest underline 2px"). Tailwind's `underline` utility uses `text-decoration` which doesn't allow controlling thickness across all browsers without a custom prop.

### Likely dev-time pitfalls (preempt these)

1. **`usePathname()` returns `null` during SSR.** `next/navigation`'s `usePathname()` is hydration-safe in App Router but can transiently be `null` on the very first render. Defensive code: `const pathname = usePathname() ?? '';` then `pathname === '/'` etc. Without the fallback, `pathname.startsWith(...)` throws.
2. **DayRail horizontal-scroll bleeding through `<body>`.** If `<body>` lacks `overflow-x-hidden`, the DayRail's mobile horizontal-scroll content can extend the page width past viewport, triggering the page-level horizontal scroll AC8 forbids. Belt-and-suspenders: `<body overflow-x-hidden>` PLUS `<nav overflow-x-auto>` per Task 5.2.
3. **`min-w-0` is non-obvious.** A CSS Grid track default is `auto`, which respects intrinsic min-content. Long words inside `<main>` can blow out the track. `min-w-0` on the grid item resets the floor to zero so the track honors the parent's `1fr` strictly. Apply preemptively to `<main>` (Task 5.2) and `<div>` wrappers inside grid columns.
4. **`process.env.NEXT_PUBLIC_DEV_GALLERY` at runtime.** `NEXT_PUBLIC_*` env vars are injected at build time, replaced as string literals in the bundle. Setting the env flag THEN running `pnpm build` bakes `'true'` into the bundle for that build. If you build without the flag and set the flag at runtime via `pnpm start`, the flag is NOT visible to the client. For local dev (`pnpm dev`), the flag is read each restart from the env. Plan accordingly when verifying AC9.
5. **`notFound()` inside a component vs at module top.** `notFound()` MUST be called inside the React render path (not at top of module — it would fire at import time). The function throws a special error that App Router's not-found boundary catches. Calling it inside an early-return at the top of the component body is the canonical pattern.
6. **Sticky positioning in CSS Grid cells.** `position: sticky` works inside grid cells in modern browsers (Chrome 105+, Safari 16+). Both DayRail and StatRail use `lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto`. If sticky appears broken, the most likely cause is an ancestor with `overflow: hidden` clipping the sticky context — `<body overflow-x-hidden>` at Task 5.2 sets `overflow-x` only, not `overflow-y`, so this should not happen. If it does, swap `overflow-x-hidden` for `[clip-path:inset(0)]` (no overflow side-effect) on `<body>`.
7. **Active-link strict-equality vs startsWith for `/`.** Treating `/` with `startsWith` always evaluates true. Use `pathname === '/'` for Today, `pathname.startsWith(item.href)` for the others (Task 1.4).
8. **Hot-reload edits to `app/layout.tsx`.** Changes to a server component sometimes don't HMR cleanly — cycle the dev server if the layout doesn't repaint after a save.
9. **Tab order across the layout.** Tab order is DOM order: TopNav links (4 stops) → DayRail (no stops, all `future` cells are non-interactive divs) → main `<a>`/buttons → StatRail (no stops, placeholder is non-interactive) → HonestyFooter (no stops, all `<span>`s). When Story 4.3 makes completed-cell DayRail entries interactive, they'll insert between TopNav and main — that's the correct order per UX spec (visit completed days BEFORE engaging with today's content).
10. **UX-spec ProviderChip is a button.** UX spec line 1430 says `<button aria-label="Provider: ..."> ...</button>` — clicking navigates to Settings. THIS story's inline placeholder is a plain `<span>` because (a) Settings persistence isn't wired yet and (b) the placeholder is throwaway. Do NOT emulate the click behavior with `useRouter().push('/settings')` here — let the real `<ProviderChip>` do that when it lands.

### Pre-existing files this story modifies (UPDATE — read before editing)

| File | Current state (after Story 1.2) | What 1.3 changes | What must be preserved |
|---|---|---|---|
| `src/app/layout.tsx` | Server component with three `next/font` loaders, font CSS variables wired to `<html className>`, `import './globals.css'`, body styled cream + ink via Story 1.2 Task 3.3 `@layer base html { ... }` rule | Compose `<TopNav>` + 3-column row (`<DayRail>` / `<main>{children}</main>` / `<StatRail>`) + `<HonestyFooter>` inside `<body>`. Add `min-h-screen flex flex-col bg-surface text-text-primary overflow-x-hidden` to `<body>`. | Server-component status (NO `'use client'`); the three `next/font` loaders + `--font-serif`/`--font-sans`/`--font-mono` CSS variable wiring on `<html>`; `import './globals.css'`; the `metadata` export. |

**Files this story creates (NEW):**

- `src/components/audiblytics/TopNav.tsx`
- `src/components/audiblytics/DayRail.tsx`
- `src/components/audiblytics/StatRail.tsx`
- `src/components/audiblytics/HonestyFooter.tsx`
- `src/app/_dev/components/page.tsx`

**Files this story does NOT touch:**

- `src/app/page.tsx` (create-next-app default — Story 1.10 replaces wholesale)
- `src/app/globals.css` (Story 1.2 owns it; no token additions needed for this story)
- `src/components/ui/*` (the 7 shadcn primitives — none used in shell)
- Any `src/features/*/` folder (this story is `app/` + `components/` only)
- Any `src/lib/*` file (no infra changes; reuses `cn()` from `@/lib/utils` only — already exists post Story 1.1's shadcn init)
- `next.config.ts` (no build-time guards added this story; Story 1.6 owns)

### Capability-area discipline (NFR28 + AR19)

The four new components live in `src/components/audiblytics/` (the bucket for "UX-spec custom composites"). They are **not** capability-specific (per architecture line 645–646: shell components are presentational, capability folders own logic). When Story 4.3 wires DayRail to day-counter, the `useDayRailState()` hook lives in `src/features/calendar/` (since calendar is the FR-cluster owning day-counting per architecture line 947), and `<DayRail>` consumes it via props passed by the route — keeping the layered-import direction clean.

### `_dev/components` route — env gating mechanics

Three considered approaches, decision recorded:

| Approach | Mechanism | Decision |
|---|---|---|
| `next.config.ts` `pageExtensions` filter on prod | Strip `_dev/**` files from prod build entirely | Overkill; Story 1.6 owns `next.config.ts` and would want to add this then |
| Module-top redirect | `if (process.env... !== 'true') redirect('/')` at top of file | Wrong API in App Router (redirect requires server context) |
| `notFound()` inside component (CHOSEN) | Standard 404 unless flag set | Simplest, AR19/UX-DR42 satisfied, no `next.config.ts` changes |

If at some point a stricter exclusion is required (e.g., the route file leaks too much info via source-maps), Story 1.6 can add the `pageExtensions` filter. For now, the `notFound()` gate suffices.

### Project Structure Notes

**Alignment with `architecture.md § Complete Project Tree` lines 957–1124:** All five new file paths match the tree exactly. `_dev/components/page.tsx` is path-line 1002. The four audiblytics composites are path-lines 1015 (TopNav), 1013 (DayRail), 1027 (HonestyFooter); StatRail is **NOT** in the architecture's listed 18 composites — it is a **new container** introduced by this story to hold the right-rail concern. **Variance acknowledged:** the architecture treats the right rail as a composition of `StatCardDark` + `StatCardLight` directly placed in the layout; this story adds an explicit `<StatRail>` container so the right-rail's responsive behavior (sticky on `≥lg`, stacked on `<lg`, 2-col grid on `md`) lives in one place rather than being recomposed at every route. The container is presentational and trivial — does not violate any pattern, just adds a sibling-shell concept.

**Detected conflicts or variances:**

- UX spec line 354 lists `DayRail` as one of "8 Audiblytics-specific primitives" in `src/components/ui/`, but architecture line 1013 places it in `src/components/audiblytics/`. **Resolved in favor of architecture** — `audiblytics/` is for custom composites, `ui/` is shadcn-managed (architecture line 645 vs 646). UX spec wording is loose; architecture is the authoritative source for placement.
- UX spec line 802–826 shows the StatRail composition as 4 cards + ProviderChip directly. Architecture lines 1015–1031 list 18 composites with no explicit "StatRail" container. This story introduces `<StatRail>` as a **new wrapper component** (not in the architecture list) — a presentational concern that owns the right-rail's responsive layout. Acceptable variance per architecture line 873 (pattern updates require explicit acknowledgment, which this dev note constitutes). When Story 4.3 builds `StatCardDark`, it composes inside `<StatRail>` rather than scattering responsive classes across each card.
- UX spec line 728 shows `<HonestyFooter>` containing the literal text `~5 min daily · $0 / mo · gemini-2.5-flash`, but epics line 487 shows `~5 min daily · $0 today · ProviderChip · v0.1.0`. **Resolved in favor of epics** (the version-controlled story-source line) — `$0 today` (per-day cost) and the explicit `v0.1.0` literal. Future ProviderChip work will swap the literal cleanly.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` § Story 1.3 (lines 468–498)] — verbatim acceptance criteria source
- [Source: `_bmad-output/planning-artifacts/epics.md` § Additional Requirements AR18 (line 179)] — layered-import direction
- [Source: `_bmad-output/planning-artifacts/epics.md` § Additional Requirements AR19 (line 180)] — capability-area folder layout
- [Source: `_bmad-output/planning-artifacts/epics.md` § UX Design Requirements UX-DR6 (line 206)] — three-column desktop shell `grid-cols-[80px_1fr_288px]`
- [Source: `_bmad-output/planning-artifacts/epics.md` § UX Design Requirements UX-DR7 (line 207)] — responsive breakpoints + degradation
- [Source: `_bmad-output/planning-artifacts/epics.md` § UX Design Requirements UX-DR9 (line 212)] — DayRail component states + interaction
- [Source: `_bmad-output/planning-artifacts/epics.md` § UX Design Requirements UX-DR18 (line 221)] — HonestyFooter spec
- [Source: `_bmad-output/planning-artifacts/epics.md` § UX Design Requirements UX-DR19 (line 222)] — TopNav spec
- [Source: `_bmad-output/planning-artifacts/epics.md` § UX Design Requirements UX-DR32 (line 241)] — Navigation pattern enforcement (no hamburger)
- [Source: `_bmad-output/planning-artifacts/epics.md` § UX Design Requirements UX-DR42 (line 257)] — `/_dev/components` env-gated route
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Frontend Architecture (lines 415–470)] — server/client component boundaries; routing model; layout-level Day14Gate (deferred to 7.2)
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Implementation Patterns — Naming (lines 580–610)] — file naming PascalCase, named exports
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Implementation Patterns — Structure (lines 637–685)] — folder decision tree, file shape pattern
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Implementation Patterns — Styling (lines 814–828)] — semantic tokens only, banned patterns
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Component Boundaries (lines 1126–1148)] — layered import direction
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Complete Project Tree (lines 957–1124)] — file paths for layout.tsx, _dev/components/page.tsx, audiblytics composites
- [Source: `_bmad-output/planning-artifacts/architecture.md` § File Organization Patterns (lines 1200–1223)] — source organization
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` § Visual Foundation — Layout Grid (lines 700–737)] — three-column desktop diagram + region table
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` § Design Direction — Implementation Approach Phase 1 (lines 847–860)] — page shell build sequence (this story = Phase 1)
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` § Component Strategy — DayRail (lines 1183–1220)] — DayRail anatomy + states + accessibility
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` § Component Strategy — TopNav (lines 1453–1476)] — TopNav anatomy + active state
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` § Component Strategy — HonestyFooter (lines 1434–1450)] — HonestyFooter spec
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` § Component Strategy — ProviderChip (lines 1410–1430)] — ProviderChip future spec (this story renders inline placeholder)
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` § Responsive — Breakpoint Strategy (lines 2030–2075)] — layout transformation table by viewport
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` § Implementation Guidelines (lines 2178–2196)] — responsive + a11y implementation rules
- [Source: `_bmad-output/planning-artifacts/ux-design-directions.html` (Direction A panel)] — working visual reference for the 3-column layout
- [Source: `_bmad-output/implementation-artifacts/1-1-project-scaffold-and-agent-configuration.md`] — previous story; created `src/components/audiblytics/` empty folder (1.1 Task 6.1) and `src/app/` skeleton this story populates
- [Source: `_bmad-output/implementation-artifacts/1-2-visual-token-system-typography-and-self-hosted-fonts.md`] — previous story; defines all the tokens + named type classes this story consumes
- [Source: `_bmad-output/planning-artifacts/prd.md` § NFR16, NFR26] — supports no-third-party-asset / dependency-parsimony posture (no `next/dynamic` for shell, no shadcn primitives needed for shell)

## Dev Agent Record

### Context Reference

- This story spec is self-contained. The dev agent should read this file plus the four planning artifacts referenced above (epics.md, architecture.md, ux-design-specification.md, prd.md) and the two prior story files (1-1, 1-2). The prototype HTML at `_bmad-output/planning-artifacts/ux-design-directions.html` (Direction A panel) is the visual reference — open it side-by-side with `localhost:3000` and `/_dev/components` during Tasks 7 + 8.
- Previous stories: `1-1-project-scaffold-and-agent-configuration.md` (status: ready-for-dev) and `1-2-visual-token-system-typography-and-self-hosted-fonts.md` (status: ready-for-dev). If neither has been implemented yet, complete them in order first — Story 1.3 mutates files Story 1.1 creates and consumes tokens Story 1.2 defines.
- No `project-context.md` files were found in the workspace at story-creation time.
- No git history exists at story-creation time; no prior code patterns to inherit beyond what 1.1 + 1.2 produce.

### Previous Story Intelligence

Story 1.2 (Visual Token System, Typography, and Self-Hosted Fonts) established the entire styling substrate this story consumes. From 1.2's Dev Notes § What this story owns vs. defers:

| 1.2 produced | 1.3 takes over |
|---|---|
| `src/app/globals.css` with all 14 raw + 19 semantic color tokens, Tailwind `@theme` block exposing utilities, 13 named type classes via `@utility`, body default font (Garamond) | This story consumes the utilities directly: `bg-surface`, `text-text-primary`, `text-text-tertiary`, `border-divider`, `border-primary`, `text-primary`, plus type classes `text-ui`, `text-ui-sm`, `text-rail`, `text-micro-label`, `text-headline-2/3`, `text-caption` |
| `src/app/layout.tsx` with three `next/font` loaders + CSS-variable className wiring to `<html>` | This story PRESERVES every line and ADDS shell composition inside `<body>`. Server-component status remains. |
| `src/app/page.tsx` reverted to create-next-app default after sample verification | This story DOES NOT touch `page.tsx` (Story 1.10's territory) |
| Token name disambiguation: Tailwind v4 emits `text-text-primary` (not `text-primary` for typography) because of the `--color-text-primary` namespace — see 1.2 Dev Notes pitfall #1 | This story uses `text-text-primary` for body text color and `text-primary` for the forest accent. Two distinct utilities; no collision. |

**Patterns established by 1.2 to honor here:**

- **Semantic tokens only.** Every color/typography reference uses a token utility. No hex literals. No arbitrary brackets for color/type. Layout-only arbitrary brackets (`lg:grid-cols-[80px_1fr_288px]`) are explicitly permitted.
- **No shadows, no rounded-full.** UX spec lines 398–399 ban these. Story 1.2 codified this in Dev Notes § Color discipline. This story stays compliant: square `rounded-sm` only, no shadow utilities anywhere.
- **`focus-visible:ring-2 ring-focus ring-offset-2`** is the canonical focus-ring pattern from Story 1.2 AC10. This story applies it to TopNav links and any future interactive element.
- **Server vs client discipline:** `app/layout.tsx` stays server (1.2 preserved this); audiblytics composites are client. This story reaffirms.

**Likely 1.2 review cycles to anticipate:** if 1.2 hasn't been reviewed/implemented yet, the token utilities may not all be present. Run `pnpm dev` and look for Tailwind unknown-class warnings on first render. If `text-text-primary` or `border-divider` doesn't apply, 1.2's `@theme` block is incomplete and must be fixed before 1.3 ships.

**Story 1.1 patterns honored here:**

- File naming: `PascalCase.tsx` for components, named exports, `kebab-case.ts` for lib (none added this story).
- Banned-deps posture: this story adds zero dependencies. `next/link` and `next/navigation` are Next.js built-ins; `next/font` and `cn` are already installed via 1.1 + 1.2.
- Three-file enforcement of personal-use boundary: this story does not touch `README.md`, `AGENTS.md`/`CLAUDE.md`, or `.cursor/rules/architecture.mdc`.
- No `git init`, no commits, no remote (1.1 Task 12 explicit). Same applies to 1.3.

### Agent Model Used

Composer (Cursor subagent)

### Debug Log References

### Completion Notes List

**AC checklist evidence**

1. **AC1** — `src/app/layout.tsx`: `lg:grid lg:grid-cols-[80px_1fr_288px]` on content wrapper; `<main>` uses `px-4 md:px-6 lg:px-12`; inner `max-w-[640px] mx-auto` via `mx-auto w-full max-w-[640px]`.
2. **AC2** — `layout.tsx` has no `'use client'`; retains three `next/font/local` loaders, `import './globals.css'`, `<html lang="en">` + `<body>`.
3. **AC3** — `src/app/%5Fdev/components/page.tsx` line 1 is `'use client';`; `src/app/page.tsx` untouched.
4. **AC4** — `TopNav.tsx`: `aria-label="Main navigation"`, four `Link`s in order with `usePathname` + `/` strict equality; active `aria-current`, `border-b-2 border-primary`, `font-medium`; hover uses `hover:text-forest` (forest accent — `text-primary` @utility in `globals.css` maps to ink, not forest). `flex-wrap justify-end`, no hamburger.
5. **AC5** — `DayRail.tsx`: 30 cells, all `future`; `text-rail` + `text-ink-faint`, square dot `bg-ink-faint/60`, `sr-only` “Day N, upcoming”; `lg:sticky lg:top-0 lg:h-screen lg:w-20 lg:overflow-y-auto`; mobile `flex overflow-x-auto`; `min-w-[44px]` touch floor.
6. **AC6** — `StatRail.tsx`: `children` prop, placeholder `aside` `text-ui-sm text-tertiary` “Stats appear here”; `lg:sticky lg:w-72 md:grid md:grid-cols-2`; no StatCard files.
7. **AC7** — `HonestyFooter.tsx`: `role="contentinfo"`, `text-rail text-ink-faint`, `border-t border-divider`, four `·` cells + inline `gemini-2.5-flash · free` with PLACEHOLDER comment, `v0.1.0`; `flex-wrap` for mobile lines.
8. **AC8** — `body` has `overflow-x-hidden`; DayRail scroll contained in `nav`; `main` / StatRail `min-w-0` where needed (manual DevTools spot-check recommended).
9. **AC9** — Gallery at `/_dev/components` via on-disk `src/app/%5Fdev/components/page.tsx` (Next.js [private folder](https://nextjs.org/docs/app/getting-started/project-structure#private-folders) rule: literal `_dev` would not route — `%5F` prefix required for `/_dev` URL). `notFound()` when `NEXT_PUBLIC_DEV_GALLERY !== 'true'`.
10. **AC10** — DOM order: `TopNav` → grid row `DayRail` / `main` / `StatRail` → `HonestyFooter`; `main` `pb-16 lg:pb-24`.
11. **AC11** — Semantic tokens / named type utilities only; layout arbitrary grid/max-width allowed; grep: no `bg-[#` / `rounded-full` / `shadow-` in shell paths; no `style={{` for color/type.
12. **AC12** — `pnpm exec tsc --noEmit` exit 0; `pnpm build` exit 0, routes `/` + `/_dev/components` listed; zero new build warnings observed.

### File List

| Action | Path |
|--------|------|
| Modified | `src/app/layout.tsx` |
| Created | `src/components/audiblytics/TopNav.tsx` |
| Created | `src/components/audiblytics/DayRail.tsx` |
| Created | `src/components/audiblytics/StatRail.tsx` |
| Created | `src/components/audiblytics/HonestyFooter.tsx` |
| Created | `src/app/%5Fdev/components/page.tsx` (URL `/_dev/components`; see AC9 note) |
