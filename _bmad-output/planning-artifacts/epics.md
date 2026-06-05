---
stepsCompleted: ['step-01-extract-requirements', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation', 'v2-backend-epics-9-13', 'ui-redesign-epic-14', 'epic-15-api-parity-pending']
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/architecture-v2-fastapi-backend.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
  - '_bmad-output/planning-artifacts/implementation-readiness-report-2026-05-30.md'
  - '_bmad-output/design/ui-mockups-v2/index.md'
---

# Audiblytics - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Audiblytics, decomposing the requirements from the PRD, UX Design Specification, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

**Onboarding & Settings**

- **FR1:** User can select an LLM provider from {Google Gemini, OpenAI, Anthropic, OpenRouter, Ollama (local)}, with Google Gemini selected by default on first run.
- **FR2:** User can enter and save an LLM API key for the selected provider; the key is persisted across browser sessions.
- **FR3:** User can access a "Get a free key" deep-link from the onboarding screen that opens the chosen provider's signup page in a new tab.
- **FR4:** User can select default theme (from launch list: horror, comedy, adventure, mystery, sci-fi, slice-of-life) and default persona (from launch list: GRE Aspirant, Business English, Storyteller, Casual Conversationalist) and have the selections persist across sessions.
- **FR5:** User can adjust default paragraph length within a 100–200 word range (default 150) and have the selection persist.
- **FR6:** User can select the Voice Journal retention policy from {90-day rolling, indefinite}; the default is 90-day rolling.
- **FR7:** User can access and modify any setting after initial onboarding via a Settings screen reachable from the app's main navigation.
- **FR8:** User can select a TTS voice from those available in the browser, with the highest-quality English voice (per browser) selected by default.

**LLM Provider Integration**

- **FR9:** User can switch the active LLM provider from Settings at any time; previously entered keys for other providers are preserved (not deleted on switch).
- **FR10:** System routes all LLM calls through a provider abstraction layer; no provider-specific code exists outside that layer.
- **FR11:** System parses provider-specific error responses (rate limit, quota exhausted, auth failure, network error, malformed response) and surfaces them as a unified user-facing error message.
- **FR12:** System automatically retries failed LLM calls up to 2 times before surfacing the error to the user.
- **FR13:** System produces structured JSON output for every paragraph generation request, validated against a fixed schema regardless of which provider is active.

**Paragraph Generation & Display**

- **FR14:** User can generate a paragraph by triggering an explicit "Generate" action that uses the current theme, persona, and length settings; paragraph generation does not auto-trigger on app load.
- **FR15:** System generates paragraphs that include 2–3 words randomly selected from the user's collection (recycled words) and 2–3 new advanced words appropriate to the chosen persona's vocabulary band.
- **FR16:** System gracefully handles cold-start when the collection has 0 or 1 word by generating a paragraph containing only new advanced words; no error surfaces in this case.
- **FR17:** System validates the LLM response against a strict schema (paragraph string + hardWords array of {word, ipa, meaning, exampleSentence}) and silently drops any incomplete hard-word entries from rendering rather than rendering them partially.
- **FR18:** User can view today's paragraph rendered with the hard-words list displayed below it, each word showing its IPA, meaning, and example sentence.
- **FR19:** System makes today's paragraph available on app open without requiring re-generation, provided one was generated earlier in the same calendar day.
- **FR20:** User can change the active theme or persona at any time from Settings; the change takes effect on the *next* paragraph generation, not retroactively.
- **FR21:** System retains the most recently generated paragraph in IndexedDB at least until the next paragraph is generated, enabling re-display, re-recording, and re-saving of words.

**Audio Output (TTS)**

- **FR22:** User can play any word from the hard-words list aloud via browser TTS by tapping the word.
- **FR23:** User can play the full paragraph aloud via browser TTS as a single action.
- **FR24:** System detects when browser TTS voices are not yet available (asynchronous voice loading on Chrome) and shows a "Loading voices…" state in the voice picker, refreshing automatically when voices arrive.
- **FR25:** System falls back to the system default English voice if the user's previously selected voice is no longer available.

**Word Collection**

- **FR26:** User can save any word from the hard-words list to their personal collection by tapping a save action; the word is persisted immediately to IndexedDB with its IPA, meaning, example sentence, source paragraph reference, and save timestamp.
- **FR27:** User can view their full word collection in a dedicated screen, sorted by save recency by default.
- **FR28:** User can remove a word from their collection.
- **FR29:** System persists collection entries across browser restarts, page refreshes, and tab closes.

**Voice Journal**

- **FR30:** User can start an audio recording from the today's-paragraph screen with a single action.
- **FR31:** User can stop the in-progress recording with a single action; the recording is automatically saved to IndexedDB with date/time, paragraph reference, duration, MIME type, and the audio blob.
- **FR32:** System requests microphone permission via `getUserMedia` on the first recording attempt only, never on app load.
- **FR33:** System displays a clear inline error with a [Try Again] action if microphone permission is denied; the rest of the app remains fully functional with only Voice Journal disabled.
- **FR34:** User can record multiple takes per session; each take is saved with its own timestamp (no automatic overwriting).
- **FR35:** User can play back any saved recording from a Voice Journal screen that lists all recordings sorted by date.
- **FR36:** User can compare two recordings side-by-side (selectable: today vs earliest, or any two) using a comparison player that plays them sequentially.
- **FR37:** System triggers a non-dismissable Day-14 comparison prompt on the user's 14th distinct day of use; the prompt blocks access to the rest of the app until the user completes the comparison playback and answers the binary "Did you hear improvement?" question. **No skip link is visible.**
- **FR38:** System's Day-14 comparison player attempts to match the earliest and most-recent recordings on the *same hard word* (if such overlap exists in the user's recording history) before falling back to whole-paragraph comparison.
- **FR39:** System persists the user's binary self-report from the Day-14 prompt (Yes / No) for use as the leading-indicator success signal.
- **FR40:** System does not re-trigger the Day-14 comparison prompt once it has fired; the next forced comparison surface is at Day 30 (or a later configurable milestone).
- **FR41:** System prunes Voice Journal recordings older than 90 days when the retention policy is "90-day rolling"; recordings are preserved indefinitely under the alternate policy.
- **FR42:** System surfaces any IndexedDB write failure (quota exceeded, permission revoked, etc.) to the user immediately rather than failing silently.

**Pen-Drill Warm-Up**

- **FR43:** User can launch the Warm-Up flow from the today's-paragraph screen via a single action.
- **FR44:** System displays a static drill text from a bundled rotating library of at least 10 distinct phrases, along with a 30-second countdown timer for the with-pen pass. Drill text leans toward playful tongue-twisters.
- **FR45:** After the with-pen timer ends, system prompts the user to read the same text again without the pen.
- **FR46:** User can optionally record either or both Warm-Up passes via the same Voice Journal recording flow used for paragraphs.
- **FR47:** System does not score, rate, or assess Warm-Up passes; no quality feedback is rendered.

**Daily Review (Flashcards)**

- **FR48:** User can launch a Daily Review session from the app's main navigation, separate from the today's-paragraph flow.
- **FR49:** System selects N words from the collection for review, prioritizing words with the oldest `lastReviewedAt` timestamp (and never-reviewed words first).
- **FR50:** User can flip a flashcard to reveal the meaning and example, then mark the word with one of three feedback options: Got it / Almost / Forgot.
- **FR51:** System updates the word's `reviewCount` and `lastReviewedAt` on each feedback action; the `difficultyRating` is updated based on cumulative feedback (no formal spaced-repetition algorithm in MVP).
- **FR52:** User can play any reviewed word aloud via browser TTS during the review.

**Calendar & Streak**

- **FR53:** System marks a calendar day as "completed" when both (a) a paragraph has been generated *and* (b) either an "I read it" confirmation has been tapped *or* a Voice Journal recording has been saved for that day.
- **FR54:** User can mark today's session as complete by tapping an "I read it" action even without recording.
- **FR55:** User can view a calendar showing completed days as green dots over a configurable window (30/60/90 days, default 30).
- **FR56:** User can tap any day in the calendar to view that day's session details (paragraph theme, paragraph excerpt, words saved, recordings made).
- **FR57:** System computes and displays the current streak as the count of consecutive completed days ending today; the streak resets cleanly on any gap day.
- **FR58:** System renders missed days as honest empty/grey cells; no shame-inducing visual treatment, no modal dialogs about broken streaks, no notifications.
- **FR59:** System distinguishes sessions that used the Offline Paragraph Pack from sessions that used a fresh LLM generation via a subtle visual badge on the calendar day cell.

**Offline Pack & Error Recovery**

- **FR60:** A separate offline-pack generation script (outside the deployed app) produces a JSON file of approximately 1,000 pre-generated paragraphs covering all theme × persona combinations, throttled to stay within the chosen provider's free-tier rate limits.
- **FR61:** User can load the generated offline-pack JSON into IndexedDB via a "Download Pack" action in Settings.
- **FR62:** System falls back to the offline pack when an LLM generation fails (provider error, rate limit, network failure) or when the user explicitly chooses [Use Offline Pack] from an error surface.
- **FR63:** System de-duplicates offline-pack selections within a 30-day rolling window so the same paragraph is not shown twice in close succession.
- **FR64:** System provides three recovery actions on any LLM generation error: [Retry], [Open Settings], and [Use Offline Pack] (the last only enabled if the offline pack is loaded into IndexedDB).

### NonFunctional Requirements

**Performance**

- **NFR1 — Cold page load:** First byte to interactive in <2s on broadband. Failure threshold: >5s.
- **NFR2 — First-paragraph generation:** <15s end-to-end. Failure threshold: >30s.
- **NFR3 — Voice Journal recording start latency:** <300ms from [Record] tap to active recording, when permission is already granted.
- **NFR4 — TTS playback start:** Imperceptible (<100ms) on tap.
- **NFR5 — IndexedDB read (collection of ≤100 words):** <200ms from screen open to list rendered.
- **NFR6 — Streak / calendar render:** <100ms.
- **NFR7 — JS bundle size (gzipped):** <500KB.

**Reliability**

- **NFR8 — Voice Journal recording durability:** Every successful stop-recording action results in a persisted IndexedDB entry. Zero silent recording loss.
- **NFR9 — Word Collection durability:** Every save action persists immediately. Zero silent collection loss.
- **NFR10 — LLM-provider downtime tolerance:** App remains fully functional for collection, Daily Review, Voice Journal playback, calendar, and Settings when active provider is unreachable.
- **NFR11 — Microphone-permission denial tolerance:** All features except Voice Journal recording remain functional when microphone is denied.
- **NFR12 — Day-14 prompt firing reliability:** Fires exactly once on the user's 14th distinct day-of-use, never before, never twice.
- **NFR13 — Streak computation correctness:** Streak count must equal consecutive completed days ending today, with no off-by-one across DST/timezone/month boundaries.

**Security & Privacy**

- **NFR14 — API-key storage:** LLM API keys stored in `localStorage` only. Public deployment forbidden until backend proxy introduced.
- **NFR15 — HTTPS for non-localhost deployments:** Voice Journal recording requires HTTPS. localhost exempt.
- **NFR16 — No third-party tracking:** No analytics, telemetry, error reporting services. Outbound network limited to (a) configured LLM provider, (b) "Get a free key" deep-link in new tab, (c) static asset fetches.
- **NFR17 — No data exfiltration paths:** No "share", no "export to cloud", no third-party storage integrations in MVP.
- **NFR18 — Microphone access scope:** Permission requested only on first record-button tap, never on app load.
- **NFR19 — Voice Journal data ownership:** All recordings remain in user's browser. No in-app export in MVP.

**Usability**

- **NFR20 — Daily session time target:** Complete daily session in ≤5 minutes for experienced user.
- **NFR21 — Onboarding completion time:** First-time setup completes in ≤3 minutes.
- **NFR22 — No shame-inducing UI:** Missed days, broken streaks, low feedback never produce alarmist visual treatments. No broken-streak modals.
- **NFR23 — Single-action primary tasks:** Most-frequent actions (generate, record, stop, save word, "I read it") each require exactly one tap with no confirmation modal.
- **NFR24 — Forced-friction tolerance:** Day-14 prompt blocks user for ≤60s. No other forced-friction surfaces in MVP.

**Maintainability**

- **NFR25 — Code legibility for return-after-6-months:** Codebase navigable by Priyank 6 months later without re-deriving design decisions.
- **NFR26 — Dependency parsimony:** Only required deps ship. Excluded: state-management libraries, UI frameworks beyond shadcn, testing framework.
- **NFR27 — Provider-swap reversibility:** Swapping LLM providers requires zero code changes — only Settings interaction.
- **NFR28 — File-organization clarity:** Source code organized by capability area (one folder per FR grouping), not by technical layer.

### Additional Requirements

> Sourced from Architecture document. Technical/infrastructure requirements that affect implementation.

- **AR1 — Project initialization:** Scaffold via `pnpm create next-app@latest audiblytics --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --use-pnpm`. Stack: Next.js 16 + React 19 + TypeScript strict + Tailwind 4 + Turbopack. (Architecture documents deliberate divergence from PRD's "Next.js 15" wording.)
- **AR2 — shadcn/ui install:** `pnpm dlx shadcn@latest init` then `pnpm dlx shadcn@latest add button input select label dialog card tooltip`. Only 7 primitives used.
- **AR3 — Dependency lock:** `ai`, `@ai-sdk/google`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@openrouter/ai-sdk-provider`, `ollama-ai-provider-v2`, `dexie@^4.4`, `dexie-react-hooks@^4.2`, `zod`. Dev: `@next/bundle-analyzer`, `tsx`. No state library, no test framework, no animation library, no toast library.
- **AR4 — LLM call API:** Use AI SDK 6 `generateText({ model, prompt, output: Output.object({ schema }) })`. The deprecated `generateObject` referenced in the PRD must NOT be used.
- **AR5 — Default models:** `gemini-2.5-flash` for runtime daily generation; `gemini-2.5-flash-lite` for offline-pack batch script (higher free-tier RPD).
- **AR6 — Provider abstraction seam:** All LLM calls flow through `src/lib/llm/generate.ts` exposing `generateParagraph(opts): Promise<Result<ParagraphResult, LlmError>>`. Provider SDKs may only be imported inside `src/lib/llm/`.
- **AR7 — Per-provider error parsers:** One module per provider in `src/lib/llm/errors/{gemini,openai,anthropic,openrouter,ollama}.ts` normalizing native errors into a discriminated union `LlmError = { kind: 'rate_limit' | 'quota_exceeded' | 'auth' | 'network' | 'malformed_response' | 'unknown'; providerCode; message; retryable; retryAfterMs? }`.
- **AR8 — Retry policy:** `lib/llm/with-retry.ts` implements ≤2 attempts with backoff `[1s, 3s]`, only when `error.retryable === true`.
- **AR9 — Result discriminated union:** All fallible operations return `Result<T, E> = { ok: true; value: T } | { ok: false; error: E }`. Throwing is reserved for programmer errors only.
- **AR10 — Dexie schema (single version):** Tables `collection`, `recordings`, `paragraphCache`, `offlinePack` with indexes per architecture (e.g., `collection: '++id, savedAt, lastReviewedAt, word'`; `recordings: '++id, recordingDate, paragraphId, dayOfUse'`; `paragraphCache: '++id, generatedAt, theme, persona'`; `offlinePack: '++id, theme, persona, lastSurfacedAt'`). Forward-only migration policy.
- **AR11 — localStorage key namespacing:** All keys prefixed `audiblytics.*` (`audiblytics.activeProvider`, `audiblytics.providerKeys`, `audiblytics.settings`, `audiblytics.daysOfUse`, `audiblytics.day14State`, `audiblytics.completions`). Bare keys forbidden.
- **AR12 — useLocalStorage hook:** `useLocalStorage<T>(key, defaultValue, schema)` is the only allowed accessor; raw `window.localStorage` calls outside the hook implementation are forbidden. Cross-tab `storage` event sync + Zod validation on read.
- **AR13 — Day-counter primitive:** `lib/day-counter/` exposes `recordDayOfUse`, `distinctDaysOfUse`, `currentStreak`, `isCompleted`. UTC-anchored `YYYY-MM-DD` strings; local-time conversion only at display boundary. Idempotent.
- **AR14 — Day-14 gate at layout level:** `<Day14Gate>` mounted inside `app/layout.tsx` short-circuits route render when `distinctDayOfUse === 14 && !day14State.fired` so URL changes cannot bypass the takeover.
- **AR15 — Hard-scope-boundary three-layer guard:** (1) Build-time guard in `next.config.ts` emits warning when `NODE_ENV === 'production' && process.env.NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE !== 'true'`. (2) Runtime guard `assertClientOnlySafeContext()` in `lib/llm/client.ts` hard-fails if `typeof window === 'undefined'`. (3) Doc guard: `README.md` opens with PERSONAL-USE banner; `app/layout.tsx` carries inline reference comment. A future contributor must consciously edit three files to remove the boundary.
- **AR16 — Zod schema as single source of truth:** Each persisted record shape defined once in `src/lib/schemas/<entity>.schema.ts` (or `src/lib/llm/schemas/`). TypeScript types derived via `z.infer<>`. Hand-written parallel TS types for the same shape are forbidden.
- **AR17 — Schema validation on read:** `verifyOnLoad()` runs once at app load against persisted records; defends against schema drift across app versions. Inbound LLM responses validated before render.
- **AR18 — Layered import direction:** `app/` → `features/` → `components/` → `lib/`. `lib/` MUST NOT import from outside `lib/`. `components/` MUST NOT import from `features/` or `app/`. `features/<X>` MUST NOT import other `features/<Y>`.
- **AR19 — Capability-area folder layout:** Top-level `src/features/` with one folder per capability (`paragraph`, `voice-journal`, `word-collection`, `review`, `calendar`, `warm-up`, `offline-pack`, `onboarding`, `day14`, `settings`). Cross-cutting infra in `src/lib/{llm, storage, schemas, audio, day-counter, result, hooks}/`.
- **AR20 — Audio I/O wrappers:** `lib/audio/recorder.ts` exposes `createRecorder()` factory handling MIME auto-detect (Chrome `webm-opus` / Safari `mp4`), 60s hard cap, and `getUserMedia` permission lifecycle. `lib/audio/tts.ts` exposes `speak`, `useVoices`, `getPersistedVoice`. Raw `MediaRecorder` / `speechSynthesis` access outside these modules is forbidden.
- **AR21 — Self-hosted fonts via next/font:** EB Garamond + Inter + JetBrains Mono loaded via `next/font` (zero-CLS, no third-party requests, ≤250KB total).
- **AR22 — Code-splitting lazy components:** `WarmUpDrill` and `Day14Takeover` loaded via `next/dynamic` to keep Today route initial bundle small.
- **AR23 — 90-day pruning hook:** `lib/hooks/use-prune-on-mount.ts` calls `features/voice-journal/prune-recordings.ts` once on app mount when retention policy is `90-day rolling`. No background worker.
- **AR24 — Offline-pack script independence:** `scripts/generate-offline-pack.ts` runs outside Next.js (`pnpm tsx`), reads `.env.local`, writes JSON consumed by FR61 import action. Throttled ≤10 RPM.
- **AR25 — Quota error surfacing path:** All Dexie writes wrapped in try/catch; `QuotaExceededError` rendered via `<InlineErrorSurface variant="storage" />` with `[Open Settings]` deep-link to retention policy.
- **AR26 — AGENTS.md / CLAUDE.md / cursor rule alignment:** Repository agent config files edited to point at `architecture.md § Implementation Patterns` so downstream coding agents stay consistent.
- **AR27 — No CI/CD, no test framework, no monitoring in MVP:** All explicitly out of scope per architecture deferred decisions. Console errors only; manual code review is the sole enforcement mechanism.
- **AR28 — Environment configuration:** `.env.example` documents `OFFLINE_PACK_PROVIDER_KEY` for the script. `.env.local` gitignored. App itself uses no `.env` — runtime settings via in-app Settings UI.
- **AR29 — Streaming intentionally deferred:** Non-streaming LLM responses for MVP (schema-validated structured output cannot be safely partial-validated mid-stream). Skeleton + ~5s spinner pattern.

### UX Design Requirements

> Sourced from UX Design Specification. Each UX-DR is specific enough to generate a story with testable acceptance criteria.

**Visual Token System & Theming**

- **UX-DR1 — Color token system:** Implement raw CSS custom properties (`--cream`, `--cream-dim`, `--border`, `--ink`, `--ink-soft`, `--ink-faint`, `--forest`, `--forest-deep`, `--forest-light`, `--forest-faint`, `--brick`, `--brick-deep`, `--sage-dim`, `--rose-dim`) in `globals.css` plus a semantic mapping layer (`--surface`, `--surface-elevated`, `--divider`, `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-on-primary`, `--text-on-danger`, `--primary`, `--primary-hover`, `--primary-soft`, `--accent`, `--danger`, `--danger-hover`, `--state-disabled`, `--state-disabled-bg`, `--state-not-chosen-primary`, `--state-not-chosen-danger`, `--focus-ring`). Component code references semantic tokens only.
- **UX-DR2 — Typography hierarchy:** Implement 13 named type classes (`text-display`, `text-headline-1`, `text-headline-2`, `text-headline-3`, `text-paragraph-hero`, `text-body`, `text-ui`, `text-ui-sm`, `text-caption`, `text-micro-label`, `text-data`, `text-data-large`, `text-rail`, `text-footnote`) mapped to EB Garamond / Inter / JetBrains Mono with sizes, line-heights, weights per spec. Mono ligatures explicitly disabled for IPA.
- **UX-DR3 — Spacing scale + radii:** 4px base scale (`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128`); reading-column max-width 640px; stat-card grid gap 12px; radii sm 4px / md 6px / lg 8px (squarer than shadcn defaults).
- **UX-DR4 — Iconography rules:** Lucide icon library only, stroke-width 1.5, `currentColor` always. Sizes: `w-4 h-4` inline, `w-5 h-5` in buttons, `w-6 h-6` in stat cards. Reserved icon set: `Mic`/`Square`, `Play`/`Pause`, `Volume2`, `Bookmark`/`BookmarkCheck`, `Trash2`, `RefreshCw`, `Settings`, `ChevronRight`/`ChevronDown`, `AlertCircle`, `Info`. Forbidden: emoji in chrome, filled/duotone variants, custom SVG, animated icons.
- **UX-DR5 — Token enforcement bans:** Component code MUST NOT use arbitrary Tailwind values (`bg-[#xxx]`, `p-[17px]`), inline `style` for color/typography, hex literals, or CSS-in-JS libraries. Class ordering: layout → box → typography → color → state. `cn()` from `@/lib/utils` for conditional composition.

**Layout & Responsive**

- **UX-DR6 — Three-column desktop shell:** `grid-cols-[80px_1fr_288px]` at `≥lg` (1024px). Left = sticky DayRail (80px), center = paragraph zone (max 640px centered), right = sticky StatRail (288px). Top nav row + honesty footer. Direction A + hybrid C-ribbon.
- **UX-DR7 — Responsive breakpoints + degradation:** Tailwind defaults (`sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`). Below `lg`, page collapses to single column with DayRail as horizontal-scroll strip, stat-rail stacked below paragraph. No horizontal scroll on any viewport ≥320px. No JS-driven layout (CSS media queries only).
- **UX-DR8 — Touch target floor 44×44px:** Every interactive element (buttons, day-cells on mobile, save-icon and TTS-icon hit-areas) padded to 44×44 minimum even when visual icon is smaller.

**Custom Components (UX spec — 19 total including Flashcard added by architecture)**

- **UX-DR9 — DayRail component:** Sticky vertical 30-cell rail with states `completed` (forest dot), `completed-offline` (forest dot + OfflineBadge overlay), `missed` (empty grey ring), `today` (forest dot + glow), `future` (faint micro-dot). Click on completed cell navigates to `/calendar?day=N`. Future and today non-interactive. ARIA `nav aria-label="30-day progress"`; per-cell screen-reader text.
- **UX-DR10 — HybridProgressRibbon component:** Thin horizontal ribbon above paragraph: `━━ DAY N / 30 · X TO FIRST REPLAY ━━` (mono uppercase micro-text, ink-faint). Variants: `pre-day-14`, `post-day-14`. Hidden on Day 1 and Day 14. ARIA `role="status"`.
- **UX-DR11 — ParagraphHero component:** `<article>` with max-width 640px, EB Garamond `text-xl`, line-height 1.7. States: `loading` (3 grey skeleton lines), `rendered` (text + meta-actions row), `error` (replaced by InlineErrorSurface). Hard words within paragraph wrapped in `<mark>` with `bg-forest-faint` and `aria-describedby` linking to corresponding HardWordRow.
- **UX-DR12 — HardWordRow component:** One row per hard word: word + IPA (mono) + TTS-play icon + save-icon. Variants: `default`, `saved`, `recycled` (with ♺ indicator). States: `default`, `playing`, `saving`, `saved`. ARIA: `aria-pressed` on save, `aria-label` on TTS, IPA wrapped in `<span lang="en-fonipa">`.
- **UX-DR13 — RecordPanel component:** Voice-journal trigger using `MediaRecorder`. States: `idle`, `requesting-permission`, `recording`, `stopped`, `error`. Recording state: brick stop button, count-up timer, pulsing red dot indicator (only idle animation in product, honors `prefers-reduced-motion`). 60s hard cap. Inline error if mic denied; rest of app unaffected. Keyboard shortcut `R` to toggle. ARIA `aria-live="polite"` on timer.
- **UX-DR14 — VoiceJournalList component:** Reverse-chronological list of recordings with playback + metadata (`▶ Day N · Theme · 0:48 [↓]`). States: `default`, `playing` (cream-dim row bg). Download icon saves blob locally. ARIA `role="list" aria-label="Voice recordings"`.
- **UX-DR15 — StatCardDark component:** Featured stat card per route (one max). Mono uppercase label (ink-faint) + serif huge number (cream) + sans body subline. Background `--ink`. Variants: `with-progress` (subtle progress bar at bottom), `numeric-only`. ARIA `role="region"`.
- **UX-DR16 — StatCardLight component:** Secondary stat card. Mono uppercase label + sans body. Background `--cream-dim`. ARIA `role="region"`.
- **UX-DR17 — ProviderChip component:** Status pill in honesty footer with mono text + status dot (forest = healthy / brick = last call failed / slate = offline-pack). Click navigates to Settings.
- **UX-DR18 — HonestyFooter component:** Persistent bottom-of-page row composing ProviderChip + cost + version. Mono ink-faint, top border. `<footer role="contentinfo">`.
- **UX-DR19 — TopNav component:** Top-right text-link nav: `Today / Collection / Review / Settings`. Active link gets forest underline (2px) + slightly bolder weight. NEVER collapses to hamburger. `<nav aria-label="Main navigation">`, `aria-current="page"` on active.
- **UX-DR20 — Day14Takeover component:** Full-bleed cream background (no overlay scrim), centered serif headline "Listen to how far you've come.", composite player, single play-comparison button, ButtonPair hidden until first playback completes. **No close button, no Esc handler, no overlay click-out, no skip link.** States: `awaiting-play`, `playing`, `awaiting-decision`, `outcome-yes`, `outcome-no`, `awaiting-continue`. Persistence-then-flow: `localStorage.day14State` write happens BEFORE celebratory copy renders. Override of shadcn Dialog: remove `<DialogClose>`, set `onEscapeKeyDown` and `onPointerDownOutside` to no-op, retain `modal={true}` for focus-trap.
- **UX-DR21 — CompositePlayer component:** Two-row clip player (Day-1 row + today row) + single shared "Play comparison" button. States: `idle`, `playing-clip-1` (row 1 cream-dim highlight, row 2 dim), `playing-clip-2` (reverse), `done` (emits `onPlaybackComplete`). Edge case: corrupt blob → inline message in row, fallback to TTS read of same word.
- **UX-DR22 — ButtonPair component:** Side-by-side binary commit. Variants: `affirm-deny` (forest left + brick right), `save-skip`. States: `hidden`, `revealed` (opacity fade 400ms), `default`, `committing`. Container `role="group" aria-label`.
- **UX-DR23 — WarmUpDrill component:** 30-second pen-drill warm-up with rotating tongue-twister library (≥10 phrases bundled). States: `pre-warmup`, `running` (count-up timer), `transition` ("Now without the pen, read it again"), `complete`. Random phrase selection per session. ARIA `aria-live="polite"` on timer.
- **UX-DR24 — InlineErrorSurface component:** Replaces paragraph zone (NOT a modal) on LLM/storage failure. Brick-text headline + ink-soft body + 3 buttons. Variants: `with-offline-pack` (3 buttons), `without-offline-pack` (2 buttons), `variant="storage"` for IndexedDB failures. `role="alert" aria-live="assertive"`.
- **UX-DR25 — OnboardingShell component:** First-run single-screen settings panel composing shadcn primitives. Fields: PROVIDER (Select), API KEY (Input password), THEME (Select), PERSONA (Select), PARAGRAPH LENGTH (Select), Generate button (forest, large, full-width, disabled until key non-empty). "Get a free key" link with `target="_blank" rel="noopener noreferrer"`. Autofocus the API key field on first render.
- **UX-DR26 — OfflineBadge component:** 8×8px icon overlay on day-cells (DayRail) and VoiceJournalList rows when session used offline pack. Tooltip: "This day used the offline pack."
- **UX-DR27 — Flashcard component:** Daily Review flip-card UI. Front shows word; flip reveals IPA + meaning + example + per-word TTS. Three feedback buttons: `Got it / Almost / Forgot`. Driven by `use-flashcard-state` state machine.

**shadcn Primitives & Component Bans**

- **UX-DR28 — shadcn primitive whitelist:** Only 7 primitives may be installed: `button`, `input`, `select`, `label`, `dialog`, `card`, `tooltip`. Banned (do not run `shadcn add`): `Toast`, `Sonner`, `Sheet`, `Drawer`, `Popover`, `Command`, `Tabs`, `Badge`, `Avatar`, `Menubar`. Button extended with `forest`, `brick`, `outline`, `ghost`, `ghost-continue` variants.

**UX Patterns (Bans Codification)**

- **UX-DR29 — Button hierarchy enforcement:** One primary button per screen. Brick reserved for Day-14 + provider/storage error surfaces only. Ghost/text-link never the only commit. No icon-only commit buttons. Ban: Cancel buttons, FABs, "Confirm?" double-tap modals.
- **UX-DR30 — Feedback pattern enforcement:** State-flip = success (no toast, no confetti, no success modal). Ban product-wide: `Toast`, `Sonner`, `useToast`, notification badges, unread counts, "Are you sure?" confirmations.
- **UX-DR31 — Form pattern enforcement:** Labels above fields (mono uppercase, tracking-wider, `--ink-faint`, text-xs). Helper text optional, italic Garamond below field. No live validation while typing; validate on blur or submit only. No multi-step wizards. No inline error tooltips. No password-strength meters. No required-field asterisks.
- **UX-DR32 — Navigation pattern enforcement:** TopNav is the only top-level route switcher. Active route = forest underline + bolder weight (no background fill, no box). No breadcrumbs, no in-app back-buttons, no hamburger menu, no tab bars / bottom nav. Only deep-link param allowed: `/calendar?day=N`.
- **UX-DR33 — Modal pattern enforcement:** shadcn Dialog used exactly once (Day14Takeover). Ban: Sheet, Popover, Drawer, modal stacking, "are you sure?" confirmations, promotional modals.
- **UX-DR34 — Empty state pattern enforcement:** Quiet, factual emptiness. One italic Garamond line maximum. Ban: empty-state CTAs, illustrations, mascots, decorative icons, tutorial/tour modes, "Get started!" copy.
- **UX-DR35 — Loading state pattern enforcement:** Spinners reserved for LLM calls. Skeleton (3 cream-dim grey lines) for paragraph zone. Disable triggering button during operation. Ban: full-page loading overlays, fake progress bars for unknown-duration ops, "Loading…" text without visual indicator. No spinners on IndexedDB/localStorage writes (instant) or route changes.
- **UX-DR36 — Animation discipline:** Only 5 CSS transitions allowed across entire app: state-flip on save-icon (200ms), ButtonPair fade-in on Day-14 (400ms), GhostContinueButton fade-in post-tap (300ms after 3s wait), hard-words mark hover (150ms), record-button breathing pulse during recording (1.0s loop). No animation library. All transitions become instantaneous when `prefers-reduced-motion: reduce` is set.

**Accessibility (WCAG 2.1 AA in practice)**

- **UX-DR37 — WCAG 2.1 AA conformance commitments:** Color contrast ≥4.5:1 for text, ≥3:1 for large text and non-text controls; keyboard-only navigation for all 5 user flows; `focus-visible:ring-2 focus-visible:ring-forest focus-visible:outline-none` on every interactive element; tab order matches visual reading order; semantic HTML first; `aria-live="polite"` on RecordPanel timer + Day14Takeover button reveal; `aria-live="assertive"` on InlineErrorSurface. No `tabindex > 0`. No autofocus except OnboardingShell API key field.
- **UX-DR38 — Day-14 documented accessibility exception:** WCAG 2.1.2 (No Keyboard Trap) deliberately violated for Day14Takeover. Inline code comment required: `// WCAG 2.1.2 deliberate exception — see ux-design-specification.md §Named Exceptions`. Mitigated by finite duration, large clear exit buttons, force-quit always available, persistence-then-flow.
- **UX-DR39 — Reduced-motion handling:** Single `@media (prefers-reduced-motion: reduce)` block in globals.css sets `transition-duration: 0ms !important` on all 5 tracked transition classes.
- **UX-DR40 — Color-blindness mitigation:** Forest/brick distinction never relies on color alone. Day-14 buttons differentiated by copy ("Yes, I hear it" / "No, not really"). DayRail completed cells = filled dot, missed = empty ring (shape primary, color reinforcement). ProviderChip dot paired with text label change.
- **UX-DR41 — axe-core dev integration:** `@axe-core/react` mounted in `app/layout.tsx` only when `process.env.NODE_ENV === 'development'`. Violations log to console. Pass criterion: zero serious/critical violations.

**Dev Gallery & Verification**

- **UX-DR42 — /_dev/components route:** Single dev-only Next.js route renders every custom component in every state for visual QA. Gated by `NEXT_PUBLIC_DEV_GALLERY` env flag; not shipped to production builds.
- **UX-DR43 — Build verification checklist:** Before declaring "done", run: Lighthouse a11y ≥95 + performance ≥90 on all pages; axe-core zero serious/critical; keyboard-only walkthrough of all 5 flows; VoiceOver spot-check on Day14Takeover; responsive spot-check at 375px / 768px / 1280px; real-device check on iPhone Safari; `prefers-reduced-motion` toggle zeroes transitions; color-blindness simulation; no horizontal scroll ≥320px; all touch targets ≥44×44; Day-14 deliberate exception code comment present.

### Backend V2 Requirements (architecture-v2)

> Authoritative when `NEXT_PUBLIC_STORAGE_BACKEND=api`. Gemini key stored per-user in `user_settings.gemini_api_key` (write-only from client).

- **BVR1:** JWT auth — register, login, logout, `/auth/me`; httpOnly session cookie (BV4).
- **BVR2:** `GET|PATCH /settings` mirroring Zod `settingsSchema`; `hasGeminiApiKey` boolean only — never return raw key (BV10).
- **BVR3:** `AppGate` → `AuthGate` in API mode; `/login` page (BV4.3).
- **BVR4:** Hide client `providerKeys` vault in API mode; Gemini key field under Settings → Defaults (DB-stored).
- **BVR5:** Next.js same-origin proxy `/api/v1/*` forwarding cookies (BV-Q1 default).
- **BVR6:** Alembic migrations for all schema changes (BV17).
- **BVR7:** `POST /paragraphs/generate` — server Gemini proxy + `paragraph_cache` write (BV8).
- **BVR8:** `GET /paragraphs/today` — same-UTC-day cache hit (FR19 server path).
- **BVR9:** Frontend paragraph hooks call API when `STORAGE_BACKEND=api`.
- **BVR10:** R2 presigned PUT upload + `recordings` Postgres metadata (BV6, Phase 3).
- **BVR11:** Presigned GET playback URL; list recordings API (Phase 3).
- **BVR12:** MediaRecorder stays client-side; only blob persistence moves server-side.
- **BVR13:** Collection + completions API (Phase 4 stretch).
- **BVR14:** Server-side 90-day recording prune when retention policy applies (FR41).
- **BVR15:** Deploy README, Dockerfile, Neon/R2 wiring, 3 ADRs (Phase 5).
- **BVR16:** `GET /paragraphs/dates` (or equivalent) — UTC dates with server `paragraph_cache` rows for calendar/streak (API mode).
- **BVR17:** Archived day read path in API mode — paragraph + recordings for a selected UTC date on Journey/Calendar drill-down.
- **BVR18:** `days_of_use` server persistence + frontend sync when `STORAGE_BACKEND=api` (Day-14 trigger parity across reloads).
- **BVR19:** Stats nav resolved — implement minimal Stats page or remove sidebar item (no dead link).
- **BVR20:** Docs + tracking hygiene — README (DB Gemini key), sprint epic statuses, optional UX v2 addendum pointer.

### UI Refresh Requirements (May 2026 mockups)

> Reference: `_bmad-output/design/ui-mockups-v2/`. Supersedes hub-and-spoke shell sections where noted; **retains** Day-14 takeover, honest calendar semantics, inline errors (no toasts).

- **UX-V2-UI1 — App shell v2:** Left sidebar nav (Home, Review, Collection, Voice Journal, Journey, Stats); user profile footer; cream canvas + white rounded cards + forest green primary.
- **UX-V2-UI2 — Home dashboard:** Greeting, "Start Today's Session" CTA, continue cards (Review / Collection / Voice Journal), right rail widgets (calendar, streak, today's focus, monthly progress).
- **UX-V2-UI3 — Today session layout:** Center reading column with highlighted hard words + bottom word-detail card; right column recording studio + difficult-words list; session status bar (day/theme/persona).
- **UX-V2-UI4 — Voice Journal v2:** Recording rows with waveform placeholder, clarity/pace/pause metadata, compare-sessions card, private notes field.
- **UX-V2-UI5 — Collection master-detail:** Search, sort, tabs (All / Practicing / Mastered), selectable list + right detail panel with pronunciation guide.
- **UX-V2-UI6 — Review session v2:** Central flashcard, Easy/Medium/Hard/Again feedback row, circular progress ring, "Up next" queue sidebar.
- **UX-V2-UI7 — Settings hub:** Sub-routes Practice, Audio, Data & Storage, Advanced, Appearance, About — card-based settings rows with icons.
- **UX-V2-UI8 — Journey page:** Calendar/timeline toggle, session detail panel, streak stats row, export journey action.
- **UX-V2-UI9 — Stretch (shell only unless noted):** Live pace/clarity badges, AI session reflection, mood picker — UI placeholders; no new LLM calls in MVP refresh.

### FR Coverage Map

| FR | Epic | Notes |
|---|---|---|
| FR1 | Epic 1 | Provider selection, Gemini default |
| FR2 | Epic 1 | API key entry + persistence |
| FR3 | Epic 1 | "Get a free key" deep-link |
| FR4 | Epic 1 | Theme + persona pickers |
| FR5 | Epic 1 | Paragraph length 100–200 (default 150) |
| FR6 | Epic 3 | Voice Journal retention policy |
| FR7 | Epic 1 | Settings screen access from main nav |
| FR8 | Epic 1 | TTS voice picker |
| FR9 | Epic 1 | Provider switch preserves keys |
| FR10 | Epic 1 | Provider abstraction layer |
| FR11 | Epic 1 | Unified provider error parser |
| FR12 | Epic 1 | ≤2 retry policy |
| FR13 | Epic 1 | Structured JSON output (schema-validated) |
| FR14 | Epic 1 | Explicit Generate action |
| FR15 | Epic 2 | Recycle 2–3 collection words |
| FR16 | Epic 1 | Cold-start (no collection) graceful |
| FR17 | Epic 1 | Schema validation + drop incomplete hard-words |
| FR18 | Epic 1 | Hard-words list rendering with IPA + meaning + example |
| FR19 | Epic 4 | Same-day paragraph reuse on app open |
| FR20 | Epic 1 | Theme/persona swap takes effect on next gen |
| FR21 | Epic 2 | Latest paragraph cached in IndexedDB |
| FR22 | Epic 1 | Tap-to-pronounce hard-word via TTS |
| FR23 | Epic 1 | Play full paragraph TTS |
| FR24 | Epic 1 | TTS voice load lifecycle (Chrome async) |
| FR25 | Epic 1 | Voice fallback to system default |
| FR26 | Epic 2 | Save word to collection |
| FR27 | Epic 2 | Collection list (sort by recency) |
| FR28 | Epic 2 | Remove word from collection |
| FR29 | Epic 2 | Collection persists across browser sessions |
| FR30 | Epic 3 | Start recording, single action |
| FR31 | Epic 3 | Stop + auto-save with metadata + MIME |
| FR32 | Epic 3 | Lazy mic permission request (first-tap only) |
| FR33 | Epic 3 | Mic-denied inline error + retry |
| FR34 | Epic 3 | Multiple takes per session (no overwrite) |
| FR35 | Epic 3 | Voice Journal screen (list + playback) |
| FR36 | Epic 3 | Compare any-two recordings |
| FR37 | Epic 7 | Day-14 non-dismissable trigger |
| FR38 | Epic 7 | Same-word match heuristic before paragraph fallback |
| FR39 | Epic 7 | Persist Yes/No self-report |
| FR40 | Epic 7 | One-shot fire + Day-30 next milestone |
| FR41 | Epic 3 | 90-day rolling prune |
| FR42 | Epic 3 | IndexedDB write failure surfacing |
| FR43 | Epic 5 | Launch warm-up from today screen |
| FR44 | Epic 5 | 30s timer + ≥10-phrase tongue-twister library |
| FR45 | Epic 5 | Without-pen second pass prompt |
| FR46 | Epic 5 | Optional recording per warm-up pass |
| FR47 | Epic 5 | No scoring/rating of warm-up |
| FR48 | Epic 6 | Launch Daily Review from main nav |
| FR49 | Epic 6 | Oldest-reviewed-first selector |
| FR50 | Epic 6 | Flip-card + Got it/Almost/Forgot feedback |
| FR51 | Epic 6 | Update reviewCount + lastReviewedAt + difficultyRating |
| FR52 | Epic 6 | Per-word TTS during review |
| FR53 | Epic 4 | Day completion logic (paragraph + read-it OR recording) |
| FR54 | Epic 4 | "I read it" alternative completion path |
| FR55 | Epic 4 | Calendar 30/60/90 toggle |
| FR56 | Epic 4 | Drill into archived day details |
| FR57 | Epic 4 | Streak from consecutive completed days |
| FR58 | Epic 4 | Honest empty cells for missed days |
| FR59 | Epic 8 | Offline-pack calendar badge |
| FR60 | Epic 8 | Offline-pack generation script (≤10 RPM) |
| FR61 | Epic 8 | "Download Pack" Settings action |
| FR62 | Epic 8 | LLM failure → offline-pack fallback |
| FR63 | Epic 8 | 30-day rolling de-dupe |
| FR64 | Epic 8 | 3-action error recovery surface (Retry / Settings / Use Pack) |

### BVR & UX-V2 Coverage Map

| Requirement | Epic | Notes |
|---|---|---|
| BVR1–BVR6 | Epic 9 | Auth + settings + proxy + migrations |
| BVR7–BVR9 | Epic 10 | Paragraph LLM proxy + cache |
| BVR10–BVR12, BVR14 | Epic 11 | R2 recordings |
| BVR13 | Epic 12 | Collection + completions API (stretch) |
| BVR15 | Epic 13 | Deploy + docs |
| UX-V2-UI1–UI2 | Epic 14 | Shell + home |
| UX-V2-UI3 | Epic 14 | Today session |
| UX-V2-UI4 | Epic 14 | Voice Journal |
| UX-V2-UI5 | Epic 14 | Collection |
| UX-V2-UI6 | Epic 14 | Settings hub |
| UX-V2-UI7 | Epic 14 | Journey |
| UX-V2-UI8 | Epic 14 | Review |
| UX-V2-UI9 | Epic 14 | Stretch placeholders |
| BVR16–BVR18 | Epic 15 | API mode calendar/journey/history parity |
| BVR19–BVR20 | Epic 15 | Stats + docs housekeeping |

## Epic List

### Epic 1: Onboarding & First Paragraph Generation

Cold-start to first paragraph rendered with hard-words + IPA + TTS in ≤3 minutes. Establishes the project scaffold (Next.js 16 + Tailwind 4 + shadcn primitives + token system + 3-column layout shell + day-rail + stat-rail), the LLM provider abstraction (5 providers behind a single seam, Gemini default with free-tier helper link), settings persistence (provider keys vault, theme, persona, length, TTS voice), the Onboarding flow (single-screen settings → Generate), and the Today screen render (ParagraphHero + HardWordRow with tap-to-pronounce + tap-to-save-stub). Settings-derived theme/persona/length take effect on next generation. Errors render inline with retry/settings actions.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR16, FR17, FR18, FR20, FR22, FR23, FR24, FR25

### Epic 2: Word Collection & Recycling Loop

User saves any hard word from the paragraph to a personal collection in IndexedDB; the Collection route lists saved words sorted by recency with per-word remove and TTS playback; subsequent paragraph generations weave 2–3 of the user's saved words back in (with cold-start gracefully bypassing recycling when collection has 0–1 words). Latest paragraph cached so re-display, re-recording, and re-saving work.

**FRs covered:** FR15, FR21, FR26, FR27, FR28, FR29

### Epic 3: Voice Journal — Record, Persist, Replay, Compare

User records reading via single-tap RecordPanel (lazy mic permission, count-up timer, breathing pulse honoring `prefers-reduced-motion`), recordings persist to IndexedDB with cross-browser MIME (Chrome `webm-opus` / Safari `mp4`) and `dayOfUse` stamp, multiple takes per session, full Voice Journal screen lists recordings sorted by date with inline playback, user can compare any two recordings via the CompositePlayer (sequential, not crossfade). Settings adds Voice Journal retention policy {90-day rolling, indefinite}; pruning hook runs on app mount. All IndexedDB write failures surface inline with `[Open Settings]` recovery (zero silent loss). Includes the day-counter primitive (UTC-anchored `recordDayOfUse`, `distinctDaysOfUse`, `currentStreak`, `isCompleted`) since recordings are the first feature to stamp `dayOfUse`.

**FRs covered:** FR6, FR30, FR31, FR32, FR33, FR34, FR35, FR36, FR41, FR42

### Epic 4: Daily Habit — Calendar, Streak & Completion

Today's paragraph rehydrates from cache on app open within the same UTC day. Day completion fires when paragraph generated AND ("I read it" tapped OR a recording saved); calendar route renders 30/60/90 toggleable green-dot grid; streak counter computes consecutive completed days ending today (DST/timezone-correct via UTC-anchored day-counter); missed days render as honest empty/grey cells with no shame copy and no broken-streak modals; tapping any completed day surfaces archived paragraph + recordings + saved words for that day.

**FRs covered:** FR19, FR53, FR54, FR55, FR56, FR57, FR58

### Epic 5: Pen-Drill Warm-Up

User launches a 30-second pen-drill from a single icon-tap on the Today screen; WarmUpDrill component shows a randomly selected tongue-twister from a bundled library (≥10 phrases) with a count-up timer; at 30s, prompt switches to "Now without the pen, read it again"; user may optionally record either or both passes via the same Voice Journal recording flow; system never scores, rates, or assesses the pass.

**FRs covered:** FR43, FR44, FR45, FR46, FR47

### Epic 6: Daily Review — Flashcards

Daily Review route accessible from main nav (separate from today's-paragraph flow). System selects N words from collection prioritizing oldest `lastReviewedAt` (and never-reviewed first); user flips card to reveal IPA + meaning + example + per-word TTS, then marks Got it / Almost / Forgot; system updates `reviewCount`, `lastReviewedAt`, and a cumulative `difficultyRating` (no formal SRS algorithm in MVP).

**FRs covered:** FR48, FR49, FR50, FR51, FR52

### Epic 7: Day-14 Aha Moment

The load-bearing emotional climax of the entire product. On the user's 14th distinct day-of-use, a layout-level `Day14Gate` short-circuits route render and surfaces the full-bleed `Day14Takeover`: serif headline "Listen to how far you've come.", composite player attempting same-hard-word match between earliest and most-recent recordings (FR38 fallback to whole-paragraph if no overlap), single play button, ButtonPair `[Yes, I hear it] / [No, not really]` hidden until first playback completes. **No close button, no Esc handler, no overlay click-out, no skip link** (deliberate WCAG 2.1.2 exception, documented inline). Yes/No write to `localStorage.day14State` BEFORE celebratory copy renders (persistence-then-flow); ghost continue button appears after 3s; prompt does not re-fire until Day 30 milestone. Edge case: if no Day-1 recording exists, takeover does not fire and re-evaluates next app open.

**FRs covered:** FR37, FR38, FR39, FR40

### Epic 8: Offline Pack & Error Recovery Resilience

Standalone Node script (`scripts/generate-offline-pack.ts` — outside the deployed app, runs via `pnpm tsx`) reads provider key from `.env.local` and generates ~1000 paragraphs across all theme × persona combinations using `gemini-2.5-flash-lite`, throttled ≤10 RPM to fit free-tier daily quota; output JSON consumed by Settings "Download Pack" action that imports into IndexedDB. On any LLM failure (provider error, rate limit, network failure) the InlineErrorSurface replaces the paragraph zone with three actions: `[Retry]` (with exponential backoff `[1s, 3s]`, only when `error.retryable === true`), `[Open Settings]` (always), and `[Use Offline Pack]` (only when pack loaded). Offline-pack selections de-duplicate within a 30-day rolling window. Calendar day-cells using offline-pack content carry a subtle `OfflineBadge` icon overlay so future-self sees which sessions were fallback vs fresh generation.

**FRs covered:** FR59, FR60, FR61, FR62, FR63, FR64

### Epic 9: Server Account & Settings

Log in with email/password; settings (theme, persona, length, retention, voice, Gemini key) persist in Postgres when `STORAGE_BACKEND=api`. Client provider-key vault hidden; `AppGate` replaces `ProviderKeysGate`. **Status: implemented (Phase 1).**

**BVRs covered:** BVR1, BVR2, BVR3, BVR4, BVR5, BVR6

### Epic 10: Server-Side Paragraph Generation

Generate today's paragraph via FastAPI Gemini proxy; same-day cache in `paragraph_cache`; browser never holds Gemini key after save. **Status: implemented (Phase 2).**

**BVRs covered:** BVR7, BVR8, BVR9 · **FRs covered (server path):** FR14, FR19, FR21

### Epic 11: Cloud Recording Persistence

One recording upload end-to-end: presigned PUT to R2, metadata in Postgres, playback via signed GET. MediaRecorder remains client-side.

**BVRs covered:** BVR10, BVR11, BVR12, BVR14 · **FRs covered (server path):** FR31, FR35, FR41

### Epic 12: Server-Backed Daily Loop (Stretch)

Collection words and day completions synced via API when in API mode. Defer until Epic 11 demo is clean.

**BVRs covered:** BVR13 · **FRs covered (server path):** FR26–FR29, FR53–FR57

### Epic 13: Production Deploy & Interview Polish

Dockerfile, Neon production wiring, Vercel + API host deploy, README architecture diagram, 3 ADRs.

**BVRs covered:** BVR15

### Epic 14: Product UI Refresh (2026 Mockups)

Replace the editorial hub-and-spoke shell with the soft-card dashboard design from `_bmad-output/design/ui-mockups-v2/`. Same feature set as Epics 1–8; visual/layout overhaul only. Day-14 takeover and inline error patterns preserved.

**UX-V2 covered:** UX-V2-UI1 through UX-V2-UI9 · **Visual reference:** mockups index in design folder

### Epic 15: API Mode Parity & Close-Out

Close gaps discovered after Epics 9–14 shipped: calendar/streak/journey must honor server `paragraph_cache` and recordings when `STORAGE_BACKEND=api`; remove dead nav; align docs and sprint tracking. **Depends on Epics 10, 11, 12, 14.**

**BVRs covered:** BVR16, BVR17, BVR18, BVR19, BVR20 · **FRs covered (server path):** FR19, FR53–FR58, FR38 (Day-14 days-of-use)

## Inter-Epic Dependencies

| Epic | Depends on | Standalone delivery |
|---|---|---|
| Epic 1 | (none — bottom of stack; bundles project init + visual foundation) | Onboard + generate + render paragraph + TTS end-to-end |
| Epic 2 | Epic 1 (LLM, hard-words list, today screen) | Save / list / remove + recycling complete |
| Epic 3 | Epic 1 (storage layer, settings UI shell) | Record + replay + compare + retention setting complete |
| Epic 4 | Epic 2 (paragraphCache writes for FR19/Story 4.1 + Story 4.5 archived view), Epic 3 (day-counter primitive + recordings for archived day view) | Calendar + streak + archived day view complete |
| Epic 5 | Epic 1 (today screen), Epic 3 (optional Voice Journal hook) | Warm-up flow runs end-to-end |
| Epic 6 | Epic 2 (collection table) | Review queue + flip-card + feedback complete |
| Epic 7 | Epic 3 (recordings + day-counter) | Takeover + comparison + outcome capture complete |
| Epic 8 | Epic 1 (LLM error path), Epic 4 (calendar badge surface) | Script + load + fallback + recovery + badge + dedupe complete |
| Epic 9 | (none for API layer) | Login + Postgres settings in API mode |
| Epic 10 | Epic 9 (auth + settings) | Server paragraph generate + cache |
| Epic 11 | Epic 9 (auth), Epic 10 optional (paragraph ref on recording) | One recording upload + playback from R2 |
| Epic 12 | Epic 9, Epic 10 | Collection + completions on server (stretch) |
| Epic 13 | Epics 9–11 minimum | Deployable demo URL |
| Epic 14 | Epics 1–8 features exist | New UI shell; can run parallel to Epic 11 after 14.1 |
| Epic 15 | Epics 10, 11, 12, 14 | Honest API-mode calendar/journey + close-out |

## MVP-Slip Hierarchy Mapping

Per PRD §Product Scope:

| PRD Drop-First Order | Epic | Status |
|---|---|---|
| 1st to drop | Epic 8 (offline pack F10) | Resilience |
| 2nd to drop | Epic 4 (calendar F9) | Habit visualization |
| 3rd to drop | Epic 6 (daily review F8) | Spaced reinforcement |
| 4th to drop | Epic 5 (warm-up F7) | Differentiating ritual |
| Cannot drop | Epic 7 (Day-14 F6 climax) | MVP-defining |
| Cannot drop | Epic 3 (Voice Journal F6 core) | MVP-defining |
| Cannot drop | Epic 1 + Epic 2 (Tier 1 F1–F5) | App does not function without these |

## Epic 1: Onboarding & First Paragraph Generation

Cold-start to first paragraph rendered with hard-words + IPA + TTS in ≤3 minutes. Foundation stories (scaffold, tokens, layout, storage, LLM seam, security guards) are bundled with user-facing stories (onboarding, settings, today screen, hard-words list, error surface) so the epic delivers the first user-value moment end-to-end.

### Story 1.1: Project Scaffold and Agent Configuration

As Priyank,
I want a working Next.js 16 + Tailwind 4 + TypeScript project initialized with the exact dependencies required by Audiblytics' architecture,
So that all subsequent stories build on a consistent, agent-friendly foundation that respects the dependency-parsimony NFR.

**Acceptance Criteria:**

**Given** an empty workspace
**When** the developer runs `pnpm create next-app@latest audiblytics --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --use-pnpm` followed by `pnpm dlx shadcn@latest init` and `pnpm dlx shadcn@latest add button input select label dialog card tooltip`
**Then** the project tree matches `architecture.md § Complete Project Tree` (src/app, src/components/ui, src/components/audiblytics, src/features, src/lib, src/types, scripts, public)
**And** `pnpm dev` boots a Turbopack dev server with HMR working
**And** runtime deps `ai`, `@ai-sdk/google`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@openrouter/ai-sdk-provider`, `ollama-ai-provider-v2`, `dexie@^4.4`, `dexie-react-hooks@^4.2`, `zod` are installed (per AR3)
**And** dev deps `@next/bundle-analyzer` and `tsx` are installed
**And** no banned deps (Redux, Zustand, animation libs, toast libs, test framework) appear in `package.json`

**Given** a coding agent reads repo guidance
**When** it opens `AGENTS.md` and `CLAUDE.md` (auto-generated by create-next-app)
**Then** both files are edited to point at `architecture.md § Implementation Patterns` as source of truth for naming/folder/error/styling conventions (per AR26)
**And** `.cursor/rules/architecture.mdc` mirrors the same guidance

**Given** the developer runs `pnpm build`
**When** the build completes
**Then** no errors are emitted and the resulting `.next/` artifact loads `/` successfully

---

### Story 1.2: Visual Token System, Typography, and Self-Hosted Fonts

As Priyank,
I want the editorial visual identity (cream/forest/brick palette, three-family type stack, semantic token layer, 4px spacing scale) live in `globals.css` and Tailwind 4 theme,
So that every UI story written afterwards can compose with semantic tokens (`bg-surface`, `text-primary`) instead of hex literals, and the visual lineage is editable in one place.

**Acceptance Criteria:**

**Given** `globals.css` is opened
**When** the file is read
**Then** raw color tokens `--cream`, `--cream-dim`, `--border`, `--ink`, `--ink-soft`, `--ink-faint`, `--forest`, `--forest-deep`, `--forest-light`, `--forest-faint`, `--brick`, `--brick-deep`, `--sage-dim`, `--rose-dim` are defined in `:root` (per UX-DR1)
**And** semantic mapping tokens `--surface`, `--surface-elevated`, `--divider`, `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-on-primary`, `--text-on-danger`, `--primary`, `--primary-hover`, `--primary-soft`, `--accent`, `--danger`, `--danger-hover`, `--state-disabled`, `--state-disabled-bg`, `--state-not-chosen-primary`, `--state-not-chosen-danger`, `--focus-ring` map to raw tokens
**And** Tailwind 4 `@theme` block exposes these as utility classes (`bg-surface`, `text-primary`, `border-divider`, etc.)

**Given** `app/layout.tsx` is opened
**When** the file is read
**Then** EB Garamond, Inter, and JetBrains Mono are loaded via `next/font` with `display: 'swap'` and Latin subsets (per AR21, UX-DR2)
**And** JetBrains Mono is configured with ligatures explicitly disabled (`fontFeatureSettings: '"liga" 0'` or equivalent)
**And** total font payload measured at `pnpm build` is ≤250KB

**Given** a developer creates a sample component using `bg-surface text-primary` classes
**When** the page renders
**Then** the cream background and ink text appear correctly in both Chrome and Safari
**And** AA contrast (≥4.5:1) is verified for the `--ink` on `--cream` pair via Chrome DevTools

**Given** the design system documentation
**When** typography classes are exposed in Tailwind theme
**Then** all 13 named type classes from UX-DR2 (`text-display`, `text-headline-1/2/3`, `text-paragraph-hero`, `text-body`, `text-ui`, `text-ui-sm`, `text-caption`, `text-micro-label`, `text-data`, `text-data-large`, `text-rail`, `text-footnote`) are defined with their family/size/line-height/weight per spec

---

### Story 1.3: Root Layout Shell, TopNav, DayRail Skeleton, StatRail Skeleton, and Honesty Footer

As Priyank,
I want the three-column editorial layout (sticky day-rail + center column + sticky stat-rail + top nav + honesty footer) rendering on every route,
So that the visual scaffolding is in place before any feature content lands, and the dev gallery surface can validate components in isolation.

**Acceptance Criteria:**

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

---

### Story 1.4: Storage Foundations — Dexie Schema, useLocalStorage Hook, Base Zod Schemas

As Priyank,
I want the IndexedDB schema, namespaced localStorage hook, and Zod schema infrastructure in place so that all subsequent persistence stories use the same validated, single-source-of-truth shapes,
So that schema drift and silent data corruption are structurally impossible.

**Acceptance Criteria:**

**Given** `src/lib/storage/db.ts` is opened
**When** the file is read
**Then** an `AudiblyticsDB` Dexie class exists with `version(1).stores({...})` declaring `collection`, `recordings`, `paragraphCache`, `offlinePack` tables with the indexes from AR10 (e.g. `collection: '++id, savedAt, lastReviewedAt, word'`)
**And** a singleton `db` instance is exported
**And** a `verifyOnLoad()` helper validates persisted records against their Zod schemas once at app load and logs (not throws) any drift (per AR17)

**Given** `src/lib/storage/use-local-storage.ts` is opened
**When** the file is read
**Then** `useLocalStorage<T>(key, defaultValue, schema)` is exported (per AR12)
**And** the hook validates reads through the provided Zod schema, returning `defaultValue` on validation failure
**And** the hook listens for the `storage` event for cross-tab sync
**And** all `key` values must be prefixed `audiblytics.*` (per AR11) — bare keys throw a programmer-error assertion at hook construction
**And** raw `window.localStorage.getItem`/`setItem` calls outside this hook are absent from the rest of the codebase (verified by grep audit)

**Given** `src/lib/schemas/` is inspected
**When** the folder contents are listed
**Then** `settings.schema.ts` (FR4–FR8 fields), `provider-keys.schema.ts` (FR9 vault), `collection.schema.ts` (FR26 placeholder for E2), `recording.schema.ts` (FR31 placeholder for E3), `paragraph-cache.schema.ts` (FR19 placeholder for E4), `offline-pack.schema.ts` (FR62 placeholder for E8), `day14-state.schema.ts` (FR39 placeholder for E7), `days-of-use.schema.ts` (NFR12 placeholder for E3), and `completions.schema.ts` (FR53 placeholder for E4) exist
**And** each schema exports both the Zod schema and the inferred TypeScript type via `z.infer<>` (per AR16)

**Given** a developer triggers any Dexie write
**When** the write fails with `QuotaExceededError` (simulated)
**Then** the operation returns a `Result<T, StorageError>` with `kind: 'quota_exceeded'` (per AR9, AR25, NFR8)
**And** the failure is never silently swallowed

---

### Story 1.5: LLM Provider Abstraction, Schema Validation, Retry, and Error Parsing

As Priyank,
I want a single `generateParagraph()` seam that wraps Vercel AI SDK 6 (`generateText` + `Output.object()`) and routes to any of 5 providers with unified error parsing and ≤2-attempt retry,
So that swapping providers requires zero code changes and any provider's failure mode surfaces a consistent, actionable error.

**Acceptance Criteria:**

**Given** `src/lib/llm/generate.ts` is opened
**When** the file is read
**Then** `generateParagraph(opts): Promise<Result<ParagraphResult, LlmError>>` is exported (per AR6, AR9)
**And** the function uses `generateText({ model, prompt, output: Output.object({ schema: paragraphSchema }) })` from `ai@^6` (NOT the deprecated `generateObject`, per AR4)
**And** `paragraphSchema` (Zod) requires `paragraph: string.min(1)` and `hardWords: array({word, ipa, meaning, exampleSentence}).min(1).max(10)` — incomplete entries dropped before render (per FR17)

**Given** `src/lib/llm/client.ts` is opened
**When** the file is read
**Then** `getProvider(settings)` returns a `LanguageModel` constructed from one of 5 providers based on `settings.activeProvider` (per FR1, FR10, AR6)
**And** model lookup uses the `MODEL_BY_PROVIDER` table from `models.ts` with `gemini` defaulting to `gemini-2.5-flash` (per AR5)
**And** provider-SDK imports (`@ai-sdk/google`, etc.) appear ONLY inside `src/lib/llm/` files (verified by grep audit per AR18)

**Given** an LLM call fails
**When** the per-provider error parser at `src/lib/llm/errors/<provider>.ts` runs
**Then** the native error is normalized into the `LlmError` discriminated union (`kind: 'rate_limit' | 'quota_exceeded' | 'auth' | 'network' | 'malformed_response' | 'unknown'`, per AR7) with `providerCode`, `message`, `retryable`, optional `retryAfterMs`
**And** all 5 provider parsers (gemini, openai, anthropic, openrouter, ollama) handle their respective vocabularies (Gemini `RESOURCE_EXHAUSTED`/`403`; OpenAI `429`/`401`; Anthropic `overloaded_error`/`rate_limit_error`; Ollama `connection refused`; OpenRouter mapped via OpenAI-compatible parser, per FR11)

**Given** an LLM call returns a `retryable: true` error
**When** `lib/llm/with-retry.ts` is invoked
**Then** the call retries up to 2 times with backoff `[1s, 3s]` (per FR12, AR8)
**And** retries do NOT fire for `retryable: false` errors (auth, quota_exceeded, unknown)
**And** after exhaustion, the final error surfaces unchanged

**Given** the LLM response payload is structurally invalid JSON
**When** Zod validation fails
**Then** the function returns `Result.err({ kind: 'malformed_response', retryable: true, ... })` so it triggers the retry path (per FR13, FR17)

---

### Story 1.6: Hard-Scope-Boundary Three-Layer Guard

As Priyank,
I want three structural guards (build-time, runtime, and documentation) preventing accidental public deployment of the n=1 personal-use app,
So that the API-key-in-localStorage architecture cannot be silently broken by a future contributor (or future me).

**Acceptance Criteria:**

**Given** `next.config.ts` is opened
**When** the build runs with `NODE_ENV === 'production'` AND `process.env.NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE !== 'true'`
**Then** the build emits a clearly worded warning naming the hard-scope-boundary policy (per AR15, NFR14)
**And** the build still completes (warning, not error — Vercel deploys with the env var still work)

**Given** `src/lib/llm/client.ts` is opened
**When** the file is read
**Then** an `assertClientOnlySafeContext()` function runs at module load
**And** it throws an `Error('Audiblytics LLM client cannot run server-side — see architecture.md NFR14')` if `typeof window === 'undefined'` (per AR15)

**Given** `README.md` is opened
**When** the file is read
**Then** the first H1 section is a "PERSONAL-USE ONLY" SECURITY block referencing NFR14
**And** `app/layout.tsx` carries a top-of-file comment `// HARD-SCOPE-BOUNDARY: API keys in localStorage; see architecture.md § Authentication & Security`
**And** removing the boundary structurally requires editing all three files (build config, client guard, docs) — verified by inspection

---

### Story 1.7: Browser TTS Wrapper with Voice Lifecycle Handling

As Priyank,
I want a `lib/audio/tts.ts` wrapper that handles Chrome's asynchronous voice loading, Safari's smaller voice set, voice-selection persistence, and graceful fallback to system default,
So that any later TTS-using component (HardWordRow, paragraph play, Daily Review) can call `speak(text)` without re-implementing the lifecycle.

**Acceptance Criteria:**

**Given** `src/lib/audio/tts.ts` is opened
**When** the file is read
**Then** `useVoices(): SpeechSynthesisVoice[]`, `speak(text: string, voice?: SpeechSynthesisVoice): void`, and `getPersistedVoice(): SpeechSynthesisVoice | null` are exported (per AR20)
**And** raw `speechSynthesis` access does NOT appear outside this module (verified by grep audit)

**Given** the user opens the app in Chrome with no voices initially loaded
**When** `useVoices()` first returns
**Then** the hook re-renders when the `voiceschanged` event fires and exposes the populated voice list (per FR24)

**Given** the user previously selected a voice that is no longer available (e.g., switched browsers)
**When** the app calls `speak(text)`
**Then** playback uses the system default English voice (per FR25)

**Given** the user opens Settings voice picker and the voices are still loading
**When** the picker first renders
**Then** a "Loading voices…" caption appears in the picker (per FR24)
**And** the picker auto-refreshes when voices arrive

**Given** TTS playback is triggered
**When** the user taps a play action
**Then** playback begins in <100ms (per NFR4)

---

### Story 1.8: Onboarding Flow — Provider Selection, Key Entry, Defaults, First Generate

As a first-time user (Priyank, Day 0),
I want a single-screen onboarding with provider dropdown (Gemini default), API key paste field with "Get a free key" deep-link, theme/persona/length defaults, and a single Generate button,
So that I reach my first paragraph in ≤3 minutes from cold start.

**Acceptance Criteria:**

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

---

### Story 1.9: Settings Screen — Provider Switch with Key Vault Preservation

As Priyank,
I want a `/settings` route where I can change provider (preserving previously entered keys), edit theme/persona/length defaults, pick a TTS voice, and have changes take effect on the next paragraph generation,
So that I can experiment with providers and adjust defaults without losing keys or regenerating retroactively.

**Acceptance Criteria:**

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

---

### Story 1.10: Today Screen — Paragraph Hero with Manual Generate Action

As Priyank,
I want the `/` route to render the Today screen with the current paragraph in the editorial paragraph-hero style and a Generate action that is explicit (not auto-fired on app load),
So that paragraph generation respects my intent and the loading state is predictable.

**Acceptance Criteria:**

**Given** onboarding has completed and a paragraph exists in the LLM response in memory
**When** the Today route renders
**Then** `<ParagraphHero>` displays the paragraph in `text-paragraph-hero` (EB Garamond, text-xl, line-height 1.7, max-w-640, centered, per UX-DR11)
**And** the page title row reads `Today` + meta-line `Day N · Theme · Persona`

**Given** the user has not yet generated today's paragraph
**When** the Today route renders
**Then** the paragraph zone shows a `Generate` primary button (forest, single tap) with the current theme/persona/length displayed beneath (per FR14, NFR23)
**And** no auto-generation fires on app load (per FR14)

**Given** the user clicks Generate
**When** the LLM call is in flight
**Then** the paragraph zone shows a 3-line cream-dim skeleton loader (per UX-DR35)
**And** the Generate button shows inline mini-spinner + text "Generating…" + button disabled
**And** the rest of the layout shell (TopNav, DayRail, StatRail, HonestyFooter) remains visible (no full-page overlay, per UX-DR35)

**Given** the LLM returns a successful `Result.ok(paragraphResult)`
**When** the response is received
**Then** the paragraph renders within the 640px column
**And** generation completes in ≤15s end-to-end on Gemini Flash for a 150-word paragraph (per NFR2)

**Given** the user's collection is empty (cold-start) and they click Generate
**When** the LLM is called
**Then** the prompt builder omits the recycle-words section and requests only new advanced words (per FR16)
**And** no error surfaces

**Given** any hard-word in the LLM response is missing one of `word`, `ipa`, `meaning`, or `exampleSentence`
**When** the response is rendered
**Then** that specific entry is silently dropped (not rendered as partial, per FR17)
**And** the remaining valid entries render normally

---

### Story 1.11: Hard-Words List with Inline TTS and Per-Word + Paragraph Playback

As Priyank,
I want each hard word in the list below the paragraph to show its IPA in mono, its meaning, and its example sentence with a single-tap pronounce action,
So that I can understand and hear each unfamiliar word inline without leaving the paragraph context.

**Acceptance Criteria:**

**Given** today's paragraph has rendered
**When** the user scrolls to the hard-words list
**Then** each hard word renders as a `<HardWordRow>` showing `word /ipa/ ▶ ☆` on row 1, `noun · meaning text` on row 2, `ex: "example sentence"` on row 3 (per FR18, UX-DR12)
**And** the IPA is wrapped in `<span lang="en-fonipa">` and rendered in JetBrains Mono with ligatures disabled (per UX-DR2)

**Given** the user taps the play icon next to a hard word
**When** TTS playback begins
**Then** the `lib/audio/tts.ts` `speak()` function is called with the word
**And** the play icon flips to a pause icon during playback (per UX-DR12, UX-DR35)
**And** playback start latency is <100ms (per NFR4)

**Given** the user taps the play icon next to the paragraph (page-level meta-action row)
**When** TTS playback begins
**Then** the full paragraph reads aloud via `speak()` (per FR23)
**And** the same play/pause icon-flip pattern applies

**Given** the save icon next to a hard word is rendered
**When** the user inspects it
**Then** the icon is rendered (outline state) but tapping it produces no behavior yet (save-to-collection persistence handled in Epic 2 Story 2.1)
**And** the icon has `aria-label="Save <word> to collection"` per UX-DR12 ARIA spec

**Given** the user navigates to the page via keyboard
**When** they tab through the hard-words list
**Then** each play and save button is focusable with the forest focus ring visible (per UX-DR37)

---

### Story 1.12: Inline Error Surface with Two-Action Recovery

As Priyank,
I want any LLM generation failure to render an inline error surface (NOT a modal) in the paragraph zone with `[Retry]` and `[Open Settings]` actions, brick-text headline, and ink-soft body explaining the error,
So that errors feel like content that hasn't loaded rather than a blue screen, and recovery is one tap away.

**Acceptance Criteria:**

**Given** `lib/llm/generate.ts` returns `Result.err(LlmError)` after retries are exhausted
**When** the Today route receives the error
**Then** `<InlineErrorSurface>` replaces the paragraph zone (NOT a modal, NOT a toast, per UX-DR24, UX-DR33)
**And** the error headline appears in `--brick` text (per UX color discipline — brick reserved for Day-14 + errors per UX-DR1)
**And** the body text in `--ink-soft` describes the provider-specific error (e.g., "Couldn't reach Google Gemini. Got a `RESOURCE_EXHAUSTED` response. This usually means a transient quota issue.")
**And** the layout shell (TopNav, DayRail, StatRail, HonestyFooter) remains visible

**Given** the surface is rendered
**When** the user inspects the action buttons
**Then** `[Retry]` and `[Open Settings]` buttons are visible (the third `[Use Offline Pack]` action is hidden until Epic 8 — per FR64 staged)
**And** buttons follow secondary/outline variant styling (per UX-DR29)
**And** `role="alert" aria-live="assertive"` is set on the surface container (per UX-DR24)

**Given** the user taps `[Retry]`
**When** the click fires
**Then** the same `generateParagraph()` call is re-issued (NOT the retry-internal `with-retry`, per UX flow §J4)
**And** during the retry, the button shows mini-spinner and other action is disabled

**Given** the user taps `[Open Settings]`
**When** the route changes
**Then** the user lands on `/settings` with the provider dropdown in focused state

**Given** the `ProviderChip` in the HonestyFooter
**When** the most recent LLM call has just failed
**Then** the chip's status dot turns brick (per UX-DR17)
**And** the chip remains clickable and navigates to Settings on tap

---

## Epic 2: Word Collection & Recycling Loop

User saves hard words to a personal collection, browses/removes them, and sees 2–3 saved words recycled into subsequent paragraphs. Latest paragraph cached so re-display works.

### Story 2.1: Save Word from Hard-Words List to Collection

As Priyank,
I want a single tap on the save icon next to any hard word to persist that word to my IndexedDB collection with full metadata,
So that I build a personal vocabulary store without leaving the today screen.

**Acceptance Criteria:**

**Given** today's paragraph and hard-words list have rendered (per Epic 1 Story 1.11)
**When** the user taps the save icon next to a hard word
**Then** a new row is inserted into the Dexie `collection` table with fields `{id, word, ipa, meaning, exampleSentence, savedAt: ISO datetime UTC, sourceParagraphId, reviewCount: 0, lastReviewedAt: null, difficultyRating: 1}` validated against `collection.schema.ts` (per FR26, AR16)
**And** the save-icon flips from outline to filled state instantly (state-flip = success per UX-DR30)
**And** no toast or success modal appears

**Given** the IndexedDB write fails (simulated `QuotaExceededError`)
**When** the failure is caught
**Then** `<InlineErrorSurface variant="storage">` renders inline next to the failing row with `[Open Settings]` recovery (per FR42, AR25, NFR8)
**And** the save-icon does NOT flip to filled state

**Given** the user closes and reopens the browser
**When** the Today route renders the same paragraph and the user looks at the previously saved word
**Then** the save-icon shows the filled (saved) state (per FR29 persistence)

**Given** the same word is already in the collection (duplicate save attempt)
**When** the user taps save again
**Then** the operation is a no-op (idempotent — same `id` keyed by the word's source paragraph entry)
**And** no error surfaces

---

### Story 2.2: Collection Route — List, Sort by Recency, Per-Word TTS, Remove

As Priyank,
I want a `/collection` route that lists every saved word sorted by save recency with inline TTS playback and a remove action,
So that I can browse my vocabulary, hear words, and prune entries without going through the Today screen.

**Acceptance Criteria:**

**Given** the user clicks "Collection" in TopNav
**When** the route renders
**Then** the page shows a list of collection entries sorted by `savedAt DESC` (per FR27)
**And** each row renders word + IPA (mono) + meaning + example with a play-TTS icon and a remove icon
**And** the list updates reactively via `useLiveQuery` from `dexie-react-hooks` (per AR3)
**And** initial render with ≤100 words completes in <200ms (per NFR5)

**Given** the collection is empty (first-time user)
**When** the route renders
**Then** the page shows a single italic Garamond line "No words saved yet." (per UX-DR34) — no CTA, no illustration, no "Get started!" copy

**Given** the user taps a word's TTS play icon
**When** playback fires
**Then** `speak(word)` runs via the TTS wrapper (per FR22, Epic 1 Story 1.7)

**Given** the user taps the remove icon
**When** the click fires
**Then** the word is deleted from the Dexie `collection` table (per FR28)
**And** the row disappears from the list immediately (via `useLiveQuery` re-render)
**And** no "Are you sure?" confirmation appears (per UX-DR30 ban on confirmations on primary actions)

**Given** the user is keyboard-navigating
**When** they tab through the list
**Then** each row's TTS and remove icons are focusable with forest focus ring visible (per UX-DR37)

---

### Story 2.3: Recycle 2–3 Saved Words Into Generated Paragraphs

As Priyank,
I want every paragraph generation to weave 2–3 randomly selected words from my saved collection back in (when ≥2 saved words exist),
So that recently learned vocabulary recurs in fresh contexts and the loop becomes self-feeding.

**Acceptance Criteria:**

**Given** the user's collection has ≥2 saved words
**When** the user clicks Generate on the Today screen
**Then** `select-recycle-words.ts` (in `features/paragraph/`) returns 2–3 words selected from the collection (per FR15)
**And** the prompt builder injects these words into the LLM prompt with explicit instructions to use them in the generated paragraph
**And** the LLM response paragraph contains those words verbatim or in close morphological variants

**Given** the user's collection has 0 or 1 words (cold-start)
**When** the user clicks Generate
**Then** the prompt builder omits the recycle section and requests only new advanced words (per FR16)
**And** no error surfaces and generation succeeds normally

**Given** the LLM has just generated a paragraph
**When** the response is validated and accepted
**Then** the full `{paragraph, hardWords[], theme, persona, generatedAt: UTC datetime}` is written to the Dexie `paragraphCache` table (per FR21, AR10)
**And** the entry is keyed by `id` and indexed by `generatedAt`

**Given** a recycled word appears in the rendered paragraph
**When** the hard-words list renders below
**Then** the recycled word may appear in the hard-words list with a recycled-variant marker (`♺` per UX-DR12) — but the per-PRD Q2 default of "no visual indicator on recycled words within the paragraph itself" is preserved (the `<mark>` highlight applies to all hard words equally)

---

## Epic 3: Voice Journal — Record, Persist, Replay, Compare

User records readings via single-tap with cross-browser MIME handling, replays/compares recordings, and chooses retention policy. Includes the day-counter primitive (UTC-anchored), since recordings are the first feature to stamp `dayOfUse`.

### Story 3.1: MediaRecorder Wrapper with MIME Auto-Detect, 60s Cap, and Permission Lifecycle

As Priyank,
I want a `lib/audio/recorder.ts` factory that wraps `MediaRecorder` with auto-detected MIME (Chrome `webm-opus` / Safari `mp4`), a 60-second hard cap, and a permission state machine,
So that any later recording UI (RecordPanel, WarmUpDrill optional record) can call `createRecorder()` without re-implementing browser quirks.

**Acceptance Criteria:**

**Given** `src/lib/audio/recorder.ts` is opened
**When** the file is read
**Then** `createRecorder()` returns an object with `start(): Promise<void>`, `stop(): Promise<{ blob, mimeType, durationMs }>`, and a `state` field of type `'idle' | 'requesting-permission' | 'recording' | 'error'` (per AR20)
**And** raw `MediaRecorder` and `navigator.mediaDevices.getUserMedia` access does NOT appear outside this module (verified by grep audit per AR18)

**Given** the user has not yet granted microphone permission
**When** `start()` is called for the first time
**Then** `navigator.mediaDevices.getUserMedia({ audio: true })` is invoked (per FR32, NFR18)
**And** the state transitions `idle → requesting-permission → recording` on grant
**And** the state transitions `idle → requesting-permission → error` with a `RecorderError { kind: 'permission_denied' }` on denial (per FR33)

**Given** recording is in progress on Chrome
**When** `stop()` is called
**Then** the resolved blob's `mimeType` is `audio/webm` (or `audio/webm;codecs=opus`)
**And** on Safari, the `mimeType` is `audio/mp4` (verified manually in Safari)
**And** the actual MIME is stored alongside the blob (NOT assumed at playback time, per architecture cross-browser handling)

**Given** recording reaches the 60-second mark
**When** the timer hits 60s
**Then** `stop()` is invoked automatically and the recording is finalized (per UX-DR13 hard cap)

**Given** recording is in progress
**When** measured from the `start()` call
**Then** the `state` transitions to `recording` in <300ms when permission is already granted (per NFR3)

---

### Story 3.2: Day-Counter Primitive (UTC-Anchored, Idempotent)

As Priyank,
I want a `lib/day-counter/` module exposing `recordDayOfUse`, `distinctDaysOfUse`, `currentStreak`, and `isCompleted` — all UTC-anchored,
So that day-14 detection, streak computation, and 90-day pruning all share one correctness-critical primitive that handles DST/timezone/month boundaries identically.

**Acceptance Criteria:**

**Given** `src/lib/day-counter/index.ts` is opened
**When** the file is read
**Then** `recordDayOfUse(now?: Date): void`, `distinctDaysOfUse(): number`, `currentStreak(now?: Date): number`, and `isCompleted(date: string): boolean` are exported (per AR13)
**And** `format-utc-date.ts` exports a `'YYYY-MM-DD'` UTC formatter (per NFR13)
**And** `use-distinct-day-of-use.ts` exports a React hook wrapping the localStorage read

**Given** `recordDayOfUse(now)` is called twice in the same UTC day
**When** the second call runs
**Then** `audiblytics.daysOfUse: string[]` is unchanged (idempotent, per AR13)
**And** when called on a new UTC day, the new date is appended

**Given** the user is in a timezone where the local date differs from UTC near midnight
**When** `recordDayOfUse()` is called
**Then** the UTC date is recorded (NOT the local date), so day-counting is consistent across DST transitions and timezone changes (per NFR13)

**Given** `audiblytics.daysOfUse` contains `['2026-05-01', '2026-05-02', '2026-05-04']` (a one-day gap)
**When** `currentStreak(new Date('2026-05-04T12:00:00Z'))` is called
**Then** the result is `1` (today only — the streak resets cleanly on the gap, per FR57, NFR13)

**Given** `audiblytics.daysOfUse` contains 14 distinct UTC dates
**When** `distinctDaysOfUse()` is called
**Then** the result is `14` (used by Epic 7 Day-14 trigger, per NFR12)

---

### Story 3.3: RecordPanel — Capture, Persist, and Stamp dayOfUse

As Priyank,
I want a single-tap RecordPanel below today's paragraph that captures audio with a count-up timer and pulsing indicator, persists the recording to IndexedDB with full metadata, and increments my day-counter,
So that recording feels effortless (NFR3) and the calendar/Day-14 layers downstream get accurate `dayOfUse` data.

**Acceptance Criteria:**

**Given** the Today route has rendered today's paragraph
**When** the user inspects the area below the paragraph
**Then** `<RecordPanel>` shows a forest 56×56 record button + mono caption "Tap to record this read" + a `0:00 / 1:00` mono timer (per FR30, UX-DR13)
**And** the keyboard shortcut `R` toggles record/stop when focus is on the panel

**Given** the user taps record (or presses `R`)
**When** the recorder transitions to `recording` state
**Then** the button shifts to brick stop-icon, timer counts up `0:00 → 0:01 → ...`, and a 1.0s breathing pulse animates the button background (per UX-DR13, UX-DR36)
**And** when `prefers-reduced-motion: reduce` is set, the pulse becomes a static color shift (per UX-DR39)
**And** an `aria-live="polite"` region announces "Recording, N seconds elapsed" (per UX-DR13)

**Given** the user taps stop
**When** the recorder finalizes the recording
**Then** a new row is inserted into the Dexie `recordings` table with fields `{id, recordingDate: ISO datetime UTC, paragraphId, durationMs, mimeType, blob, dayOfUse: distinctDaysOfUse() snapshot}` validated against `recording.schema.ts` (per FR31, AR16)
**And** `recordDayOfUse()` is called from `useSaveRecording` (per AR13, architecture data flow)
**And** the recording materializes inline below the panel as `▶ 0:42 · today HH:MMpm`

**Given** the user records multiple takes in the same session
**When** the second take stops
**Then** a new row is inserted (no overwrite of the first take, per FR34)
**And** both takes appear in the inline list

**Given** the IndexedDB write fails
**When** the failure is caught
**Then** the audio blob is held in memory and `<InlineErrorSurface variant="storage">` renders with `[Open Settings]` + `[Try Again]` (per FR42, NFR8, UX-DR24)
**And** the recording is NOT silently lost

**Given** the microphone permission is denied
**When** the user attempts to record
**Then** `<RecordPanel>` shows an inline error: "Microphone access is required to record. Click the lock icon in your address bar, then try again." with a `[Try Again]` button (per FR33, UX-DR13)
**And** the rest of the app remains fully functional (per NFR11)

---

### Story 3.4: Voice Journal Route — List All Recordings with Inline Playback

As Priyank,
I want a route (accessible from `Today` or a sub-link) that lists every voice recording reverse-chronologically with metadata and inline playback,
So that I can browse my recording history and replay any take without leaving the app shell.

**Acceptance Criteria:**

**Given** the user navigates to the Voice Journal route (via `/collection` sub-link or in-page anchor — UX places it within the Today flow but a dedicated list view is required for FR35)
**When** the route renders
**Then** the page shows `<VoiceJournalList>` with one row per recording: `▶ Day N · Theme · 0:48 [↓]` (per UX-DR14)
**And** the list is sorted by `recordingDate DESC` via `useLiveQuery`

**Given** the user taps the play icon on any row
**When** playback begins
**Then** the row background shifts to `--cream-dim` and the icon flips to pause (per UX-DR14)
**And** the audio plays back using the stored `mimeType` (NOT an assumed type, per cross-browser handling)

**Given** the user taps the download icon
**When** the click fires
**Then** the audio blob is downloaded as a `.webm` or `.mp4` file (matching the stored MIME) named `audiblytics-day-N-HHMM.<ext>`

**Given** there are zero recordings
**When** the route renders
**Then** the page shows a single italic Garamond line "No recordings yet." (per UX-DR34) — no CTA, no illustration

---

### Story 3.5: Compare Any-Two Recordings via CompositePlayer (general-purpose mode)

As Priyank,
I want to select any two recordings and play them sequentially in a comparison player,
So that I can A/B my pronunciation across any two days, not just at the engineered Day-14 moment.

**Acceptance Criteria:**

**Given** the Voice Journal list is rendered (per Story 3.4)
**When** the user enters compare mode (via a "Compare" affordance — checkboxes or selection icons on rows)
**Then** the user can select exactly 2 recordings
**And** a `<CompositePlayer mode="compare" sourceA={recA} sourceB={recB} />` mounts (per FR36, UX-DR21)

**Given** the CompositePlayer has rendered with two valid recordings
**When** the user taps the single "Play comparison" button
**Then** sourceA plays, then ~1 second silence, then sourceB plays automatically
**And** during sourceA playback, row 1 has `--cream-dim` background and row 2 dims; reverse during sourceB
**And** an `onPlaybackComplete` event fires when sourceB finishes (used downstream by Day-14 in Epic 7)

**Given** one of the two selected recordings has a corrupt blob
**When** playback attempts that row
**Then** the row shows an inline message "Recording unavailable — comparing against earliest available." (per UX-DR21 edge case)
**And** the comparison player gracefully falls back to TTS read of the same word (when applicable) or skips the failed clip

**Given** the user is keyboard-navigating
**When** they activate Play comparison
**Then** the button responds to Enter/Space and ARIA `role="region" aria-label="recording comparison player"` is announced (per UX-DR21)

---

### Story 3.6: Voice Journal Retention Policy and 90-Day Pruning Hook

As Priyank,
I want a Settings option to choose between {90-day rolling, indefinite} retention, with the rolling option pruning recordings older than 90 days on app open,
So that my IndexedDB stays within the ~50MB budget without manual housekeeping while preserving an opt-out for users who want full history.

**Acceptance Criteria:**

**Given** the user opens Settings → Retention
**When** the panel renders
**Then** a select shows `90-day rolling (default)` and `Indefinite` options (per FR6)
**And** the active value is loaded from `audiblytics.settings.retention`

**Given** the retention policy is `90-day rolling` and the app mounts
**When** `lib/hooks/use-prune-on-mount.ts` runs (called from `app/layout.tsx`)
**Then** `features/voice-journal/prune-recordings.ts` deletes any recording where `recordingDate` is older than `now - 90 days` (per FR41, AR23)
**And** the prune is idempotent and runs at most once per app mount

**Given** the retention policy is `Indefinite`
**When** the prune hook runs
**Then** no recordings are deleted

**Given** the user changes retention from `90-day rolling` to `Indefinite`
**When** they save
**Then** existing recordings already pruned are NOT recovered (one-way prune; documented in helper text)
**And** future prune runs become no-ops while the policy is `Indefinite`

---

## Epic 4: Daily Habit — Calendar, Streak, and Completion

Today's paragraph rehydrates from cache on app open within the same UTC day. Day completion fires when paragraph generated AND ("I read it" tapped OR a recording saved); calendar shows green dots; streak counter updates honestly; missed days render as empty cells; archived days are inspectable.

### Story 4.1: Same-Day Paragraph Cache Reuse on App Open

As Priyank,
I want today's previously generated paragraph to render instantly when I reopen the app within the same UTC day,
So that I don't burn an extra LLM call or wait for regeneration when I revisit the tab to record or save a word.

**Acceptance Criteria:**

**Given** the user generated a paragraph earlier today and the entry exists in `paragraphCache`
**When** the user closes and reopens the tab on the same UTC date
**Then** `useParagraphOfTheDay()` reads `paragraphCache` via `useLiveQuery` and returns the cached entry (per FR19, AR10)
**And** the `<ParagraphHero>` renders the cached paragraph immediately (no spinner, no LLM call)
**And** the hard-words list renders normally

**Given** the user crosses a UTC midnight boundary
**When** the app opens on the new UTC date
**Then** the cached entry from yesterday is NOT used as today's paragraph
**And** the Today screen shows the manual `Generate` button (per FR14 — no auto-generation)

**Given** no cached entry exists for today
**When** the app opens
**Then** the Today screen shows the `Generate` button (per Epic 1 Story 1.10)

---

### Story 4.2: Day Completion Logic + "I Read It" Action

As Priyank,
I want my session marked complete when both (a) today's paragraph has been generated AND (b) either I tap "I read it" OR I save a recording,
So that my honest engagement is recognized regardless of whether I record on a given day.

**Acceptance Criteria:**

**Given** today's paragraph has been rendered
**When** the user inspects the bottom of the paragraph zone
**Then** an "I read it →" ghost-button is visible (per UX flow §J2, FR54)
**And** the button is single-tap with no confirmation modal (per NFR23, UX-DR30)

**Given** the user taps "I read it"
**When** the click fires
**Then** `features/calendar/use-mark-read-it.ts` runs and updates `audiblytics.completions[today] = { hasReadIt: true, ... }` via `useLocalStorage` (per FR54, AR11)
**And** `recordDayOfUse()` is called

**Given** the user saves a recording (via Epic 3 Story 3.3) for today
**When** the recording write succeeds
**Then** `audiblytics.completions[today].hasRecording` becomes `true`
**And** `recordDayOfUse()` is called from `useSaveRecording`

**Given** `evaluate-completion.ts` is called for any UTC date
**When** the function runs
**Then** it returns `true` IFF a paragraph was generated for that date (cache or offline pack) AND (`hasReadIt === true` OR `hasRecording === true`) (per FR53)

**Given** the day is marked complete
**When** the calendar surface re-renders
**Then** the corresponding day-cell turns forest-green (per Epic 4 Story 4.4)

---

### Story 4.3: Streak Computation and Right-Rail Streak Stat-Card

As Priyank,
I want my current streak (consecutive completed days ending today) computed from completion data and displayed as a `STREAK · N days` stat-card in the right rail,
So that the loop's stickiness is honest data, never gamified celebration.

**Acceptance Criteria:**

**Given** `features/calendar/use-streak.ts` is opened
**When** the file is read
**Then** the hook calls `currentStreak(new Date())` from `lib/day-counter/` and returns the result (per FR57, AR13)
**And** the value re-computes whenever `audiblytics.completions` changes via `useLocalStorage`

**Given** the streak hook is mounted on the Today route
**When** the right rail renders
**Then** a `<StatCardLight>` shows `STREAK` micro-label + `N days` body (per UX-DR16)
**And** when N=0, the card reads `STREAK · 0 days` (no shame copy, no "Start your streak today!" — per UX-DR22, UX-DR34)

**Given** the user has a 7-day streak and misses Day 8
**When** they open the app on Day 9
**Then** the streak card reads `STREAK · 1 day` (today only) — the streak reset cleanly on the gap (per FR57)
**And** no modal, banner, or warning copy appears anywhere about the broken streak (per FR58, NFR22, UX-DR30)

**Given** the streak render measurement
**When** the page mounts
**Then** the streak/calendar render completes in <100ms (per NFR6)

---

### Story 4.4: Calendar Route — 30/60/90-Day Toggle Grid with Honest Empty Cells

As Priyank,
I want a `/calendar` route showing the last 30/60/90 days as a green-dot grid with missed days rendered as empty grey cells,
So that my daily-use pattern is visible without ever shaming a missed day.

**Acceptance Criteria:**

**Given** the user clicks "Calendar" (or however the route is exposed) and lands on `/calendar`
**When** the route renders
**Then** the page shows a `30/60/90` toggle (default 30) and a calendar grid (per FR55)
**And** each day-cell is computed by `evaluate-completion.ts` from Story 4.2

**Given** a day is completed
**When** its cell renders
**Then** the cell shows a forest-green dot (per UX color discipline)

**Given** a day is missed (no completion)
**When** its cell renders
**Then** the cell shows an empty grey ring (`--border` color), label `text-ink-faint` (per FR58, UX-DR9)
**And** no red, warning icon, exclamation mark, or tooltip about the missed day appears
**And** no "you missed a day" notification fires

**Given** the user is on `/calendar?day=` with no day param
**When** the route renders
**Then** the grid is the only content (no archived day detail panel)

**Given** the calendar is rendered with up to 90 cells
**When** the cells paint
**Then** the render completes in <100ms (per NFR6)
**And** the layout does NOT cause horizontal scroll on any viewport ≥320px (per UX-DR7)

---

### Story 4.5: Archived Day View — Drill into Past Day Details

As Priyank,
I want to tap any completed day-cell in the calendar (or DayRail) and see that day's archived paragraph excerpt, words saved, and recordings made,
So that I can revisit any past session as a record of what I read and learned.

**Acceptance Criteria:**

**Given** the user is on `/calendar` and taps a completed day-cell
**When** the click fires
**Then** the route navigates to `/calendar?day=N` where `N` is the UTC date in `YYYY-MM-DD` format (per FR56)
**And** the page renders the archived day detail panel below the grid

**Given** the archived day panel renders
**When** it queries data
**Then** it shows the paragraph theme + persona + first ~30 words excerpt from `paragraphCache` for that day
**And** the count of words saved on that day (joined from `collection.savedAt`)
**And** a list of recordings made on that day with inline playback (reusing the VoiceJournalList row style)

**Given** the user taps a `future` or `today` day-cell in the DayRail
**When** the click fires
**Then** nothing happens (per UX-DR9 — only completed cells are interactive)

**Given** the user taps a `missed` day-cell
**When** the click fires
**Then** nothing happens (or, if implemented as click-able, the archived day panel shows "No session on this day." in italic Garamond per UX-DR34 — no shame copy)

---

## Epic 5: Pen-Drill Warm-Up

User runs a 30-second pen-drill from a single icon-tap on Today, sees a randomly selected tongue-twister, transitions to a without-pen pass, and may optionally record either pass.

### Story 5.1: Tongue-Twister Library and WarmUpDrill Component (with-pen pass)

As Priyank,
I want a single-tap warm-up icon on the Today screen that opens a 30-second with-pen drill showing one randomly selected tongue-twister from a bundled library,
So that I can prime my articulators before reading without leaving the daily-ritual flow.

**Acceptance Criteria:**

**Given** `src/features/warm-up/drill-library.ts` is opened
**When** the file is read
**Then** at least 10 distinct tongue-twister phrases are exported as a constant array (per FR44)
**And** phrases lean toward classic playful tongue-twisters (e.g., "red lorry, yellow lorry", "Peter Piper picked a peck...") rather than clinical instructional copy (per FR44 voice guidance)

**Given** the user is on the Today screen
**When** the meta-actions row renders
**Then** a `⏵ Warm-Up` icon-button is visible (per UX flow §J2, FR43)
**And** a single tap on the icon mounts `<WarmUpDrill>` (lazy-loaded via `next/dynamic` per AR22)

**Given** WarmUpDrill mounts
**When** the with-pen pass starts
**Then** instruction text reads "Hold a pen between your teeth. Read this out loud:" with a randomly selected tongue-twister displayed below (per FR44, UX-DR23)
**And** a count-up timer mono-renders `0:00 → 0:30`
**And** an `aria-live="polite"` region announces every 10s (per UX-DR23)

**Given** the timer reaches 30 seconds
**When** the timer fires the transition
**Then** the component enters the `transition` state and the instruction switches to "Now without the pen, read it again." (Story 5.2 covers the without-pen pass)

**Given** the warm-up runs end-to-end
**When** measured against PRD F7 spec
**Then** the system never scores, rates, or assesses the drill (per FR47, UX-DR23)

---

### Story 5.2: Without-Pen Pass Transition and Back-to-Today Affordance

As Priyank,
I want the warm-up to prompt me to read the same tongue-twister again without the pen after the with-pen 30 seconds,
So that I feel the contrast in articulation that proves the pen-drill thesis.

**Acceptance Criteria:**

**Given** WarmUpDrill is in the `transition` state (per Story 5.1)
**When** the without-pen prompt renders
**Then** the same tongue-twister text is shown beneath the new instruction "Now without the pen, read it again." (per FR45, UX-DR23)
**And** a second 30-second count-up timer starts

**Given** the without-pen timer ends OR the user taps "Back to today's paragraph"
**When** the click fires
**Then** the WarmUpDrill unmounts and the user returns to the Today screen
**And** focus returns to the Today screen's first interactive element

**Given** the user is in either pass and taps the in-component Back button
**When** the click fires
**Then** the warm-up exits cleanly without recording or scoring (per FR47)

---

### Story 5.3: Optional Recording per Warm-Up Pass

As Priyank,
I want a small "Record this pass" affordance during the warm-up so that I can capture either or both passes via the same Voice Journal pipeline,
So that warm-up audio can be reviewed alongside paragraph recordings if I choose.

**Acceptance Criteria:**

**Given** WarmUpDrill is in either `running` or `transition` state
**When** the user inspects the panel
**Then** a small "● Record this pass" affordance is visible (per FR46)
**And** the affordance is opt-in, never blocking — the user can complete the warm-up without recording

**Given** the user taps the record affordance
**When** the recorder starts
**Then** the same `lib/audio/recorder.ts` factory from Epic 3 Story 3.1 is used (per AR20, FR46)
**And** the resulting recording persists to the Dexie `recordings` table with a metadata field indicating it came from a warm-up pass (e.g. `paragraphId: 'warmup-<phrase-hash>'`)

**Given** the user records both passes
**When** the warm-up exits
**Then** both recordings appear in the Voice Journal list (per FR35) with the warm-up indicator distinguishable from paragraph recordings

---

## Epic 6: Daily Review — Flashcards

Daily Review accessed from main nav. System surfaces oldest-reviewed words first; user flips card; marks Got it / Almost / Forgot; system updates review metadata.

### Story 6.1: Review Queue Selector — Oldest-Reviewed-First

As Priyank,
I want a Daily Review session that surfaces N words from my collection prioritizing the words I haven't reviewed in the longest time (and never-reviewed words first),
So that the review consistently revisits forgotten material rather than rotating through whatever was most recent.

**Acceptance Criteria:**

**Given** the user clicks "Review" in TopNav (a separate destination from the today's-paragraph flow per FR48)
**When** the route renders
**Then** `features/review/use-review-queue.ts` runs and returns N words sorted ascending by `lastReviewedAt` (with `null` values — never reviewed — sorted first per FR49)
**And** N defaults to 7 (per PRD §Open Decisions Q3 default)

**Given** the collection has fewer than N words
**When** the queue is computed
**Then** all available words are returned (no padding, no error)

**Given** the collection is empty
**When** the route renders
**Then** the page shows a single italic Garamond line "No words to review yet. Save some hard words from today's paragraph." (per UX-DR34 — one-line, no illustration, no CTA button)

---

### Story 6.2: Flashcard UI with Three-Button Feedback

As Priyank,
I want each review item rendered as a flip-card showing the word, with the back revealing meaning + example + IPA, plus three feedback buttons (Got it / Almost / Forgot),
So that I can self-assess each word in <5 seconds and the system can update review metadata.

**Acceptance Criteria:**

**Given** the review queue has at least one word
**When** the route renders the first card
**Then** `<Flashcard>` shows the word centered (Garamond text-3xl) with a "Tap to flip" affordance (per FR50, UX-DR27)
**And** the card front shows ONLY the word — no IPA, no meaning, no example

**Given** the user taps the card (or presses Space)
**When** the flip animation completes
**Then** the back side shows IPA (mono) + meaning + example sentence + a per-word TTS play icon (per FR52)
**And** three buttons render below: `Got it / Almost / Forgot` (per FR50)

**Given** the user taps any of the three feedback buttons
**When** the click fires
**Then** the corresponding word's `reviewCount += 1`, `lastReviewedAt = now (UTC ISO)`, and `difficultyRating` updates (per FR51) — `Got it` → `difficultyRating - 1` clamped at 0; `Almost` → unchanged; `Forgot` → `difficultyRating + 1` clamped at 2
**And** the next card from the queue is shown
**And** when the queue is exhausted, the page shows a single italic Garamond line "Done for today." (per UX-DR34)

**Given** the user uses keyboard
**When** they navigate the card
**Then** Space flips, and `1`/`2`/`3` keys map to `Got it`/`Almost`/`Forgot` (single-key shortcut, optional but per UX-DR37 keyboard navigability commitment)

---

### Story 6.3: Per-Word TTS Playback During Review

As Priyank,
I want a TTS play icon on the back of each flashcard that pronounces the word,
So that I can hear correct pronunciation as part of the review without leaving the card.

**Acceptance Criteria:**

**Given** the flashcard is on its back side (per Story 6.2)
**When** the user taps the play icon next to the IPA
**Then** `speak(word)` runs via `lib/audio/tts.ts` (per FR52, AR20)
**And** the play icon flips to pause during playback (per UX-DR12 pattern reused)
**And** playback latency is <100ms (per NFR4)

**Given** TTS playback is in progress and the user taps a feedback button
**When** the click fires
**Then** the playback stops cleanly and the next card loads
**And** no audio bleeds across cards

---

## Epic 7: Day-14 Aha Moment

The load-bearing emotional climax. On the user's 14th distinct day-of-use, a layout-level gate suppresses route render and surfaces the non-dismissable comparison takeover.

### Story 7.1: Day-14 Trigger Detection (Exact-Once)

As Priyank,
I want the system to detect my 14th distinct day-of-use exactly once and persist a flag so it never fires twice,
So that the Day-14 takeover lands at the right moment with full surprise and never re-fires irritatingly.

**Acceptance Criteria:**

**Given** `features/day14/use-day-14-trigger.ts` is opened
**When** the file is read
**Then** the hook returns `true` IFF `distinctDaysOfUse() === 14 AND audiblytics.day14State.fired === false` (per FR37, NFR12)
**And** the trigger evaluates on app open (mount of the layout `<Day14Gate>`), NOT during the session

**Given** `audiblytics.day14State.fired` is `false` and `audiblytics.daysOfUse` has 14 distinct UTC dates
**When** the app opens
**Then** the trigger returns `true`

**Given** `audiblytics.day14State.fired` is `true`
**When** the app opens (any subsequent day, including Day 14 itself if returning)
**Then** the trigger returns `false` (per FR40, NFR12 — never re-fires)

**Given** `distinctDaysOfUse() === 13` (Day 13 of use)
**When** the app opens
**Then** the trigger returns `false` (does not fire prematurely)

**Given** the user has 14 distinct days of use BUT no Day-1 recording exists in the `recordings` table
**When** the trigger evaluates
**Then** the hook returns `'no-recording'` instead of `true` (Story 7.3 handles this fallback) — the takeover does NOT fire and re-evaluates next app open (per UX flow §J3 edge case)

---

### Story 7.2: Day-14 Gate at Layout Level (URL-Unbypassable)

As Priyank,
I want a `<Day14Gate>` component mounted in `app/layout.tsx` that short-circuits route render when the trigger fires,
So that no URL change, TopNav click, or browser back button can bypass the takeover.

**Acceptance Criteria:**

**Given** `app/_internal/Day14Gate.tsx` is opened
**When** the file is read
**Then** the component reads `useDay14Trigger()` and renders `<Day14Takeover>` (lazy via `next/dynamic` per AR22) when the trigger is `true`, otherwise renders `{children}` (per FR37, AR14)
**And** the gate is a client component

**Given** `app/layout.tsx` is opened
**When** the file is read
**Then** `<Day14Gate>` wraps the route children inside the layout shell (per AR14)
**And** when the gate renders the takeover, the TopNav, DayRail, and StatRail are visually suppressed (per UX flow §J3 — "full-bleed", layout shell hidden during takeover)

**Given** the gate is in `Day14Takeover` mode
**When** the user clicks any TopNav link (Today / Collection / Review / Settings)
**Then** the URL changes but the layout still renders `<Day14Takeover>` (because the gate is layout-level, per AR14)
**And** the user cannot navigate away

**Given** the gate is in `Day14Takeover` mode
**When** the user presses browser back
**Then** the same gate condition holds at the previous URL and the takeover continues to render

---

### Story 7.3: Day14Takeover UI + CompositePlayer Same-Word Match Heuristic

As Priyank,
I want the takeover to render full-bleed with the headline "Listen to how far you've come.", a composite player that attempts to match earliest and most-recent recordings on the same hard word, and binary buttons that stay hidden until first playback completes,
So that the audio comparison itself is the moment of truth — engineered to force the listen, not the click-through.

**Acceptance Criteria:**

**Given** the Day-14 trigger fires and `<Day14Takeover>` mounts
**When** the takeover renders
**Then** the background is full-bleed `--cream` (no overlay scrim, per UX-DR20)
**And** the headline reads "Listen to how far you've come." in EB Garamond text-5xl (per UX-DR20)
**And** a subhead caption reads `Day 14 · YYYY-MM-DD` in mono text-sm
**And** the layout shell (TopNav, DayRail, StatRail, HonestyFooter) is suppressed

**Given** `features/day14/select-day-1-recording.ts` runs
**When** the function picks recordings for the comparison
**Then** it first attempts to find a recording from `dayOfUse === 1` AND a recent recording that share a hard word in common (per FR38)
**And** if such a same-word pair exists, both clips are passed to `<CompositePlayer mode="compare" sourceA={day1Rec} sourceB={recentRec} />`
**And** if no same-word match exists, it falls back to whole-paragraph comparison (earliest + most-recent paragraphs) per FR38
**And** if no Day-1 recording exists at all, the takeover does NOT render (Story 7.1 returns `'no-recording'`) and a soft inline banner appears on the Today route instead per UX flow §J3 edge case

**Given** the CompositePlayer has rendered
**When** the takeover first paints
**Then** the `[Yes, I hear it]` / `[No, not really]` `<ButtonPair>` is hidden via `display: none` (per UX-DR20, UX-DR22)
**And** the only interactive element is the single "▶ Play comparison" button

**Given** the user taps "Play comparison"
**When** sourceA finishes and sourceB finishes
**Then** `onPlaybackComplete` fires and the ButtonPair fades in over 400ms (opacity 0 → 1, per UX-DR22, UX-DR36)
**And** the user cannot proceed without engaging the audio

**Given** the takeover is rendered
**When** the user inspects the dialog
**Then** there is NO close button, NO Esc handler (overridden via `onEscapeKeyDown={(e) => e.preventDefault()}`), NO overlay click-out (overridden via `onPointerDownOutside={(e) => e.preventDefault()}`), NO skip link (per FR37, UX-DR20, UX-DR38)
**And** an inline code comment in `Day14Takeover.tsx` reads `// WCAG 2.1.2 deliberate exception — see ux-design-specification.md §Named Exceptions` (per UX-DR38)
**And** focus is trapped within the dialog (Radix `modal={true}` retained for a11y per UX-DR20)

---

### Story 7.4: Yes/No Capture, Persistence-Then-Flow, and Continue Affordance

As Priyank,
I want my Yes/No tap to persist to localStorage BEFORE any celebratory copy renders, then show outcome copy and a ghost continue button after 3 seconds,
So that even a force-quit captures my self-report and the celebration feels earned, not insisted upon.

**Acceptance Criteria:**

**Given** the ButtonPair is revealed (per Story 7.3)
**When** the user taps `[Yes, I hear it]`
**Then** `audiblytics.day14State` is updated to `{ fired: true, result: 'yes' }` via `useLocalStorage` BEFORE any UI state change (persistence-then-flow per UX-DR20, FR39)
**And** the Yes button stays full forest color, the No button desaturates to `--rose-dim` (per UX-DR20)
**And** italic Garamond copy fades in (300ms): "That's the entire reason this app exists. Keep going." (per UX-DR20 — the one allowed delight moment per release per UX-DR36)

**Given** the user taps `[No, not really]`
**When** the click fires
**Then** `audiblytics.day14State` is updated to `{ fired: true, result: 'no' }` BEFORE any UI state change (per FR39)
**And** the No button stays full brick color, the Yes button desaturates to `--sage-dim`
**And** italic Garamond copy fades in: "Two weeks isn't always enough. Keep going." (per UX-DR20)

**Given** 3 seconds pass after the outcome copy renders
**When** the timer fires
**Then** a ghost-continue button "Continue to today →" appears bottom-right (per UX-DR20)

**Given** the user taps "Continue to today"
**When** the click fires
**Then** the takeover unmounts, `<Day14Gate>` returns `false` for the trigger (because `fired === true`), and today's paragraph route renders normally (per FR40, AR14)

**Given** the user force-quits the tab AFTER tapping Yes/No but BEFORE the celebratory copy renders
**When** they reopen the app on the same day
**Then** `audiblytics.day14State.fired === true` and `result` is set, so the takeover does NOT re-fire (per FR40 + persistence-then-flow guarantee)

**Given** the takeover has fired once
**When** the user reaches Day 30 (or the next configured milestone — PRD §Open Decisions Q1 default Day 30)
**Then** the trigger logic for Day-30 (separate, NOT this story's scope) may evaluate; this story does not implement the Day-30 trigger

---

## Epic 8: Offline Pack & Error Recovery Resilience

Standalone Node script generates ~1000 paragraphs offline; user loads via Settings; LLM failures present 3-action recovery; offline sessions show subtle calendar badge; 30-day rolling de-dupe.

### Story 8.1: Offline-Pack Generation Script (Node, Standalone)

As Priyank,
I want a standalone `pnpm tsx scripts/generate-offline-pack.ts` script that generates ~1000 paragraphs across all theme × persona combinations using Gemini 2.5 Flash-Lite throttled to ≤10 RPM,
So that I can produce the offline pack on my machine without inflating the deployed app's bundle and without burning through my free-tier quota.

**Acceptance Criteria:**

**Given** `.env.local` contains `OFFLINE_PACK_PROVIDER_KEY=<gemini-key>` (per AR28)
**When** the developer runs `pnpm tsx scripts/generate-offline-pack.ts`
**Then** the script loops through all theme × persona combinations (6 themes × 4 personas = 24 combinations) and generates ~42 paragraphs per combination for ~1000 total (per FR60)
**And** the model is `gemini-2.5-flash-lite` (NOT runtime `gemini-2.5-flash`, per AR5)
**And** request rate is throttled to ≤10 RPM (safety margin under Flash-Lite's 15 RPM free-tier limit, per AR24)

**Given** the script is running
**When** any individual response fails Zod validation
**Then** the malformed entry is logged and skipped (final pack may be ~990 entries, acceptable per PRD §J6)
**And** the script continues without aborting the whole run

**Given** the script completes
**When** the developer inspects the output
**Then** a JSON file is written to a path consumable by the runtime "Download Pack" action in Settings (e.g., `public/offline-pack.json` or a known download URL)
**And** the JSON schema is identical to the runtime `paragraphSchema` from Epic 1 Story 1.5 (per architecture pack-schema-equivalence)
**And** total runtime is approximately 70 minutes (script logs ETA progress)

**Given** the script lives in `scripts/`
**When** the architectural boundary is checked
**Then** the script is NOT inside `src/` and is NOT bundled with the deployed app (per AR24)
**And** it imports from `src/lib/llm/schemas/paragraph.schema.ts` directly to ensure schema parity

---

### Story 8.2: "Download Pack" Settings Action — Load Pack into IndexedDB

As Priyank,
I want a Settings → Offline Pack → "Download Pack" action that imports the generated JSON into the Dexie `offlinePack` table,
So that the runtime fallback path has data to surface when LLM calls fail.

**Acceptance Criteria:**

**Given** the user opens Settings → Offline Pack panel
**When** the panel renders
**Then** a status row shows either "Offline pack loaded — N paragraphs" or "Offline pack not loaded" based on Dexie `offlinePack` row count
**And** a `[Download Pack]` button is visible (per FR61)

**Given** the user taps `[Download Pack]`
**When** the click fires
**Then** `features/offline-pack/pack-loader.ts` fetches `offline-pack.json` from `public/` and inserts each entry into the Dexie `offlinePack` table (per FR61, AR10)
**And** each entry validates against the offline-pack Zod schema before insert
**And** the button shows inline mini-spinner + text "Loading pack…" + button disabled during the operation (per UX-DR35)

**Given** the load completes successfully
**When** the panel re-renders
**Then** the status row updates to "Offline pack loaded — N paragraphs" (per UX-DR30 — state-flip is success, no toast)

**Given** the load fails (network error fetching JSON, or quota exceeded inserting)
**When** the failure is caught
**Then** an `<InlineErrorSurface variant="storage">` renders below the button with the specific error and `[Try Again]` (per FR42, NFR8)

---

### Story 8.3: Offline-Pack Selection on LLM Failure with 30-Day Rolling De-Dupe

As Priyank,
I want the Today screen to optionally fall back to the offline pack when LLM calls fail (or when I explicitly choose "Use Offline Pack"), with the same paragraph never resurfacing within a 30-day window,
So that I can complete my daily ritual even when Gemini is down or quota-exhausted, without the same content appearing repeatedly.

**Acceptance Criteria:**

**Given** an LLM generation has failed and the user taps `[Use Offline Pack]` (Story 8.4)
**When** the click fires
**Then** `features/offline-pack/select-from-offline-pack.ts` selects an entry from the Dexie `offlinePack` table where `lastSurfacedAt` is null OR older than 30 days from now (per FR62, FR63, AR10)
**And** the selected entry's `lastSurfacedAt` is updated to now
**And** the selected paragraph + hard-words renders in `<ParagraphHero>` and the hard-words list (Epic 1 Stories 1.10, 1.11)

**Given** the offline pack has been loaded but ALL entries have been surfaced within the last 30 days (extreme edge case for n=1)
**When** the selector runs
**Then** it falls back to the oldest-surfaced entry (effectively a wrap-around) and updates its `lastSurfacedAt`

**Given** the user successfully reads the offline-pack paragraph and marks it complete
**When** completion fires
**Then** `audiblytics.completions[today]` includes `usedOfflinePack: true` (per FR59 — used by the calendar badge in Story 8.5)

---

### Story 8.4: Extend InlineErrorSurface to Three-Action Recovery

As Priyank,
I want the existing inline error surface from Epic 1 Story 1.12 to gain a third action `[Use Offline Pack]` when (and only when) the offline pack is loaded into IndexedDB,
So that the full PRD §J4 recovery surface — Retry / Open Settings / Use Offline Pack — is in place once Epic 8 is complete.

**Acceptance Criteria:**

**Given** an LLM generation fails and `<InlineErrorSurface>` renders
**When** the surface checks for offline-pack presence (count of rows in Dexie `offlinePack` table > 0)
**Then** the third button `[Use Offline Pack]` becomes visible alongside `[Retry]` and `[Open Settings]` (per FR64, UX-DR24)
**And** when no offline pack is loaded, only `[Retry]` and `[Open Settings]` show (per UX-DR24 `without-offline-pack` variant)

**Given** the user taps `[Use Offline Pack]`
**When** the click fires
**Then** the offline-pack selector from Story 8.3 runs and the surface is replaced by the rendered paragraph
**And** the calendar badge for today is set (per Story 8.5)

**Given** the user taps `[Retry]`
**When** the click fires
**Then** the retry behavior from Epic 1 Story 1.12 still applies (no regression)

---

### Story 8.5: OfflineBadge on Calendar Day-Cells and Voice Journal Rows

As Priyank,
I want any session that used the offline pack to display a small badge on its calendar day-cell (and optionally on its Voice Journal row),
So that future-me can see at a glance which sessions ran on fresh LLM generation versus offline fallback.

**Acceptance Criteria:**

**Given** `audiblytics.completions[date].usedOfflinePack === true` for a given date
**When** that date's day-cell renders in the DayRail or `/calendar` grid
**Then** a small `<OfflineBadge>` (8×8px icon overlay in `--ink-faint`, per UX-DR26) appears in the corner of the cell (per FR59)
**And** hovering the cell shows a tooltip "This day used the offline pack."

**Given** the corresponding date is rendered in the Voice Journal list (Story 3.4)
**When** the row paints
**Then** the OfflineBadge optionally appears next to the date metadata (per UX-DR26 — Voice Journal placement is allowed but not required)

**Given** the badge is rendered
**When** color-blindness simulation is applied (protanopia, deuteranopia)
**Then** the badge remains distinguishable via shape/icon — color is reinforcement, not the only signal (per UX-DR40)

---


## Epic 9: Server Account & Settings

JWT-authenticated account with Postgres-backed settings when `NEXT_PUBLIC_STORAGE_BACKEND=api`. Replaces client-only provider-key gate for API mode.

**Reference:** `architecture-v2-fastapi-backend.md` BV4, BV5, BV12 Phase 1 · **Status:** implemented 2026-05-30

### Story 9.1: FastAPI Scaffold, Health, and Postgres

As Priyank,
I want a monorepo `apps/api/` FastAPI service with health check and async Postgres connection,
So that the backend foundation exists for auth and settings.

**Status:** done

**Acceptance Criteria:**

**Given** `docker compose up postgres` and `uvicorn app.main:app`
**When** `GET /api/v1/health` is called
**Then** response is 200 with liveness payload (BVR1 scaffold)

**Given** `DATABASE_URL` points at Postgres
**When** the API starts
**Then** SQLAlchemy async engine connects without error (BV2)

---

### Story 9.2: Users Model, JWT Auth Routes, and Seed Script

As Priyank,
I want register, login, logout, and `/auth/me` with httpOnly JWT cookie,
So that I can authenticate securely without storing tokens in localStorage.

**Status:** done · **BVR1**

**Acceptance Criteria:**

**Given** a new email/password via `POST /auth/register`
**When** login succeeds
**Then** `audiblytics_session` httpOnly cookie is set and `GET /auth/me` returns user id + email

**Given** `scripts/seed_user.py`
**When** run locally
**Then** seeded account exists for dogfooding (BV12)

---

### Story 9.3: Alembic Migrations for Users and User Settings

As Priyank,
I want Alembic migrations for `users` and `user_settings`,
So that schema changes are versioned for Neon/production (BVR6).

**Status:** done

**Acceptance Criteria:**

**Given** fresh Postgres
**When** `alembic upgrade head` runs
**Then** `users` and `user_settings` tables exist matching BV5 schema

---

### Story 9.4: Next.js Login, AuthProvider, and AppGate

As Priyank,
I want `/login` and `AuthGate` wrapping the app when API mode is on,
So that unauthenticated users are redirected to login instead of the provider-key vault.

**Status:** done · **BVR3, UX-V2-1**

**Acceptance Criteria:**

**Given** `NEXT_PUBLIC_STORAGE_BACKEND=api` and no session cookie
**When** visiting `/today`
**Then** user is redirected to `/login` with inline error on failed login (no toast)

**Given** valid credentials
**When** login succeeds
**Then** user lands on home/today and session persists across reload

---

### Story 9.5: Settings API and API-Mode Settings Form

As Priyank,
I want theme, persona, length, retention, voice, and Gemini key saved via `PATCH /settings`,
So that preferences persist in Postgres across devices.

**Status:** done · **BVR2, BVR4**

**Acceptance Criteria:**

**Given** authenticated session
**When** `PATCH /settings` with theme/persona/length
**Then** `GET /settings` returns updated values mirroring Zod shapes (BV10)

**Given** `geminiApiKey` in PATCH body
**When** settings save succeeds
**Then** `GET /settings` returns `hasGeminiApiKey: true` but never the raw key (BV-NFR2)

---

### Story 9.6: Next.js API Proxy for Same-Origin Cookies

As Priyank,
I want `/api/v1/*` proxied through Next.js with cookie forwarding,
So that httpOnly session cookies work in local dev and production (BVR5).

**Status:** done

**Acceptance Criteria:**

**Given** web on `:3000` and API on `:8000`
**When** browser calls `/api/v1/settings`
**Then** request reaches FastAPI with `Cookie` header and `Set-Cookie` from login is stored

---

## Epic 10: Server-Side Paragraph Generation

Server Gemini proxy with `paragraph_cache`; client stops calling browser LLM in API mode.

**Reference:** BV8, BV12 Phase 2 · **Status:** implemented 2026-05-30

### Story 10.1: Paragraph Cache Migration and Model

As Priyank,
I want a `paragraph_cache` table and SQLAlchemy model,
So that generated paragraphs persist server-side for same-day reuse (BVR7).

**Status:** done · **FR19 server path**

**Acceptance Criteria:**

**Given** `alembic upgrade head`
**When** migration `20260530_0002` applies
**Then** `paragraph_cache` exists with user_id, paragraph, hard_words JSONB, theme, persona, generated_at

---

### Story 10.2: POST /paragraphs/generate Gemini Proxy

As Priyank,
I want paragraph generation to run on the server using my DB-stored Gemini key,
So that the browser never calls Gemini directly in API mode (BVR7, AR15 lifted).

**Status:** done · **FR14**

**Acceptance Criteria:**

**Given** authenticated user with `gemini_api_key` saved
**When** `POST /paragraphs/generate` with optional recycleWords
**Then** response matches paragraph schema and row is inserted into `paragraph_cache`

**Given** missing Gemini key
**When** generate is called
**Then** 502 with `error.kind: auth` and inline-friendly message (BV7)

---

### Story 10.3: GET /paragraphs/today Same-Day Cache

As Priyank,
I want today's cached paragraph returned without re-generation,
So that app open on the same UTC day shows the existing paragraph (BVR8, FR19).

**Status:** done

**Acceptance Criteria:**

**Given** a paragraph generated today UTC
**When** `GET /paragraphs/today`
**Then** 200 with cached row

**Given** no paragraph today
**When** `GET /paragraphs/today`
**Then** 404 with structured not_found error

---

### Story 10.4: Frontend API Paragraph Hooks

As Priyank,
I want `use-generate-paragraph` and `use-paragraph-of-the-day` to call the API in API mode,
So that Today works end-to-end without Dexie paragraph cache (BVR9).

**Status:** done

**Acceptance Criteria:**

**Given** `NEXT_PUBLIC_STORAGE_BACKEND=api`
**When** user taps Generate on Today
**Then** network tab shows `POST /api/v1/paragraphs/generate` not provider SDK

**Given** same UTC day reload
**When** Today mounts
**Then** `GET /paragraphs/today` hydrates paragraph without generate tap

---

### Story 10.5: Paragraph Route Tests

As Priyank,
I want pytest coverage for generate and today routes,
So that regressions are caught before deploy (BV-NFR5).

**Status:** done

**Acceptance Criteria:**

**Given** mocked Gemini
**When** tests run
**Then** generate + today + missing-key cases pass in `test_paragraphs.py`

---

## Epic 11: Cloud Recording Persistence

Presigned R2 upload with Postgres metadata; hardest remaining backend slice.

**Reference:** BV6, BV12 Phase 3 · **Status:** ready-for-dev

### Story 11.1: Recordings Table and R2 Client Service

As Priyank,
I want a `recordings` model and R2 presign helper,
So that upload orchestration has a data layer (BVR10).

**Acceptance Criteria:**

**Given** Alembic migration
**When** applied
**Then** `recordings` table matches BV5 schema with `storage_key` nullable until complete

**Given** R2 env vars configured
**When** presign PUT is requested
**Then** URL expires ≤15 minutes and key follows `recordings/{user_id}/{id}.{ext}`

---

### Story 11.2: POST /recordings and Presigned Upload Start

As Priyank,
I want to start an upload and receive a presigned PUT URL,
So that audio bytes go direct to R2 without streaming through FastAPI (BV6, BVR10).

**Acceptance Criteria:**

**Given** authenticated POST with metadata (paragraphId, durationMs, mimeType, dayOfUse)
**When** route succeeds
**Then** response includes recording id + presigned PUT URL and row status is pending

---

### Story 11.3: POST /recordings/{id}/complete and Playback URL

As Priyank,
I want to finalize upload and play back via short-lived GET URL,
So that Voice Journal works with cloud blobs (BVR11, FR35).

**Acceptance Criteria:**

**Given** client PUT blob to R2
**When** `POST /recordings/{id}/complete`
**Then** row updates `storage_key` and returns RecordingResponse

**Given** completed recording
**When** `GET /recordings/{id}/playback-url`
**Then** presigned GET URL returned (60–300s TTL)

---

### Story 11.4: Frontend Save Recording via API

As Priyank,
I want `use-save-recording` to use API path when `STORAGE_BACKEND=api`,
So that recordings persist to R2 instead of Dexie blobs (BVR12, FR31).

**Acceptance Criteria:**

**Given** API mode and successful MediaRecorder stop
**When** save runs
**Then** flow is presign → PUT R2 → complete → local list refresh from `GET /recordings`

**Given** upload failure
**When** caught
**Then** `<InlineErrorSurface variant="storage">` renders (FR42)

---

### Story 11.5: Server-Side 90-Day Retention Prune

As Priyank,
I want old recordings deleted on server when retention is 90-day rolling,
So that FR41 holds in API mode (BVR14).

**Acceptance Criteria:**

**Given** user `retention=90-day-rolling` and recordings older than 90 days
**When** prune job runs on login (or scheduled)
**Then** R2 objects and Postgres rows are removed

---

## Epic 12: Server-Backed Daily Loop (Stretch)

**Status:** ready-for-dev · defer until Epic 11 demo

### Story 12.1: Collection Words API

As Priyank,
I want collection CRUD on the server,
So that saved words sync when using API mode (BVR13, FR26–FR29).

**Acceptance Criteria:**

**Given** authenticated user
**When** `POST /collection` with word payload
**Then** word persists with user_id scope and appears in `GET /collection` recency sort

---

### Story 12.2: Day Completions API

As Priyank,
I want completion state upserted per UTC date on the server,
So that calendar and streak work cross-device (BVR13, FR53–FR57).

**Acceptance Criteria:**

**Given** `PUT /completions/{utc_date}` with hasReadIt/hasRecording flags
**When** saved
**Then** calendar evaluation uses server completions in API mode

---

## Epic 13: Production Deploy & Interview Polish

**Status:** ready-for-dev

### Story 13.1: Dockerfile and Production Env Docs

As Priyank,
I want a production Dockerfile and updated README,
So that I can deploy API to Railway/Fly (BVR15).

**Acceptance Criteria:**

**Given** `apps/api/Dockerfile`
**When** built
**Then** container runs uvicorn with health check on `/api/v1/health`

---

### Story 13.2: Neon Migrations and Seed for Production

As Priyank,
I want Alembic applied against Neon with seed script documented,
So that production DB matches local schema (BVR6, BVR15).

**Acceptance Criteria:**

**Given** Neon `DATABASE_URL`
**When** `alembic upgrade head` runs in CI or manually
**Then** all migrations apply cleanly

---

### Story 13.3: Architecture ADRs (3 minimum)

As Priyank,
I want ADRs for auth, R2-not-DB-blobs, and strangler migration,
So that interview narrative has written decisions (BVR15).

**Acceptance Criteria:**

**Given** `docs/decisions/`
**When** complete
**Then** at least 3 ADRs exist referencing BV decision IDs

---

## Epic 14: Product UI Refresh (2026 Mockups)

Visual overhaul to match `_bmad-output/design/ui-mockups-v2/`. **Does not remove features** from Epics 1–8; remaps them to new shell. Day-14 takeover behavior unchanged.

### Story 14.1: Design Tokens and App Shell v2

As Priyank,
I want the cream/forest soft-card shell with left sidebar navigation,
So that the app matches the 2026 mockup aesthetic (UX-V2-UI1).

**Acceptance Criteria:**

**Given** `globals.css` semantic tokens
**When** shell renders at ≥1024px
**Then** layout uses sidebar + main + optional right rail; primary green uses existing `--forest` tokens (no arbitrary hex)

**Given** sidebar nav
**When** user navigates
**Then** items match mockups: Home, Review, Collection, Voice Journal, Journey, Stats; active state uses light green background + forest text

**Given** user profile footer in sidebar
**When** API mode
**Then** shows logged-in identity (from `/auth/me`) or local n=1 label

---

### Story 14.2: Home Dashboard

As Priyank,
I want a home dashboard with greeting, start session CTA, and continue cards,
So that daily entry matches the home mockup (UX-V2-UI2).

**Acceptance Criteria:**

**Given** `/` or `/home` route
**When** rendered
**Then** shows time-of-day greeting, "Start Today's Session" primary button routing to `/today`, and three continue cards (Review, Collection, Voice Journal) with live counts from existing hooks

**Given** right rail on home
**When** rendered
**Then** calendar mini-widget, streak card, and monthly progress stats use existing day-counter/completion data

---

### Story 14.3: Today Session Three-Column Layout

As Priyank,
I want Today redesigned as center reading column + right recording/difficult-words column,
So that the session screen matches the today mockup (UX-V2-UI3).

**Acceptance Criteria:**

**Given** `/today` in new shell
**When** paragraph is rendered
**Then** hard words are highlighted in paragraph body; tapping a word opens bottom detail card with IPA, meaning, example, Add to collection

**Given** right column
**When** session active
**Then** recording studio card wraps existing `RecordPanel`; difficult-words list shows today's hard words with speaker icons

**Given** session status bar
**When** visible
**Then** shows day-of-30, theme, persona, optional Warm-Up link (Epic 5 preserved)

---

### Story 14.4: Voice Journal Page v2

As Priyank,
I want Voice Journal as a rich list with waveforms and compare card,
So that the journal matches the voice-journal mockup (UX-V2-UI4).

**Acceptance Criteria:**

**Given** `/voice-journal`
**When** recordings exist
**Then** each row shows play button, title/date, waveform placeholder (CSS or static SVG), clarity/pace/pause labels (static or derived from duration until analytics exist)

**Given** compare sessions card
**When** two recordings selected
**Then** existing `use-compare-recordings` + `CompositePlayer` mount in compare panel

**Given** notes field
**When** user types
**Then** notes persist to localStorage namespaced key (server notes defer to Epic 12)

---

### Story 14.5: Collection Master-Detail

As Priyank,
I want Collection as searchable list with right detail panel,
So that browsing saved words matches the collection mockup (UX-V2-UI5).

**Acceptance Criteria:**

**Given** `/collection`
**When** rendered
**Then** tabs All / Practicing / Mastered filter list (Practicing/Mastered may map to reviewCount thresholds initially)

**Given** row selection
**When** user clicks a word
**Then** detail panel shows pronunciation guide, meaning, example, source day, Play slow + Add to practice actions wired to existing TTS/save hooks

---

### Story 14.6: Review Session v2

As Priyank,
I want Review as a centered flashcard with Easy/Medium/Hard/Again feedback,
So that review matches the review mockup (UX-V2-UI8).

**Acceptance Criteria:**

**Given** `/review`
**When** session runs
**Then** central card shows word + phonetic; Reveal meaning toggles IPA/meaning/example; feedback buttons map to existing Got it / Almost / Forgot semantics (Easy/Medium/Hard/Again)

**Given** right sidebar
**When** visible
**Then** circular progress ring shows N reviewed / queue length; Up Next lists next 3 words

---

### Story 14.7: Settings Hub Sub-Pages

As Priyank,
I want Settings split into Practice, Audio, Data & Storage, Advanced, Appearance, About,
So that settings match the settings mockups (UX-V2-UI6).

**Acceptance Criteria:**

**Given** `/settings` with sidebar sub-nav
**When** user opens Practice
**Then** card rows for theme, persona, length, remember-last-used toggle match practice mockup; Save persists via existing settings form/API path

**Given** Advanced page in API mode
**When** rendered
**Then** Gemini key field + Test Connection (optional) replace multi-provider vault; keys save to Postgres (BVR4)

**Given** Data & Storage page
**When** rendered
**Then** retention dropdown, offline pack section, export/delete actions reuse existing Epic 8 flows where implemented

**Given** Appearance page
**When** user selects theme/accent/text size
**Then** choices apply via semantic tokens (dark mode may defer if not in current token set)

---

### Story 14.8: Journey Page (Calendar + Timeline)

As Priyank,
I want a Journey page combining calendar/timeline with session detail,
So that progress tracking matches journey mockups (UX-V2-UI7).

**Acceptance Criteria:**

**Given** `/journey` route
**When** rendered
**Then** top stats row shows current streak, sessions completed, longest streak, words practiced from existing hooks

**Given** calendar/timeline toggle
**When** user switches views
**Then** calendar reuses honest completion cells (FR58); timeline lists sessions with completion icons

**Given** day selection
**When** user picks a completed day
**Then** detail panel shows session summary, reflection note (localStorage), and link to archived day content (Epic 4)

---

### Story 14.9: Stretch UI Placeholders (Optional)

As Priyank,
I want placeholder UI for live feedback and AI reflection,
So that mockup parity exists without new backend work (UX-V2-UI9).

**Acceptance Criteria:**

**Given** Today right column
**When** stretch flag enabled
**Then** Pace/Clarity/Accuracy cards render static or "—" values with copy "Coming soon"

**Given** Voice Journal
**When** stretch flag enabled
**Then** "AI Session Reflection" card shows placeholder text, not live LLM call

---

## Epic 15: API Mode Parity & Close-Out

Closes functional and process gaps after v2 + UI refresh. **Priority:** BVR16 → BVR17 → BVR19 → BVR18 → BVR20.

### Story 15.1: Server Paragraph Dates for Calendar and Streak

As Priyank,
I want calendar, streak, and journey stats to know which UTC days have a server-generated paragraph,
So that completion dots and streaks stay honest in API mode after reload (BVR16, FR53, FR58).

**Status:** ready-for-dev

**Acceptance Criteria:**

**Given** `NEXT_PUBLIC_STORAGE_BACKEND=api` and authenticated session
**When** `GET /api/v1/paragraphs/dates` is called (optional `from` / `to` query for window)
**Then** response is a JSON array of UTC `YYYY-MM-DD` strings derived from `paragraph_cache.generated_at` for the current user only (BV17)

**Given** API mode
**When** `loadParagraphCacheUtcDateSet()` (or successor) runs
**Then** it merges server dates with local Dexie dates (union) so legacy local rows still count

**Given** user generated a paragraph yesterday via API, marked read, and reloads today
**When** Journey calendar or streak hooks evaluate yesterday
**Then** yesterday shows as complete when completions flags are set (FR53)

**Given** pytest
**When** tests run
**Then** new tests cover dates endpoint + empty-user case

---

### Story 15.2: Archived Day Detail in API Mode

As Priyank,
I want Journey (and calendar drill-down) to show paragraph excerpt and recordings for a past UTC day in API mode,
So that historical session detail matches local mode (BVR17, FR56).

**Status:** ready-for-dev

**Acceptance Criteria:**

**Given** API mode and a completed UTC date selected on Journey
**When** detail panel renders
**Then** it loads cached paragraph for that date from API (`GET /paragraphs?date=` or `GET /paragraphs/by-date/{utc_date}`) and recordings from `GET /recordings` filtered by date

**Given** no paragraph exists for that date on server
**When** panel renders
**Then** quiet empty state (UX-DR34) — no error toast

**Given** API mode
**When** `JourneyDayDetailPanel` runs
**Then** it no longer disables archived content solely because `apiMode === true`

**Given** recording playback
**When** user plays from archived panel
**Then** presigned playback URL flow from Epic 11 is used

---

### Story 15.3: Days-of-Use Server Sync (Day-14 Parity)

As Priyank,
I want distinct practice days stored on the server when in API mode,
So that Day-14 trigger and journey stats survive reload and match Postgres truth (BVR18, FR37).

**Status:** ready-for-dev

**Acceptance Criteria:**

**Given** Alembic migration
**When** applied
**Then** `days_of_use` table exists per architecture-v2 BV5 (`user_id`, `utc_date`, PK composite)

**Given** authenticated user
**When** `POST /days-of-use` or idempotent stamp on mark-read-it / save-recording
**Then** today's UTC date is recorded once per user

**Given** API mode
**When** `recordDayOfUse()` runs
**Then** it calls server stamp in addition to (or instead of) localStorage `audiblytics.daysOfUse`

**Given** Day-14 evaluation
**When** API mode
**Then** `distinctDaysOfUse` reads from server list (with local fallback during migration)

---

### Story 15.4: Stats Route — Implement or Remove Nav

As Priyank,
I want the Stats sidebar item to lead somewhere useful,
So that the v2 shell has no dead navigation (BVR19).

**Status:** ready-for-dev

**Acceptance Criteria:**

**Given** product decision **A — implement**
**When** user opens `/stats`
**Then** page shows streak, sessions completed, words practiced, and link to Journey — data from existing hooks (`use-streak`, journey stats, collection count)

**Given** product decision **B — defer**
**When** shell renders
**Then** Stats is removed from `AppSidebar` nav until a future epic; no `/stats` route advertised

**Given** either decision
**When** axe/keyboard pass on shell
**Then** no broken `aria-current` on missing route

---

### Story 15.5: Documentation and Sprint Tracking Hygiene

As Priyank,
I want docs and sprint status to reflect shipped v2 + UI work,
So that the repo is interview-ready and agents see accurate epic state (BVR20).

**Status:** ready-for-dev

**Acceptance Criteria:**

**Given** root `README.md` Phase 2 section
**When** read
**Then** primary Gemini path is **Settings → Postgres** (`gemini_api_key`); `GEMINI_API_KEY` in `.env` documented as optional dev fallback only

**Given** `sprint-status.yaml`
**When** epics 1–8 and 11 have all stories `done`
**Then** epic rows are `done` (not `in-progress`)

**Given** `_bmad-output/planning-artifacts/`
**When** complete
**Then** optional one-page `ux-v2-mockups-addendum.md` links mockup folder + notes API-mode login/settings (or UX spec § addendum stub)

**Given** Epics 9–10
**When** traceability desired
**Then** story files exist in `implementation-artifacts/` matching 9.1–10.5 (retroactive, copy ACs from `epics.md`)

---
