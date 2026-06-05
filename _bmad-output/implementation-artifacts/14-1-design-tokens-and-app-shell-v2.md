# Story 14.1: Design Tokens and App Shell v2

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want the cream/forest soft-card shell with left sidebar navigation,
so that the app matches the 2026 mockup aesthetic (UX-V2-UI1).

## Acceptance Criteria

> Sourced from `epics.md` § Story 14.1, `epics.md` § UI Refresh Requirements (UX-V2-UI1), and `_bmad-output/design/ui-mockups-v2/index.md`. **Epic 14 supersedes** hub-and-spoke TopNav-only navigation from `ux-design-specification.md` § Layout Revision 2026-05-20 where they conflict — persistent **left sidebar** is canonical for v2.

1. **AC1 — Semantic tokens (cream/forest soft-card)** — Given `globals.css`, when tokens are inspected, then `--cream` / `--surface` reflect mockup cream (`#F9F7F2` or visually equivalent via token update), `--forest` / `--primary` remain forest green (no new arbitrary hex in components), and a **`--surface-card`** (white) token exists for soft-card surfaces mapped into `@theme inline` as `--color-surface-card`. Card radius uses existing `--radius-lg` / `rounded-lg` — no `rounded-[16px]` in components.

2. **AC2 — Three-zone shell at ≥1024px** — Given viewport `lg+`, when any authenticated route renders (except Day-14 takeover), then layout is **sidebar (fixed width) + main + optional right StatRail** per `app/layout.tsx` + `AppShell.tsx`. Sidebar visible at `lg:flex`; main content scrolls; StatRail sticky on `xl+` where `AppShell` mounts it (Today may suppress rail — unchanged).

3. **AC3 — Sidebar nav items** — Given `AppSidebar`, when expanded, nav links match mockups exactly (order + labels):
   - Home → `/`
   - Review → `/review`
   - Collection → `/collection`
   - Voice Journal → `/voice-journal`
   - Journey → `/journey`
   - Stats → `/stats`
   Settings is **not** in the primary nav list — expose via sidebar footer overflow/menu (see AC5).

4. **AC4 — Active nav state** — Given current route, when a sidebar item matches (`pathname === href` or `pathname.startsWith(href)` for nested settings), then active item uses **`bg-primary-soft text-primary`** (light green background + forest text). Inactive items: `text-foreground hover:bg-surface-elevated`.

5. **AC5 — Profile footer** — Given sidebar footer, when API mode (`isApiStorageBackend()`), then display `useAuth().user.email` (or local-part before `@` if truncated) after load; when Dexie/local mode, display **"Personal use"** label (not hardcoded "Neal"). Avatar initial derived from first character of label. Footer includes Settings link (`/settings`) and optional logout in API mode.

6. **AC6 — TopNav demotion** — `TopNav.tsx` is **removed from production layout** (or reduced to mobile-only overflow — prefer removal). Feature discovery is sidebar-only on desktop; mobile uses collapsible sidebar drawer or bottom sheet — minimum: `lg:hidden` mobile nav trigger in sidebar header region that opens nav links. No duplicate Home/Review links in TopNav + sidebar simultaneously on desktop.

7. **AC7 — Stub routes for new nav targets** — `/journey` and `/stats` routes exist with `FeatureRouteShell` + honest placeholder copy ("Journey view — Story 14.8" / "Stats overview — coming soon") so nav links never 404. **Do not** build Journey/Stats page content in this story.

8. **AC8 — Day-14 unchanged** — `Day14Gate` still replaces entire shell on trigger; sidebar and StatRail never mount during takeover.

9. **AC9 — Tests** — Pure helpers (`resolveSidebarProfileLabel`, `isSidebarNavActive`, nav config) covered by `node:test` files under `apps/web/src/components/audiblytics/` or `apps/web/src/lib/navigation/`. Run `pnpm --filter @audiblytics/web test` and `typecheck` green. No regressions in existing API unit tests.

10. **AC10 — Scope boundary** — This story does **not** redesign Home dashboard (14.2), Today 3-column workbench (14.3), page interiors, or Settings hub sub-pages (14.7). Only shell, tokens, sidebar, layout wiring, stub routes.

## Tasks / Subtasks

- [x] **Task 1 — Token refresh for v2 soft-card palette** (AC: 1)
  - [x] 1.1 Update `:root` in `apps/web/src/app/globals.css`: adjust `--cream` toward mockup `#F9F7F2`; cascade `--surface`, `--cream-dim`, `--border` if needed for contrast.
  - [x] 1.2 Add `--surface-card: #ffffff` (and `--color-surface-card` in `@theme inline`).
  - [x] 1.3 Document token mapping in story Dev Notes; **no** hex literals in TSX — components use `bg-surface-card`, `bg-surface`, `bg-primary-soft`, etc.

- [x] **Task 2 — Navigation config module** (AC: 3, 4, 9)
  - [x] 2.1 Create `apps/web/src/lib/navigation/sidebar-nav.ts` exporting `SIDEBAR_NAV_ITEMS` (href, label, lucide icon key) and pure `isSidebarNavActive(pathname, href)`.
  - [x] 2.2 Create `apps/web/src/lib/navigation/sidebar-profile.ts` with `resolveSidebarProfileLabel({ apiMode, userEmail, loading })` → string.
  - [x] 2.3 Add `sidebar-nav.test.ts` + `sidebar-profile.test.ts` (node:test).

- [x] **Task 3 — AppSidebar v2** (AC: 3, 4, 5)
  - [x] 3.1 Refactor `AppSidebar.tsx` to import nav config; replace `/calendar` Stats link with `/stats`; add `/journey`.
  - [x] 3.2 Apply AC4 active classes (`bg-primary-soft text-primary`).
  - [x] 3.3 Wire `useAuth()` + `isApiStorageBackend()` for profile footer; remove hardcoded "Neal".
  - [x] 3.4 Add Settings link + API logout affordance in footer; keep collapse/hover expand behavior on desktop.
  - [x] 3.5 Mobile `< lg`: hamburger or menu button exposing same nav links (sheet/dropdown acceptable — use existing shadcn `@/components/ui` if present).

- [x] **Task 4 — Layout + TopNav cleanup** (AC: 2, 6, 8)
  - [x] 4.1 Update `apps/web/src/app/layout.tsx`: remove `TopNav` import/render on desktop; verify `AppSidebar` + `AppShell` + `HonestyFooter` order matches mockup hierarchy.
  - [x] 4.2 Ensure `Day14Gate` wraps shell unchanged.
  - [x] 4.3 Confirm `FeatureRouteShell` keeps `BackToHomeLink` as `lg:hidden` only (sidebar replaces on desktop).

- [x] **Task 5 — Stub routes** (AC: 7)
  - [x] 5.1 Create `apps/web/src/app/journey/page.tsx` — placeholder inside `FeatureRouteShell`.
  - [x] 5.2 Create `apps/web/src/app/stats/page.tsx` — placeholder inside `FeatureRouteShell`.
  - [x] 5.3 Optional: add redirect from `/calendar` → `/journey` **only if** product decision documented — **default: keep `/calendar` working** (existing Epic 4); Journey stub is separate until 14.8 merges calendar into Journey.

- [x] **Task 6 — AppShell grid alignment** (AC: 2)
  - [x] 6.1 Verify `AppShell.tsx` grid: main + StatRail at `xl:grid-cols-3` (2+1) with sidebar **outside** AppShell in layout (sidebar | (main+rail)).
  - [x] 6.2 Layout outer flex: `aside` + `flex-1 flex-col` for main column — match mockup proportions; avoid double padding regressions.

- [x] **Task 7 — Verification** (AC: 9, all)
  - [x] 7.1 `pnpm --filter @audiblytics/web test`
  - [x] 7.2 `pnpm --filter @audiblytics/web typecheck`
  - [x] 7.3 `pnpm --filter @audiblytics/web lint` — **blocked**: pre-existing ESLint env error (`next/dist/compiled/babel/eslint-parser` missing); not introduced by 14.1
  - [x] 7.4 Manual: `lg+` sidebar nav highlights per route; profile shows email in API mode; Day-14 still full-bleed.

### Review Findings (2026-05-31)

- [x] [Review][Defer] `/calendar` unreachable from nav until 14.8 [`AppSidebar.tsx` / `sidebar-nav.ts`] — Stats→`/stats` stub; Journey→`/journey` stub; route still works at URL; 14.8 merges calendar into Journey.
- [x] [Review][Defer] HomeDashboard hardcoded "Neal" [`HomeDashboard.tsx:53`] — AC10 scope; fix in 14.2 home dashboard.
- [x] [Review][Defer] `TopNav.tsx` orphaned [`layout.tsx`] — removed from layout; file retained; delete in cleanup pass if desired.
- [x] [Review][Defer] Logout failure silent [`AppSidebar.tsx:176`] — `void logout()`; no inline error surface; matches auth-context pattern.
- [x] [Review][Dismiss] Profile shows email local-part not full address — AC5 allows truncated local-part; `resolveSidebarProfileLabel` correct.
- [x] [Review][Dismiss] ESLint toolchain broken — pre-existing; typecheck + 91 tests green.

## Dev Notes

### Authority stack (read in order)

1. `epics.md` § Epic 14 + UX-V2-UI1 — **sidebar nav wins** over § Layout Revision hub-and-spoke TopNav
2. `_bmad-output/design/ui-mockups-v2/index.md` — visual reference (cream `#F9F7F2`, forest `#1B3D2F`, white cards, 12–16px radius)
3. `architecture.md` § Implementation Patterns (571–873) — naming, tokens, folder tree, no toasts
4. `ux-design-specification.md` — fonts (EB Garamond / Inter / JetBrains Mono), Day-14 takeover, inline errors unchanged

### Brownfield baseline (do not rewrite from scratch)

| File | Current state | 14.1 delta |
|------|---------------|------------|
| `apps/web/src/components/audiblytics/AppSidebar.tsx` | Exists; 5 nav items; Stats→`/calendar`; hardcoded "Neal" | Add Journey/Stats hrefs; profile from auth; active token classes |
| `apps/web/src/app/layout.tsx` | Sidebar + TopNav + AppShell | Remove TopNav (desktop) |
| `apps/web/src/components/audiblytics/AppShell.tsx` | 2-col main+StatRail; hides rail on `/today` | Grid verify only |
| `apps/web/src/components/audiblytics/FeatureRouteShell.tsx` | `BackToHomeLink lg:hidden` | Keep — correct for v2 |
| `apps/web/src/components/audiblytics/TopNav.tsx` | Home + Settings | Deprecate/remove from layout |
| `apps/web/src/app/globals.css` | `--cream: #f5f0e6` | Bump cream; add `--surface-card` |

### Nav config shape (implement exactly)

```ts
// apps/web/src/lib/navigation/sidebar-nav.ts
export type SidebarNavItem = {
  href: string;
  label: 'Home' | 'Review' | 'Collection' | 'Voice Journal' | 'Journey' | 'Stats';
  icon: LucideIcon;
};

export const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/review', label: 'Review', icon: FileText },
  { href: '/collection', label: 'Collection', icon: Bookmark },
  { href: '/voice-journal', label: 'Voice Journal', icon: Mic },
  { href: '/journey', label: 'Journey', icon: Map },      // or Route — pick one Lucide icon
  { href: '/stats', label: 'Stats', icon: BarChart3 },
];
```

Active rule: `/` exact match; others `pathname.startsWith(href)` except prevent `/` matching all.

### Profile label rules

| Mode | Condition | Label |
|------|-----------|-------|
| API | `user.email` loaded | email or truncated local-part (max ~24 chars + ellipsis) |
| API | loading | `…` or skeleton — not "Neal" |
| API | no user (shouldn't happen behind AppGate) | `Account` |
| Dexie | always | `Personal use` |

Use `useAuth()` from `@/features/auth/auth-context`; gate with `isApiStorageBackend()` from `@/lib/config/storage-backend`.

### Token update guidance

Mockup palette vs current:

| Token | Mockup approx | Action |
|-------|---------------|--------|
| `--cream` / `--surface` | `#F9F7F2` | Update `:root` value |
| `--forest` / `--primary` | `#1B3D2F` (mockup) vs `#2d5b3a` (current) | **Keep existing `--forest`** unless side-by-side contrast fails — AC says "existing `--forest` tokens" |
| Card surface | white | New `--surface-card` |

Recompute `--cream-dim` / `--border` if contrast breaks against white cards.

### Layout wireframe (≥1024px)

```
┌──────────┬────────────────────────────────────┬─────────────┐
│ AppSidebar│  main (AppShell children)         │ StatRail    │
│  nav     │                                   │ (optional)  │
│  profile │                                   │             │
└──────────┴────────────────────────────────────┴─────────────┘
│ HonestyFooter (full width of main column)                   │
└─────────────────────────────────────────────────────────────┘
```

Sidebar width: keep existing `w-56` expanded / `w-20` collapsed pattern.

### Folder placement (architecture.md §641–656)

| New file | Location |
|----------|----------|
| Nav config + pure helpers | `apps/web/src/lib/navigation/` |
| Nav tests | co-located `*.test.ts` |
| Stub pages | `apps/web/src/app/journey/page.tsx`, `apps/web/src/app/stats/page.tsx` |
| Shell components | mutate existing `components/audiblytics/` — no parallel `ShellV2` duplicate |

### Anti-patterns (reject)

- Duplicating `AppSidebarV2.tsx` — mutate `AppSidebar.tsx`
- Hardcoded display names ("Neal", "Priyank") in shell components
- `bg-[#F9F7F2]` in TSX — token only
- Building Journey/Stats page content (14.8 / future)
- Removing `/calendar` route — still used until 14.8
- Toast/modal for profile errors
- Breaking Day-14 full-bleed takeover

### Testing approach

Web uses `tsx --test` (Node test runner), not Vitest. Follow `apps/web/src/lib/api/collection.test.ts` pattern:

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isSidebarNavActive } from './sidebar-nav';
```

Test cases minimum:

- `isSidebarNavActive('/', '/')` → true; `isSidebarNavActive('/review', '/')` → false
- `isSidebarNavActive('/settings/practice', '/settings')` → false (settings not in primary nav)
- `resolveSidebarProfileLabel({ apiMode: false, ... })` → `'Personal use'`
- `resolveSidebarProfileLabel({ apiMode: true, userEmail: 'a@b.com', loading: false })` → contains `a@b.com`

### Previous epic intelligence

- **Epic 13 done** — production deploy + ADRs; no shell conflicts.
- **Epic 11/12 API mode** — `useAuth()` + `AppGate`/`AuthGate` already gate API routes; sidebar profile must respect same auth state.
- **`deferred-work.md`** — API-mode calendar/paragraph gaps remain; stub `/journey` must not pretend data is synced.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` § Story 14.1, UX-V2-UI1]
- [Source: `_bmad-output/design/ui-mockups-v2/index.md`]
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Implementation Patterns, § Styling Patterns]
- [Source: `apps/web/src/app/layout.tsx`]
- [Source: `apps/web/src/components/audiblytics/AppSidebar.tsx`]
- [Source: `apps/web/src/features/auth/auth-context.tsx`]

## AI Engineering Record

| AI-Phase | AI-Tool | Story-Ref |
|---|---|---|
| story | cursor/composer-2.5-fast | 14-1-design-tokens-and-app-shell-v2 |
| code | cursor/composer-2.5-fast | 14-1-design-tokens-and-app-shell-v2 |
| test | cursor/composer-2.5-fast | 14-1-design-tokens-and-app-shell-v2 |
| review | cursor/composer-2.5-fast | 14-1-design-tokens-and-app-shell-v2 |
| deploy | pending | |

## Dev Agent Record

### Agent Model Used

composer-2.5-fast

### Debug Log References

- ESLint fails repo-wide: `Cannot find module 'next/dist/compiled/babel/eslint-parser'` — pre-existing toolchain gap; typecheck + 91 tests pass.

### Completion Notes List

- Tokens: `--cream` → `#f9f7f2`, adjusted dim/border, added `--surface-card` + Tailwind `--color-surface-card`.
- `lib/navigation/`: `SIDEBAR_NAV_ITEMS`, `isSidebarNavActive`, profile label helpers + 7 unit tests.
- `AppSidebar`: 6 nav items, `bg-primary-soft text-primary` active, auth profile footer, Settings + logout.
- `MobileAppNav`: `lg:hidden` dialog menu (AC6).
- `layout.tsx`: TopNav removed; `MobileAppNav` added.
- Stub routes: `/journey`, `/stats`.
- **91 tests** pass; typecheck green.

### File List

- `apps/web/src/app/globals.css`
- `apps/web/src/lib/navigation/sidebar-nav.ts`
- `apps/web/src/lib/navigation/sidebar-nav.test.ts`
- `apps/web/src/lib/navigation/sidebar-profile.ts`
- `apps/web/src/lib/navigation/sidebar-profile.test.ts`
- `apps/web/src/components/audiblytics/AppSidebar.tsx`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/journey/page.tsx`
- `apps/web/src/app/stats/page.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/14-1-design-tokens-and-app-shell-v2.md`

## Change Log

- 2026-05-31: CR — approved; 4 defer, 2 dismiss; status → done.
- 2026-05-31: Implemented shell v2 — tokens, sidebar nav, mobile menu, stub routes, profile footer (91 tests).
- 2026-05-31: Story created — Epic 14 kickoff; design tokens + app shell v2 (ready-for-dev).
