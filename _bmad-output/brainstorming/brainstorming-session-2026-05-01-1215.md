---
stepsCompleted: [1, 2]
inputDocuments: []
session_topic: 'Audiblytics — a webapp that helps users improve pronunciation and build a stronger vocabulary by generating themed paragraphs (via user-chosen LLMs) packed with target words, surfacing hard/advanced words with phonetics, meaning and example sentences, letting users build a personal collection that recycles into future paragraphs, and tracking progress on a calendar.'
session_goals: 'Expand and complete the Audiblytics app concept end-to-end, adding additional engaging and interesting features beyond the user''s initial list, and produce a detailed description of how the app should work (user flows, features, UX, mechanics).'
selected_approach: 'progressive-flow'
techniques_used: ['What If Scenarios + Cross-Pollination', 'Mind Mapping', 'Six Thinking Hats', 'Solution Matrix + User Flow Mapping']
ideas_generated: []
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Priyank
**Date:** 2026-05-01

## Session Overview

**Topic:** Audiblytics — a pronunciation + vocabulary-building webapp where users generate themed paragraphs (via any LLM of their choice) seeded with default and advanced words, get a per-paragraph hard-word list (phonetics, meaning, example sentence), curate a personal word collection that recycles into future paragraphs, and track progress on a calendar.

**Goals:**
- Round out the app concept with additional engaging features
- Produce a detailed description of how the app should work end-to-end (flows, mechanics, UX feel)

### Context Guidance

_No external context file provided. The user has shared a detailed initial concept and explicitly invited expansion and feature additions._

### Session Setup

_Fresh session. User wants Mary (Business Analyst) to facilitate ideation that both broadens the feature surface and converges into a detailed product description._

## Technique Selection

**Approach:** Progressive Technique Flow
**Journey Design:** Systematic development from divergent exploration through convergent product description.

**Progressive Techniques:**

- **Phase 1 — Expansive Exploration:** *What If Scenarios + Cross-Pollination* — break out of the initial feature set, steal patterns from adjacent apps
- **Phase 2 — Pattern Recognition:** *Mind Mapping* — cluster ideas into themes (core loop, gamification, AI, social, monetization, retention, accessibility)
- **Phase 3 — Idea Development:** *Six Thinking Hats* — pressure-test top features (facts, benefits, risks, emotions, creative variants, MVP fit)
- **Phase 4 — Action Planning:** *Solution Matrix + User Flow Mapping* — features × release-phase grid plus end-to-end user flows that produce the detailed app description

**Journey Rationale:** User has a strong nucleus (paragraph generation + word collection + calendar tracking). The journey first widens the design space, finds shape in the chaos, stress-tests promising candidates, then crystallizes everything into a concrete product description that can hand off to PRD or product-brief.

## Phase 1 Output — Idea Generation

### Total Ideas Generated: 57 across 4 waves

**Wave 1 — What If Scenarios (12 ideas):** Pronunciation scoring, mouth-mechanics coach, recovery quest, story arcs, reader personas, daily ritual, accent twin, garden collection, multi-LLM battle, TTS-first, conversation mode, sentence smithy.

**Wave 2 — Cross-Pollination (12 ideas):** Borrowed from Duolingo, Anki, Strava, Reddit/Wordle, Headspace, Spotify Wrapped, GitHub, Pokémon Go, Notion, Fitbit, LinkedIn Learning, Co-Star.

**Wave 3 — Diction Drills + Yes-And + Domain Pivots (21 ideas):** Pen-drill warm-ups, articulation gym, before/after scoring, voice health, boss-battle words, choose-your-own-adventure, genre crossover weeks, persona word banks, persona graduation, cold-call mode, sentence battle league, voice-submitted sentences, mid-month surprise card, smart calendar reflection, freemium tiers, educator/coach mode, kid mode, accessibility, offline cache, hallucination guard, reading circles.

**Wave 4 — Offline-First (12 ideas):** Pre-bake, travel mode, curated library fallback, offline pen-drills, offline collection review, sync queue, browser-native voice loop, WebLLM local gen, PWA install, what-works-offline indicator, smart pre-download, reconnection celebration.

### Locked-In Features for Audiblytics

**Core Engine (original nucleus):**
- Paragraph generation with themes (horror, comedy, adventure, etc.)
- Advanced + default words baked in
- BYO-LLM (user picks any model)
- Hard-words list per paragraph: phonetics + meaning + example sentence
- Personal Word Collection (user adds words from each paragraph)
- Daily collection review
- 2–3 collection words recycle into the next day's paragraph
- Calendar-based progress tracking

**Selected Expansions (Phase 1 keepers):**

| ID | Name | Layer | Note |
|----|------|-------|------|
| #3 | Mispronunciation Recovery Quest | Memory | Failed words come back as "redemption missions" with spaced repetition |
| #4 | Story Arcs | Engagement | Themes become 7-day story arcs with cliffhangers |
| #5 | Reader Personas | Personalization | GRE / Business / Kid / Podcaster / Shakespearean — each tunes vocabulary band, register, accent |
| #11 | Conversation Mode | Production | LLM voice agent interviews user using their collection words |
| #12 | Sentence Smithy | Production | User writes/speaks an original sentence per word; LLM critiques |
| #18 | Audiblytics Wrapped | Reflection | Monthly + annual recap (most-mispronounced, top theme, growth) |
| #19 | GitHub-style Calendar | Progress | Heatmap of practice intensity, optional public profile |
| #25 | Warm-Up Mode (pen drill) | Coaching | Pen-between-teeth pre-paragraph drill with before/after voice scoring |
| #30 | Choose-Your-Own-Adventure | Engagement | Story arcs branch on user choice; both paths reuse collection words |
| #38 | Smart Calendar Reflection | Accountability | Tap a missed day → contextual reason + 90s recovery action |
| #48 | Curated Library Fallback | Trust | 1,000+ pre-written paragraphs as fallback when LLM unreachable |
| #50 | Offline Word Collection Review | Offline | Collection review fully offline once words are cached |
| #55 | "What Works Offline" Indicator | Trust UX | Honest banner when offline showing which features work |
| #56 | Smart Pre-Download | Intelligence | App learns user's practice times and pre-caches accordingly |

**Implicit infrastructure flagged for Phase 2:** #50 + #56 imply lightweight pre-baking + caching (a slim version of #46 Pre-Bake / #54 PWA) — to be scoped consciously during Mind Mapping.


## Phase 2 Output — Pattern Recognition (Mind Map)

### Five Pillars + Two Cross-Cutting Layers

**Pillars:**
1. **Core Loop** — paragraph generation, hard-words list, word collection, recycling
2. **Coaching** — #25 Warm-Up Mode, #59 Phoneme Mechanics Card
3. **Memory & Production** — #3 Recovery Quest, daily review, #11 Conversation Mode, #12 Sentence Smithy
4. **Engagement & Retention** — #4 Story Arcs, #30 Choose-Your-Own-Adventure
5. **Trust & Offline** — #48 Curated Library Fallback, #50 Offline Review, #55 Offline Indicator, #56 Smart Pre-Download

**Cross-cutting:**
- **Progress & Reflection** — #19 Calendar, #38 Smart Reflection, #18 Wrapped, #58 Per-paragraph Voice Score
- **Personalization** — #5 Reader Personas (configurator, set during onboarding)

### Phase 2 Decisions

- ✅ Added **#58 Lightweight Per-Paragraph Voice Score** as explicit feature (was implicit, now central)
- ✅ Added **#59 Phoneme Mechanics Card** — SVG-based, ~25-30 phoneme library, lazy-loaded, bundled offline
- ✅ Confirmed scope: monetization, social, kids mode, and B2B are OUT for v1
- ✅ Confirmed: Persona is onboarding-set with occasional swap, not daily
- ✅ Confirmed implementation reality: slim PWA + cache layer needed (carries offline review, smart pre-download, and offline phoneme cards)

### Final Feature Roster — 16 Selected Features + Original Nucleus

| ID | Name | Pillar |
|----|------|--------|
| Original | Paragraph generation, themes, BYO-LLM, advanced+default words | Core |
| Original | Hard-words list (IPA, meaning, example) | Core |
| Original | Word Collection + daily review + recycling 2-3 words next day | Core |
| #5 | Reader Personas (configurator) | Personalization |
| #25 | Warm-Up Mode (pen drill, before/after scoring) | Coaching |
| #59 | Phoneme Mechanics Card (SVG, lazy, lightweight) | Coaching |
| #58 | Lightweight Per-Paragraph Voice Score (heatmap) | Progress |
| #3 | Mispronunciation Recovery Quest | Memory |
| #11 | Conversation Mode (LLM voice agent interview) | Production |
| #12 | Sentence Smithy (write/speak + LLM critique) | Production |
| #4 | Story Arcs (7-day themed arcs) | Engagement |
| #30 | Choose-Your-Own-Adventure paragraphs | Engagement |
| #19 | GitHub-style Calendar (heatmap) | Reflection |
| #38 | Smart Calendar Reflection (tap-day → recovery) | Reflection |
| #18 | Audiblytics Wrapped (monthly/annual recap) | Reflection |
| #48 | Curated Library Fallback (1000+ paragraphs) | Trust/Offline |
| #50 | Offline Word Collection Review | Offline |
| #55 | "What Works Offline" Indicator | Trust UX |
| #56 | Smart Pre-Download (learns user's practice times) | Offline |

## Phase 3 Output — Six Thinking Hats Pressure Test

### Hat Findings (summary)

- **White (facts):** 25-30 phonemes is bounded; browser TTS works offline; STT requires server (Whisper $0.10/user/month); curated library is ~150KB; no direct full-stack competitor exists.
- **Red (emotions):** Daily ritual feels good; story arcs hook returns; pen drill is silly→empowering; BYO-LLM intimidates non-techies; voice scoring tone matters enormously; conversation mode is anxiety-inducing for some.
- **Yellow (benefits):** Closes speak/listen gap; differentiated thesis (speech is physical); three independent retention mechanics stack; low operational cost via BYO-LLM; defensible content moat (curated library + phoneme cards + persona word banks); natural expansion paths.
- **Black (risks):** BYO-LLM cold-start friction (→ free fallback required); voice scoring accuracy on accents (→ generous tone); LLM hallucinations in meanings (→ dictionary verification required); story arc continuity (→ story-state JSON); combinatorial prompt complexity; conversation mode too heavy for MVP; calendar guilt (→ streak freeze).
- **Green (creative additions):** Score explanation (1-line plain language), persona graduation, streak freeze, daily Word-of-the-Day lock, **onboarding paragraph as diagnostic**, Pen Day theming.
- **Blue (process):** MVP = 16 features anchored on Voice Score (#58) + Warm-Up (#25); V1.1 = 8 features for retention; V2 = Conversation Mode + voice Sentence Smithy + full offline LLM.

### Phase 3 Decisions

- ✅ MVP locked to 16 features
- ✅ Conversation Mode demoted to V2 (engineering-heavy)
- ✅ Hidden requirements surfaced: dictionary verification, free fallback model, story-state persistence, generous voice-scoring tone calibration
- ✅ Three Green Hat additions promoted into MVP automatically: Onboarding Paragraph diagnostic, Streak Freeze (1/month auto), Score Explanation (1-line)

## Phase 4 Output — Solution Matrix + User Flows + Detailed Description

### Solution Matrix — Feature × Release Phase

See in-doc matrix above (or main session output above).

### Critical User Flows Captured

1. First-Time Onboarding (Diagnostic-First) — 12 steps
2. Daily Session (Core Ritual) — 7 steps
3. Daily Collection Review — 5 steps
4. Story Arc Mode — 6 steps
5. Offline / Low-Signal — 4 steps

### Final Deliverable

**Detailed Product Description written to:**
`_bmad-output/brainstorming/audiblytics-detailed-description-2026-05-01.md`

This document covers: thesis, target user, daily loop, five pillars + two cross-cutting layers, architectural realities, MVP/V1.1/V2 scope, success metrics, deliberate exclusions, open decisions, and tagline candidates. Ready to feed into bmad-product-brief or bmad-create-prd as the next step.

## Session Summary

**Total Ideas Generated:** 59 (across 4 waves of Phase 1)
**Locked-In Features:** 16 in MVP, 8 in V1.1, 3 in V2+
**Techniques Used:** What If Scenarios + Cross-Pollination → Mind Mapping → Six Thinking Hats → Solution Matrix + User Flow Mapping
**Session Duration:** ~80 minutes
**Outcome:** Detailed product description ready for handoff to product brief / PRD / architecture / UX design phases.

### Creative Highlights

- **User-contributed idea — pen-between-lips drill** opened the entire "Coaching" pillar and became a flagship MVP feature (Warm-Up Mode #25). This was the session's most influential contribution.
- The thesis statement *"speech is physical"* emerged organically from clustering, and now anchors the product positioning.
- The decision to demote Conversation Mode to V2 — though it was an early favorite — kept MVP buildable. Strong convergent discipline.
- The session demonstrated rapid, decisive selection by Priyank — short answers were a feature, not a bug, of his working style.
