---
title: "Product Brief: Audiblytics"
status: "complete"
created: "2026-05-01T13:53:21"
updated: "2026-05-01T14:05:00"
type: "hybrid"
horizon: "Personal MVP (1 week) + Public Future (open-ended)"
inputs:
  - "_bmad-output/brainstorming/brainstorming-session-2026-05-01-1215.md"
  - "_bmad-output/brainstorming/audiblytics-detailed-description-2026-05-01.md"
  - "Web research: ELSA Speak, Speakometer, Lingova, Accent AI, paragraphlearning.com, ai-vocabulary-builder (2026-05)"
---

# Product Brief: Audiblytics

> A daily-ritual webapp that teaches you to *speak* — physically and verbally — through themed paragraph generation, advanced-vocabulary collection, and physical articulation drills.

**Tagline candidates:** *"Read it. Say it. Mean it." · "Vocabulary with a voice." · "Your daily 3-minute voice gym."*

This is a **hybrid brief** — the immediate horizon is a 1-week personal-use build for the author, with a parked roadmap for taking it public when (and if) that becomes the goal.

---

## Executive Summary

Most language-learning apps treat speech as text-with-audio. They build vocabulary in isolation (Anki), drill pronunciation in isolation (ELSA, Speakometer), or gamify grammar without ever asking the learner to physically open their mouth and produce sound (Duolingo). This split is a genuine pedagogical gap — *speaking* is a physical skill that requires daily practice on real content with measurable feedback.

**Audiblytics** closes that gap with one elegant daily loop: read a freshly generated themed paragraph aloud (your chosen LLM, your chosen genre, seeded with advanced + recycled vocabulary), see hard words surfaced with phonetics and meaning, save them to your collection, and warm up your articulation with a physical drill (pen between teeth) before you read. The thesis is simple: **speech is physical**, and Audiblytics is the only app that takes that seriously inside a vocabulary-building loop.

The first user is the author — building Audiblytics for personal use over one focused build week, using a minimal client-side stack designed to scale into a real product later. The mechanism that produces felt progress without expensive voice scoring is the **Voice Journal**: every read-aloud is recorded and dated; on day 14, the app prompts a side-by-side replay of week-1 vs. today. Hearing your past self struggle with a word you now read cleanly is the *aha moment* of the entire product. If daily use produces the felt experience of *"my pronunciation actually improved,"* the personal MVP has succeeded — and the parked detailed product description (written 2026-05-01) becomes a credible roadmap to a public launch.

---

## The Problem

The author wants to push his English vocabulary into advanced territory and tighten his pronunciation — for high-stakes speaking situations like presentations, interviews, and professional conversation. Existing tools fail him in specific ways:

- **Vocabulary apps** (Anki, Memrise, paragraphlearning.com) build word lists but never ask you to *speak* them. Words die in passive recognition.
- **Pronunciation apps** (ELSA, Speakometer, BoldVoice) score your accent but operate on canned content unrelated to the words you actually want to learn.
- **LLM chats** (ChatGPT, Claude) can generate paragraphs and explain words on demand — but there's no daily ritual, no collection, no recycling, no physical drill, no calendar. It's a tool, not a practice.

The cost of this fragmentation is **fragmented daily practice and slow perceived progress.** The author opens three apps to do what should be one. None of them *visibly* improve his speech over time.

A second-order problem: most of these apps are subscription products that own the AI inference cost. For someone who already pays for an LLM API, that cost layer is redundant — yet no app respects this and lets the user bring their own key.

---

## The Solution

Audiblytics is a single-page webapp that runs the daily speaking-practice loop end-to-end:

1. **Open the app** — today's themed paragraph is ready (cached or freshly generated).
2. **(Optional) 30-second pen-drill warm-up** — hold a pen between your teeth, read a short text, then read again without it. Articulators awakened.
3. **Read today's paragraph aloud** — 120–180 words, themed (horror / comedy / adventure / etc.), seeded with 2–3 of yesterday's saved words and 2–3 new advanced ones.
4. **Save advanced words to your collection** — each comes with phonetics, meaning, and an example sentence.
5. **Voice journal** — record yourself reading; play back alongside browser TTS; compare today's recording to last week's. The improvement is *felt*, not just measured.
6. **Daily review** — flashcard pass over the collection with audio playback and three-button feedback.
7. **Calendar** — green dots for completed days. Visible streak.

For the public future, this loop is enriched with voice scoring (Whisper/Azure), phoneme mechanics diagrams, persona-tuned word banks, story arcs, and offline trust layers — all designed but parked. See *Where This Could Go* below and the [detailed product description](../brainstorming/audiblytics-detailed-description-2026-05-01.md) for the full roadmap.

---

## What Makes This Different

Three differentiators carry the product, in increasing order of defensibility:

1. **The fusion of pronunciation + vocabulary in one daily loop.** Adjacent products do one or the other. The combination is what produces speakers, not just readers or listers. *(Validated by competitive scan — no direct full-stack competitor exists.)*
2. **The physical-articulation thesis.** Pen drills, phoneme mechanics cards, before/after audio comparison — Audiblytics treats the mouth as the instrument. Other apps treat speech as data. This is a positioning moat that copy can't easily steal.
3. **BYO-LLM as a first-class architecture.** Users bring their own API key; Audiblytics never owns inference cost. This collapses the operating cost of the product and gives power users full control over model choice. *No competing app in this space does this.*

The competitive scan (May 2026) confirmed: AI pronunciation apps exist (Speakometer, Lingova, Accent AI, ELSA — collectively millions of users), AI vocabulary text generators exist (paragraphlearning.com, Musely, Logicballs), open-source AI vocabulary builders exist (piglei/ai-vocabulary-builder). **None fuse the halves into a daily speaking practice with physical drills.**

---

## Who This Serves

### Primary user (Personal MVP)
**The author** — a self-directed adult English-speaking developer with an existing LLM API key, who wants to push his vocabulary into advanced territory and tighten pronunciation through 5 minutes of daily practice. He values minimal apps that respect his time and don't waste compute.

### Future users (Public Launch)
- **Non-native English speakers preparing for high-stakes situations** — IELTS/TOEFL/GRE, business communication, job interviews, public speaking.
- **Native speakers polishing diction and vocabulary** — podcasters, presenters, broadcasters, actors, anyone who speaks for a living.
- **Self-directed learners frustrated with one-trick apps** who want vocabulary, pronunciation, and physical practice in one place.

The "aha moment" — for both the author and future users — is the **week-2 voice journal replay**. Hearing your past self struggle with a word you now read cleanly is a more visceral progress signal than any score.

---

## Success Criteria

### Personal MVP (the only metric that matters)
> **"After 30 days of daily use, I felt my pronunciation actually improved."**

This is qualitative and self-reported, by design. The mechanism that produces this feeling is the **Voice Journal**: dated audio recordings stored in IndexedDB, replayable side-by-side. If, by week 4, the author can hear improvement when comparing recordings, the personal MVP has succeeded.

Soft secondary signals (logged in the calendar, no targets):
- Daily-use streak (length is the user telling himself the app is working)
- Words saved to collection (size suggests the engagement loop is alive)
- Voice journal recordings count (raw evidence of speaking practice)

### Public Future (parked targets, when relevant)
- Daily active rate ≥ 40%
- Paragraph-completion rate ≥ 70%
- Average voice score trends upward over the first 30 days per user
- Median streak length grows month over month
- Warm-up adoption rate (the differentiator metric — % of paragraph reads preceded by a warm-up)

---

## Personal MVP Scope (1-Week Build)

**Ten features, all client-side, zero backend.** Listed in build-priority order — if the week runs short, drop from the bottom. Tier-1 (must-have) is the smallest viable loop; Tier-2 adds the differentiating ritual; Tier-3 is polish.

### Tier 1 — Smallest Viable Loop *(Days 1–3)*

1. **Paragraph generator** — pick theme + persona; calls user's chosen LLM directly from browser; structured JSON response with paragraph + hard-words list
2. **Hard-words list** — IPA + meaning + example sentence per word, displayed below paragraph
3. **Word Collection** — tap to save; persisted in localStorage / IndexedDB
4. **Browser TTS playback** — paragraph and word-level, native `SpeechSynthesis` API, free and offline *(was #6)*
5. **Recycle 2–3 collection words** into the next paragraph (prompt-template injection); cold-start: when collection has <2 words, paragraph contains only new advanced words *(was #5)*

### Tier 2 — The Differentiating Ritual *(Days 4–5)*

6. **Voice Journal** — record yourself reading via `MediaRecorder`, store dated audio in IndexedDB, side-by-side replay against TTS, **week-2 prompt to compare today vs. earliest recording** *(was #9 — promoted: this is the aha-moment mechanism)*
7. **Pen-drill warm-up** — short text + 30-second timer + "now without pen" prompt; ritual without scoring *(was #8)*
8. **Daily Review** — flip-card flashcard UI; three-button difficulty feedback *(was #4)*

### Tier 3 — Habit & Variety *(Days 6–7, drop first if time slips)*

9. **Calendar grid** — last 30 days, green dots for completed sessions. *Definition: a "completed session" = a paragraph generated AND read aloud (tap "I read it" or record a Voice Journal entry).* *(was #7)*
10. **Offline Paragraph Pack** — one-click download of ~1,000 pre-generated paragraphs (~1.5MB JSON) for offline / variety use; expandable to 10k+ later

**If the week truly compresses,** Tier 1 alone (5 features) still delivers a working personal tool. Tier 1 + Voice Journal alone delivers 80% of the perceived-improvement value.

### Tech Stack — Personal MVP

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **State / Storage:** localStorage (settings, API key, calendar) + IndexedDB via Dexie.js (collection, recordings, paragraph cache)
- **LLM:** Vercel AI SDK (`ai` package) — single API across OpenAI / Anthropic / Google; user provides own key in settings, stored in localStorage
- **Browser APIs:** `SpeechSynthesis` for TTS, `MediaRecorder` for voice journal
- **Backend:** **None** at v1 — fully client-side
- **Deployment:** Vercel free tier (or local-only `next dev` for purest personal use)

> **Security note (consequential when going public):** Storing the LLM API key in browser localStorage and calling the LLM directly from the browser is **acceptable for personal single-user use** (your key, your machine). It is **not acceptable for a public deployment** — a hosted version must proxy LLM calls through a backend so user keys (or your platform key) are never exposed in the browser. This gate must close before any public launch. Adding a thin FastAPI proxy is the planned mitigation in the public-future phase.

### What's Explicitly Out (Personal MVP)

- ❌ Backend / FastAPI (deferred to public phase)
- ❌ Whisper voice scoring (uses Voice Journal as the perceived-improvement mechanism instead)
- ❌ Phoneme mechanics SVG cards (30+ hours authoring time we don't have)
- ❌ Story arcs / CYOA (engineering depth not justified for n=1)
- ❌ Audiblytics Wrapped (needs months of data)
- ❌ PWA install / offline indicator / smart pre-download (single-device, single-user)
- ❌ Authentication / multi-user / public sharing
- ❌ Persona graduation, streak freeze, smart reflection (premature for n=1)

These are *parked, not abandoned*. The detailed product description spells out the full path.

---

## Where This Could Go (Public Future, Parked Roadmap)

If, after 30 days of personal use, the author decides to take Audiblytics public, the path is well-mapped (see [detailed product description](../brainstorming/audiblytics-detailed-description-2026-05-01.md)):

- **Add backend:** FastAPI (Python) for Whisper voice-scoring proxy, free-tier hosted LLM (cold-start safety), authentication, persistent multi-device storage.
- **Promote Personal MVP features to public MVP:** the same 10 features become the foundation of the public product, joined by Reader Personas (3–4 launch personas), the Onboarding Paragraph diagnostic, Streak Freeze, Score Explanation, Phoneme Mechanics Cards (~10 to start), Story Arcs (linear), Curated Library Fallback, and "What Works Offline" indicator.
- **V1.1 fast-follow:** CYOA forks, Sentence Smithy, Mispronunciation Recovery Quest, Audiblytics Wrapped, Smart Pre-Download, Offline Word Collection Review, full Smart Calendar Reflection, Persona Graduation.
- **V2 ambitions:** Conversation Mode (LLM voice agent interview), full offline LLM (WebLLM), voice Sentence Smithy.

The public-future commercial model would lean on a **freemium tier** (free limited daily generations via fallback model + Pro tier for voice scoring + full features), keeping operating costs low through BYO-LLM as default. Distribution would start with developer / language-learning communities (Hacker News, r/EnglishLearning, r/languagelearning, IndieHackers) — communities where the BYO-LLM positioning resonates.

---

## Open Questions (For the Build Phase)

These intentionally remain open and should be resolved during the 1-week build:

1. **Theme launch lineup.** Six is recommended: horror, comedy, adventure, mystery, sci-fi, slice-of-life. Confirm or adjust.
2. **Persona lineup.** Four recommended: GRE Aspirant, Business English, Storyteller, Casual Conversationalist. Confirm or adjust for personal use.
3. **Default LLM.** Which model is the default in your settings? GPT-4o / Claude 3.5 Sonnet / Gemini 2.0 Flash? (User-changeable, but defaults shape the first session.)
4. **Voice Journal retention.** Indefinite, or 90-day rolling window? (IndexedDB has no hard size limit, but you may not want every recording forever.)
5. **Paragraph length.** 120 / 150 / 180 words at v1? Affects daily-time feel.
6. **Offline Paragraph Pack initial size.** 500 / 1,000 / 2,000? Costs $0.50–$3 to generate via batch script.
7. **Browser support.** Chrome-first only, or also Safari/Firefox? `SpeechSynthesis` and `MediaRecorder` are universal, but voice quality varies.

---

## Appendix — Document Lineage

This brief was produced through a structured BMad workflow on 2026-05-01:

- **Brainstorming session** (Mary, Business Analyst — Progressive Technique Flow): generated 59 ideas across 4 waves, locked 16 features, produced detailed product description.
- **Detailed product description** captures the full public-product vision (the parked roadmap).
- **Hybrid product brief** (this document) reframes the personal-MVP scope while preserving the public path.
- **Next-step skills** ready to consume this brief: `bmad-create-prd` (full PRD for personal MVP build), `bmad-create-architecture` (technical architecture), `bmad-create-ux-design` (UX flows), or `bmad-prfaq` (further stress-test the public concept).
