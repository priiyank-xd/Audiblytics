---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain-skipped', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
workflowComplete: true
completedAt: '2026-05-01'
releaseMode: 'single-release'
inputDocuments:
  - '_bmad-output/planning-artifacts/product-brief-Audiblytics.md'
  - '_bmad-output/planning-artifacts/product-brief-Audiblytics-distillate.md'
  - '_bmad-output/brainstorming/brainstorming-session-2026-05-01-1215.md'
  - '_bmad-output/brainstorming/audiblytics-detailed-description-2026-05-01.md'
documentCounts:
  briefs: 2
  research: 0
  brainstorming: 2
  projectDocs: 0
workflowType: 'prd'
classification:
  projectType: 'web_app'
  domain: 'general'
  complexity: 'low'
  projectContext: 'greenfield'
  scope: 'personal-mvp'
  notes: 'edtech-adjacent in subject matter but n=1 personal use neutralizes edtech compliance drivers (COPPA/FERPA/accessibility audits/content moderation). Personal MVP scope is locked; Public Future is parked per brief. PRD must encode the API-key security gate as a non-negotiable scope boundary preventing accidental public deployment.'
---

# Product Requirements Document - Audiblytics

> *"Audiblytics — read it. Say it. Mean it."*

**Author:** Priyank
**Date:** 2026-05-01

## Executive Summary

Audiblytics is a **single-user, single-device, fully client-side webapp** that delivers a 5-minute daily voice gym at **zero recurring cost** — defaulting to **Google Gemini's free tier** (no payment required, ~1,500 requests/day quota vs ~1 used/day) while supporting BYO-key swap to OpenAI, Anthropic, OpenRouter, or a local Ollama install from Settings. The app generates themed paragraphs (120–180 words, persona-tuned, seeded with 2–3 recycled collection words + 2–3 new advanced ones), surfaces hard words with IPA + dictionary-verified meaning + example sentence, builds a personal Word Collection in IndexedDB, and — most importantly — **records every read-aloud via `MediaRecorder` so the user can replay past-self vs present-self** and *hear* improvement that no score could prove.

The Personal MVP ships in one focused build week as ten features across three tiers, anchored on a **non-negotiable load-bearing column: the Voice Journal (F6)**. Every other feature exists to feed it: paragraph generation gives you something to read, the hard-words list gives you words worth saying carefully, the collection makes recycling possible, the calendar makes daily-ness visible, and the pen-drill warm-up primes the articulators before recording. Without Voice Journal and its Day-14 side-by-side comparison prompt, the entire success criterion — *"after 30 days, I felt my pronunciation actually improved"* — has no mechanism. F6 is therefore promoted from Tier 2 to **MVP-defining**: if F6 slips, the MVP slips with it.

The app runs on Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui, with `localStorage` for settings/calendar/API-key and `IndexedDB` (via Dexie) for word collection, voice recordings, and paragraph cache. LLM access goes through the Vercel AI SDK (`ai` package) with a **provider abstraction** that ships Google Gemini as the default and exposes OpenAI / Anthropic / Ollama / OpenRouter as one-click alternates — calls go directly from the browser to the chosen provider, **acceptable only because this is a single-user personal tool on the user's own machine.** This is encoded as a hard scope boundary: the app must never be deployed publicly without a backend proxy first, *regardless of whether the chosen provider is free or paid.*

### What Makes This Special

Three differentiators define the product, in increasing order of defensibility:

1. **The fusion** — vocabulary acquisition + pronunciation practice + physical articulation drill, in one daily loop. Adjacent products do exactly one (ELSA/Speakometer for pronunciation, Anki/paragraphlearning.com for vocab, raw ChatGPT for paragraph generation). Doing all three is the differentiator that can't be ironed out by adding one feature to a competitor.
2. **Voice Journal as the success mechanism, not a feature** — most apps measure speech (scores, percentages, accent ratings). Audiblytics *records* it and lets you compare. Hearing your past self struggle with a word you now read cleanly is a more visceral progress signal than any number. The Day-14 side-by-side prompt is engineered to be the moment the product proves itself.
3. **Speech is physical** — the pen-drill warm-up is the most tangible expression of this thesis. It's both a feature and a positioning statement: this is the only app that takes seriously that the mouth, tongue, jaw, and breath are an instrument that needs warming up.

A fourth, architectural differentiator distinct from the user-facing three: **BYO-LLM as a first-class architecture, not an afterthought.** The provider abstraction lets Priyank default to Google Gemini's free tier (zero recurring cost, no credit card on file) and swap to a paid model — or even a local Ollama install — from Settings without touching code. Audiblytics owns zero inference cost in any configuration. *(Public-future implication: this becomes a marketable position — "we don't add a markup to inference you already pay for, and the default tier is free" — but only after a backend proxy closes the API-key security gate.)*

The "aha moment" — the single experience that defines whether this product worked — is **Day 14, when the app surfaces a side-by-side replay of week-1 vs today.** If the user hears improvement, the MVP succeeded. Everything else is infrastructure to make that 30-second comparison possible.

## Project Classification

| Field | Value |
|---|---|
| **Project Type** | `web_app` (Next.js 15 SPA, browser-only, PWA-readiness preserved but PWA install/service-worker explicitly out of MVP scope) |
| **Domain** | `general` — subject matter is edtech-adjacent (vocabulary + pronunciation), but n=1 personal use neutralizes all edtech compliance drivers (no COPPA/FERPA, no accessibility audit obligation, no content moderation, no age verification) |
| **Complexity** | `low` — no auth, no multi-tenancy, no backend, no payments, no compliance surface; tactical complexity exists in browser API orchestration (`MediaRecorder`, `SpeechSynthesis`, IndexedDB via Dexie, Vercel AI SDK streaming) but is bounded |
| **Project Context** | `greenfield` (zero existing code, empty `docs/`, fresh Next.js project) |
| **Scope** | `personal-mvp` — single-user, single-device, ~5 minutes/day, 1-week build. Public Future is *parked, not abandoned*; the PRD treats it as out-of-scope appendix material only |
| **Hard Scope Boundary** | The LLM API key lives in browser `localStorage` and calls the LLM directly from the browser. **This is acceptable for personal single-user use on the user's own machine, and only that.** The app must not be deployed publicly without first introducing a backend proxy. This boundary is non-negotiable for the Personal MVP and must be re-evaluated before any public deployment. |

## Success Criteria

### User Success — The Only Metric That Matters

The Personal MVP succeeds if and only if, after **30 days of daily use**, Priyank can say:

> *"My pronunciation actually improved, and I have audio receipts to prove it to myself."*

This is **qualitative, self-reported, and binary** by design. It is not a score, not a streak, not a word count. The mechanism that makes this judgement possible is the **Voice Journal (F6)** and specifically the **Day-14 side-by-side comparison prompt**: a non-dismissable surface that takes over the home screen and forces a 60-second comparison of today's recording vs the earliest stored recording for an equivalent paragraph (or any paragraph if equivalence isn't available).

If the user hears improvement on Day 14, the MVP has *probably* succeeded. The Day-30 self-report confirms it.

#### The "Aha Moment" — Defined Precisely

The single user experience that defines product success: **on Day 14, opening the app surfaces an unmissable banner — "Listen to how far you've come." Tapping it plays week-1 recording, then today's recording, side by side. The user audibly hears the difference (cleaner articulation, fewer stumbles, better pacing on advanced words).** That 30-second playback is the entire success thesis confirmed in real time.

#### Soft Secondary User-Success Signals (logged, no targets)

These exist for self-observation only — *not* as success gates:

- **Daily-use streak length** — visible on the calendar; if it grows, the user is telling himself the app is working.
- **Words saved to collection** — collection size is a proxy for engagement-loop liveliness.
- **Voice Journal recording count** — raw evidence of speaking practice (not just paragraph reads without recording).
- **Tier-2 warm-up adoption** — % of paragraph reads preceded by a pen-drill. If this trends up, the "speech is physical" thesis is being internalized.

### Personal Investment Success (n=1 reframe of "Business Success")

This product has no business; it has a builder-user. Investment success is the trade between **Priyank's time spent building + using** vs **Priyank's value received**. The bar:

- **Build investment** — one focused build week (~30–40 hours). If the build slips past 2 weeks, scope must be cut, not extended.
- **Daily use investment** — ~5 minutes/day for 30 days (~2.5 hours total). If daily use feels like work, the loop is wrong.
- **Inference cost** — **$0 with default Google Gemini free tier** (~1 generation/day used vs ~1,500/day quota). If Priyank swaps to a paid provider from Settings (OpenAI GPT-4o-mini, Claude 3.5 Haiku, etc.), marginal cost remains <$1/month. If he swaps to local Ollama, cost stays $0 with zero key required.
- **Hosting cost** — $0. Either local-only `next dev` or Vercel free tier.
- **Return** — measurable improvement in pronunciation + a meaningfully expanded advanced vocabulary, both validated by the Day-30 self-report and Voice Journal evidence.

The investment succeeds if the build week stays bounded *and* the Day-30 self-report is positive. Either failure invalidates the trade.

### Technical Success

The system must reliably perform its core job, end-to-end, every day, on Priyank's primary browser (Chrome on macOS, with Safari as a known-good secondary). Specifically:

- **Paragraph generation** — completes in <15 seconds for a 150-word paragraph, returns structured JSON (paragraph + hard-words array) with ≥95% schema-validity rate across providers (failure modes: JSON parse error, missing `hardWords` array, malformed IPA strings — all must be caught and gracefully retried or surfaced).
- **Hard-words list** — every entry has a non-empty `word`, `ipa`, `meaning`, and `exampleSentence`. Any incomplete entry is dropped silently rather than rendered partially.
- **Word Collection persistence** — saved words survive browser restart, page refresh, and tab close. IndexedDB writes are confirmed (not fire-and-forget).
- **Voice Journal recording** — every recording attempt either succeeds and is persisted to IndexedDB with `{id, recordingDate, paragraphId, durationMs, audioBlob}`, or surfaces a clear error to the user. No silent recording loss. Storage budget stays under ~50MB (90-day rolling window of ~30s recordings).
- **Browser TTS playback** — paragraph and word-level playback works via `SpeechSynthesis` API on Chrome and Safari. Voice selection persists across sessions.
- **Recycle logic** — if collection has ≥2 words, next paragraph contains 2–3 of them; if 0–1 words, paragraph is generated without recycling (cold-start handled gracefully, no errors).
- **Day-14 comparison prompt** — fires reliably on the 14th day-of-use (not 14th calendar day) and is non-dismissable until interaction completes.
- **Calendar accuracy** — green dot appears for any day with both a paragraph generated AND a "I read it" tap or Voice Journal entry. No false positives, no missed completions.

### Measurable Outcomes (consolidated, in priority order)

1. **Day-30 self-report: pronunciation improved (Y/N).** This is the gate. *Pass = MVP succeeded.*
2. **Day-14 Voice Journal comparison completed and "yes I hear it" reported.** Earlier signal of #1.
3. **Build completed in ≤2 weeks elapsed time.**
4. **Daily-use streak ≥ 14 days within first 30 days.** (Not 30/30 — life happens; 14+ proves the loop is sticky.)
5. **Word collection ≥ 30 saved words by Day 30.** (Average ~1/day = engagement loop is alive.)
6. **Voice Journal recording count ≥ 14 by Day 30.** (Not every read needs recording; 14+ ensures comparison data exists.)
7. **Zero data-loss incidents** — no lost collection words, no lost recordings across the 30-day usage window.

## Product Scope

### MVP — Minimum Viable Product (the 1-week build)

**10 features across 3 tiers, with F6 (Voice Journal) promoted to MVP-defining priority.** Build order is by tier; within Tier 1, F1→F4→F2→F3→F5 is suggested for incremental verification.

**Tier 1 — Smallest Viable Loop (Days 1–3)**
- **F1 — Paragraph generator** (theme + persona pickers; Vercel AI SDK with **provider abstraction**; **default Google Gemini free tier** + BYO-key alternates for OpenAI / Anthropic / Ollama / OpenRouter; structured JSON response via `generateObject` with provider-agnostic schema)
- **F2 — Hard-words list** (IPA + meaning + example, rendered below paragraph; tap-to-pronounce via TTS)
- **F3 — Word Collection** (tap-to-save; IndexedDB via Dexie; schema includes review metadata for F8)
- **F4 — Browser TTS playback** (`SpeechSynthesis`, paragraph + word-level)
- **F5 — Recycle 2–3 collection words** into next paragraph (prompt-template injection; cold-start safe)

**Tier 2 — Differentiating Ritual (Days 4–5) — F6 IS MVP-DEFINING**
- **F6 — Voice Journal** (`MediaRecorder` → IndexedDB; side-by-side replay vs TTS; **Day-14 non-dismissable comparison prompt**) — *this feature carries the entire success criterion*
- **F7 — Pen-drill warm-up** (~15 rotating tongue-twisters; 30-second timer; "now without pen" prompt; optional Voice Journal record on each pass)
- **F8 — Daily Review** (flip-card flashcards; three-button feedback; picks N words by oldest `lastReviewedAt`)

**Tier 3 — Habit & Variety (Days 6–7, drop first if time slips)**
- **F9 — Calendar grid** (30/60/90 toggle on home; green dots for completed sessions; tap-day → details)
- **F10 — Offline Paragraph Pack** (one-shot batch script generates ~1,000 paragraphs to a JSON file stored in IndexedDB; offline mode picks from this when LLM unreachable)

**MVP-Slip Hierarchy (if the week compresses):**
1. F10 drops first (offline variety is nice-to-have for n=1)
2. F9 drops second (calendar can be added later; not load-bearing)
3. F8 drops third (daily review is valuable but non-critical for the success thesis)
4. F7 drops fourth (warm-up is the differentiator but not the success criterion)
5. **F6 cannot drop. If F6 doesn't ship, the MVP doesn't ship.**
6. Tier 1 (F1–F5) cannot drop — without it, there is no app at all.

### Growth Features (Post-MVP) — Parked, Not Pursued

Per scope decision, the Personal MVP is the entire product for now. There are **no planned growth features**. If, after 30+ days of personal use, Priyank decides to take Audiblytics public, the brief's "Public Future" roadmap (V1.1 fast-follow) is the source of truth — see [`product-brief-Audiblytics.md`](./product-brief-Audiblytics.md) §"Where This Could Go" and [`product-brief-Audiblytics-distillate.md`](./product-brief-Audiblytics-distillate.md) §9. Items parked there include: backend API-key proxy (mandatory security gate), Whisper voice scoring, Phoneme Mechanics Cards, Reader Personas (full library), Story Arcs, CYOA forks, Sentence Smithy, Mispronunciation Recovery Quest, Audiblytics Wrapped, Smart Pre-Download, full PWA cache.

### Vision (Future) — Parked, Not Pursued

V2 ambitions (Conversation Mode, full offline LLM via WebLLM, voice Sentence Smithy, etc.) are documented in the brief and explicitly out of scope for this PRD. They exist as a credible roadmap *if* Audiblytics goes public — not as commitments.

**Restatement of the hard scope boundary:** Public deployment of Audiblytics in any form is **forbidden** until the brief's documented "API-key security gate" is closed via a backend proxy. This PRD will not be modified to accommodate a public deployment without a separate security-architecture review. The PRD scope is, and remains, Personal MVP.

## User Journeys

> **Single-user product context:** Audiblytics has exactly one user (Priyank), one device (his laptop browser), and zero auth. The journeys below are *scenarios* for that single user — happy path, the aha moment, predictable edge cases, and the developer-hat setup task — not different personas. Coverage is comprehensive for the n=1 reality, not padded with fictional admins or API consumers that don't exist in this product.

### Persona — Priyank, the n=1 user

- **Who:** Adult English-speaking developer, technically comfortable.
- **Goal:** Push his vocabulary into advanced territory + tighten pronunciation for high-stakes speaking situations (presentations, interviews, professional conversation).
- **Constraint:** Has ~5 minutes a day. Doesn't want another subscription. Doesn't want to spend on inference if he can avoid it. Owns his data, his key, his machine.
- **Emotional baseline:** Skeptical of language apps after trying ELSA / Anki / paragraphlearning.com and getting fragmented daily friction. Quietly hopeful that one focused tool, built by him for him, can deliver the felt sense of progress that those apps couldn't.

---

### Journey 1 — First-Time Setup (Day 0, ~3 minutes)

**Opening scene.** It's a Saturday morning. The build is done. Priyank opens `localhost:3000` for the first time as a *user* rather than a *developer*. He sees a clean settings-first welcome screen: **"Welcome to Audiblytics."** Below it, a provider dropdown with **Google Gemini (Free)** pre-selected, and the alternates listed below it: OpenAI, Anthropic, OpenRouter, Ollama (local). A subtle helper line under the dropdown reads: *"We default to Gemini's free tier — no payment required, generous quota for daily use."*

**Rising action.** He keeps Google Gemini selected, taps the "Get a free key" link → opens Google AI Studio in a new tab → creates a key in two clicks → pastes it back. The key writes to `localStorage`. The app moves to a one-screen settings panel: pick default theme (Adventure), pick default persona (Storyteller), confirm paragraph length (150 words). One tap each. He clicks "Generate my first paragraph."

**Climax.** A loading spinner for ~5 seconds (Gemini Flash is fast). Then a 150-word adventure paragraph appears, with `crepuscular`, `perfunctory`, and `vehement` as hard words at the bottom — each with IPA, meaning, and example sentence. He taps `crepuscular` → browser TTS pronounces it. He taps the save-icon next to it → it lands in his collection.

**Resolution.** He reads the paragraph aloud, taps "I read it." A green dot appears for today on the calendar. Total elapsed time: ~3 minutes (including the ~30 seconds to grab a Gemini key). Total cost: $0. He closes the tab, satisfied. The loop works.

**Emotional arc:** Curious → mildly impressed (it really is free) → committed to trying it again tomorrow.

**Capability requirements revealed:**
- Settings-first onboarding flow with **provider dropdown (Google Gemini default)**, key entry, "Get a free key" deep-link to the chosen provider's signup, and theme/persona/length pickers
- Settings persisted to `localStorage` and survive browser restart
- LLM key validation (at least: rejects empty, accepts any non-empty string; no live API call required for v1)
- Provider abstraction in code: a `LLMProvider` interface that wraps Vercel AI SDK and resolves to `@ai-sdk/google`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `ollama-ai-provider`, or OpenRouter via OpenAI-compatible mode
- First-paragraph generation triggered explicitly by user (not auto-on-load)
- Loading state with progress indication
- Hard-words list with tap-to-pronounce and tap-to-save
- Green-dot calendar marking on first session completion

---

### Journey 2 — The Daily Happy Path (Day 3, ~5 minutes)

**Opening scene.** Tuesday morning, coffee in hand. Priyank opens the app at his usual time. Today's paragraph is ready (cached from a background fetch on close yesterday, OR generated on open — either is acceptable for n=1). It's a horror paragraph (he switched theme yesterday for variety). At the top, a small "Day 3" badge and his current streak ("3 days").

**Rising action.** He glances at the hard-words list: 6 words today, 2 of them recycled from his collection (`vehement` from Day 1, `perfunctory` from Day 2) and 4 new ones (`susurration`, `eldritch`, `gibbous`, `pall`). He spots the recycled words feel slightly familiar — proof the loop is doing its job.

He taps the small pen-icon at the top of the paragraph. A 30-second warm-up screen appears: "Hold a pen between your teeth. Read this short text out loud. We'll time you." A 30-second timer counts down while a tongue-twister displays. When it ends: "Now without the pen, read it again." He does. No scoring, no judgment, just the ritual.

He taps "Back to today's paragraph." Reads it aloud, deliberately slowing down on `susurration`. Taps the record icon — a 60-second recording starts. He reads the paragraph through, taps stop. The recording is saved to his Voice Journal with date and paragraph reference.

**Climax.** He taps the play icon next to `susurration` to hear it pronounced cleanly. Notices his version was close but slightly off on the second `s`. Taps the save icon → `susurration` joins his collection. Same for `eldritch`. Skips the other two (he already knows `gibbous`, doesn't care about `pall`).

**Resolution.** Taps "I read it." Green dot for today. Calendar now shows 3 consecutive green dots. He closes the tab. Total elapsed time: ~5 minutes (including the warm-up). Total cost: $0.

**Emotional arc:** Mildly anticipated → engaged → satisfied → quietly proud.

**Capability requirements revealed:**
- Today's paragraph available on open without manual generation step (cached overnight OR auto-generated; either fine for n=1)
- Streak counter visible on home screen
- Recycled words from collection visually distinguishable (subtle indicator) from new advanced words — *or* not (worth confirming UI decision)
- Pen-drill warm-up accessible from a one-tap icon on the home/paragraph screen
- 30-second timer with rotating text from a small bundled library (~15 phrases)
- Voice Journal recording: tap-to-record, tap-to-stop, automatic save with metadata
- Per-word TTS playback inline with the hard-words list
- Save-to-collection from hard-words list, with persistence
- "I read it" confirmation tap to mark session complete (separate from recording — recording also implicitly marks complete)

---

### Journey 3 — The Aha Moment (Day 14, ~2 minutes)

**Opening scene.** A Wednesday two weeks in. Priyank opens the app expecting today's paragraph. Instead, the entire home screen is taken over by a calm, full-bleed banner: **"Listen to how far you've come."** Below it: today's date. A 60-second comparison player. *No skip link is visible* (decision finalized — see FR37). He cannot get to today's paragraph until he engages.

**Rising action.** He taps the play button. The player plays his recording from Day 1 — his voice stumbling through `vehement`, slightly mispronouncing the second syllable, pausing awkwardly mid-sentence. Then it plays today's recording of the same word in a recent paragraph — cleaner, faster, more confident. The transition is jarring in the best way.

**Climax.** A simple two-button prompt: **"Did you hear improvement?"** [Yes, I hear it] [No, not really]. He taps Yes. The banner fades. A small celebratory message appears: "That's the entire reason this app exists. Keep going." Today's paragraph slides into view.

**Resolution.** He does today's session as normal. Closes the tab. The Day-14 prompt has fired exactly once and will not fire again until Day 30 (or 60, TBD — see §Open Decisions Q1).

**Emotional arc:** Mildly surprised → emotionally moved (this is the load-bearing emotion of the entire product) → re-committed.

**Capability requirements revealed:**
- Day-counter logic that tracks distinct days-of-use (not calendar days, not session count)
- Day-14 detection trigger that fires *on app open*, not at any background time
- Non-dismissable banner UX pattern with no visible skip mechanism
- Comparison player that selects two recordings: earliest available + most recent available, ideally for the same word or same paragraph (best-effort — falls back to "earliest paragraph" + "today's paragraph" if no word-level match exists)
- Yes/No self-report capture with a single binary write to `localStorage` (used as the Day-30 success signal)
- Re-trigger logic: prompt does not fire again until Day 30 (or configurable next milestone)

---

### Journey 4 — Edge Case: LLM Provider Failure Mid-Generation (Day 7, ~1 minute)

**Opening scene.** Priyank opens the app on Day 7. Gemini is having a transient regional outage (or Priyank somehow exhausted his free quota — unlikely at his usage rate, but possible). He taps "Generate today's paragraph."

**Rising action.** Loading spinner for ~5 seconds. Then an error surface: **"Couldn't reach Google Gemini. Got a `RESOURCE_EXHAUSTED` response. This usually means a transient quota issue — try again in a minute, switch providers, or use the offline pack."** Below it, three clear actions: [Retry] [Open Settings] [Use Offline Pack] (if the offline pack is downloaded — Tier 3 F10).

**Climax.** He taps [Use Offline Pack]. A random pre-generated paragraph from his ~1,000-paragraph local pack appears. It's a comedy paragraph (not his preferred theme today, but variety is fine). Hard-words list is included (pre-generated). He reads it aloud, records, saves a word.

**Resolution.** Green dot appears with a small offline-icon badge (so future-Priyank knows this session used the offline pack, not a fresh generation). Total elapsed time: ~1 minute longer than usual due to the error and theme change. He notes that next time he should also have an OpenAI key configured as a backup provider.

**Emotional arc:** Mild frustration → relief that there's a fallback → continued use.

**Capability requirements revealed:**
- Provider-agnostic error parser: maps Gemini (`RESOURCE_EXHAUSTED`, `403`), OpenAI (`429`, `401`, `quota_exceeded`), Anthropic (`overloaded_error`, `rate_limit_error`), Ollama (`connection refused`), and OpenRouter errors into a unified user-facing surface
- Three-action error recovery: [Retry] (with optional exponential backoff), [Open Settings] (deep-link to provider config), [Use Offline Pack] (fallback to local cached pack if F10 is enabled)
- Offline-pack indicator on calendar (subtle badge differentiating offline-pack sessions from fresh-LLM sessions, for future self-observation)
- Graceful degradation: error surface should never crash the app or block the calendar from updating

---

### Journey 5 — Edge Case: Missed Day Recovery (Day 9, after a missed Day 8)

**Opening scene.** Tuesday. Priyank skipped Monday — meeting day, no time. He opens the app on Tuesday morning expecting some accusation about the broken streak.

**Rising action.** The home screen shows his calendar with a small grey gap where yesterday's green dot should be. The streak counter shows "1 day" (reset, because the previous streak was 7 and is now broken). No popup, no nag, no "you broke your streak" modal. Just honest visual state.

**Climax.** He notices the streak reset but feels no shame about it — the UI did not catastrophize. He generates today's paragraph and proceeds normally.

**Resolution.** Today's session completes. New streak: 1 day. Calendar updates. Tomorrow he'll be at 2.

**Emotional arc:** Anticipated guilt → relief → re-engagement.

**Capability requirements revealed:**
- Streak counter computed from calendar state (consecutive green dots ending today); resets cleanly on any gap day
- No shame-inducing UI: missed days are visually rendered as honest absence (grey/empty cell), never as red/X/warning
- Calendar gap is visible but uncommented — no modal, no banner, no "You broke your streak!" dialogue
- Streak Freeze mechanic is **explicitly out of MVP scope** — that's a Public-Future feature; the MVP's compassionate-by-default UI is sufficient for n=1 (Priyank doesn't need protection from himself)

---

### Journey 6 — Developer-Hat: Building the Offline Paragraph Pack (One-Time, ~70 minutes)

**Opening scene.** Sunday evening, Day 6 of build week. Tier 3 is being built. Priyank decides to generate his offline paragraph pack now so it ships with the app.

**Rising action.** He runs a separate Node script (lives in `/scripts/generate-offline-pack.ts`, NOT inside the deployed Next.js app). The script reads his Gemini key from a local `.env` file, loops through theme × persona combinations (6 themes × 4 personas = 24 combinations × ~42 paragraphs each = 1,008 paragraphs), batches calls to `gemini-2.5-flash` **throttled to ≤10 RPM** to stay safely under the free-tier 15 RPM limit, parses each structured JSON response, and writes the validated results to `public/offline-pack.json`. *(Trade-off note: throttling to free-tier rate makes the script ~70 minutes of wall time. If Priyank wants the pack faster, he can flip a `--paid` flag in the script and it'll burn ~$1.50 of paid Gemini Flash credits to finish in ~8 minutes. Documented in script README. He picks the free path because he's making coffee anyway.)*

**Climax.** Total runtime: ~70 minutes. Total cost: **$0**. The output JSON is ~1.8MB. The script logs validation failures (any paragraphs whose hard-words list was malformed) and skips them silently (final pack is closer to ~990 paragraphs, which is fine).

**Resolution.** He commits `public/offline-pack.json` to the repo. The app's "Download Pack" button in settings now copies this JSON into IndexedDB on first tap (or auto-loads on first run; UX choice TBD). Offline mode is now live. *(Note: the offline pack is deliberately Gemini-generated regardless of Priyank's runtime provider choice — it's a one-time build asset, not a per-user concern.)*

**Emotional arc:** Slightly nervous about runtime → reassured by the zero cost → satisfied that offline works.

**Capability requirements revealed:**
- Offline pack generation is a **separate Node script**, not part of the deployed app — runs once on Priyank's machine with his Gemini key (or any other provider key via a `--provider` CLI flag)
- Script must handle: rate limiting (≤10 RPM for Gemini free tier; configurable per provider), JSON validation per response, graceful skipping of malformed responses, progress logging with ETA
- Optional `--paid` flag for faster runs at small cost (documented trade-off, defaulted off)
- Output schema is identical to the runtime LLM response schema (so the same paragraph rendering code handles both fresh and offline content)
- Pack ships in `public/` folder of the Next.js app
- "Download Pack" UX in settings: either explicit button (copies from `/offline-pack.json` → IndexedDB) or auto-load on first run with a visible progress indicator
- Offline pack picks paragraphs randomly from the ~1,000-paragraph store, with light de-duplication (don't show the same paragraph twice within a 30-day window)

### Journey Requirements Summary

The six journeys collectively reveal **eight capability clusters** the PRD must cover in functional requirements:

| Capability Cluster | Source Journeys | Notes |
|---|---|---|
| **Settings & Onboarding** | J1, J4 | Provider dropdown (Gemini default, OpenAI/Anthropic/Ollama/OpenRouter alternates); API-key entry with "Get a free key" deep-link; theme/persona/length defaults; settings deep-link from errors |
| **LLM Provider Abstraction** | J1, J4, J6 | `LLMProvider` interface wrapping Vercel AI SDK; provider-agnostic structured-JSON via `generateObject`; provider-specific error parsing mapped to unified user surface |
| **Paragraph Generation & Display** | J1, J2, J4 | Theme + persona prompt construction; structured JSON validation; loading state; recycle logic; hard-words list with IPA/meaning/example |
| **Audio Output** | J1, J2, J3 | Browser TTS for paragraph and per-word playback; voice selection persistence |
| **Word Collection** | J1, J2 | Tap-to-save from hard-words list; IndexedDB persistence; collection survives session restart |
| **Voice Journal** | J2, J3 | `MediaRecorder` → IndexedDB; recording metadata; **Day-14 non-dismissable comparison prompt** with binary self-report |
| **Pen-Drill Warm-Up** | J2 | One-tap entry from home; 30s timer; rotating text library; optional recording per pass |
| **Calendar & Streak** | J1, J2, J5 | Green-dot completion marker; streak counter; offline-pack badge; honest empty cells for missed days |
| **Offline Pack & Error Handling** | J4, J6 | Separate Node generation script (Gemini default, throttled to free tier; optional `--paid` flag); runtime fallback from LLM errors; deep-link to settings on key issues |

Two capabilities present in the brief but **not validated by any journey above** (and therefore worth confirming explicitly in functional requirements):
1. **F8 — Daily Review (flashcards)** — none of the six journeys exercises this. It's a separate user-initiated flow, accessible from the home screen, not part of the daily ritual. Worth ensuring it lives as a "secondary tab" or "review button" rather than expecting it to surface on its own.
2. **Theme/persona switching mid-stream** — J2 mentions Priyank "switched theme yesterday" but no journey shows the actual switch UX. Settings should expose theme/persona swap that takes effect on the *next* paragraph generation, not retroactively.

## Innovation & Novel Patterns

### Detected Innovation Areas

Audiblytics' innovation is **product-conceptual**, not platform-technical. There are no novel browser APIs, no WebAssembly, no AR/VR, no machine-learning research breakthroughs. What's genuinely new is the *combination* and the *measurement reframe*. Five specific innovations matter:

#### Innovation 1 — The Fusion: vocab + pronunciation + physical drill in one daily loop

**The novel claim.** No existing product fuses (a) advanced vocabulary acquisition with personal collection + recycling, (b) pronunciation practice through repeated read-alouds, and (c) physical articulation drills (pen-between-teeth) into a single daily ritual. Adjacent products do exactly one: ELSA / Speakometer / Lingova do pronunciation alone; Anki / paragraphlearning.com / piglei/ai-vocabulary-builder do vocab alone; raw ChatGPT does paragraph generation alone.

**Validation approach.** The fusion succeeds if Priyank, after 30 days, can name *one* daily app that delivers what previously required three. Self-reported, binary. Validated by §Success Criteria measurable outcome #1.

**Failure mode + fallback.** If the fusion produces friction rather than flow ("too much to do in one session"), the loop is decomposable: collection review (F8) and warm-up (F7) can be skipped on any given day without breaking the core paragraph→record→save loop. The MVP-Slip Hierarchy in §Product Scope already encodes this — F7 and F8 drop before F6 if scope is squeezed.

#### Innovation 2 — Voice Journal as the success mechanism (not a score)

**The novel claim.** Pronunciation apps measure speech (ELSA: 1–100 score; Speakometer: phoneme accuracy; Lingova: tutor critique). Audiblytics *records* it and lets the user compare past-self vs present-self. The Day-14 side-by-side comparison is the load-bearing emotional moment of the entire product — engineered to be the moment the thesis proves itself in 30 seconds of audio.

**Validation approach.** On Day 14, the user is asked a binary question: *"Did you hear improvement?"* This is the leading indicator of the Day-30 self-report (§Success Criteria measurable outcome #1). If users consistently say "Yes, I hear it" on Day 14 across multiple month-long usage cycles, the mechanism is working. (For n=1, "consistently" means: it works once, then again at Day 60, Day 90, etc.)

**Failure mode + fallback.** If, on Day 14, Priyank cannot hear improvement, two diagnostics are possible: (a) genuinely, his pronunciation hasn't improved in 14 days — this is a signal the loop isn't working, *not* a problem with the comparison mechanism; (b) the comparison is happening on dissimilar paragraphs/words, making improvement audibly invisible. Mitigation for (b): the comparison player tries to match earliest-recording with most-recent-recording on the *same hard word* if such overlap exists, before falling back to whole-paragraph comparison. (c) If neither helps, this is product-defining feedback — the Voice Journal mechanism may need post-MVP enhancement (e.g. word-level zoom, slow-playback comparison) before the thesis is provable.

#### Innovation 3 — "Speech is physical" expressed via pen-drill warm-up

**The novel claim.** No pronunciation app treats the mouth, tongue, jaw, and breath as an instrument that needs warming up before use. Audiblytics frames the daily session with a 30-second pen-drill — the most tactile, weirdest, most teachable proof that articulation is a physical skill.

**Validation approach.** Tracked softly via the *warm-up adoption rate* (§Success Criteria soft secondary signal). If, after 30 days, Priyank has voluntarily run the warm-up before ≥30% of sessions, the thesis has been internalized. Below 10%, the warm-up is decoration, not differentiation.

**Failure mode + fallback.** If warm-up adoption is below 10% but the Day-30 success report is positive, the pen-drill can be retired as a core feature in any future iteration without invalidating the product — it's a *positioning* feature more than a *learning* feature. (For the Personal MVP, no action is required either way.) If warm-up adoption is high *and* Day-30 success is positive, the pen-drill is validated as both positioning and pedagogy.

#### Innovation 4 — BYO-LLM with free-tier default + provider abstraction

**The novel claim.** No competitive app in this space (per §Executive Summary competitive scan) lets the user bring their own LLM key, choose between paid and free providers, or run inference fully locally via Ollama. Audiblytics ships with **Google Gemini's free tier as the default** (zero recurring cost, no payment required) and exposes OpenAI / Anthropic / Ollama / OpenRouter as one-click alternates from Settings. This is an architectural innovation, not a user-facing feature — but it has direct user-facing consequences (zero subscription, zero rate limits in practice for n=1, full provider control).

**Validation approach.** Validated by Priyank's actual cost over 30 days. Target: $0 with Gemini free tier (default) or local Ollama. Worst case: <$1 with paid Gemini Flash or GPT-4o-mini. Tracked passively in §Success Criteria Personal Investment Success.

**Failure mode + fallback.** If Gemini's free tier rate-limits or quality degrades during normal use, the abstraction itself is the fallback — Priyank swaps providers from Settings without touching code. The provider abstraction IS the mitigation; no other mitigation is needed.

#### Innovation 5 — Day-14 non-dismissable comparison prompt as engineered emotional moment

**The novel claim.** Most apps avoid forced friction. Audiblytics deliberately introduces it at exactly one moment in the user's lifecycle — Day 14 — because the brief's premise demands a single, unmissable confrontation with the audio evidence of progress. This is "friction on purpose" as a product mechanic.

**Validation approach.** The Yes/No self-report is the validation. If the user taps "Yes, I hear it," the engineered moment delivered. If "No, not really," the engineered moment was correctly delivered but the underlying mechanism (Innovation 2) failed.

**Failure mode + fallback.** Forced friction can backfire — Priyank might resent the takeover and lose trust in the product. Mitigation: the prompt fires *exactly once* at Day 14, and the user is never blocked from the rest of the app for more than ~60 seconds (the duration of the comparison player). After Day 14, the next forced surface is at Day 30 (or Day 60 — see §Open Decisions Q1). If even one forced moment proves regrettable, the prompt can be downgraded to a soft banner in any future iteration without breaking other features.

### Market Context & Competitive Landscape

The brief's competitive scan (May 2026) is the source of truth — full detail in [`product-brief-Audiblytics.md`](./product-brief-Audiblytics.md) §"What Makes This Different" and [`product-brief-Audiblytics-distillate.md`](./product-brief-Audiblytics-distillate.md) §8. Summary verdict for the PRD:

- **Pronunciation-only apps** (ELSA, Speakometer, Lingova, Accent AI, BoldVoice — collectively millions of users) — operate on canned content, no vocabulary loop, no physical drill, all subscription-based, all own their inference costs.
- **Vocabulary text-generators** (paragraphlearning.com, Musely, Logicballs) — closest concept-match for paragraph + word-extraction; *no voice angle*, *no daily ritual*, $14.99/mo Pro tier (paragraphlearning.com is the price-point benchmark for any future commercial model).
- **Open-source vocabulary builders** (piglei/ai-vocabulary-builder) — CLI/notebook tool, *no pronunciation*, *no daily app*.
- **The fusion gap is real and validated.** No direct full-stack competitor exists. Audiblytics' innovation moat is the combination + the measurement reframe + the architectural BYO-LLM pattern.

For the Personal MVP, market context matters mostly as a *sanity check that the gap is real* — if a competitor shipped this exact product tomorrow, Priyank could just use theirs. The competitive scan confirms no one has, so building it is the only way to get it.

### Validation Approach (Consolidated)

The five innovations validate against three signals (in order of leading-to-lagging):

1. **Day-14 Voice Journal comparison: "Yes, I hear it"** — leading indicator. If this fires, Innovations 1 + 2 + 5 are working.
2. **Warm-up adoption ≥30% of sessions over 30 days** — leading indicator for Innovation 3.
3. **Day-30 self-report: "My pronunciation actually improved"** — lagging confirmation of all five innovations and §Success Criteria gate.

If signal 1 + 3 fire, the MVP succeeded regardless of signal 2 (warm-up is additive, not load-bearing). If signal 1 fires but signal 3 does not, the comparison mechanism is psychologically powerful but the underlying skill change is too slow — needs longer observation window before judgment. If signal 1 does not fire, the entire product needs re-examination.

### Risk Mitigation

| Innovation | Primary Risk | Mitigation |
|---|---|---|
| 1 — Fusion | Cognitive overload in 5-min daily window | MVP-Slip Hierarchy ensures decomposability; F7/F8 are skippable per session without breaking core loop |
| 2 — Voice Journal | Comparison sounds identical (no audible improvement) | Player attempts word-level match before paragraph-level fallback; if both fail to surface improvement, this is product-validating feedback, not a bug |
| 3 — Pen-drill | User finds it silly and stops doing it | Acceptable failure — pen-drill is positioning, not pedagogy; can be quietly removed in future iterations without breaking thesis |
| 4 — BYO-LLM with free default | Gemini free tier rate-limits or quality drops | Provider abstraction *is* the mitigation — Settings-side swap to paid Gemini, OpenAI, Anthropic, or Ollama with no code changes |
| 5 — Day-14 forced friction | User resents takeover, loses trust in product | Single fire at Day 14, ≤60s blocking, no subsequent forced friction until Day 30+; downgradable to soft banner in future iterations if regretted |

## Web App-Specific Requirements

### Project-Type Overview

Audiblytics is a **client-side SPA** built on Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui. Despite running on a Next.js framework typically used for server-rendered or hybrid apps, **the runtime architecture is intentionally client-only** — there are no API routes, no server actions for LLM calls, no server components beyond the App Router shell. All meaningful logic runs in the browser: LLM calls go directly to the chosen provider via Vercel AI SDK, storage is `localStorage` + IndexedDB, audio I/O uses native browser APIs (`MediaRecorder`, `SpeechSynthesis`), and there is no backend to deploy.

This shape is non-negotiable for the Personal MVP — it's what enables zero infrastructure cost and the BYO-LLM architecture (Innovation 4). It is also what creates the hard scope boundary documented in §Project Classification: a public deployment of this same architecture would expose the user's API key in browser `localStorage`, which is acceptable for n=1 personal use only.

### Browser Matrix

| Browser | Tier | Status | Known caveats to handle |
|---|---|---|---|
| **Chrome (latest 2 versions)** | Primary | Full support, all features tested manually by Priyank during build week | None expected; reference browser for UX |
| **Safari (latest 2 versions, macOS)** | Secondary | Supported with known caveats | (a) `SpeechSynthesis.getVoices()` returns smaller voice list than Chrome; UI must show whatever's available, no minimum count required. (b) `MediaRecorder` defaults to `audio/mp4` codec on Safari vs `audio/webm` on Chrome; persistence layer must store the actual MIME type with each recording so playback works regardless of which browser recorded it |
| **Edge (Chromium)** | Inherits Chrome | Same as Chrome, no separate testing | None |
| **Firefox** | Best-effort only | Not a Day-1 target; runs but UX/audio quality varies | `SpeechSynthesis` voice list is sparse; `MediaRecorder` mimeType handling differs again. Acceptable to break Firefox if a fix would slow the build week. |
| **Mobile Safari / Chrome (iOS / Android)** | Out of MVP scope | Pages render but no UX optimization | Not part of Priyank's daily-use surface (he uses his laptop). Touch targets, viewport, mobile keyboard handling, and PWA install — all explicitly deferred. |

**Single-target reality:** primary daily-use browser is Chrome (or any Chromium-based browser) on macOS. Safari is the only other browser that must work end-to-end. Everything else is best-effort.

### Responsive Design

- **Designed primarily for laptop/desktop widths** (≥1024px). Priyank's daily use is at his laptop.
- Tailwind + shadcn/ui defaults provide graceful scaling down to ~768px (tablet) without explicit work.
- **No mobile-first design pass.** No mobile-specific layouts, no bottom nav, no mobile keyboard tuning.
- **No fixed widths or pixel-locked layouts.** Use Tailwind's responsive utilities (`md:`, `lg:`) sparingly — most screens are single-column flows that scale naturally.
- Calendar grid (F9) is the one component with non-trivial responsive behavior: 30/60/90-day views must adapt to viewport width without horizontal scroll on a laptop screen.

### Performance Targets

These are Personal-MVP-realistic targets (not enterprise SLOs). Measured informally during dogfooding, not via formal monitoring.

| Operation | Target | Notes |
|---|---|---|
| **Cold page load** | <2s on broadband | Small SPA, mostly client JS; no server roundtrips beyond the static asset fetch |
| **First-paragraph generation (full)** | <15s end-to-end | LLM-dependent. Gemini Flash typically ≤5s for a 150-word structured-JSON response. 15s is the buffer including network jitter and parsing |
| **LLM streaming first token** | <3s | Only relevant if streaming is implemented; Vercel AI SDK supports it. If not streaming, the user sees a single ~5s loading state |
| **Per-word TTS playback** | Instant on tap | Native `SpeechSynthesis`; no perceptible lag |
| **Voice recording start** | <300ms tap-to-active | After microphone permission is already granted; first-ever permission request adds ~1s for the browser dialog |
| **Voice recording playback** | Instant on tap | Direct from IndexedDB blob |
| **IndexedDB read (collection list of ≤100 words)** | <200ms | Dexie live queries; well within typical IndexedDB performance |
| **Streak/calendar render** | <100ms | Reading from `localStorage`; trivial |
| **JS bundle size (gzipped)** | <500KB | Don't ship unnecessary deps; Next.js default tree-shaking; no Lighthouse audit gate |

No formal Lighthouse score target. No Core Web Vitals tracking. No performance monitoring infrastructure (no Sentry, no PostHog, no analytics). If Priyank notices something feels slow, he fixes it; otherwise, it's fine.

### SEO Strategy

**None.**

This is an n=1 personal app deployed either locally (`next dev`) or on Vercel free tier with no public discovery intent. The PRD explicitly opts out of:

- Sitemap generation
- `robots.txt` (default Next.js behavior is fine — neither encouraging nor discouraging crawlers, since the app shouldn't be reachable from public URLs anyway)
- Open Graph / Twitter Card meta tags
- JSON-LD / structured data
- Canonical URLs
- Meta descriptions beyond a default `<title>`
- Any analytics or search-console integration

If Vercel-hosted, the deployment URL is treated as a personal endpoint, not a discoverable web property. SEO is a Public-Future concern.

### Accessibility Level

**Best-effort by default; no formal WCAG audit, no compliance commitment.**

Reasoning: the PRD acknowledges the user is Priyank, who has no relevant accessibility needs. A formal a11y posture is out of scope for n=1. *However*, "best-effort by default" is achievable nearly for free, so the PRD commits to:

- **Use shadcn/ui (built on Radix primitives) for all interactive components.** Keyboard navigation, focus management, ARIA labels, and roles come built-in — no extra work required.
- **All voice recording controls have keyboard equivalents.** No mouse-only interactions in the daily ritual happy path.
- **Text scales with browser zoom.** Use Tailwind's relative font sizing (`text-base`, `text-lg`) rather than fixed px, so browser zoom and OS-level text scaling work.
- **Color contrast at AA via shadcn defaults.** Don't override theme colors with low-contrast custom values.
- **Microphone permission denial path is keyboard-navigable** — error UI and recovery actions reachable without mouse.

**Explicitly out of scope:**

- Screen reader compatibility testing (NVDA, JAWS, VoiceOver)
- Formal WCAG 2.x AA/AAA audit
- High-contrast mode toggling
- Captioning or transcript display for TTS audio playback (it's output, not narration)
- Reduced-motion preference handling beyond what shadcn provides by default
- Internationalization, localization, RTL support

Public-Future implication: if Audiblytics ever ships publicly, a formal a11y audit and at least WCAG 2.1 AA conformance becomes mandatory before launch (especially given the edtech-adjacency, where COPPA/FERPA-flavored markets often expect Section 508 compliance).

### Real-Time / Reactivity

No multi-user real-time. No WebSocket connections. No server-pushed updates. The product has exactly one client and zero servers.

**Local interactivity that must feel real-time:**

- LLM response streaming (optional; if implemented, use Vercel AI SDK's `streamText` or `streamObject` with progressive UI updates as tokens arrive)
- Recording start/stop UI (sub-second response)
- TTS playback start (immediate)
- Live waveform during recording (optional; nice-to-have visual feedback during a Voice Journal capture, not required for v1)
- Dexie live queries for the collection list (auto-update when a word is saved from another tab — though n=1 single-tab use makes this unnecessary in practice)

### Audiblytics-Specific Web App Considerations (not in CSV but critical)

#### PWA Stance — Explicitly Opt-Out for MVP

The brief mentions "Slim PWA + cache layer" as a Public-Future requirement. **For the Personal MVP, no PWA features ship:**

- No `manifest.json` beyond the Next.js default (no install prompt, no app icons beyond favicon)
- No service worker (no offline shell, no asset caching beyond browser HTTP cache)
- No "Install Audiblytics" prompt
- No standalone display mode

PWA is deferred entirely. Offline support for paragraphs comes from the IndexedDB-stored Offline Pack (F10), not from a service worker. If Priyank wants to use the app offline, F10 is the answer; PWA installability is not.

#### Browser API Permissions

The app uses one permission-gated browser API: **microphone access via `navigator.mediaDevices.getUserMedia({ audio: true })`**, required by F6 (Voice Journal) and F7 (warm-up if recording is enabled).

Permission UX requirements:

- **First request happens on first tap of the record button**, never on app load. Permission requests on cold start are a known anti-pattern that browsers increasingly suppress.
- **If permission is denied**, surface a clear inline message: *"Microphone access is required to record. Click the lock icon in your address bar to grant permission, then try again."* Provide a [Try Again] button.
- **If permission is granted**, store the granted state in `localStorage` so subsequent sessions skip any internal "should I ask?" logic (the browser handles persistent permission state, but the app should remember UX flow context).
- **Microphone permission denial does NOT block the rest of the app** — Priyank can still generate paragraphs, read silently, build his collection, do the daily review. Voice Journal becomes unavailable until permission is granted; everything else remains functional.

No other permission-gated APIs are used. No `Notification` permission (no in-browser notifications in MVP). No `Persistent Storage` permission request (IndexedDB works fine without it for the storage budget Audiblytics needs).

#### IndexedDB Quotas & Storage Hygiene

IndexedDB quotas vary by browser but are generous for Audiblytics' needs:

- Chrome: ~60% of free disk space (effectively unlimited for n=1 use)
- Safari: ~1GB by default, expandable to ~20% of disk
- Voice Journal storage budget: ~50MB max with 90-day rolling window (~30s recordings at ~500KB each, up to ~90 retained ≈ ~45MB)
- Word Collection: <1MB even at thousands of words
- Offline Paragraph Pack: ~1.8MB (one-time)

**Defensive handling:**

- All IndexedDB writes wrapped in try/catch to surface `QuotaExceededError` if it ever occurs (extremely unlikely for n=1 but cheap to handle)
- Voice Journal recordings older than 90 days are pruned by a periodic cleanup task (runs on app open, no separate worker needed)
- 90-day rolling window is configurable in Settings; "indefinite retention" is offered as an advanced toggle (per brief Open Question #4)

#### Browser TTS Voice Availability

`SpeechSynthesis.getVoices()` returns asynchronously on Chrome — the first call typically returns an empty array, with voices populating after the `voiceschanged` event fires. Safari returns voices synchronously but with a smaller set.

UX requirements:

- **Settings voice picker** lists voices grouped by language, defaulting to the highest-quality English voice available (e.g. "Google US English" on Chrome, "Samantha" on Safari).
- **If no voices are available** (rare on a cold load before `voiceschanged` fires), the picker shows a "Loading voices…" state and refreshes when voices appear.
- **Voice selection persists** in `localStorage` and is restored on subsequent loads.
- **If the persisted voice is no longer available** (e.g. user switched browsers), fall back to the system default English voice.

### Implementation Considerations

Pulling together the above into developer-actionable summary:

- **Framework:** Next.js 15 App Router; mostly client components (use `"use client"` liberally; almost no server components needed beyond the root layout).
- **Routing:** Single primary route (`/`) with the daily ritual surface; secondary routes for `/settings`, `/collection`, `/calendar`, `/review`. No dynamic routes, no catch-alls.
- **Styling:** Tailwind CSS with shadcn/ui defaults; no custom theme overrides for MVP (default neutral palette is fine).
- **State management:** No global state library (Redux, Zustand, etc.). Use React state + Dexie live queries + `localStorage` reads. The data shapes are simple enough that hand-rolled is faster than any library wrapper.
- **LLM SDK:** Vercel AI SDK (`ai` package) with provider abstraction layer wrapping `@ai-sdk/google` (default), `@ai-sdk/openai`, `@ai-sdk/anthropic`, `ollama-ai-provider` (community), and OpenRouter via OpenAI-compatible mode.
- **Storage layer:** Dexie.js for IndexedDB; vanilla `localStorage` for settings/calendar/key.
- **Audio I/O:** Native `MediaRecorder` (Voice Journal recording) and `SpeechSynthesis` (TTS playback) — no libraries.
- **Deployment:** Vercel free tier OR local-only `next dev`. Vercel adds nothing functional for n=1; deploy if you want HTTPS for microphone permissions on a non-localhost domain.
- **Build tooling:** Next.js defaults; no custom webpack config; ESLint + Prettier with Next.js defaults; no test framework required for MVP (Priyank's daily use IS the integration test).

## Product Voice & Tone

All product copy — onboarding text, button labels, empty states, error messages, drill phrases, the Day-14 banner, the streak ribbon, the brutally-honest comparison prompt — should sound like the same person wrote it. That person is warm, honest, and slightly cheeky, and they refuse to manipulate. The tagline *"Audiblytics — read it. Say it. Mean it."* sets the register: short, declarative, slightly playful, never preachy.

Operating principles for all written surfaces:

- **Warm but not saccharine.** Celebrate quietly. The Day-14 banner says *"Listen to how far you've come"* — not *"Amazing! You're crushing it! 🎉"*. No exclamation-point gymnastics, no manufactured enthusiasm. The product trusts the user to recognize their own progress.
- **Honest about what's real.** Default copy reflects actual behavior. Say *"Free with Google Gemini's free tier — no payment required"*, not *"Free forever, unlimited usage"*. Say *"You can hear the difference now"* only if the product actually surfaces a comparison; never claim improvement that isn't measurable from the audio itself.
- **Slightly cheeky where it earns the laugh.** Pen-drill text leans toward classic tongue-twisters (*"red lorry, yellow lorry"*); empty states can have a little personality (*"Nothing here yet. Today changes that."*). Never trying-too-hard, never punching down at the user.
- **Never shame-inducing.** Missed-day copy is neutral and forward-looking ("Welcome back"), not red, not warning-styled, not exclamation-pointed. Streak ribbons reference distinct days completed and never highlight gaps. The product never tells the user they failed — only that they're back.
- **Direct and concrete, like the product itself.** Short sentences. Plain words. No marketing speak ("synergize", "unlock", "elevate"), no hedge words ("just", "simply", "easily"), no AI-disclosure boilerplate beyond what's necessary. If a button does one thing, name that one thing.

This section is normative: any copy added during build week or any future iteration must pass this voice check. When in doubt, read it aloud — if it doesn't sound like something Priyank would say to a friend over coffee, rewrite it.

## Project Scoping

> **Single-release scope.** This is a one-shot Personal MVP build — not a phased rollout. There is no Phase 2, no Growth phase, no Vision release planned within this PRD's horizon. The "tiers" referenced throughout (Tier 1 / Tier 2 / Tier 3) are *build-sequence priorities within the single release*, providing graceful degradation if the build week compresses — not multi-release phases. The Public-Future roadmap is documented as parked in §Product Scope and remains explicitly out of this PRD's scope.

### Strategy & Philosophy

**MVP Approach: Learning-Driven Personal MVP.**

This is neither a problem-solving MVP (a hypothesis about a stranger's pain) nor a revenue MVP (a thing someone will pay for) nor a platform MVP (a foundation for future features). It is a **learning-driven personal MVP** — built to test, in 30 days of n=1 dogfooding, whether the brief's central thesis (*"speech is physical, and a daily fusion-loop with Voice Journal as the success mechanism produces the felt experience of pronunciation improvement"*) holds for at least one user — namely, Priyank.

The implications of this framing:

1. **No external validation matters.** If Priyank reports "yes, my pronunciation improved" on Day 30, the MVP succeeded — even if no other human ever sees the app. Conversely, no external praise rescues a "no, I can't hear improvement" outcome.
2. **Build investment must be small** (one focused week, ~30–40 hours) because the validation signal is binary and personal — no need to over-invest in infrastructure that would only matter at scale.
3. **Polish is calibrated to "would I keep using this?", not "would others judge it well?"** No product-design polish, no marketing surface, no demo-readiness, no analytics dashboards.
4. **Every Tier 2/3 feature exists to either reinforce the success mechanism (F6) or test a corollary thesis (F7 = "physical drill matters", F9 = "visible streak matters", F10 = "offline always available matters").** Features with no thesis attached should not exist.

**Resource Requirements:**

- **Team size:** 1 (Priyank, solo).
- **Skills required:** TypeScript / React / Next.js (intermediate+), browser API familiarity (`MediaRecorder`, `SpeechSynthesis`, IndexedDB), comfort with Vercel AI SDK and Tailwind/shadcn — all already in Priyank's working set.
- **Calendar time:** 1 focused build week (5–7 working days); 2-week ceiling triggers scope cuts per MVP-Slip Hierarchy.
- **Wall-clock effort:** ~30–40 focused hours.
- **Inference budget for build-time experimentation:** <$5 of paid LLM credits during build (Gemini Flash free tier covers most experimentation; ~$1 for the Offline Pack generation if `--paid` flag is used).
- **Hosting cost:** $0 (local-only `next dev` is sufficient; Vercel free tier optional).
- **External dependencies:** Google AI Studio account for the default Gemini key (free tier signup, ~5 min); no other external accounts required.

### Complete Feature Set (Single Release)

The full feature list with descriptions and MVP-Slip Hierarchy lives in §Product Scope. This section consolidates the **must-have vs nice-to-have split** for clarity, restated against the single release.

#### Must-Have Capabilities (Cannot Ship Without)

These features must be in the released MVP. If any cannot be built within the build window, the MVP is delayed — *not* shipped without them.

| Feature | Why must-have |
|---|---|
| **F1 — Paragraph generator** (with provider abstraction, Gemini default) | Without paragraph generation, there is no daily content. The product literally does not function. |
| **F2 — Hard-words list** | Without hard words, there is no vocabulary acquisition. Half the product thesis (vocab side) collapses. |
| **F3 — Word Collection** | Without persistence, vocabulary acquisition is ephemeral. The recycle loop (F5) has nothing to recycle from. |
| **F4 — Browser TTS playback** | Without TTS, the user cannot hear correct pronunciation of unfamiliar words — pronunciation acquisition has no reference. |
| **F5 — Recycle 2–3 collection words** | Without recycling, the loop is open — yesterday's words have no path back into today's practice. The "personal collection drives tomorrow's content" mechanic is the engagement glue. |
| **F6 — Voice Journal** (with Day-14 non-dismissable comparison prompt) | This carries the entire success criterion. Without F6, the MVP cannot be evaluated as success or failure on Day 30. |

**Must-have count: 6 features.** This is the smallest viable Audiblytics that can be evaluated against the success thesis.

#### Nice-to-Have Capabilities (Ship If Time, Drop If Squeezed)

These features add value but their absence does not invalidate the MVP success evaluation. They drop in the order documented in §Product Scope MVP-Slip Hierarchy.

| Feature | Why nice-to-have |
|---|---|
| **F7 — Pen-drill warm-up** | Tests Innovation 3 ("speech is physical" thesis). Adds positioning depth and a third differentiator, but the core fusion (F1–F6) still validates Innovations 1, 2, 4, 5 without it. |
| **F8 — Daily Review (flashcards)** | Adds spaced-repetition vocabulary reinforcement, but Priyank can manually re-read older paragraphs to achieve similar effect. |
| **F9 — Calendar grid** | Visual habit anchor — useful, but a streak counter (computed from the same data) provides 80% of the value in a single line. |
| **F10 — Offline Paragraph Pack** | Resilience for offline use. Real but non-critical for an n=1 user with reliable home internet. |

**Nice-to-have count: 4 features.** Total feature count if all ship: 10 (matches the brief).

#### What Is Not in This Release (And Why)

These items appear in the brief or brainstorming and are explicitly excluded from this PRD:

- **Backend / FastAPI proxy** — deferred to Public-Future phase. The hard scope boundary (§Project Classification) prevents public deployment, so no backend is needed.
- **Whisper voice scoring / phoneme heatmap** — Voice Journal replaces this as the success mechanism. Phoneme scoring is a Public-Future Tier-1 V1.1 feature.
- **Phoneme Mechanics SVG cards** — 30+ hours of authoring time we don't have for n=1 build week.
- **Story Arcs / CYOA forks** — engineering depth not justified for n=1; great fit for Public-Future V1.1.
- **Audiblytics Wrapped (monthly/annual recap)** — needs months of accumulated data; impossible to validate in a 30-day MVP.
- **Reader Personas (full library beyond 4)** — 4 personas at launch is sufficient for n=1 variety; library expansion is Public-Future.
- **Streak Freeze, Smart Reflection, Persona Graduation** — user-protection features that assume scale; n=1 doesn't need them.
- **PWA install / service worker / smart pre-download** — explicitly opted out in §Web App-Specific Requirements.
- **Authentication, multi-user, sharing** — n=1, by definition.
- **Analytics, monitoring, error tracking** — Priyank IS the monitoring system.
- **Test framework** — Priyank's daily use is the integration test (per §Web App Implementation Considerations).

All of the above are *parked, not abandoned* — see brief's Public-Future roadmap if/when public scope re-opens.

### Risk Mitigation Strategy

Risks are consolidated from prior sections (Innovation, Web App Considerations) into a single strategic view, framed against the n=1 reality.

#### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Gemini structured-JSON response malformed/inconsistent** | Medium | High (breaks F1, the entire content engine) | Vercel AI SDK `generateObject` with Zod schema; strict validation on every response; up to 2 automatic retries on validation failure; surface error with retry/swap-provider/use-offline-pack actions |
| **MediaRecorder MIME type variance Safari vs Chrome** | High | Medium (breaks Voice Journal cross-browser) | Store actual MIME type with each recording; playback uses stored type, not assumed type. Safari users get `.mp4`, Chrome users get `.webm` — both work in their respective browsers' native players |
| **IndexedDB write failures (quota or permission)** | Low | High (loses recordings/words silently) | Wrap all writes in try/catch; surface error to user immediately; never fail silently. Priyank's daily use will catch any issue within 1 day |
| **`SpeechSynthesis` voice unavailable on first load** | High | Low (TTS appears broken briefly) | Listen for `voiceschanged` event; show "Loading voices…" state; refresh picker when voices arrive |
| **Microphone permission denied** | Low | Medium (blocks F6 entirely) | App remains functional for everything except F6; clear inline recovery instructions; [Try Again] button |
| **Build week slips past 2 weeks** | Medium | High (Personal Investment Success failure) | MVP-Slip Hierarchy in §Product Scope provides ordered scope cuts; dropping F10→F9→F8→F7 in that order preserves the success thesis |

#### Market / User Risks

There is no market for n=1. The "user risk" is reframed as **does the product actually work for Priyank**:

| Risk | Mitigation |
|---|---|
| **Daily use feels like work, not ritual** | 5-minute target time; no streak-shaming UI (per §J5); skippable Tier 2 features (F7, F8) within any session |
| **Day-14 comparison reveals no audible improvement** | Two diagnostics from §Innovation 2: word-level matching fallback in player; if mechanism still fails, this is product-validating feedback that informs post-MVP iteration |
| **Day-30 self-report is "no" but Priyank wants the product to succeed (cognitive bias)** | Self-report is binary and uncomfortable by design. The Voice Journal recordings are objective evidence — Priyank can replay them to a third party (friend, partner) for second-opinion check if his self-report feels uncertain |
| **Priyank loses interest after week 1** | Acceptable failure — the product needed to earn week 2. If it didn't, the loop is wrong, and that's important information. No artificial retention mechanics will be added to game this |

#### Resource Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| **Build week loses days to other commitments** | Medium | Single-developer flexibility; 2-week ceiling triggers MVP-Slip cuts; calendar-time for build is on Priyank, not the PRD |
| **Gemini free tier rate-limits during build experimentation** | Low | Throttle build-time test calls; use paid Gemini Flash (~$1 total) if needed |
| **Browser API availability in target browsers regresses** | Very low | All APIs used (`MediaRecorder`, `SpeechSynthesis`, IndexedDB) are stable for years; no edge-of-platform features |
| **Priyank's primary machine fails mid-build** | Very low | Code in git from Day 1; settings/data are personal-machine-local, but rebuilding the app from git after a machine change is straightforward |

#### Risk Posture Summary

The most likely risks are **technical (LLM JSON variance)** and **resource (build slips)**, both of which have explicit mitigations. The most consequential risks are **build week slipping past 2 weeks** and **Day-14 mechanism failing** — both addressed by §Product Scope MVP-Slip Hierarchy and §Innovation 2 fallback strategy respectively.

There are no compliance, regulatory, or legal risks (n=1 personal use, no PII, no users besides Priyank). There are no business risks (no business). There are no competitive risks (it's not for sale). This is the simplest risk profile a software project can have, and the PRD treats it accordingly.

## Functional Requirements

> **Capability contract.** The 55 FRs below define what Audiblytics can do. UX flows, architecture decisions, and implementation stories must trace back to one or more FRs. Anything not listed here will not exist in the shipped product unless added explicitly to this list. Capabilities explicitly *excluded* are documented in §Project Scoping "What Is Not in This Release."

### Onboarding & Settings

- **FR1:** User can select an LLM provider from {Google Gemini, OpenAI, Anthropic, OpenRouter, Ollama (local)}, with Google Gemini selected by default on first run.
- **FR2:** User can enter and save an LLM API key for the selected provider; the key is persisted across browser sessions.
- **FR3:** User can access a "Get a free key" deep-link from the onboarding screen that opens the chosen provider's signup page in a new tab.
- **FR4:** User can select default theme (from launch list: horror, comedy, adventure, mystery, sci-fi, slice-of-life) and default persona (from launch list: GRE Aspirant, Business English, Storyteller, Casual Conversationalist) and have the selections persist across sessions.
- **FR5:** User can adjust default paragraph length within a 100–200 word range (default 150) and have the selection persist.
- **FR6:** User can select the Voice Journal retention policy from {90-day rolling, indefinite}; the default is 90-day rolling.
- **FR7:** User can access and modify any setting after initial onboarding via a Settings screen reachable from the app's main navigation.
- **FR8:** User can select a TTS voice from those available in the browser, with the highest-quality English voice (per browser) selected by default.

### LLM Provider Integration

- **FR9:** User can switch the active LLM provider from Settings at any time; previously entered keys for other providers are preserved (not deleted on switch).
- **FR10:** System routes all LLM calls through a provider abstraction layer; no provider-specific code exists outside that layer.
- **FR11:** System parses provider-specific error responses (rate limit, quota exhausted, auth failure, network error, malformed response) and surfaces them as a unified user-facing error message.
- **FR12:** System automatically retries failed LLM calls up to 2 times before surfacing the error to the user.
- **FR13:** System produces structured JSON output for every paragraph generation request, validated against a fixed schema regardless of which provider is active.

### Paragraph Generation & Display

- **FR14:** User can generate a paragraph by triggering an explicit "Generate" action that uses the current theme, persona, and length settings; paragraph generation does not auto-trigger on app load.
- **FR15:** System generates paragraphs that include 2–3 words randomly selected from the user's collection (recycled words) and 2–3 new advanced words appropriate to the chosen persona's vocabulary band.
- **FR16:** System gracefully handles cold-start when the collection has 0 or 1 word by generating a paragraph containing only new advanced words; no error surfaces in this case.
- **FR17:** System validates the LLM response against a strict schema (paragraph string + hardWords array of {word, ipa, meaning, exampleSentence}) and silently drops any incomplete hard-word entries from rendering rather than rendering them partially.
- **FR18:** User can view today's paragraph rendered with the hard-words list displayed below it, each word showing its IPA, meaning, and example sentence.
- **FR19:** System makes today's paragraph available on app open without requiring re-generation, provided one was generated earlier in the same calendar day.
- **FR20:** User can change the active theme or persona at any time from Settings; the change takes effect on the *next* paragraph generation, not retroactively.
- **FR21:** System retains the most recently generated paragraph in IndexedDB at least until the next paragraph is generated, enabling re-display, re-recording, and re-saving of words.

### Audio Output (TTS)

- **FR22:** User can play any word from the hard-words list aloud via browser TTS by tapping the word.
- **FR23:** User can play the full paragraph aloud via browser TTS as a single action.
- **FR24:** System detects when browser TTS voices are not yet available (asynchronous voice loading on Chrome) and shows a "Loading voices…" state in the voice picker, refreshing automatically when voices arrive.
- **FR25:** System falls back to the system default English voice if the user's previously selected voice is no longer available.

### Word Collection

- **FR26:** User can save any word from the hard-words list to their personal collection by tapping a save action; the word is persisted immediately to IndexedDB with its IPA, meaning, example sentence, source paragraph reference, and save timestamp.
- **FR27:** User can view their full word collection in a dedicated screen, sorted by save recency by default.
- **FR28:** User can remove a word from their collection.
- **FR29:** System persists collection entries across browser restarts, page refreshes, and tab closes.

### Voice Journal

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

### Pen-Drill Warm-Up

- **FR43:** User can launch the Warm-Up flow from the today's-paragraph screen via a single action.
- **FR44:** System displays a static drill text from a bundled rotating library of at least 10 distinct phrases, along with a 30-second countdown timer for the with-pen pass. Drill text leans toward playful tongue-twisters and silly-but-saturated phonetic phrases (e.g., classics like *"red lorry, yellow lorry"*) rather than clinical or instructional copy — honoring the warm-up's silly-then-empowering experience arc described in Innovation #3.
- **FR45:** After the with-pen timer ends, system prompts the user to read the same text again without the pen.
- **FR46:** User can optionally record either or both Warm-Up passes via the same Voice Journal recording flow used for paragraphs.
- **FR47:** System does not score, rate, or assess Warm-Up passes; no quality feedback is rendered.

### Daily Review (Flashcards)

- **FR48:** User can launch a Daily Review session from the app's main navigation, separate from the today's-paragraph flow.
- **FR49:** System selects N words from the collection for review, prioritizing words with the oldest `lastReviewedAt` timestamp (and never-reviewed words first).
- **FR50:** User can flip a flashcard to reveal the meaning and example, then mark the word with one of three feedback options: Got it / Almost / Forgot.
- **FR51:** System updates the word's `reviewCount` and `lastReviewedAt` on each feedback action; the `difficultyRating` is updated based on cumulative feedback (no formal spaced-repetition algorithm in MVP).
- **FR52:** User can play any reviewed word aloud via browser TTS during the review.

### Calendar & Streak

- **FR53:** System marks a calendar day as "completed" when both (a) a paragraph has been generated *and* (b) either an "I read it" confirmation has been tapped *or* a Voice Journal recording has been saved for that day.
- **FR54:** User can mark today's session as complete by tapping an "I read it" action even without recording (alternative completion path for users who don't record on a given day).
- **FR55:** User can view a calendar showing completed days as green dots over a configurable window (30/60/90 days, default 30).
- **FR56:** User can tap any day in the calendar to view that day's session details (paragraph theme, paragraph excerpt, words saved, recordings made).
- **FR57:** System computes and displays the current streak as the count of consecutive completed days ending today; the streak resets cleanly on any gap day.
- **FR58:** System renders missed days as honest empty/grey cells; no shame-inducing visual treatment (no red, no warning icons), no modal dialogs about broken streaks, no "you missed a day" notifications.
- **FR59:** System distinguishes sessions that used the Offline Paragraph Pack from sessions that used a fresh LLM generation via a subtle visual badge on the calendar day cell.

### Offline Pack & Error Recovery

- **FR60:** A separate offline-pack generation script (outside the deployed app) produces a JSON file of approximately 1,000 pre-generated paragraphs covering all theme × persona combinations, throttled to stay within the chosen provider's free-tier rate limits.
- **FR61:** User can load the generated offline-pack JSON into IndexedDB via a "Download Pack" action in Settings.
- **FR62:** System falls back to the offline pack when an LLM generation fails (provider error, rate limit, network failure) or when the user explicitly chooses [Use Offline Pack] from an error surface.
- **FR63:** System de-duplicates offline-pack selections within a 30-day rolling window so the same paragraph is not shown twice in close succession.
- **FR64:** System provides three recovery actions on any LLM generation error: [Retry], [Open Settings], and [Use Offline Pack] (the last only enabled if the offline pack is loaded into IndexedDB).

## Non-Functional Requirements

> **Selective by design.** Categories that do not apply to the n=1 Personal MVP are explicitly excluded at the bottom of this section, not silently omitted. NFRs that overlap with §Web App-Specific Requirements (e.g., performance targets, browser matrix) are restated here as testable quality criteria with the underlying detail referenced rather than duplicated.

### Performance

- **NFR1 — Cold page load:** First byte to interactive in <2s on broadband. *Measured by:* opening `localhost:3000` (or deployed URL) cold; counting seconds until the [Generate] button is clickable. *Failure threshold:* >5s.
- **NFR2 — First-paragraph generation:** <15s end-to-end from [Generate] tap to fully rendered paragraph + hard-words list. Provider-dependent; Gemini Flash typical is ≤5s. *Failure threshold:* >30s. Mitigated by FR12 (auto-retry) and FR62 (offline-pack fallback).
- **NFR3 — Voice Journal recording start latency:** <300ms from [Record] tap to active recording, when microphone permission is already granted. *Failure threshold:* any user-perceptible lag.
- **NFR4 — TTS playback start:** Imperceptible (<100ms) on tap. Native `SpeechSynthesis` only; no library.
- **NFR5 — IndexedDB read (collection of ≤100 words):** <200ms from screen open to list rendered. *Failure threshold:* any visible loading delay.
- **NFR6 — Streak / calendar render:** <100ms. Reading from `localStorage`; trivial.
- **NFR7 — JS bundle size (gzipped):** <500KB. *Measured by:* `next build` output. No formal Lighthouse audit gate.

### Reliability

- **NFR8 — Voice Journal recording durability:** Every successful stop-recording action results in a persisted IndexedDB entry with complete metadata. **Zero silent recording loss is the bar.** Enforced by FR42 (immediate IndexedDB write-failure surfacing).
- **NFR9 — Word Collection durability:** Every save action persists immediately. Zero silent collection loss across browser restart, tab close, or page refresh. Enforced by FR29.
- **NFR10 — LLM-provider downtime tolerance:** When the active LLM provider is unreachable, the app remains fully functional for collection viewing, Daily Review (F8), Voice Journal playback, calendar viewing, and Settings. Only paragraph generation is blocked, and FR62 provides the offline-pack fallback.
- **NFR11 — Microphone-permission denial tolerance:** When microphone is denied or unavailable, all features *except* Voice Journal recording remain functional. Enforced by FR33.
- **NFR12 — Day-14 prompt firing reliability:** Fires exactly once on the user's 14th distinct day-of-use, and never before. Trigger evaluated on app open (FR37). *Failure modes:* missed fire (worse — invalidates leading-indicator success signal) or false fire (less bad but still a bug).
- **NFR13 — Streak computation correctness:** Streak count must equal the count of consecutive completed days ending today, with no off-by-one errors across timezone changes, daylight saving, or month boundaries.

### Security & Privacy

- **NFR14 — API-key storage:** LLM API keys are stored in `localStorage` only. Acceptable for n=1 personal use (per §Project Classification Hard Scope Boundary). Public deployment is forbidden until a backend proxy is introduced.
- **NFR15 — HTTPS for non-localhost deployments:** Voice Journal recording requires HTTPS to access `getUserMedia`. Vercel deployments inherit HTTPS automatically. `localhost` development is exempt (browsers permit `getUserMedia` on `localhost` over HTTP).
- **NFR16 — No third-party tracking:** No analytics, no telemetry, no error reporting services (Sentry, PostHog, GA, etc.). The app makes no outbound network requests except to (a) the user-configured LLM provider, (b) the user-clicked "Get a free key" deep-link target, and (c) static asset fetches for the app itself.
- **NFR17 — No data exfiltration paths:** No "share", no "export to cloud", no third-party storage integration in MVP. Recordings, words, settings, and calendar all stay local. (Future-Public would change this; current MVP does not.)
- **NFR18 — Microphone access scope:** Microphone permission is requested only on first record-button tap (FR32), never on app load and never proactively. The app does not record audio without an explicit per-take user action.
- **NFR19 — Voice Journal data ownership:** All recordings remain in the user's browser. The user can export recordings manually via browser DevTools (IndexedDB export) if desired; no in-app export is provided in MVP.

### Usability

- **NFR20 — Daily session time target:** A complete daily session (open → today's paragraph appears → read aloud → record → save 1–2 words → close) completes in ≤5 minutes for an experienced user. *Validated by:* Priyank's informal time-tracking during dogfooding, not formal test.
- **NFR21 — Onboarding completion time:** First-time setup (per §J1) completes in ≤3 minutes. Includes provider selection, "Get a free key" round-trip, key entry, theme/persona/length defaults, and first paragraph generation.
- **NFR22 — No shame-inducing UI:** Missed days, broken streaks, low Daily Review feedback ("Forgot" repeatedly), and offline-fallback indicators never produce alarmist, red, or judgmental visual treatments. No modals about broken streaks. No "you missed a day" notifications. Enforced by FR58.
- **NFR23 — Single-action primary tasks:** The most-frequent actions (generate paragraph, start recording, stop recording, save word, mark "I read it") each require exactly one tap from the today's-paragraph screen — no confirmation modals, no multi-step flows.
- **NFR24 — Forced-friction tolerance:** The Day-14 non-dismissable prompt (FR37) blocks the user for ≤60s. No other forced-friction surfaces exist in MVP.

### Maintainability

- **NFR25 — Code legibility for return-after-6-months:** The codebase must be navigable by Priyank 6 months later without re-deriving design decisions. *Mitigated by:* this PRD as design source-of-truth; brief + distillate as preserved context; code organized by capability area (mirroring §Functional Requirements groupings); no exotic patterns; no global state library.
- **NFR26 — Dependency parsimony:** Only dependencies that earn their weight ship. Required set: Next.js, React, Tailwind, shadcn primitives, Vercel AI SDK + provider packages (`@ai-sdk/google` + alternates), Dexie.js, Zod (schema validation). **Excluded:** state-management libraries (Redux, Zustand, etc.), UI component frameworks beyond shadcn, testing framework.
- **NFR27 — Provider-swap reversibility:** Swapping LLM providers requires zero code changes — only Settings interaction (per FR9, FR10).
- **NFR28 — File-organization clarity:** Source code is organized by capability area (one folder per §Functional Requirements grouping where reasonable), not by technical layer (no `components/`, `services/`, `utils/` mega-folders). Capability-area code colocation reduces context-switching cost for return-visits.

### Categories Explicitly Excluded from NFRs

The following NFR categories were considered and consciously **not** documented because they do not apply to the n=1 Personal MVP scope. Listed for transparency so future readers (Priyank-in-6-months, or anyone reading this if scope re-opens) understand what was deliberately omitted:

- **Scalability** — single user, single device, single tab; no concurrency to scale.
- **Multi-tenancy** — exactly one tenant exists.
- **Internationalization / Localization** — English-only interface and target language; no localization plan.
- **Disaster recovery** — local-only data; user is responsible for their own backups (browser sync, manual IndexedDB export, etc.). No formal DR plan, no RPO/RTO targets.
- **Compliance** — no regulatory obligations (no GDPR / COPPA / FERPA / HIPAA / PCI / SOX surface for n=1 personal use).
- **Audit logging** — no audit trail beyond the user-facing calendar (which is UX, not audit).
- **Service-level objectives (SLOs)** — no users to commit SLOs to.
- **Multi-device sync** — n=1 user on one primary machine; if Priyank wants to use a second device, he sets it up fresh (separate state).
- **Backup / restore** — user owns their data and can manage IndexedDB export themselves if desired.
- **Capacity planning** — no capacity to plan.
- **Penetration testing / formal security audit** — not warranted at n=1 with no PII and no external-facing surface beyond a personal `localhost` or private Vercel deployment.

**If Audiblytics ever transitions to Public-Future scope, every excluded category above becomes a required NFR category.** See brief's Public-Future roadmap; this PRD does not encode public-scope NFRs.

## Open Decisions

The following questions remain explicitly *undecided* and were left open during PRD authoring. Each is referenced from at least one FR or Journey above. A decision is required *before or during* the build week — none of these block the start of implementation, but each must be resolved before the affected feature ships. Defaults are listed where a sensible "ship-it-this-way-unless-objection" choice exists.

- **Q1 — Day-14 prompt re-trigger interval.** After the Day-14 forced comparison fires (FR37), when does the next forced comparison surface fire? *Candidates:* Day 30, Day 60, never (Day-14 is one-shot). *Default if undecided:* **Day 60** — gives enough time for newly-recognized progress to compound, avoids fatiguing the forced-friction pattern. *Referenced by:* FR40, §Journey 3, §Innovation #5.
- **Q2 — Recycled-words visual indicator in today's paragraph.** When the LLM weaves a previously-collected word into today's paragraph (FR15), should the UI subtly highlight it (e.g., faint underline) so Priyank notices the recurrence? *Candidates:* subtle underline on hover, no indicator at all (pure ambient surfacing), small badge on word click. *Default if undecided:* **no indicator** — preserves the ambient-discovery feel; the joy is in noticing it himself, not being told. *Referenced by:* §Product Scope MVP-Slip Hierarchy notes, §Journey 2.
- **Q3 — Daily Review batch size N.** How many words does the Daily Review (F8) surface per session? *Candidates:* 5, 7, 10, "all due today" with a soft cap. *Default if undecided:* **7** — matches working-memory norms, completes in ≤2 minutes, doesn't pad an already-tight 5-minute daily session. *Referenced by:* FR49, §Journey 2.
- **Q4 — Today's paragraph delivery model.** Is today's paragraph generated *on app open* (cold-start latency cost ≈3–6s) or *cached overnight on previous tab close* (zero-latency open, but a second LLM call per day)? *Candidates:* generate-on-open (default), pre-generate-on-close, pre-generate-via-scheduled-event (rejected — requires a backend or service worker complexity not warranted). *Default if undecided:* **generate-on-open** — simpler, predictable cost (1 call/day), matches the "open the tab and breathe" intent of §Journey 2. *Referenced by:* §Journey 2, NFR1.

These four open questions are not blockers; they are deferrable design choices best resolved by Priyank-the-builder during implementation, ideally with at least 2–3 days of personal usage data informing each call. If any default is adopted by inertia (i.e., the question is never explicitly answered and the default ships), that is acceptable — the defaults above are defensible MVP choices.

If new open questions arise during implementation, append them here (Q5, Q6, …) with the same shape — *Question, Candidates, Default, Referenced by* — to keep the PRD's design-decision provenance intact.
