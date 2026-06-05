# Story 14.7: Settings Hub Sub-Pages

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want Settings split into Practice, Audio, Data & Storage, Advanced, Appearance, and About,
so that settings match the settings mockups (**UX-V2-UI7**).

## Acceptance Criteria

> Sourced from `epics.md` § Story 14.7, **UX-V2-UI7** (Settings hub — not UX-V2-UI6, which is Review), and `_bmad-output/design/ui-mockups-v2/index.md` (Practice, Appearance, About, Advanced, Data & Storage, Advanced Audio). Builds on **14.1** shell. **Brownfield:** monolithic `SettingsForm` + `SettingsPillTabs` on `/settings` today (~650 lines); no nested routes, no `rememberLastUsed`, no export/delete flows.

1. **AC1 — Routes + redirect** — Given user navigates to `/settings`, when page loads, then **redirect** to `/settings/practice` (Next.js `redirect` in server `page.tsx` or equivalent). Nested routes exist and render inside a shared hub layout:
   - `/settings/practice` — Practice defaults
   - `/settings/audio` — TTS voice + Advanced Audio section (see AC6)
   - `/settings/data` — Retention + offline pack
   - `/settings/advanced` — API keys (mode-dependent)
   - `/settings/appearance` — UI chrome prefs (honest deferrals OK)
   - `/settings/about` — version + links
   Unknown `/settings/foo` → 404 or redirect to practice (prefer **notFound**).

2. **AC2 — Hub layout + sidebar sub-nav** — Given any `/settings/*` route, when rendered at `lg+`, then:
   - Page uses **`FeatureRouteShell`** with hub header: **"Settings"** + subtitle **"Changes apply on your next paragraph generation."** (reuse copy from `settings-form.tsx`)
   - **Left column (settings sub-nav)** lists the six sections with icons (lucide) matching mockup labels; active item uses `bg-primary-soft text-primary` (same as primary sidebar AC4)
   - **Right column** shows the active section content in **card rows** (`bg-surface-card rounded-lg border border-divider` — semantic tokens only)
   - Global **`StatRail` remains visible** on settings routes (not suppressed)
   - Below `lg`, sub-nav stacks above content (vertical list or compact select — no horizontal scroll trap)

3. **AC3 — App sidebar integration** — Given `pathname.startsWith('/settings')`, when `AppSidebar` / `MobileAppNav` render, then show **Settings subsection** in the sidebar (mockup: indented links under Settings) **in addition to** footer Settings link; subsection links mirror hub routes. Primary nav items (`Home`, `Review`, …) must **not** appear active on `/settings/practice` (existing `isAnySidebarNavActive` test must stay green). Footer Settings link still targets `/settings` (redirects to practice).

4. **AC4 — Practice page** — Given `/settings/practice`, when user edits and taps **Save**, then persist **theme**, **persona**, **length** via **existing** paths:
   - **Dexie/local:** `audiblytics.settings` + `settingsSchema` through `useLocalStorage` (same validation as today)
   - **API mode:** `patchApiSettings` for theme/persona/length only on this page (no provider keys here)
   UI matches Practice mockup pattern: **card rows** (icon + title + description + control) for Theme, Persona, Paragraph length; not bare `<Select>` stacks.
   **Remember last used** toggle:
   - Add **`practicePrefsSchema`** in `apps/web/src/lib/schemas/practice-prefs.schema.ts`: `{ rememberLastUsed: boolean (default true), lastUsed: { theme, persona, length } | null }`
   - Persist at `audiblytics.practicePrefs` via `useLocalStorage` (**browser-only**, both storage backends — Postgres has no column for this in 14.7)
   - When `rememberLastUsed` is true and user saves practice settings, update `lastUsed` snapshot
   - **Today** (`today-app.tsx`): on session start / generate, if `rememberLastUsed` and `lastUsed` present, **pre-fill** theme/persona/length controls from `lastUsed` before user edits (do not overwrite explicit user picks mid-session)
   Include **Reset to defaults** control (resets drafts to `settingsSchema` defaults + clears `lastUsed` when toggled off is optional; minimum: reset theme/persona/length drafts to schema defaults).

5. **AC5 — Advanced page (API vs local)** — Given `/settings/advanced`:
   - **API mode (`isApiStorageBackend()`):** Gemini API key field only (move out of practice/defaults); show `hasGeminiApiKey` placeholder state; save via `patchApiSettings({ geminiApiKey })`. **Remove** multi-provider vault UI. Optional **Test Connection** button: if no backend endpoint exists, render **disabled** with `text-caption` explanation **"Connection test not available yet."** (do not invent a fake success)
   - **Local mode:** Provider select + per-provider API key fields (current `provider` tab logic); validate key before save via existing `getProvider` check; persist `audiblytics.providerKeys` + `audiblytics.activeProvider`
   Deep link: `/settings/advanced` replaces `/settings?focus=provider` (support legacy query: redirect or `useEffect` focus on `#settings-provider` / gemini input)

6. **AC6 — Audio page** — Given `/settings/audio`, when rendered, then:
   - **TTS voice** card row reuses `useVoices()` + `voiceURI` save path (existing `settings` field)
   - **Advanced Audio** mockup section: static placeholder card rows (e.g. speech rate, pause between sentences) with honest **"Coming soon"** or disabled controls — **no new audio engine** in 14.7 (full Advanced Audio → **14.9** if needed)

7. **AC7 — Data & Storage page** — Given `/settings/data`, when rendered, then:
   - **Retention** dropdown + explanatory copy (move from `retention` pill section)
   - **Offline pack** download block (move from `offline-pack` section): count via `db.offlinePack`, `loadOfflinePackFromPublic`, `InlineErrorSurface` on failure
   - **Export data** / **Delete all data** mockup rows: render as **disabled** buttons with caption **"Not available in this build."** (no fake flows — Epic 8 never shipped export/delete)

8. **AC8 — Appearance page** — Given `/settings/appearance`, when user interacts, then:
   - Card rows for Light / Dark / System, accent swatches, text size (per mockup)
   - **Only Light (current cream/forest tokens) is functional**; Dark / System and accent/text-size that would require new token themes → **disabled** + helper **"Dark mode coming later."** (per epic AC: dark mode may defer)
   - Do **not** confuse paragraph **Theme** enum (`horror`, `adventure`, …) with UI light/dark — keep paragraph theme on Practice page only

9. **AC9 — About page** — Given `/settings/about`, then show app name, version string (from `package.json` env or static `0.1.0` if no inject), and link rows (GitHub/docs placeholders OK as `href="#"` with `aria-disabled` or external links if known). No API keys on this page.

10. **AC10 — Save UX** — Each hub page has its own **Save** button (footer right, mockup). Saving runs only that page’s fields (practice save must not require provider key; advanced save must not reset voice). Errors → **`InlineErrorSurface`** or existing inline `role="alert"` text — **no toasts**. API loading skeleton while `fetchApiSettings` on mount (shared provider).

11. **AC11 — Regression + link updates** — Update all `?focus=provider` and bare `/settings` CTAs:
   - `today-app.tsx`, `CollectionListRow.tsx`, `CollectionWordDetailPanel.tsx`, `HardWordsList.tsx` → `/settings/advanced` (local) or `/settings/advanced` (API; gemini field)
   Remove or narrow **`SettingsPillTabs`** once hub routes work. **`/settings` must not 404.**

12. **AC12 — Tests** — `apps/web/src/lib/settings/settings-nav.ts` (or `lib/navigation/settings-nav.ts`) with pure `isSettingsNavActive(pathname, href)`, `settingsNavItems` list; `settings-nav.test.ts`. Optional `practice-prefs.test.ts` for snapshot merge helper. `pnpm --filter @audiblytics/web test` + `typecheck` green.

13. **AC13 — Scope boundary** — **Out of scope:** FastAPI migration for `rememberLastUsed` in Postgres; real dark mode token set; live Test Connection API; export/delete implementation; moving retention enforcement server logic; **14.9** Advanced Audio behavior. Do not break Day-14 gate, login, or StatRail on settings.

## Tasks / Subtasks

- [x] **Task 1 — Settings navigation module** (AC: 2, 3, 12)
  - [x] 1.1 Create `lib/navigation/settings-nav.ts` — `SETTINGS_NAV_ITEMS`, `isSettingsNavActive`.
  - [x] 1.2 Tests in `settings-nav.test.ts`.
  - [x] 1.3 `SettingsSubNav.tsx` — vertical nav for hub layout + mobile stack variant.

- [x] **Task 2 — Practice prefs schema + Today wiring** (AC: 4, 12)
  - [x] 2.1 `practice-prefs.schema.ts` + `useLocalStorage` at `audiblytics.practicePrefs`.
  - [x] 2.2 `lib/settings/apply-last-used-practice.ts` — pure merge for Today defaults.
  - [x] 2.3 Wire `today-app.tsx` to read prefs on load.
  - [x] 2.4 Tests for merge helper.

- [x] **Task 3 — Settings hub layout + routes** (AC: 1, 2, 10)
  - [x] 3.1 `app/settings/layout.tsx` — `SettingsHubLayout` + `SettingsHubProvider`.
  - [x] 3.2 `app/settings/page.tsx` — redirect to `/settings/practice`.
  - [x] 3.3 Section pages: practice, audio, data, advanced, appearance, about.
  - [x] 3.4 `SettingsCardRow.tsx` — reusable card row chrome.

- [x] **Task 4 — Extract save logic from monolith** (AC: 4–9, 10)
  - [x] 4.1 `settings-hub-context.tsx` — shared drafts, per-page save handlers.
  - [x] 4.2 Section page components under `features/settings/`.
  - [x] 4.3 `settings-form.tsx` → deprecated re-export shim.
  - [x] 4.4 Removed `SettingsPillTabs.tsx`.

- [x] **Task 5 — Sidebar subsection** (AC: 3)
  - [x] 5.1 `AppSidebar.tsx` + `MobileAppNav` — `SettingsSubNav` when on `/settings/*`.
  - [x] 5.2 Subsection labels when sidebar expanded.

- [x] **Task 6 — Deep links + regression** (AC: 11)
  - [x] 6.1 Replaced `?focus=provider` → `/settings/advanced`.
  - [x] 6.2 Advanced page focuses provider/gemini when `?focus=provider` present.

- [x] **Task 7 — Verification** (AC: 12, all)
  - [x] 7.1 `pnpm --filter @audiblytics/web test` — 123 pass
  - [x] 7.2 `pnpm --filter @audiblytics/web typecheck` — green
  - [x] 7.3 Manual: deferred to author (automated verification green).

### Review Findings (2026-05-31)

- [x] [Review][Patch] API settings fetch could overwrite in-progress drafts [`settings-hub-context.tsx`] — hydrate drafts from API once via `apiDraftHydratedRef`.
- [x] [Review][Patch] Today `rememberLastUsed` PATCHed Postgres on page load in API mode [`today-app.tsx`] — session `practiceOverlay` pre-fills controls without server write until user edits/saves.
- [x] [Review][Patch] Advanced Save allowed empty Gemini PATCH in API mode [`settings-hub-context.tsx`] — require key when none stored.
- [x] [Review][Dismiss] Duplicate sub-nav in hub layout + sidebar — intentional per AC2/AC3.
- [x] [Review][Dismiss] `settings-form.tsx` deprecated shim — no remaining imports.
- [x] [Review][Defer] Hub still renders section forms while API loading — loading banner only; acceptable for n=1.

## Dev Notes

### Authority stack (read in order)

1. `epics.md` § Story 14.7 + **UX-V2-UI7**
2. Mockups: `_bmad-output/design/ui-mockups-v2/index.md` (Settings rows)
3. `14-1-design-tokens-and-app-shell-v2.md` — sidebar active states, Settings footer pattern
4. `architecture.md` § Implementation Patterns — Zod source of truth, `Result<T,E>`, semantic tokens, inline errors, `useLocalStorage` keys `audiblytics.*`
5. `apps/web/src/features/settings/settings-form.tsx` — **port, do not rewrite blind**

### Epic ID correction

| Doc | ID | Screen |
|-----|-----|--------|
| `epics.md` story title line | wrongly cites UX-V2-UI6 | Settings |
| `epics.md` UX table + mockups index | **UX-V2-UI7** | Settings hub |
| UX-V2-UI6 | Review session | 14.6 |

### Brownfield baseline

| Asset | State | 14.7 action |
|-------|--------|-------------|
| `app/settings/page.tsx` | Wraps `SettingsForm` | Redirect + `layout.tsx` hub |
| `settings-form.tsx` | Monolith: provider, defaults, voice, retention, offline-pack | Split into section pages + shared draft hook |
| `SettingsPillTabs.tsx` | In-form tabs | Replace with route sub-nav |
| `settings.schema.ts` | theme, persona, length, retention, voiceURI | Unchanged fields; practice prefs **separate** schema |
| `fetchApiSettings` / `patchApiSettings` | Postgres-backed | Reuse; no new backend fields in 14.7 |
| `sidebar-nav.test.ts` | Settings routes excluded from primary nav | Keep passing |
| Export / delete | **Not implemented** | Disabled UI only (AC7) |
| Test Connection API | **Not found** | Disabled button (AC5) |

### Mockup → route map

| Mockup | Route | Source logic |
|--------|-------|----------------|
| Practice | `/settings/practice` | theme, persona, length, remember toggle |
| Advanced Audio | `/settings/audio` (lower section) | voice + placeholders |
| Data & Storage | `/settings/data` | retention, offline pack, disabled export/delete |
| Advanced (AI) | `/settings/advanced` | gemini (API) or provider vault (local) |
| Appearance | `/settings/appearance` | disabled dark/accent/size |
| About | `/settings/about` | static info |

### Suggested file layout

```
apps/web/src/
  app/settings/
    layout.tsx          # SettingsHubLayout + provider
    page.tsx            # redirect → practice
    practice/page.tsx
    audio/page.tsx
    data/page.tsx
    advanced/page.tsx
    appearance/page.tsx
    about/page.tsx
  features/settings/
    settings-hub-context.tsx
    settings-practice-page.tsx
    settings-advanced-page.tsx
    ... (other section pages)
    settings-card-row.tsx
  lib/navigation/settings-nav.ts
  lib/schemas/practice-prefs.schema.ts
  lib/settings/apply-last-used-practice.ts
```

### `rememberLastUsed` behavior (Today)

1. On Today mount, read `audiblytics.practicePrefs`.
2. If `rememberLastUsed === true` and `lastUsed` is set, initialize session theme/persona/length from `lastUsed` (after API settings fetch merges in API mode for server-backed fields — **lastUsed is client overlay for UX only**).
3. On successful Practice **Save**, write `lastUsed` from saved theme/persona/length.

### API mode split

| Field | Storage |
|-------|---------|
| theme, persona, length, retention, voiceURI | Postgres via `/api/v1/settings` |
| geminiApiKey | Postgres (hashed; `hasGeminiApiKey` flag) |
| rememberLastUsed, lastUsed | `audiblytics.practicePrefs` localStorage only |
| provider keys (local mode) | `audiblytics.providerKeys` |

### Architecture references

- **AR15 / NFR14:** n=1; keys in browser for local mode — unchanged
- **NFR28:** colocate under `features/settings/` + `lib/settings/` + `lib/navigation/`
- **Enforcement:** no arbitrary Tailwind; Zod for `practicePrefs`; `'use client'` only where needed

### Previous story intelligence (14.6)

- StatRail suppression pattern **does not** apply to settings
- `FeatureRouteShell` + honest empty/disabled copy pattern from Review/Collection
- Prefer extracting pure helpers + `node:test` over component snapshot tests

## References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 14.7]
- [Source: `_bmad-output/design/ui-mockups-v2/index.md`]
- [Source: `apps/web/src/features/settings/settings-form.tsx`]
- [Source: `apps/web/src/lib/schemas/settings.schema.ts`]
- [Source: `apps/web/src/lib/api/settings.ts`]
- [Source: `apps/web/src/lib/navigation/sidebar-nav.test.ts`]
