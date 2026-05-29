# Story 1.10: Today Screen — Paragraph Hero with Manual Generate Action

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want the `/` route to render the Today screen with the current paragraph in the editorial paragraph-hero style and a Generate action that is explicit (not auto-fired on app load),
so that paragraph generation respects my intent and the loading state is predictable.

## Acceptance Criteria

1. **Given** onboarding has completed and a paragraph exists in the LLM response in memory  
   **When** the Today route renders  
   **Then** `<ParagraphHero>` displays the paragraph in `text-paragraph-hero` (EB Garamond, text-xl, line-height 1.7, max-w-640, centered)  
   **And** the page title row reads `Today` + meta-line `Day N · Theme · Persona`  
   - Source: `_bmad-output/planning-artifacts/epics.md` Story 1.10 (lines ~709–747)
   - Source: `_bmad-output/planning-artifacts/ux-design-specification.md` `ParagraphHero` + typography table (lines ~1246–1272, ~661–676)

2. **Given** the user has not yet generated today's paragraph  
   **When** the Today route renders  
   **Then** the paragraph zone shows a `Generate` primary button (forest, single tap) with the current theme/persona/length displayed beneath  
   **And** no auto-generation fires on app load  
   - Source: `_bmad-output/planning-artifacts/epics.md` Story 1.10 (lines ~722–726)

3. **Given** the user clicks Generate  
   **When** the LLM call is in flight  
   **Then** the paragraph zone shows a 3-line cream-dim skeleton loader  
   **And** the Generate button shows inline mini-spinner + text "Generating…" + button disabled  
   **And** the rest of the layout shell (TopNav, DayRail, StatRail, HonestyFooter) remains visible (no full-page overlay)  
   - Source: `_bmad-output/planning-artifacts/epics.md` Story 1.10 (lines ~727–732)
   - Source: `_bmad-output/planning-artifacts/ux-design-specification.md` `ParagraphHero` states (lines ~1261–1265)

4. **Given** the LLM returns a successful `Result.ok(paragraphResult)`  
   **When** the response is received  
   **Then** the paragraph renders within the 640px column  
   **And** generation completes in ≤15s end-to-end on Gemini Flash for a 150-word paragraph  
   - Source: `_bmad-output/planning-artifacts/epics.md` Story 1.10 (lines ~733–737)
   - Source: `_bmad-output/planning-artifacts/prd.md` NFR2

5. **Given** the user's collection is empty (cold-start) and they click Generate  
   **When** the LLM is called  
   **Then** the prompt builder omits the recycle-words section and requests only new advanced words  
   **And** no error surfaces  
   - Source: `_bmad-output/planning-artifacts/epics.md` Story 1.10 (lines ~738–742)
   - Source: `_bmad-output/planning-artifacts/prd.md` FR16

6. **Given** any hard-word in the LLM response is missing one of `word`, `ipa`, `meaning`, or `exampleSentence`  
   **When** the response is rendered  
   **Then** that specific entry is silently dropped (not rendered as partial)  
   **And** the remaining valid entries render normally  
   - Source: `_bmad-output/planning-artifacts/epics.md` Story 1.10 (lines ~743–746)
   - Source: `_bmad-output/planning-artifacts/prd.md` FR17

## Tasks / Subtasks

- [x] Implement Today route shell content for paragraph zone (AC: 1–3)
  - [x] Render page title row `Today` + meta-line `Day N · Theme · Persona`
  - [x] Render paragraph zone as one of: Empty-state → Generate CTA, Loading → skeleton, Rendered → `<ParagraphHero>`

- [x] Wire explicit Generate action (no auto-fire) (AC: 2–4)
  - [x] Create a click handler that triggers the LLM generation call only on user intent
  - [x] Disable the Generate button while in-flight; render mini-spinner + “Generating…”

- [x] Add loading skeleton in paragraph zone (AC: 3)
  - [x] Use 3-line cream-dim skeleton blocks inside the paragraph zone (not a full-page overlay)

- [x] Ensure cold-start behavior is non-erroring (AC: 5)
  - [x] When recycle pool has <2 words, prompt-builder must omit recycle section (no special UI)

- [x] Guard against partial hard-word entries (AC: 6)
  - [x] Filter invalid hardWords entries before rendering downstream components

## Dev Notes

### Prerequisites / Dependencies

- This story assumes the codebase scaffold and core layout shell exist.
  - Likely prerequisites: Story **1.1** (project scaffold), Story **1.3** (root layout shell with TopNav/rails/footer), Story **1.5** (LLM provider abstraction), Story **1.12** (inline error surface).
- There is currently no Next.js `src/` tree in the repo; implementation will be blocked until scaffolding is implemented.

### Implementation Guardrails (must follow)

- **No auto-generation on mount**: Generation must be initiated only by the explicit `Generate` action (PRD FR14; Epic 1 Story 1.10).
- **Keep the shell visible during loading**: Only the paragraph zone changes state; do not introduce full-page overlays (UX `ParagraphHero` loading state).
- **Reading column cap**: Keep the paragraph in a **max 640px** centered reading column; use the `text-paragraph-hero` typographic class (UX typography system + `ParagraphHero` anatomy).
- **Data + errors are typed**: Architecture standard is `Result<T, E>` for fallible operations; do not throw for normal LLM failures. (Architecture “Error format” guidance.)
- **No toast/modals for success**: State change is the feedback (UX principle echoed in epics + UX spec).

### Suggested file targets (expected locations per architecture)

These paths are the intended homes per `_bmad-output/planning-artifacts/architecture.md` “Project Tree”. If the scaffold differs, update the story implementation accordingly rather than inventing new structure.

- **Route**: `src/app/page.tsx` (Today route)
- **Paragraph UI**: `src/components/audiblytics/ParagraphHero.tsx`
- **Generate flow hook**: `src/features/paragraph/use-generate-paragraph.ts`
- **Same-day cache hook (future tie-in)**: `src/features/paragraph/use-paragraph-of-the-day.ts` (PRD FR19)
- **LLM call**: `src/lib/llm/generate.ts` (returns `Result.ok/err`)
- **LLM response schema**: `src/lib/llm/schemas/paragraph.schema.ts`
- **Prompt builder**: `src/lib/llm/prompts/paragraph.ts` (must omit recycle section on cold-start)
- **Utilities**: `src/lib/utils.ts` for `cn()`

### UX details to carry into implementation

- `ParagraphHero` should be an `<article>` with:
  - `max-width: 640px`
  - serif font (EB Garamond), `text-xl`, `line-height: 1.7`
  - `aria-label="Today's paragraph, theme: <Theme>"`
  - Source: `_bmad-output/planning-artifacts/ux-design-specification.md` `ParagraphHero` section (lines ~1246–1272)

### References

- `_bmad-output/planning-artifacts/epics.md` — Epic 1 → Story 1.10 (Today Screen)
- `_bmad-output/planning-artifacts/ux-design-specification.md` — Typography System; `ParagraphHero`
- `_bmad-output/planning-artifacts/architecture.md` — Stack, folder decision tree, Result pattern, and target file layout
- `_bmad-output/planning-artifacts/prd.md` — FR14/FR16/FR17; NFR2

## Dev Agent Record

### Agent Model Used

Cursor agent

### Debug Log References

### Completion Notes List

- `/` post-onboarding: Today header + paragraph zone (empty / loading skeleton + disabled Generate with spinner / `ParagraphHero`). No `generateParagraph` on mount; onboarding gate unchanged (1.8).
- `useGenerateParagraph` calls `generateParagraph` with persisted `settings` + dynamic `import('@/lib/llm/client')` for `getProvider`; `recycleWords: []` for cold-start.
- `buildPrompt` omits recycle-word clause unless `recycleWords.length >= 2`.
- `filterValidHardWords` in paragraph schema; `ParagraphHero` renders filtered hard words only.
- Verified: `pnpm exec tsc --noEmit`, `pnpm build` (pass).

### File List

- `src/app/page.tsx`
- `src/components/audiblytics/ParagraphHero.tsx`
- `src/features/paragraph/use-generate-paragraph.ts`
- `src/lib/llm/schemas/paragraph.schema.ts`
- `src/lib/llm/prompts/paragraph.ts`
- `_bmad-output/implementation-artifacts/1-10-today-screen-paragraph-hero-with-manual-generate-action.md`
