# Story 1.9: Settings Screen — Provider Switch with Key Vault Preservation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want a `/settings` route where I can change provider (preserving previously entered keys), edit theme/persona/length defaults, pick a TTS voice, and have changes take effect on the next paragraph generation,
So that I can experiment with providers and adjust defaults without losing keys or regenerating retroactively.

## Acceptance Criteria

> Sourced verbatim from `epics.md § Story 1.9` (lines 669–706). Re-formatted as numbered AC for traceability.

1. **AC1 — Settings route + sections** (per FR7). Given the user clicks "Settings" in TopNav, when the route renders, then the page shows pill-tabbed sections **Provider / Defaults / Voice / Retention** per UX spec.
2. **AC2 — Provider dropdown + key field**. The active provider is highlighted in the dropdown with all 5 options listed, and the API KEY field for the active provider shows the persisted key (masked).
3. **AC3 — Switch provider preserves old keys + updates active** (per FR9). Given the user switches the active provider from Gemini to OpenAI and pastes a new key, when the user saves, then `audiblytics.providerKeys.openai` is set AND `audiblytics.providerKeys.gemini` is preserved unchanged, and `audiblytics.activeProvider` updates to `openai`.
4. **AC4 — Next generation uses new provider**. After switching provider, the next call to `getProvider(settings)` returns an OpenAI client.
5. **AC5 — Switching back restores previously saved key** (per FR9). Given the user switches back to Gemini, when the page reloads, then the previously stored Gemini key is still present and re-used.
6. **AC6 — Defaults change is not retroactive** (per FR20). Given the user changes theme or persona, when the user saves and then visits Today, then the existing paragraph still displays unchanged (settings change does NOT re-generate retroactively), and the next Generate call uses the new theme/persona.
7. **AC7 — Voice selection persists + voice picker loading state** (per FR8, FR24). Given the user picks a TTS voice, when the user saves, then `audiblytics.settings.voiceURI` updates and subsequent `speak()` calls use the new voice; and if the voice list is still loading, the picker shows "Loading voices…".
8. **AC8 — No success toast/modal on save** (per UX-DR30). Given the Settings save action commits, when the save completes, then no "Saved!" toast or success modal appears — the persisted state IS the feedback.

### BDD format (verbatim mirror of `epics.md § Story 1.9` lines 677–705)

**Given** the user clicks "Settings" in TopNav  
**When** the route renders  
**Then** the page shows pill-tabbed sections (Provider / Defaults / Voice / Retention) per UX §J1 design (per FR7)  
**And** the active provider is highlighted in the dropdown with all 5 options listed  
**And** the API KEY field for the active provider shows the persisted key (masked)

**Given** the user switches the active provider from Gemini to OpenAI and pastes a new key  
**When** the user saves  
**Then** `audiblytics.providerKeys.openai` is set AND `audiblytics.providerKeys.gemini` is preserved unchanged (per FR9)  
**And** `audiblytics.activeProvider` updates to `openai`  
**And** the next call to `getProvider(settings)` returns an OpenAI client

**Given** the user switches back to Gemini  
**When** the page reloads  
**Then** the previously stored Gemini key is still present and re-used (per FR9)

**Given** the user changes theme from Adventure to Horror or persona from Storyteller to Business English  
**When** the user saves and then visits the Today screen  
**Then** the existing paragraph still displays unchanged (settings change does NOT re-generate retroactively, per FR20)  
**And** the next Generate call uses the new theme/persona

**Given** the user picks a TTS voice  
**When** the user saves  
**Then** `audiblytics.settings.voiceURI` updates and subsequent `speak()` calls use the new voice (per FR8)  
**And** if the voice list is still loading, the picker shows "Loading voices…" (per FR24)

**Given** the Settings save action commits  
**When** the save completes  
**Then** no "Saved!" toast or success modal appears (per UX-DR30) — the persisted state IS the feedback

## Tasks / Subtasks

- [ ] **Task 0 — Pre-req: project scaffold + foundations exist** (AC: all)
  - [ ] 0.1 Confirm Story 1.1 completed (Next.js app scaffold exists with `src/` tree).
  - [ ] 0.2 Confirm Story 1.4 completed (schemas + `useLocalStorage` exist and enforce `audiblytics.*` keys).
  - [ ] 0.3 Confirm Story 1.5 completed (LLM provider abstraction exists and Settings can influence `getProvider(settings)`).
  - [ ] 0.4 Confirm Story 1.7 completed (`src/lib/audio/tts.ts` exports `useVoices()` + `speak()` + persisted voice fallback).

- [ ] **Task 1 — Read files being modified (UPDATE — non-negotiable)** (AC: all)
  - [ ] 1.1 Read `src/app/settings/page.tsx` fully if it exists; if missing, note it as NEW.
  - [ ] 1.2 Read `src/features/settings/use-settings.ts` / `settings-form.tsx` if they exist; confirm current state shape and save mechanics.
  - [ ] 1.3 Read `src/features/settings/use-provider-keys.ts` if it exists; confirm how keys are read/updated.
  - [ ] 1.4 Read `src/lib/storage/use-local-storage.ts` fully. Confirm hook signature + Zod-on-read behavior + cross-tab sync.
  - [ ] 1.5 Read `src/lib/schemas/provider-keys.schema.ts` and `src/lib/schemas/settings.schema.ts` fully. Confirm:
    - Provider key storage object shape
    - Settings fields include `voiceURI`, `theme`, `persona`, `length`, `retention`
  - [ ] 1.6 Read `src/lib/llm/client.ts` (or equivalent) that exposes `getProvider(settings)` and confirm which settings fields it consumes (provider + model).
  - [ ] 1.7 Read `src/lib/audio/tts.ts` and confirm how `voiceURI` is interpreted (e.g. matched by `SpeechSynthesisVoice.voiceURI`).

- [ ] **Task 2 — Add `/settings` route UI shell** (AC: 1, 8)
  - [ ] 2.1 Create `src/app/settings/page.tsx` if missing (NEW). It should be a client route (needs localStorage + voices).
  - [ ] 2.2 Render the Settings content inside the existing app shell (TopNav + rails) without introducing modal navigation.
  - [x] 2.3 Implement pill tabs for subsections using a **custom pill tab row** (`SettingsPillTabs` — `Button` primitives only; shadcn `Tabs` banned per Story 1.1):
    - Provider / Defaults / Voice / Retention
  - [ ] 2.4 Provide one Save action for the whole page (bottom-right or bottom-full-width), with **no toast/modal** on success (AC8).

- [ ] **Task 3 — Provider section: provider dropdown + masked key field** (AC: 2, 3, 5)
  - [ ] 3.1 Provider dropdown includes all five providers: Gemini, OpenAI, Anthropic, OpenRouter, Ollama.
  - [ ] 3.2 Provider key input:
    - `type="password"` (masked)
    - shows persisted key value (masked) for the active provider (AC2)
  - [ ] 3.3 Save semantics must preserve previously entered keys:
    - Updating the OpenAI key must not clear Gemini key (AC3)
    - Switching back and reloading must show prior Gemini key (AC5)
  - [ ] 3.4 Ollama behavior:
    - No key required; key field should be disabled/hidden or show “No key required” copy (choose one and keep it consistent with “no confusion” UX).

- [ ] **Task 4 — Defaults section: theme/persona/length persisted, not retroactive** (AC: 6)
  - [ ] 4.1 Allow editing default theme/persona/length using the launch lists and constraints (length 100–200, default 150).
  - [ ] 4.2 Persist changes to `audiblytics.settings` (via `useLocalStorage`).
  - [ ] 4.3 Ensure defaults apply only to the **next** generation (FR20):
    - Do not auto-regenerate
    - Do not mutate cached paragraph content as a side effect of saving settings

- [ ] **Task 5 — Voice section: voice picker + “Loading voices…” state + persistence** (AC: 7)
  - [ ] 5.1 Implement a voice picker that uses `useVoices()` from `src/lib/audio/tts.ts`.
  - [ ] 5.2 If `useVoices()` returns `[]`, show caption text exactly: **"Loading voices…"** (AC7/FR24).
  - [ ] 5.3 Persist the selected voice as `audiblytics.settings.voiceURI`.
  - [ ] 5.4 Ensure subsequent `speak()` calls use the new persisted voice (AC7); do not add another storage key.

- [ ] **Task 6 — Retention section: retention policy persisted** (AC: 1)
  - [ ] 6.1 Expose retention choice `{90-day rolling, indefinite}` and persist to `audiblytics.settings.retention`.
  - [ ] 6.2 No immediate pruning is required in this story; pruning behavior is owned by Voice Journal retention story/hook (but Settings must control the persisted value).

- [ ] **Task 7 — Integration guardrails** (AC: 3, 4, 6, 7, 8)
  - [ ] 7.1 After Save, `audiblytics.activeProvider` and `audiblytics.providerKeys` reflect the selected provider + key(s).
  - [ ] 7.2 Verify that on the next Generate action the LLM provider is resolved from `getProvider(settings)` and matches the saved provider (AC4).
  - [ ] 7.3 Verify settings changes do not re-render the Today paragraph as a new generation (AC6).
  - [ ] 7.4 Verify no toasts/modals are introduced for Save (AC8). The UI should simply reflect persisted values.

- [ ] **Task 8 — Manual smoke tests** (AC: 1–8)
  - [ ] 8.1 Navigate Today → Settings via TopNav; confirm Settings renders pill tabs and defaults to Provider tab.
  - [ ] 8.2 Provider: switch Gemini → OpenAI, paste key, Save; reload; confirm OpenAI is active and Gemini key is still present when switching back.
  - [ ] 8.3 Defaults: change theme/persona, Save; return Today; confirm current paragraph is unchanged; click Generate; confirm new theme/persona used.
  - [ ] 8.4 Voice: if voices not yet loaded, confirm "Loading voices…" state appears; once loaded, pick a voice, Save, and confirm subsequent TTS uses it.
  - [ ] 8.5 Confirm Save produces no "Saved!" UI, toast, or modal.

## Dev Notes

### Guardrails (prevent common implementation mistakes)

- **Key vault preservation is non-negotiable**: `audiblytics.providerKeys` is an object keyed by provider; updating one provider must not wipe others (FR9).
- **No raw `localStorage` in components**: All access must go through the project’s storage wrapper / `useLocalStorage` hook (architecture.md localStorage keys table).
- **No success toasts**: UX explicitly bans them; persisted state + field values are the feedback (AC8).
- **Pill tabs are required**: Settings is a single screen with subsections, not multiple routes and not a wizard.
- **Voice loading lifecycle**: Chrome may return no voices initially; the UI must be able to show "Loading voices…" using `useVoices()` from Story 1.7 (FR24).
- **Non-retroactive defaults**: Changing defaults must not mutate existing cached paragraph display; only future generation reads updated settings (FR20).
- **Dependency parsimony**: Use shadcn primitives already in the stack; do not add settings/form libraries or state managers.

### Project Structure Notes

- Expected file placements (from `architecture.md`):
  - Route: `src/app/settings/page.tsx`
  - Feature: `src/features/settings/use-settings.ts`, `src/features/settings/use-provider-keys.ts`, `src/features/settings/settings-form.tsx`
  - TTS: `src/lib/audio/tts.ts` (already provided by Story 1.7)
  - Storage: `src/lib/storage/use-local-storage.ts`
  - Schemas: `src/lib/schemas/settings.schema.ts`, `src/lib/schemas/provider-keys.schema.ts`

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` § Story 1.9 (lines 669–706)] — story statement + acceptance criteria
- [Source: `_bmad-output/planning-artifacts/prd.md` FR7–FR9, FR20, FR24] — settings route, provider switch + preserve keys, non-retroactive defaults, voice loading
- [Source: `_bmad-output/planning-artifacts/architecture.md` § localStorage keys table (around lines 616–623)] — required key names (`audiblytics.activeProvider`, `audiblytics.providerKeys`, `audiblytics.settings.voiceURI`)
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Frontend project tree (around lines 978–1041)] — intended Settings route and settings feature module locations
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` “Pill tabs in bordered panel — Settings sub-sections” + “No success modals” principles] — UX constraints for Settings UI behavior
- [Source: `_bmad-output/implementation-artifacts/1-7-browser-tts-wrapper-with-voice-lifecycle-handling.md`] — `useVoices()` / `speak()` contract and “Loading voices…” support
- [Source: `_bmad-output/implementation-artifacts/1-8-onboarding-flow-provider-selection-key-entry-defaults-first-generate.md`] — established persistence patterns for provider keys + settings and “no toasts” philosophy

## Dev Agent Record

### Context Reference

- Sprint tracking indicates this story was in backlog and is now contexted as ready-for-dev.
- Previous story intelligence available:
  - `1-8-onboarding-flow-provider-selection-key-entry-defaults-first-generate.md` (persistence + no-toast UX)
  - `1-7-browser-tts-wrapper-with-voice-lifecycle-handling.md` (voice lifecycle + persisted voice fallback)
- No `project-context.md` files were found in the workspace at story-creation time.

### Agent Model Used

Composer (subagent).

### Debug Log References

- `pnpm build` initially failed: static import of `@/lib/llm/client` in `settings-form.tsx` pulled `assertClientOnlySafeContext()` during `/settings` prerender. Fixed by dynamic `import('@/lib/llm/client')` inside Save handler (same pattern as `OnboardingShell`).

### Completion Notes List

- Pill tabs implemented as `SettingsPillTabs` (`src/components/audiblytics/SettingsPillTabs.tsx`) using allowed `Button` variants — no shadcn `Tabs`.
- Settings form hydrates drafts from `useLocalStorage` after read so keys/settings match persisted values on first paint.
- Provider `getProvider` validation on Save uses dynamic import to keep Story 1.6 client-only boundary compatible with static generation.

### File List

- `src/app/settings/page.tsx` (NEW)
- `src/components/audiblytics/SettingsPillTabs.tsx` (NEW)
- `src/features/settings/settings-form.tsx` (NEW)
- `_bmad-output/implementation-artifacts/1-9-settings-screen-provider-switch-with-key-vault-preservation.md` (Dev Agent Record + status)

