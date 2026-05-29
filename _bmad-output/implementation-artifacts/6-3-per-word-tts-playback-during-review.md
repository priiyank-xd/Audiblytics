# Story 6.3: Per-Word TTS Playback During Review

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want a TTS play icon on the back of each flashcard that pronounces the word,
so that I can hear correct pronunciation as part of the review without leaving the card.

## Acceptance Criteria

1. **Playback trigger (FR52, AR20)** — Given the flashcard is on its **back** side (Story 6.2), when the user activates the **play control next to the IPA**, then **`speak(word)`** runs with the current card’s **surface word string** (the same string shown on the card front / `CollectionWord.word`), routed exclusively through **`src/lib/audio/tts.ts`** — **no** direct `window.speechSynthesis` / `SpeechSynthesisUtterance` usage outside that module (grep-clean per AR20). [Source: `epics.md` Story 6.3; `epics.md` AR20]

2. **Play ↔ Pause chrome (UX-DR12)** — While synthesis is **actively speaking** this card’s utterance, the control shows **pause** (Lucide **`Pause`**), matching the **HardWordRow** play/pause swap pattern; when idle or ended, show **`Play`**. Minimum **44×44px** hit target (UX-DR4 / UX-DR8). **`aria-label`** reflects action (e.g. `Play pronunciation of <word>` / `Pause pronunciation`) and **`aria-pressed`** or live region updates as appropriate for the playing state. [Source: `epics.md` Story 6.3; `epics.md` UX-DR12]

3. **Latency (NFR4)** — Playback must **start within &lt;100ms** of the user gesture on the play control (same bar as Story 1.7 TTS AC625–627). Implement by invoking **`speak`** synchronously in the click/tap handler (no `await` before `speak` that would defer off the user gesture). [Source: `epics.md` Story 6.3; `epics.md` NFR4; Story 1.7 AC]

4. **Cancel on feedback — no bleed** — Given TTS is **in progress** for the current card, when the user activates **Got it / Almost / Forgot** (pointer or **`1`/`2`/`3`** shortcuts from Story 6.2), then **cancel active speech first** (clean stop), then run the existing feedback pipeline and advance the queue. After advance, **no audio** from the previous card may continue or restart. Also cancel/reset when **`currentWord.id`** changes (next card) or the flip returns to **front** if product logic clears back-side playback — ensure **no cross-card bleed**. [Source: `epics.md` Story 6.3]

## Tasks / Subtasks

- [ ] **`src/lib/audio/tts.ts`** (AC: 1, 3, 4)
  - [ ] If not already present, add an exported **`cancelSpeech()`** (or equivalent) that wraps **`speechSynthesis.cancel()`** (and any utterance bookkeeping) so **features/components never import raw synthesis APIs** (AR20).
  - [ ] Ensure **`speak`** remains the single entry point for starting playback; document that **`cancelSpeech`** must be called before starting a new utterance when switching cards or stopping for feedback.

- [ ] **`Flashcard.tsx` + optional small hook** (AC: 1, 2, 3, 4)
  - [ ] Track **`isSpeaking`** for the **current** word id: set true when `speak(word)` fires; listen for utterance **end/error** via callbacks exposed from **`tts.ts`** (preferred) or a thin **`useReviewWordTts.ts`** in `features/review/` — **do not** duplicate voice lifecycle outside `tts.ts`.
  - [ ] Swap **Play / Pause** icons per UX-DR12; **pause** tap should cancel or pause per browser-capable behavior — **minimum**: cancel + reset icon to Play (consistent with “stop cleanly” on feedback).
  - [ ] In the feedback handler path **before** `applyReviewFeedback` / queue advance: **`cancelSpeech()`**.

- [ ] **`src/app/review/page.tsx` (or feedback composition layer)** (AC: 4)
  - [ ] Ordering guarantee: **cancel → persist feedback → index++** so Dexie and audio never race.

- [ ] **Verification**
  - [ ] Play → icon becomes Pause → utterance ends → icon returns to Play.
  - [ ] Play → tap **Got it** during speech → audio stops immediately → next card; **no** audio from prior word.
  - [ ] Rapidly advance cards while playing → only the latest card’s intent is honored; no overlap.

## Dev Notes

### Epic / dependency context

- **Story 6.2** owns flip chrome, FR51 writes, and baseline **`speak(word)`** on play for “basic” pronunciation; **this story** owns **play/pause UX**, **NFR4**, **cancellation rules**, and **AR20-safe** stop semantics.
- Reuse **`use-flashcard-state.ts`** / **`use-review-feedback.ts`** from Story 6.2 paths — **extend** rather than fork queue or feedback math.

### Architecture compliance

| Artifact | Requirement |
|----------|-------------|
| **AR20** | All **`speechSynthesis`** access stays in **`src/lib/audio/tts.ts`**. Consumers call **`speak` / `cancelSpeech` / hooks** only. |
| **Tree** | **`src/components/audiblytics/Flashcard.tsx`**, **`src/features/review/*.ts`**, **`src/lib/audio/tts.ts`**, **`src/app/review/page.tsx`** per `architecture.md` § project tree (~1031–1057). |
| **Imports** | `app/` → `features/` → `components/` → `lib/` (AR18). |

### Technical requirements

- **Word payload:** Use **`CollectionWord.word`** (not IPA) for `speak`, unless PRD explicitly requires otherwise — FR52 references hearing the **word**; IPA remains visual on the back per 6.2.
- **Browser variance:** Safari/Chrome utterance lifecycle differs slightly; centralize edge handling in **`tts.ts`** so **`Flashcard`** stays thin.
- **Reduced motion:** Icon swap is not one of the five tracked transitions (UX-DR36); no extra animations required for this story.

### Project Structure Notes

| Area | Path |
|------|------|
| TTS wrapper | `src/lib/audio/tts.ts` |
| Flashcard UI | `src/components/audiblytics/Flashcard.tsx` |
| Review route | `src/app/review/page.tsx` |
| Queue / feedback | `src/features/review/use-review-queue.ts`, `use-review-feedback.ts`, `use-flashcard-state.ts` |

### Previous story intelligence (6.2)

- **6.2** explicitly deferred **play/pause swap**, **&lt;100ms latency**, and **cancel-on-feedback** to **Story 6.3** — implement those here without regressing FR50/FR51/FR52 baseline behavior.
- **Keyboard:** Preserve **Space** = flip and **1/2/3** = feedback; ensure feedback path still **cancels TTS** first (AC4).
- **Single queue source:** **`use-review-queue.ts`** remains authoritative for ordering.

### Project context reference

- No `project-context.md` found in repo at story creation time; follow **`architecture.md`**, **`epics.md`**, and **`ux-design-specification.md`** (UX-DR12, NFR4).

### Git intelligence

- No git history available in this workspace snapshot — rely on architecture and story files for conventions.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
