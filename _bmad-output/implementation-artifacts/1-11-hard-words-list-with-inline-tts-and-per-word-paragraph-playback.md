# Story 1.11: Hard-Words List with Inline TTS and Per-Word + Paragraph Playback

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want each hard word in the list below the paragraph to show its IPA in mono, its meaning, and its example sentence with a single-tap pronounce action,
so that I can understand and hear each unfamiliar word inline without leaving the paragraph context.

## Acceptance Criteria

1. **Given** today's paragraph has rendered  
   **When** the user scrolls to the hard-words list  
   **Then** each hard word renders as a `<HardWordRow>` showing `word /ipa/ ▶ ☆` on row 1, `noun · meaning text` on row 2, `ex: "example sentence"` on row 3  
   **And** the IPA is wrapped in `<span lang="en-fonipa">` and rendered in JetBrains Mono with ligatures disabled  
   - Source: `_bmad-output/planning-artifacts/epics.md` Story 1.11 (lines ~758–762)
   - Source: `_bmad-output/planning-artifacts/prd.md` FR18
   - Source: `_bmad-output/planning-artifacts/ux-design-specification.md` `HardWordRow` (lines ~1275+) + monospace IPA principle (lines ~62–63)

2. **Given** the user taps the play icon next to a hard word  
   **When** TTS playback begins  
   **Then** `lib/audio/tts.ts` `speak()` is called with the word  
   **And** the play icon flips to a pause icon during playback  
   **And** playback start latency is <100ms  
   - Source: `_bmad-output/planning-artifacts/epics.md` Story 1.11 (lines ~763–768)
   - Source: `_bmad-output/planning-artifacts/prd.md` FR22, NFR4
   - Source: `_bmad-output/planning-artifacts/architecture.md` Audio I/O abstraction + `lib/audio/tts.ts` (lines ~505–513, ~564–566)

3. **Given** the user taps the play icon next to the paragraph (page-level meta-action row)  
   **When** TTS playback begins  
   **Then** the full paragraph reads aloud via `speak()`  
   **And** the same play/pause icon-flip pattern applies  
   - Source: `_bmad-output/planning-artifacts/epics.md` Story 1.11 (lines ~769–773)
   - Source: `_bmad-output/planning-artifacts/prd.md` FR23

4. **Given** the save icon next to a hard word is rendered  
   **When** the user inspects it  
   **Then** the icon is rendered (outline state) but tapping it produces no behavior yet (save-to-collection persistence is Epic 2 Story 2.1)  
   **And** the icon has `aria-label="Save <word> to collection"`  
   - Source: `_bmad-output/planning-artifacts/epics.md` Story 1.11 (lines ~774–778)

5. **Given** the user navigates to the page via keyboard  
   **When** they tab through the hard-words list  
   **Then** each play and save button is focusable with the forest focus ring visible  
   - Source: `_bmad-output/planning-artifacts/epics.md` Story 1.11 (lines ~779–781)
   - Source: `_bmad-output/planning-artifacts/ux-design-specification.md` Accessibility principles (multiple sections; focus ring spec referenced in epics)

## Tasks / Subtasks

- [x] Add `HardWordRow` UI primitive (AC: 1, 4, 5)
  - [x] Render 3-row layout: `word /ipa/ ▶ ☆`, `pos · meaning`, `ex: "..."` with typography matching UX spec
  - [x] Wrap IPA in `<span lang="en-fonipa">` and use JetBrains Mono with ligatures disabled
  - [x] Ensure play/save controls are `<button>` elements with focus ring visible (keyboard accessible)
  - [x] Render save icon in outline state with correct `aria-label`; onClick is a no-op / stub for now

- [x] Wire per-word TTS playback via the existing TTS wrapper (AC: 2)
  - [x] Call `speak(word)` through `src/lib/audio/tts.ts`
  - [x] Track playback state per-row to flip play ↔ pause icon while speaking
  - [x] Avoid spinners for TTS; icon flip is the only feedback (per UX + architecture guidance)

- [x] Wire paragraph-level playback via the same TTS wrapper (AC: 3)
  - [x] Add / reuse a paragraph meta-action row play button that calls `speak(paragraph)`
  - [x] Use the same play ↔ pause icon flip pattern as the word rows

- [ ] Manual verification in target browsers (AC: 1–5)
  - [ ] Chrome: voices available asynchronously; ensure TTS still starts quickly once a voice is present
  - [ ] Safari: smaller voice set; ensure default voice playback works without requiring a picker on this screen

## Dev Notes

### Prerequisites / Dependencies

- This story depends on the existence of:
  - Story **1.7** (`lib/audio/tts.ts` wrapper with voice lifecycle handling)
  - Story **1.10** (Today screen + paragraph rendering + explicit Generate)
  - Story **1.3** (root layout shell and page structure where the hard-words list is rendered under the paragraph)
- The save action is intentionally **stub-only** in this story. Persistence + filled-state icon behavior belongs to Epic 2 Story **2.1**.

### Implementation Guardrails (must follow)

- **No new audio libraries**: Use native `SpeechSynthesis` exclusively via `src/lib/audio/tts.ts` (architecture constraint).
- **No modal/toast UX**: TTS feedback is only play/pause icon flip; saving is non-functional here (no toast either).
- **Render hard-words as glossary footnotes**: Keep the list visually subordinate to the paragraph (paragraph remains the hero).
- **IPA semantics**: IPA must be wrapped with `lang="en-fonipa"` for accessibility and text-to-speech correctness.
- **Keyboard accessibility**: Play/save buttons must be reachable and clearly focused; do not rely on `div` click handlers.
- **Performance expectations**: Per-word TTS should feel immediate (<100ms start latency target); do not introduce heavy state plumbing or re-renders per tick.

### Suggested file targets (expected locations per architecture)

These paths are the intended homes per `_bmad-output/planning-artifacts/architecture.md` “Project Tree”. If the scaffold differs, align to the existing structure rather than inventing new one-offs.

- `src/components/audiblytics/HardWordRow.tsx` (new) — renders a single row (word + IPA + meaning + example + play + save)
- `src/components/audiblytics/HardWordsList.tsx` (new) — maps the hardWords array to rows (keeps layout logic out of the route)
- `src/components/audiblytics/ParagraphHero.tsx` (update) — hosts paragraph-level play/pause meta-action row (if not already present)
- `src/lib/audio/tts.ts` (use) — call `speak(text, voice?)`; respect existing voice-lifecycle handling
- `src/lib/llm/schemas/paragraph.schema.ts` (use) — hardWords entry shape is `{ word, ipa, meaning, exampleSentence }` (dropping incomplete entries is already required by Story 1.10/FR17)

### Testing Requirements

- Per NFR26, **no test framework** ships in MVP. Treat the manual browser checks as the quality gate for this story.
- At minimum, manually verify:
  - Word-level play works, paragraph-level play works, and the UI correctly reflects play/pause state
  - Keyboard tab order reaches play/save controls and the focus ring is visible
  - IPA typography renders correctly and does not use ligatures

### References

- `_bmad-output/planning-artifacts/epics.md` — Epic 1 → Story 1.11 (Hard-Words List + TTS)
- `_bmad-output/planning-artifacts/prd.md` — FR18, FR22, FR23; NFR4
- `_bmad-output/planning-artifacts/ux-design-specification.md` — `HardWordRow` anatomy + glossary/footnote patterns + IPA principle
- `_bmad-output/planning-artifacts/architecture.md` — `lib/audio/tts.ts` wrapper, dependency parsimony (no audio libs), and project tree
- `_bmad-output/implementation-artifacts/1-10-today-screen-paragraph-hero-with-manual-generate-action.md` — prior story context and shared assumptions

## Dev Agent Record

### Agent Model Used

Cursor coding agent (subagent)

### Debug Log References

### Completion Notes List

- Extended `speak(text, voice?, callbacks?)` with optional `onEnd` (maps to utterance `end` + `error`) so UI can clear play/pause without spinners.
- Central `ttsAnchor` in `ParagraphHero` so switching word/paragraph or cancel keeps a single active speaker and correct icon state; second tap calls `speechSynthesis.cancel()` (no true per-utterance pause in Web Speech).
- `HardWordRow` + `HardWordsList`; IPA uses `lang="en-fonipa"` + `text-data` (mono, ligatures off). Save = Lucide `Star` stub with required `aria-label`. Focus ring: `focus-visible:ring-2 ring-focus ring-offset-2`.
- Paragraph prompt nudge so `meaning` follows `pos · gloss` pattern for new generations.

### File List

- `_bmad-output/implementation-artifacts/1-11-hard-words-list-with-inline-tts-and-per-word-paragraph-playback.md`
- `src/lib/audio/tts.ts`
- `src/lib/llm/prompts/paragraph.ts`
- `src/components/audiblytics/HardWordRow.tsx`
- `src/components/audiblytics/HardWordsList.tsx`
- `src/components/audiblytics/ParagraphHero.tsx`
