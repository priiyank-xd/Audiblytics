# Story 1.8: Onboarding Flow — Provider Selection, Key Entry, Defaults, First Generate

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a first-time user (Priyank, Day 0),
I want a single-screen onboarding with provider dropdown (Gemini default), API key paste field with "Get a free key" deep-link, theme/persona/length defaults, and a single Generate button,
So that I reach my first paragraph in ≤3 minutes from cold start.

## Acceptance Criteria

> Sourced verbatim from `epics.md § Story 1.8` (lines 631–666). Re-formatted as numbered AC for traceability.

1. **AC1 — First run routes to onboarding** (per UX-DR25). Given the user loads the app for the first time (empty `audiblytics.providerKeys` in localStorage), when the app mounts, then the route resolves to `<OnboardingShell>` instead of the Today screen.
2. **AC2 — Onboarding headline**. Given the OnboardingShell has rendered, then the headline reads **"Welcome to Audiblytics."** in EB Garamond `text-3xl`.
3. **AC3 — Provider select + helper copy** (per FR1). Given the OnboardingShell has rendered, then the PROVIDER select shows `Google Gemini (Free)` pre-selected with options for OpenAI, Anthropic, OpenRouter, Ollama. And a helper line under the select reads **"Free tier — no payment required."**
4. **AC4 — “Get a free key” deep-link** (per FR3). Given the OnboardingShell has rendered, then a "→ Get a free key" link opens the active provider's signup URL in a new tab with `target="_blank" rel="noopener noreferrer"`.
5. **AC5 — API key input behavior** (per UX-DR25). Given the OnboardingShell has rendered, then the API KEY input is `type="password"` and is autofocused.
6. **AC6 — Defaults controls populated + length constraints** (per FR4, FR5). Given the OnboardingShell has rendered, then THEME, PERSONA, and PARAGRAPH LENGTH selects are populated from the launch lists; PARAGRAPH LENGTH defaults to `150 words` and is constrained to 100–200.
7. **AC7 — Generate persists settings + transitions** (per FR2, FR4–FR8, AR11). Given the user has typed a non-empty API key and clicks Generate, when the LLM call succeeds, then the key, provider, theme, persona, length are persisted via `useLocalStorage` to `audiblytics.providerKeys`, `audiblytics.activeProvider`, and `audiblytics.settings`; the OnboardingShell unmounts and the Today route renders with the generated paragraph; and no success interstitial/modal appears.
8. **AC8 — Empty key blocks generate** (per UX-DR31). Given the user clicks Generate with an empty API key field, when the click handler runs, then the button remains disabled and no LLM call is made.
9. **AC9 — ≤3 minutes manual measure** (per NFR21). Given the user completes onboarding, when elapsed time from first render to first paragraph is measured manually, then the median session is ≤3 minutes including the Get-a-free-key round-trip.

### BDD format (verbatim mirror of `epics.md § Story 1.8` lines 639–666)

**Given** the user loads the app for the first time (empty `audiblytics.providerKeys` in localStorage)  
**When** the app mounts  
**Then** the route resolves to `<OnboardingShell>` instead of the Today screen (per UX-DR25)  
**And** the headline reads "Welcome to Audiblytics." in EB Garamond text-3xl

**Given** the OnboardingShell has rendered  
**When** the user inspects the form  
**Then** the PROVIDER select shows `Google Gemini (Free)` pre-selected with options for OpenAI, Anthropic, OpenRouter, Ollama (per FR1)  
**And** a helper line under the select reads "Free tier — no payment required."  
**And** a "→ Get a free key" link opens the active provider's signup URL in a new tab with `target="_blank" rel="noopener noreferrer"` (per FR3)  
**And** the API KEY input (type=password) is autofocused (per UX-DR25)  
**And** THEME, PERSONA, and PARAGRAPH LENGTH selects are populated from the launch lists (per FR4, FR5)  
**And** PARAGRAPH LENGTH defaults to `150 words` and is constrained to 100–200 (per FR5)

**Given** the user has typed a non-empty API key and clicks Generate  
**When** the LLM call succeeds  
**Then** the key, provider, theme, persona, length are persisted via `useLocalStorage` to `audiblytics.providerKeys`, `audiblytics.activeProvider`, and `audiblytics.settings` (per FR2, FR4–FR8, AR11)  
**And** the OnboardingShell unmounts and the Today route renders with the generated paragraph  
**And** no "You're all set!" interstitial or success modal appears (per UX-DR30)

**Given** the user clicks Generate with an empty API key field  
**When** the click handler runs  
**Then** the button remains disabled and no LLM call is made (per UX-DR31)

**Given** the user completes onboarding  
**When** elapsed time from first render to first paragraph is measured manually  
**Then** the median session is ≤3 minutes including the Get-a-free-key round-trip (per NFR21)

## Tasks / Subtasks

- [ ] **Task 0 — Pre-req: project scaffold + foundations exist** (AC: all)
  - [ ] 0.1 Confirm Story 1.1 completed (Next.js app scaffold exists with `src/` tree).
  - [ ] 0.2 Confirm Story 1.4 completed (schemas + `useLocalStorage` exist), Story 1.5 completed (LLM provider abstraction + generate helper exist).

- [ ] **Task 1 — Read files being modified (UPDATE — non-negotiable)** (AC: all)
  - [ ] 1.1 Read `src/app/page.tsx` fully. Document: how the Today route is currently composed and where the "first run" decision should live.
  - [ ] 1.2 Read `src/components/audiblytics/OnboardingShell.tsx` fully if it exists; if missing, note it as NEW.
  - [ ] 1.3 Read `src/lib/storage/use-local-storage.ts` fully. Confirm the exact hook signature and the key prefix assertion (`audiblytics.*`) (Story 1.4 AC4–AC8).
  - [ ] 1.4 Read `src/lib/schemas/provider-keys.schema.ts` and `src/lib/schemas/settings.schema.ts` fully. Confirm shapes, defaults, and which settings field (e.g. `length`) is authoritative.
  - [ ] 1.5 Read `src/lib/llm/generate.ts` (or equivalent) fully. Confirm the function that performs paragraph generation, expected inputs (provider/settings/theme/persona/length), and returned `Result` shape.

- [ ] **Task 2 — Implement the first-run router decision in `/`** (AC: 1, 7)
  - [ ] 2.1 In `src/app/page.tsx`, implement: if no provider key is present for the current/selected provider, render `<OnboardingShell />`; else render the Today screen.
  - [ ] 2.2 "First run" definition: treat missing `audiblytics.providerKeys` OR an object with no non-empty key for any provider as first run. (`providerKeysSchema` enforces `min(1)` so empty string must never be persisted.)
  - [ ] 2.3 Keep this decision client-side (page is a client route in this project); do not introduce any server-only branching.

- [ ] **Task 3 — Build `OnboardingShell` single-screen form** (AC: 2–6, 8)
  - [ ] 3.1 Create `src/components/audiblytics/OnboardingShell.tsx` if missing (NEW). It is a client component.
  - [ ] 3.2 UI requirements:
    - Headline text exactly `Welcome to Audiblytics.` (punctuation included), EB Garamond `text-3xl`.
    - Provider `Select` with default choice `Google Gemini (Free)` and options for `OpenAI`, `Anthropic`, `OpenRouter`, `Ollama`.
    - Helper line under provider: `Free tier — no payment required.` (exact text).
    - “→ Get a free key” link uses active provider and opens in new tab with `target="_blank" rel="noopener noreferrer"`.
    - API key input uses `type="password"` and autofocus.
    - Theme/Persona/Length selects populated from schema launch lists (same enums used in `settingsSchema`), length constrained to 100–200, default 150.
    - One primary CTA: `Generate` (disabled until API key non-empty).
  - [ ] 3.3 Implement provider signup URL mapping (no web research; use a constant map in the onboarding feature/component). Requirements:
    - Gemini → Google AI Studio key page
    - OpenAI → API keys page
    - Anthropic → API keys page
    - OpenRouter → keys page
    - Ollama → no external key required; either hide the link for Ollama or make it point to the Ollama download page (choose one and keep it consistent with UX goal: zero confusion, ≤3 minutes).

- [ ] **Task 4 — Persist onboarding selections via `useLocalStorage`** (AC: 7)
  - [ ] 4.1 Use `useLocalStorage` to set:
    - `audiblytics.activeProvider`
    - `audiblytics.providerKeys` (set only the key for the selected provider; preserve existing keys for other providers)
    - `audiblytics.settings` (theme/persona/length + existing defaults like retention/voiceURI preserved unless UX explicitly sets them here)
  - [ ] 4.2 Write behavior constraints:
    - Do not persist the API key until the user clicks Generate (keeps onboarding feeling like preferences, reduces "form debt").
    - Do not perform live key validation or API ping; only enforce non-empty (per PRD Journey 1 + UX spec).

- [ ] **Task 5 — First generate and transition** (AC: 7, 9)
  - [ ] 5.1 On Generate click (with non-empty key), call the canonical paragraph generation function from `src/lib/llm/` using the selected provider + defaults (theme/persona/length).
  - [ ] 5.2 Loading state must be inline/subtle (skeleton or button spinner). Do not add any success modal; the paragraph appearing is success.
  - [ ] 5.3 On successful generation:
    - Ensure persisted values are written (Task 4).
    - Unmount onboarding by making the `/` decision (Task 2) resolve to Today view on next render.
    - Render the generated paragraph immediately in the Today screen.

- [ ] **Task 6 — Manual smoke test** (AC: 1–9)
  - [ ] 6.1 Clear site data for localhost (or clear `audiblytics.*` localStorage keys). Reload `/` and confirm onboarding renders.
  - [ ] 6.2 Confirm API key input is focused and masked.
  - [ ] 6.3 Confirm Generate stays disabled until a non-empty key is entered.
  - [ ] 6.4 Confirm "Get a free key" opens a new tab and uses `noopener noreferrer`.
  - [ ] 6.5 Complete the flow with Gemini and confirm first paragraph renders and onboarding disappears with no success interstitial.
  - [ ] 6.6 Time the flow informally and ensure it is plausibly ≤3 minutes (the UX success criterion).

## Dev Notes

### What this story owns vs. defers

- Owns: First-run onboarding decision for `/` and the single-screen `<OnboardingShell />` with persistence + first generate.
- Defers:
  - Settings route UI and provider-switch key preservation UI (Story 1.9).
  - Today screen paragraph hero styling and explicit Generate action (Story 1.10) beyond what is needed to show the first generated paragraph.

### Guardrails to prevent common mistakes

- **Do not invent new localStorage keys.** Must use `audiblytics.providerKeys`, `audiblytics.activeProvider`, `audiblytics.settings` via `useLocalStorage` (namespaced + Zod-validated).
- **No raw `window.localStorage` access** outside `src/lib/storage/use-local-storage.ts` (Story 1.4 AC8).
- **No “wizard” multi-step onboarding.** This story is explicitly **single-screen** (UX: ≤3 minutes, minimal deliberation).
- **No success modals/toasts.** The first paragraph rendering is the success state (UX philosophy).
- **Key validation is non-empty only** (no live API ping), to keep onboarding fast and avoid provider/network variance.

### Project Structure Notes

- Expected file placements (from architecture.md tree):
  - `src/components/audiblytics/OnboardingShell.tsx`
  - `src/features/onboarding/*` (if you split state machine / validation helpers)
  - `src/app/page.tsx` (first-run gate)
  - Storage + schemas under `src/lib/storage/` and `src/lib/schemas/` already exist from Story 1.4

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` § Story 1.8 (lines 631–666)] — story statement + acceptance criteria
- [Source: `_bmad-output/planning-artifacts/prd.md` § Journey 1 — First-Time Setup (lines ~177–195)] — narrative requirements (provider dropdown default, get-free-key deep link, non-empty-only key validation, first generate explicit)
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` § BYO-key onboarding ≤3 min (NFR21) + Flow 1 diagram + decision points] — UX constraints (single-screen settings, helper copy, generate CTA, no modals)
- [Source: `_bmad-output/planning-artifacts/architecture.md` § localStorage keys table (around lines 612–626)] — required key names + settings object location
- [Source: `_bmad-output/implementation-artifacts/1-4-storage-foundations-dexie-schema-uselocalstorage-hook-base-zod-schemas.md`] — `useLocalStorage` contract and key prefix enforcement

## Dev Agent Record

### Context Reference

- Sprint tracking indicates this story was in backlog and is now contexted as ready-for-dev.
- Prior story intelligence: Storage (`1.4`) and LLM seam (`1.5`) are prerequisites for persisting onboarding defaults and performing first generation.
- No `project-context.md` files were found in the workspace at story-creation time.

### Agent Model Used

Composer (Cursor subagent)

### Debug Log References

### Completion Notes List

- First-run gate uses `isProviderKeysStoragePresent()` in `use-local-storage.ts` (storage key absent vs present) so Ollama-only completion persists `{"ollama":null}` and still exits onboarding, matching AC1 empty-store semantics.
- `getProvider` is dynamically imported inside Generate handler to avoid evaluating `assertClientOnlySafeContext()` during SSR of the client bundle.
- API keys and settings persist only after a successful `generateParagraph` `Result.ok` (AC7). Keys are merged with existing `providerKeys` for other providers.
- Ollama: API key field disabled with “not required” placeholder; Generate enabled without a key. “Get a free key” points at the Ollama download URL.

### File List

- `src/lib/storage/use-local-storage.ts`
- `src/app/page.tsx`
- `src/components/audiblytics/OnboardingShell.tsx`
- `_bmad-output/implementation-artifacts/1-8-onboarding-flow-provider-selection-key-entry-defaults-first-generate.md` (this file — Dev Agent Record only)

