---
title: "Product Brief Distillate: Audiblytics"
type: llm-distillate
source: "product-brief-Audiblytics.md"
created: "2026-05-01T14:09:00"
purpose: "Token-efficient context for downstream PRD creation, architecture design, or coding-agent handoff"
related:
  - "_bmad-output/planning-artifacts/product-brief-Audiblytics.md"
  - "_bmad-output/brainstorming/audiblytics-detailed-description-2026-05-01.md"
  - "_bmad-output/brainstorming/brainstorming-session-2026-05-01-1215.md"
---

# Audiblytics — LLM Distillate

This file is the dense detail companion to the executive brief. Read alongside the brief, not instead of it. Optimized for downstream PRD/architecture workflows or coding agents — every bullet is standalone and carries enough WHY to be actionable.

---

## 1. Product Identity & Thesis

- **Name:** Audiblytics — audio + analytics; user agreed to keep this name.
- **One-line:** Daily-ritual webapp that teaches users to *speak* (physically + verbally) via themed paragraph generation, advanced-vocabulary collection, and physical articulation drills.
- **Thesis:** *"Speech is physical."* Speech is a physical skill — like an athletic skill — that requires warming up, practicing on real content, and measuring progress. This is the differentiator no competitor takes seriously.
- **Project type:** Hybrid — Personal MVP (1-week solo build) + parked Public Future roadmap.
- **Author:** Priyank Patel; building first for personal use, may go public later.

---

## 2. Target Users

- **Personal MVP user (n=1):** Priyank — adult English-speaking developer with existing LLM API key; goal is improving own pronunciation + advanced vocabulary; values minimal apps that respect his time and don't waste compute.
- **Future public primary:** Non-native English speakers preparing for IELTS/TOEFL/GRE, business communication, interviews, public speaking.
- **Future public secondary:** Native speakers polishing diction (podcasters, presenters, broadcasters, actors); self-directed learners frustrated with one-trick apps.
- **Aha moment for both:** Week-2 Voice Journal replay — hearing past-self struggle with words you now read cleanly. More visceral than any score.

---

## 3. Core Daily Loop (Personal MVP, ~5 min/day)

1. Open app → today's themed paragraph ready.
2. (Optional) 30-second pen-drill warm-up.
3. Read paragraph aloud (120–180 words; theme + persona; 2–3 recycled collection words + 2–3 new advanced ones).
4. Save advanced words to collection (each carries IPA + meaning + example).
5. Voice Journal — record self, replay alongside browser TTS; comparable across weeks.
6. Daily flashcard review of collection.
7. Calendar updates green dot (definition: "completed session" = paragraph generated AND read aloud, signaled by tap-confirm or Voice Journal entry).

---

## 4. Personal MVP — Feature Tiers (10 features, build-priority order)

### Tier 1 — Smallest Viable Loop (Days 1–3, mandatory)

- **F1 — Paragraph generator:** UI to pick theme + persona; hits user's chosen LLM directly from browser via Vercel AI SDK; expects structured JSON: `{paragraph: string, hardWords: [{word, ipa, meaning, exampleSentence}]}`. Single LLM call returns both.
- **F2 — Hard-words list:** Renders below paragraph. Each word: IPA, meaning, example. Tap-to-pronounce via TTS.
- **F3 — Word Collection:** Tap-to-save per hard word. Persisted in IndexedDB (Dexie). Schema suggestion: `{id, word, ipa, meaning, example, savedAt, sourceParagraphId, reviewCount, lastReviewedAt, difficultyRating}`.
- **F4 — Browser TTS playback:** `SpeechSynthesis` API. Configurable voice (defaults to English US/UK). Plays paragraph fully, individual words, or selected text.
- **F5 — Recycle 2–3 collection words:** Prompt template injects 2–3 random words from collection into next paragraph. **Cold-start edge case:** if collection has 0 or 1 word, skip recycling (paragraph contains only new advanced words). Deterministic but uniform-random selection from collection (not weighted by mastery in v1).

### Tier 2 — Differentiating Ritual (Days 4–5)

- **F6 — Voice Journal:** `MediaRecorder` API → blob saved to IndexedDB with `{id, recordingDate, paragraphId, durationMs, audioBlob}`. Side-by-side replay UI lets user hear today's recording vs. TTS, OR vs. earliest recording. **Day-14 prompt:** non-dismissable banner takes over home until user completes a 60-second comparison (per user's tentative agreement to friction-on-purpose). This feature carries the success criterion entirely.
- **F7 — Pen-drill warm-up:** Static text + 30-second timer + UI prompt: "now without pen, read again." No scoring. Optional Voice Journal record on each pass — shows two recordings side-by-side. Drill text rotates through ~15 short tongue-twisters/phrases shipped with the app.
- **F8 — Daily Review:** Flip-card flashcard UI over collection. Three buttons: "Got it" / "Almost" / "Forgot." Updates word's `reviewCount` + `difficultyRating`. No SRS algorithm in v1 — just picks N words with oldest `lastReviewedAt`.

### Tier 3 — Habit & Variety (Days 6–7, drop first if time slips)

- **F9 — Calendar grid:** 30-day strip on home screen (or 30/60/90 toggle). Green dot per completed session. Tap a day → see what was done that day (paragraph theme, words saved). Backed by localStorage day-array.
- **F10 — Offline Paragraph Pack:** "Download Pack" button in settings. Runs a one-shot batch script (or pre-bundled JSON) to fetch ~1,000 pre-generated paragraphs. JSON file stored in IndexedDB; offline mode picks from this when LLM unreachable. **Generation script is separate from app** — Priyank runs it once with his LLM key and gets a JSON file (~1.5MB for 1k paragraphs).

---

## 5. Tech Stack & Architectural Decisions

### Personal MVP (Week 1)

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui.
- **Why Next.js over SvelteKit/Vue/Astro:** ecosystem depth, future PWA-readiness, easy migration to monorepo, Vercel one-click deploy, hireability if going public, App Router is current standard.
- **Why shadcn/ui:** copy-paste accessible components, no ceremony, no runtime deps to manage.
- **State / Storage:**
  - `localStorage`: user settings, LLM API key, calendar dot array, persona/theme defaults
  - `IndexedDB` via Dexie.js: word collection, voice recordings, paragraph cache, offline pack
- **Why Dexie:** type-safe wrapper over IndexedDB; live queries; lightweight (~30KB).
- **LLM SDK:** Vercel AI SDK (`ai` package) — single API across OpenAI, Anthropic, Google. User picks provider in settings; key stored in localStorage; calls go browser → provider directly.
- **Browser APIs:** `SpeechSynthesis` (TTS), `MediaRecorder` (voice journal). Both work fully offline on iOS/macOS/most modern Android.
- **Backend:** None at v1. Fully client-side.
- **Deployment:** Vercel free tier (or local-only `next dev` for purest personal use — Vercel adds nothing for n=1).

### Public Future (When Going Public)

- **Backend added:** FastAPI (Python) — for Whisper voice-scoring proxy, free-tier hosted LLM, authentication (Auth.js or Supabase Auth), persistent multi-device storage (Postgres or Supabase).
- **LLM API key handling MUST change:** API key proxying through backend mandatory before any public deployment (security gate). User-supplied keys handled server-side only; platform-key fallback for free tier.
- **Voice scoring:** Whisper API (~$0.006/min); 30s/day/user ≈ $0.10/user/month. Alternatives: Azure Speech (better phonemes, more expensive), Deepgram.
- **Storage tiering:** localStorage/IndexedDB for hot client cache, Postgres for canonical multi-device store.

---

## 6. Hidden Requirements / Critical Implementation Details

- **Dictionary verification of LLM-generated meanings (Public Future, recommended even for personal):** cross-check LLM word meanings against Wiktionary or Free Dictionary API before display. LLMs hallucinate definitions. A wrong meaning is worse than no meaning. Trust > speed.
- **Story-state JSON (parked for V1.1+):** for Story Arcs, persist a `{arcId, theme, persona, dayNumber, prevChapterSummary, charactersIntroduced, plotPointsResolved, recycledWords[]}` object; inject as context in each daily prompt to maintain Day 1 → Day 7 continuity.
- **Generous voice-scoring tone (Public Future):** heatmap framing must be "areas to revisit," not "wrong." Score explanations: "*came out softer*" / "*a touch imprecise*" — NEVER "wrong" / "failed." Critical for non-native users; calibrate copy carefully.
- **Cold-start collection edge case (MVP):** when collection has 0 or 1 word, paragraph contains only new advanced words; recycle logic skips gracefully.
- **API-key security gate (between MVP and Public):** browser-stored API key acceptable for personal single-user use only. Public deployment requires backend proxy. Documented in brief.
- **PWA cache layer (V1.1):** required for full offline word review (#50), smart pre-download (#56), and offline phoneme cards (#59). Service worker + IndexedDB + cache strategy.
- **Voice Journal storage budget:** ~500KB per 30s recording × 30 days = ~15MB. Within IndexedDB safe budget. Suggest 90-day rolling window default; user-configurable.
- **Phoneme Mechanics Cards (V1.1):** SVG-only (5–10KB each), lazy-loaded, ~25–30 phonemes max for non-native English speakers (priority: /θ/, /ð/, /r/, /v/-/w/, /l/-/r/, vowel pairs). Source: custom SVG authoring (~30 hours speech-pathology consulting) OR CC-licensed existing diagrams. Total bundle ≤ 250KB.

---

## 7. Rejected / Parked Ideas (with rationale — DO NOT re-propose without re-discussion)

### Rejected at brainstorming filter (Waves 1–4)

- **Mouth-Mechanics Coach video** (#2): rejected — heavy media; SVG-based phoneme cards (#59) chosen instead for lightweight goal.
- **"Pronunciation Twin" accent goal** (#7): rejected — too narrow a use case for v1; great V2 candidate.
- **Word Collection as Living Garden** (#8): rejected — cute but doesn't actually drive learning; calendar (#19) does the same job.
- **Multi-LLM Word Battle** (#9): rejected — adds friction at the moment user wants to read; cute but distracting.
- **Audiblytics Speaks Back / TTS-first** (#10): partially adopted (TTS is in MVP) but the "app reads first" framing rejected — user wants control of reading order.
- **Conversation Mode** (#11): demoted to V2 — engineering-heavy (real-time STT+LLM+TTS pipeline), too risky for MVP.
- **Cross-Pollination concepts** (#13–24): mostly rejected for MVP — Streak Freeze (#13) absorbed into MVP; GitHub-graph calendar (#19) absorbed; Wrapped (#18) parked V1.1; others (Strava, Pokemon, Notion, Co-Star) too gimmicky for thesis.
- **Articulation Gym** (#26): rejected — overengineered drill library; pen-drill (#25) alone is enough for thesis demonstration.
- **Voice Health Check** (#28): rejected — interesting but not core; potential V2 wellness extension.
- **Boss-Battle Words** (#29): absorbed into Recovery Quest (#3) for V1.1; standalone naming/UI rejected.
- **Genre Crossover Weeks** (#31): rejected — adds prompting complexity for marginal value.
- **Persona-Targeted Word Banks** (#32) + **Persona Challenge** (#33): rejected for personal MVP — premature; revisit when going public.
- **Cold Call Surprise Conversation** (#34): rejected — anxiety-inducing, opt-in feature for V2+.
- **Sentence Battle League** (#35): rejected — social feature, out of scope.
- **Mid-Month Surprise Card** (#37): absorbed into Audiblytics Wrapped (#18) for V1.1.
- **Free + Pro tiers** (#39): out of scope until going public.
- **Educator/Coach Mode** (#40): out of scope (B2B).
- **Audiblytics Junior** (#41): out of scope (kids).
- **Inclusive a11y deep work** (#42): in-spirit only at MVP; full effort at public phase.
- **WebLLM offline LLM** (#53): rejected for V1; V2+ ambition.
- **Reading Circles** (#45): rejected — social feature, out of scope.

### Parked V1.1 (revisit when going public)

- Mispronunciation Recovery Quest (#3), Story Arcs (#4), CYOA forks (#30), Reader Personas (#5), Conversation Mode → V2 (#11), Sentence Smithy text (#12), Audiblytics Wrapped (#18), Score Explanation, Streak Freeze, Persona Graduation, Smart Pre-Download (#56), Offline Word Collection Review (#50), Curated Library Fallback (#48), Phoneme Mechanics Card (#59), Onboarding Paragraph diagnostic, "What Works Offline" indicator (#55), full Smart Calendar Reflection (#38).

### Parked V2+

- Conversation Mode (#11), Sentence Smithy voice version (#12 voice), full WebLLM offline LLM (#53), Pronunciation Twin (#7), Articulation Gym (#26), Voice Health Check (#28), Cold Call (#34).

### Out of Scope (probably forever, or separate product)

- Junior / Family mode, B2B / Educator dashboards, Social features (reading circles, sentence battle league), Native mobile apps (PWA covers it), Multi-language target (non-English target language teaching).

---

## 8. Competitive Intelligence (May 2026)

### Pronunciation-only apps (NOT direct competitors — gap leaves vocab unaddressed)

- **ELSA Speak** — market leader; AI pronunciation scoring, accent training; subscription; no vocabulary or LLM content.
- **Speakometer** — 1M+ users; AI accent training (UK/US); 65k word library; minimal pairs; subscription; no LLM/vocab building.
- **Lingova** — 500k+ users; conversational AI tutor; pronunciation + grammar + vocab scores; closest to "AI tutor" positioning; subscription.
- **Accent AI** — pronunciation coach; tracks filler words ("um/uh") + tempo; novel metrics; subscription.
- **BoldVoice** — premium accent-reduction; expert coaches embedded; subscription.

### Vocabulary-text generators (NOT direct competitors — no speech angle)

- **paragraphlearning.com** — closest concept-match; AI paragraph generation in 20+ languages, keyword extraction with example sentences, save-for-review. **No voice. No themes (in pronunciation/persona sense). No daily ritual. $14.99/mo Pro tier.**
- **Musely** — vocab-based text generator; positioned as educator tool; one-shot text creation, not daily app.
- **Logicballs** — similar to Musely; "verification-first" anti-hallucination angle.

### Open-source vocabulary builders

- **piglei/ai-vocabulary-builder (GitHub)** — Python CLI + notebook; one-click vocab saving from text; OpenAI/Gemini/Anthropic backends; story+quiz modes for memorization. **No pronunciation. No daily ritual. No paragraph generation theme/persona.**

### Verdict

- **Pronunciation + vocabulary fusion in a daily ritual with physical drills:** does NOT exist. Audiblytics' moat is real.
- **BYO-LLM as architecture:** zero competitors do this. Strong differentiation.
- **paragraphlearning.com validates demand exists for paragraph-gen + word-extraction;** their $14.99/mo pricing and monolingual story is the price-point benchmark for the public-future commercial model.

---

## 9. Public-Future Roadmap (Parked, summary)

### V1.1 (fast-follow after MVP, when going public)

- CYOA forks for Story Arcs (#30)
- Sentence Smithy text version (#12)
- Mispronunciation Recovery Quest with spaced repetition (#3)
- Audiblytics Wrapped — monthly first, annual later (#18)
- Smart Pre-Download (learns user's practice times) (#56)
- Offline Word Collection Review (#50)
- Full Smart Calendar Reflection (#38)
- Persona Graduation prompts (after 60 days hitting persona goals)
- Phoneme Mechanics Cards expanded to ~30 (V1)
- Full PWA cache (service worker + offline shell)

### V2 (ambitious add-ons)

- Conversation Mode (LLM voice agent interview using collection words) (#11)
- Sentence Smithy voice version (#12 voice)
- Full offline LLM (WebLLM / Llama-3-3B / Phi-3 in browser)

### V2+ / Future expansion paths

- Pronunciation Twin (custom voice goal upload) (#7)
- Articulation Gym (drill library) (#26)
- Voice Health Check (acoustic strain detection) (#28)
- Cold Call surprise mode (#34)

---

## 10. Open Build-Time Questions (with recommended defaults)

1. **Theme launch lineup (6 themes):** horror, comedy, adventure, mystery, sci-fi, slice-of-life. *Recommend: ship all 6.*
2. **Persona launch lineup (4 personas):** GRE Aspirant, Business English, Storyteller, Casual Conversationalist. *Recommend: ship all 4 for personal MVP; revisit lineup when public.*
3. **Default LLM provider:** GPT-4o-mini for cost; Claude 3.5 Haiku as alternative. *Recommend: GPT-4o-mini default; user-changeable.*
4. **Voice Journal retention policy:** indefinite vs 90-day rolling. *Recommend: 90-day rolling default with user-toggleable indefinite mode (advanced settings).*
5. **Paragraph length:** 120 / 150 / 180 words. *Recommend: 150 words for v1; user-adjustable in settings (slider 100–200).*
6. **Offline Paragraph Pack initial size:** 500 / 1,000 / 2,000. *Recommend: 1,000 paragraphs (~$1–2 to generate; ~1.5MB file).*
7. **Browser support:** Chrome-first vs all modern browsers. *Recommend: Chrome + Safari at MVP (covers 90% of personal-use cases); test Firefox lightly.*

---

## 11. Persona Tuning Hints (for prompt template author)

For each persona, the LLM prompt should specify:

- **GRE Aspirant:** Vocabulary band — GRE Tier 4–5 (advanced); register — academic; sentence length — long, complex; example word bank: *vexatious, esoteric, perfunctory, sycophant, vehement, ostentatious.*
- **Business English:** Vocabulary band — boardroom/professional; register — formal-but-warm; sentence length — moderate; example word bank: *leverage, cadence, alignment, mitigate, articulate, navigate.*
- **Storyteller:** Vocabulary band — literary/narrative; register — vivid descriptive; sentence length — varied; example word bank: *crepuscular, susurration, melancholy, vehement, halcyon, brood.*
- **Casual Conversationalist:** Vocabulary band — upper-conversational; register — natural everyday-with-uplift; sentence length — short to medium; example word bank: *quirky, knack, cringe, vibe, mellow, dork.*

---

## 12. Theme Tuning Hints (for prompt template author)

- **Horror:** atmosphere — eerie, slow tension; verbs of lurking, looming; advanced words biased to gothic/uncanny.
- **Comedy:** rhythm — punch lines; absurdity; advanced words biased to wordplay-friendly territory.
- **Adventure:** pace — kinetic; verbs of motion, discovery; advanced words biased to terrain/peril vocabulary.
- **Mystery:** structure — partial information; investigative language; advanced words biased to legal/clue-related.
- **Sci-fi:** texture — speculative tech, novel concepts; advanced words biased to scientific/futurist Latin/Greek roots.
- **Slice-of-life:** mood — observational, mundane elevated; advanced words biased to emotional precision (*ennui, reverie, wistful*).

---

## 13. Success Metrics (consolidated)

### Personal MVP (the only metric that matters)

- **"After 30 days of daily use, I felt my pronunciation actually improved."** Self-reported, qualitative. Mechanism: Voice Journal week-2+ comparison.

### Soft secondary signals

- Daily-use streak length, words saved to collection, voice journal recording count.

### Public Future (parked targets)

- DAU rate ≥ 40%
- Paragraph completion ≥ 70%
- Voice score trend rising over first 30 days
- Median streak length growing month-over-month
- Warm-up adoption rate (the differentiator metric)

---

## 14. Tagline Candidates

- *"Audiblytics — read it. Say it. Mean it."* (recommended for personal MVP)
- *"Vocabulary with a voice."*
- *"Your daily 3-minute voice gym."*
- *"Daily speech, daily progress."*
- *"The pronunciation app that respects your time."*

---

## 15. Document Lineage

- **Brainstorming:** `_bmad-output/brainstorming/brainstorming-session-2026-05-01-1215.md` — 59 raw ideas across 4 waves; locked 16 commercial-MVP features; thesis "speech is physical" emerged organically.
- **Detailed product description:** `_bmad-output/brainstorming/audiblytics-detailed-description-2026-05-01.md` — full public-product roadmap (use as future-public reference).
- **Product brief (executive):** `_bmad-output/planning-artifacts/product-brief-Audiblytics.md` — 2-page hybrid brief.
- **This distillate:** companion to brief — dense detail for downstream PRD/architecture/coding-agent consumption.

### Recommended next-step skills

- `bmad-create-prd` — full PRD for Personal MVP (input: brief + this distillate).
- `bmad-create-architecture` — technical architecture (Next.js + Dexie + AI SDK; input: brief + distillate).
- `bmad-create-ux-design` — UX flows + wireframes (input: detailed product description + brief).
- `bmad-prfaq` — stress-test the public-future concept before committing to it.

### When the personal MVP is built and dogfooded

- After 30 days of personal use, decide: take public, or stay personal?
- If taking public, this distillate already encodes the V1.1 / V2 / scope-out roadmap — no re-discovery needed.
- Founder narrative ("I built it, I used it, here's me at day 1 vs. day 60") becomes a powerful demo asset — preserve all Voice Journal recordings.
