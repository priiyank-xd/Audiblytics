# Audiblytics — Detailed Product Description

**Version:** 1.0 (concept)
**Date:** 2026-05-01
**Source:** Brainstorming Session 2026-05-01 (Mary, Business Analyst)

---

## 1. The Thesis

> **Audiblytics teaches you to *speak* — physically and verbally — through a daily, narrative-rich micro-ritual.**

Where most language apps treat speech as text-with-audio (Anki, Duolingo) or pronunciation as an isolated drill (ELSA), Audiblytics weaves vocabulary acquisition, pronunciation measurement, and physical articulation drills into one elegant daily loop. The product's core conviction is that **speech is physical** — your mouth, tongue, jaw, and breath are the instrument, and they need warming up, training, and measurement just like any athletic skill.

---

## 2. Who It's For

The first user is a **self-directed adult learner** of English (with non-English first language, or a native speaker preparing for high-stakes speaking — interviews, presentations, exams). They:

- Have an existing vocabulary but want to push into advanced territory
- Care about *sounding* clear and confident, not just being grammatically correct
- Prefer short daily practice over long study sessions
- Are technically comfortable enough to bring their own LLM API key (with a free fallback for those who aren't)
- May practice on commutes, during travel, or in environments with poor connectivity

**Out of scope for v1:** kids/families, classroom/teacher dashboards, social communities, paid tiers — all explicit deferrals to keep the v1 product surface tight and focused.

---

## 3. The Daily Loop (Audiblytics in One Minute)

Here is the user's day in the app, end to end:

1. **Open the app.** Today's paragraph is already waiting (pre-generated overnight).
2. **(Optional) 30-second Warm-Up.** Grab a pen, hold it between your teeth, read a short text, then remove the pen and read again. The app scores both attempts and shows you side-by-side how much your articulation improved.
3. **Read today's paragraph aloud.** Themed (horror, comedy, adventure, etc.), 120–180 words long, deliberately seeded with 2–3 advanced words and 2–3 words from your personal collection (recycled from earlier days for spaced repetition). The paragraph might be a chapter in a 7-day story arc.
4. **See your voice score.** A single number (e.g. *87*) plus a colored heatmap directly on the paragraph: green words you nailed, yellow words that were imprecise, red words you mispronounced. A one-line plain-language explanation follows ("your /th/ came out softer in three words").
5. **Investigate red words.** Tap any → replay slow TTS, see a small mouth-mechanics diagram for the tricky phoneme (lazy-loaded, ~5–10KB), or save the word to your collection.
6. **Save advanced words.** Below the paragraph, a list of the day's hard words, each with phonetics, dictionary-verified meaning, and an example sentence. Toggle which to add to your collection.
7. **End-of-session card.** Today's score, words saved, calendar turns green, story arc progresses ("Day 3 of 7"). You're done in 3–5 minutes.

Throughout the day, a separate **Collection Review** is available — flashcard-style, with TTS, voice scoring on individual words, and three-button difficulty feedback.

---

## 4. The Five Pillars + Two Cross-Cutting Layers

### Pillar 1 — Core Loop
The engine of the app: paragraph generation with themes, BYO-LLM (with a free fallback model so cold-start users aren't locked out), hard-word extraction, the Word Collection, and the recycling mechanism that pushes 2–3 saved words into tomorrow's paragraph for spaced repetition.

### Pillar 2 — Coaching
Where Audiblytics is uniquely physical. **Warm-Up Mode** delivers a daily pen-drill ritual with before/after scoring. **Phoneme Mechanics Cards** are small SVG-based diagrams showing tongue/lip/jaw position for the ~25–30 most-needed English phonemes — lazy-loaded, lightweight, and bundled into the offline pack so they work on a flight.

### Pillar 3 — Memory & Production
The recall infrastructure. Daily collection review keeps saved words alive. **Mispronunciation Recovery Quest** (V1.1) tags words you've struggled with and weaves them back via spaced repetition under a narrative lens ("redemption missions"). **Conversation Mode** (V2) puts an LLM voice agent in charge of asking you questions using your collection words — the highest-leverage active recall in the product. **Sentence Smithy** (V1.1) closes the production loop: write or speak an original sentence using each saved word; the LLM critiques.

### Pillar 4 — Engagement & Retention
Audiblytics doesn't gamify with badges; it engages with **story**. Themes can become **7-day Story Arcs** (Day 7 is the climax), with each chapter generated using a small story-state JSON for continuity. **Choose-Your-Own-Adventure** (V1.1) introduces forks at chapter ends — both branches always reuse your collection words and surface new advanced ones, so vocabulary is never sacrificed to narrative.

### Pillar 5 — Trust & Offline
The honesty layer. **Curated Library Fallback** ships with 1,000+ professionally written paragraphs (~150KB total) so the app never says "no internet, sorry." When offline, a banner clearly tells users **what works and what doesn't**. **Smart Pre-Download** (V1.1) learns the user's typical practice time and ensures content is fresh in cache before then. **Offline Collection Review** (V1.1) makes the most-used screen completely network-free.

### Cross-Cutting: Progress & Reflection
Three time scales of reflection. **Lightweight Per-Paragraph Voice Score** is the daily measure (with score explanation). **GitHub-style Calendar** is the weekly/monthly habit anchor — tap any day to see what happened (Smart Reflection: missed days surface a 90-second recovery action; strong days celebrate). **Streak Freeze** (1 free per month, automatic) prevents shame spirals. **Audiblytics Wrapped** (V1.1) is the monthly + annual recap — your most-mispronounced word, your favorite theme, your growth trajectory.

### Cross-Cutting: Personalization
**Reader Personas** are the master configurator. During onboarding (and occasionally swappable later), the user picks one of 3–4 personas at launch — *GRE Aspirant, Business English, Storyteller, Casual Conversationalist*. Each persona ships with its own ~150-word advanced bank, register tuning, sentence-length tendencies, and accent target. The persona changes *everything else* in the app — but it isn't a daily decision.

---

## 5. Architectural Realities

A few engineering realities flow directly from the product decisions:

- **Slim PWA + cache layer.** Required by offline review, smart pre-download, and offline phoneme cards. Not a feature per se — but a non-negotiable foundation. Service-worker shell, IndexedDB for cached paragraphs/dictionary entries/recordings.
- **BYO-LLM with free fallback.** Architecture must support both modes from day one. User-supplied keys never touch Audiblytics' servers (security promise); fallback model is rate-limited (e.g. 1–2 generations/day) but enough to never block a new user.
- **Voice scoring is online.** Whisper API (or Azure Speech / Deepgram) for the foreseeable future. Recordings made offline are queued and uploaded when network returns. *This means the per-paragraph score is a "soon" experience offline, not a "now" experience.*
- **Dictionary verification.** Before any LLM-generated word meaning displays, it gets cross-checked against Wiktionary / Free Dictionary API. Discrepancies flagged or definition replaced. Trust > speed.
- **Story-state persistence.** A small JSON object per active arc, included in each daily prompt as context, ensures Day 5 doesn't forget what happened on Day 1.
- **Generous voice-scoring tone.** Heatmap framing is "areas to revisit," not "wrong." Score explanations use language like *"came out softer"* or *"a touch imprecise,"* never *"wrong"* or *"failed."* Critical for non-native users; calibrate copy carefully.

---

## 6. MVP Scope (What Ships First)

**16 features in MVP**, anchored on the duo that delivers the thesis: **Voice Scoring + Warm-Up Mode**.

Must-haves:
- Onboarding Paragraph as diagnostic
- Paragraph generation with themes + BYO-LLM + free fallback
- Hard-words list with dictionary-verified meanings
- Word Collection + daily review + recycling
- Reader Personas (3–4 at launch)
- **Lightweight Per-Paragraph Voice Score** with heatmap and 1-line explanation
- **Warm-Up Mode** (pen drill)
- Phoneme Mechanics Cards (start with ~10, expand to ~30 in V1.1)
- GitHub-style Calendar with Streak Freeze and light Smart Reflection
- Story Arcs (linear, no CYOA forks yet)
- Curated Library Fallback (1,000+ paragraphs)
- "What Works Offline" Indicator
- Slim PWA + cache layer (basic version)

**V1.1 (fast follow):** CYOA forks, Sentence Smithy (text), Wrapped, Recovery Quest, Smart Pre-Download, Offline Review, full Smart Reflection, Persona Graduation, full PWA cache.

**V2 (later):** Conversation Mode (heavy STT+LLM+TTS pipeline), Sentence Smithy voice version, full offline LLM (WebLLM).

---

## 7. Success Metrics

The numbers that should move:

- **Daily active rate:** % of users who do *anything* in the app each day (target: 40%+)
- **Paragraph completion rate:** % of opens where a paragraph is read aloud (target: 70%+)
- **Voice score trend:** average per-user score should rise over the first 30 days (we are literally teaching the skill we measure)
- **Collection growth:** average words saved per user per week (target: 3–5)
- **Streak length distribution:** median user streak length (target: rising over months)
- **Warm-Up adoption:** % of paragraph reads preceded by a warm-up (this is the differentiator metric)

---

## 8. What's Deliberately Excluded

These were considered and *consciously* deferred:

- ❌ Free / Pro tiers (no monetization in v1; collect users first)
- ❌ Social features (reading circles, leaderboards, public sharing)
- ❌ Junior / Family mode (different product, different audience)
- ❌ B2B / Educator dashboards (adjacent product, separate go-to-market)
- ❌ Native mobile apps (PWA covers it; native is a budget question for later)
- ❌ Multi-language target (English only at launch; localizing the *interface* is a separate question from teaching a *non-English* target language)

---

## 9. Open Decisions for Future Refinement

These intentionally remain open and should be answered before MVP build starts:

1. **Free fallback model choice and rate limit.** GPT-4o-mini? Claude Haiku? On-device WebLLM? Daily call cap?
2. **Voice scoring vendor.** Whisper API (cheap, open) vs. Azure Speech (better phoneme detail, more expensive) vs. Deepgram. Latency target: <3 seconds for a 30-second recording.
3. **Persona launch lineup.** Confirm the four: GRE Aspirant, Business English, Storyteller, Casual Conversationalist — or different mix?
4. **Phoneme Mechanics Card sourcing.** Custom SVG authoring (~30 hours of speech-pathology consulting) vs. CC-licensed existing diagrams.
5. **Theme launch lineup.** Six is a good starting set — confirm: horror, comedy, adventure, mystery, sci-fi, slice-of-life?
6. **Reminder strategy.** In-browser notifications only, or email + browser? Native push requires PWA install.
7. **First-paragraph length.** 120, 150, or 180 words? Affects daily-time perception.

---

## 10. Tagline Candidates (for product positioning)

- *"Audiblytics — read it. Say it. Mean it."*
- *"Daily speech, daily progress."*
- *"Your daily 3-minute voice gym."*
- *"Vocabulary with a voice."*
- *"The pronunciation app that respects your time."*

---

**End of detailed product description.**

This document captures the locked-in vision from the brainstorming session of 2026-05-01. Next-step skills that can build on this: `bmad-product-brief` (formal product brief), `bmad-create-prd` (full PRD), `bmad-create-ux-design` (UX specifications), or `bmad-create-architecture` (technical architecture).
