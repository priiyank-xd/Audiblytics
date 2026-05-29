# Story 1.12: Inline Error Surface with Two-Action Recovery

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want any LLM generation failure to render an inline error surface (NOT a modal) in the paragraph zone with `[Retry]` and `[Open Settings]` actions, brick-text headline, and ink-soft body explaining the error,
so that errors feel like content that hasn't loaded rather than a blue screen, and recovery is one tap away.

## Acceptance Criteria

1. **Given** `lib/llm/generate.ts` returns `Result.err(LlmError)` after retries are exhausted  
   **When** the Today route receives the error  
   **Then** `<InlineErrorSurface>` replaces the paragraph zone (NOT a modal, NOT a toast, per UX-DR24, UX-DR33)  
   **And** the error headline appears in `--brick` text (brick reserved for Day-14 + error surfaces only)  
   **And** the body text in `--ink-soft` describes the provider-specific error with concrete details (provider name + native code when available)  
   **And** the layout shell (TopNav, DayRail, StatRail, HonestyFooter) remains visible  
   - Source: `_bmad-output/planning-artifacts/epics.md` Story 1.12 (lines ~793–799)
   - Source: `_bmad-output/planning-artifacts/ux-design-specification.md` `InlineErrorSurface` + Flow 4 J4 (lines ~1026–1065, ~1619–1648)

2. **Given** the surface is rendered  
   **When** the user inspects the action buttons  
   **Then** `[Retry]` and `[Open Settings]` buttons are visible  
   **And** the third action `[Use Offline Pack]` is **hidden** until Epic 8 (staged feature)  
   **And** buttons use the secondary/outline styling (per UX button hierarchy)  
   **And** `role="alert" aria-live="assertive"` is set on the surface container  
   - Source: `_bmad-output/planning-artifacts/epics.md` Story 1.12 (lines ~800–805)
   - Source: `_bmad-output/planning-artifacts/ux-design-specification.md` `InlineErrorSurface` variants + accessibility (lines ~1634–1648)

3. **Given** the user taps `[Retry]`  
   **When** the click fires  
   **Then** the same user-intent paragraph generation call is re-issued (a fresh `generateParagraph()` call, not internal `withRetry` logic)  
   **And** while retrying, the Retry button shows a mini-spinner and the other action button is disabled  
   **And** on success, the error surface unmounts and the paragraph zone returns to the normal rendered state  
   - Source: `_bmad-output/planning-artifacts/epics.md` Story 1.12 (lines ~806–810)
   - Source: `_bmad-output/planning-artifacts/ux-design-specification.md` `InlineErrorSurface` states (lines ~1638–1642)

4. **Given** the user taps `[Open Settings]`  
   **When** the route changes  
   **Then** the user lands on `/settings` with the provider dropdown in focused state  
   - Source: `_bmad-output/planning-artifacts/epics.md` Story 1.12 (lines ~811–814)

5. **Given** the `ProviderChip` in the HonestyFooter  
   **When** the most recent LLM call has just failed  
   **Then** the chip's status dot turns brick  
   **And** the chip remains clickable and navigates to Settings on tap  
   - Source: `_bmad-output/planning-artifacts/epics.md` Story 1.12 (lines ~815–819)
   - Source: `_bmad-output/planning-artifacts/epics.md` UX-DR17 (line ~220)

## Tasks / Subtasks

- [x] Build `InlineErrorSurface` component (AC: 1–3)
  - [x] Create `src/components/audiblytics/InlineErrorSurface.tsx` (named export; `"use client"`)
  - [x] Props include a typed `error: LlmError` and two callbacks: `onRetry()` and `onOpenSettings()`
  - [x] Render brick headline with the provider name + short failure summary; render body text in ink-soft with error code when present
  - [x] Render **two** outline/secondary buttons: `[Retry]` and `[Open Settings]` (no Offline Pack button in this story)
  - [x] Accessibility: container `role="alert" aria-live="assertive"`, decorative icon `aria-hidden`, button group is tabbable and in DOM order

- [x] Wire paragraph-zone error replacement on Today route (AC: 1–3)
  - [x] Update `src/components/audiblytics/ParagraphHero.tsx` (or the Today route, depending on current architecture) to render:
    - rendered paragraph state
    - loading skeleton state
    - **error** state that swaps paragraph zone → `<InlineErrorSurface />`
  - [x] Ensure only the center paragraph zone swaps; the shell remains visible (no full-page overlays)

- [x] Ensure Retry is user-intent retry (AC: 3)
  - [x] Implement Retry to re-invoke the same “Generate” action (fresh call) rather than relying on internal retry helper
  - [x] During retry: show mini-spinner on Retry; disable Open Settings
  - [x] On retry success: unmount surface and show new paragraph
  - [x] On retry failure: keep surface mounted and update displayed error details (do not “stack” errors)

- [x] Add `ProviderChip` minimal implementation and wire to failure state (AC: 5)
  - [x] Create `src/components/audiblytics/ProviderChip.tsx` (named export; `"use client"`)
  - [x] Chip shows mono provider label + status dot:
    - forest: last call succeeded (or no call yet)
    - brick: last call failed
  - [x] Clicking the chip navigates to `/settings`
  - [x] Wire chip status via localStorage-backed state (preferred): add a small `audiblytics.lastLlmCallStatus` key updated by the generate flow (success/fail)
    - Success path sets forest
    - Error path sets brick

- [x] Settings deep-link focus behavior (AC: 4)
  - [x] In `src/app/settings/page.tsx` (or the provider select component), support a query param like `/settings?focus=provider` that auto-focuses the provider `<Select>` trigger
  - [x] Ensure focus respects keyboard navigation (no scroll-jank, no focus trap)

- [ ] Manual verification (AC: 1–5)
  - [ ] Simulate an LLM failure (e.g., invalid key / forced network failure) and confirm InlineErrorSurface appears in paragraph zone
  - [ ] Verify Retry updates UI to retrying state; on success, paragraph returns
  - [ ] Verify Open Settings navigates and focuses provider dropdown
  - [ ] Verify ProviderChip dot turns brick after a failure and navigates to Settings on click

## Dev Notes

### Prerequisites / Dependencies

- Story **1.10** (Today route + paragraph zone states + explicit Generate) is the primary consumer of this surface.
- Story **1.5** defines `LlmError` and the `Result<T, E>` pattern returned from `lib/llm/generate.ts`.
- Story **1.3** provides the layout shell and the HonestyFooter region where ProviderChip lives.
- This repo currently contains planning + story artifacts only (no `src/` tree at story-creation time). Implementation will be blocked until Story 1.1 scaffolding is executed and the Next.js project exists on disk.

### Implementation Guardrails (must follow)

- **Inline, not modal**: This surface replaces the paragraph zone only. No toast, no dialog, no sheet.
- **Brick discipline**: Brick is for errors (and Day-14 “No” later). Do not introduce brick elsewhere.
- **No extra actions**: Two actions only in Epic 1. The Offline Pack action is deferred to Epic 8 (Story 8.4).
- **Result-shaped errors**: LLM failures surface as `Result.err(LlmError)`; do not throw for normal LLM failures.
- **No new dependencies**: Build using existing shadcn Button + tokens; no toast libraries, no alert components.

### Suggested file targets (expected locations per architecture)

These paths are the intended homes per `_bmad-output/planning-artifacts/architecture.md` “Project Tree”. If the scaffold differs, align to the existing structure rather than inventing new one-offs.

- `src/components/audiblytics/InlineErrorSurface.tsx` (new)
- `src/components/audiblytics/ProviderChip.tsx` (new)
- `src/components/audiblytics/HonestyFooter.tsx` (update) — use `<ProviderChip />` instead of inline placeholder text
- `src/components/audiblytics/ParagraphHero.tsx` (update) — render error state as InlineErrorSurface in paragraph zone
- `src/app/page.tsx` (update) — wires Today route error state from generate hook to ParagraphHero
- `src/app/settings/page.tsx` (update) — supports `?focus=provider` focus behavior
- `src/features/paragraph/use-generate-paragraph.ts` (update) — sets last-call success/fail status + exposes retry
- `src/lib/storage/use-local-storage.ts` (use) — to persist last-call status (namespaced key)
- `src/lib/llm/types.ts` (use) — `LlmError` shape

### Storage key for ProviderChip last-call status (recommended)

- `audiblytics.lastLlmCallStatus`: `{ ok: boolean; lastProvider: ActiveProvider; lastErrorKind?: LlmError['kind']; at: string }`
- Keep it namespaced and Zod-validated (through `useLocalStorage`) per architecture localStorage rules.

### Testing Requirements

- Per NFR26, **no test framework** in MVP. Treat the manual verification list as the quality gate for this story.

### Pre-existing files this story modifies (UPDATE — read before editing)

At story-creation time, there are no code files present in the repo yet. Once Story 1.1 scaffolding lands, expect these to be UPDATE targets for this story and read them fully before modifying:

- `src/components/audiblytics/ParagraphHero.tsx`
- `src/app/page.tsx`
- `src/components/audiblytics/HonestyFooter.tsx`
- `src/app/settings/page.tsx`
- `src/features/paragraph/use-generate-paragraph.ts`

### References

- `_bmad-output/planning-artifacts/epics.md` — Story 1.12 (Inline Error Surface), UX-DR17 (ProviderChip), UX-DR24 (InlineErrorSurface)
- `_bmad-output/planning-artifacts/ux-design-specification.md` — Flow 4 (J4), `InlineErrorSurface` component spec + accessibility
- `_bmad-output/planning-artifacts/architecture.md` — Result pattern, error model (`LlmError`), inline-error rendering rule, token discipline, folder decision tree
- `_bmad-output/implementation-artifacts/1-10-today-screen-paragraph-hero-with-manual-generate-action.md` — consumer story context
- `_bmad-output/implementation-artifacts/1-5-llm-provider-abstraction-schema-validation-retry-and-error-parsing.md` — `LlmError` shape + retry semantics (internal)

## Dev Agent Record

### Agent Model Used

GPT-5.2 → Claude Opus 4.5 (implementation)

### Debug Log References

### Completion Notes List

- `InlineErrorSurface` + Today paragraph zone wiring; `ProviderChip` + `audiblytics.lastLlmCallStatus` Zod schema; generate/onboarding write status; `useLocalStorage` same-tab sync (`audiblytics-storage-sync`) so footer chip updates after generation; settings `?focus=provider` via Suspense + double `rAF` focus; `pnpm exec tsc --noEmit` + `pnpm run build` pass.

### File List

- `src/lib/schemas/last-llm-call-status.schema.ts` (new)
- `src/components/audiblytics/InlineErrorSurface.tsx` (new)
- `src/components/audiblytics/ProviderChip.tsx` (new)
- `src/lib/storage/use-local-storage.ts` (update)
- `src/features/paragraph/use-generate-paragraph.ts` (update)
- `src/app/page.tsx` (update)
- `src/components/audiblytics/HonestyFooter.tsx` (update)
- `src/components/audiblytics/OnboardingShell.tsx` (update)
- `src/features/settings/settings-form.tsx` (update)
- `src/app/settings/page.tsx` (update)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (update)
- `_bmad-output/implementation-artifacts/1-12-inline-error-surface-with-two-action-recovery.md` (update)
