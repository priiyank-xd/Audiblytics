# Story 14.3: Today Session Three-Column Layout

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want Today redesigned as center reading column + right recording/difficult-words column,
so that the session screen matches the today mockup (UX-V2-UI3).

## Acceptance Criteria

> Sourced from `epics.md` § Story 14.3, UX-V2-UI3, and `_bmad-output/design/ui-mockups-v2/ChatGPT_Image_May_27__2026__09_08_03_PM-*.png`. Builds on **14.1** shell (sidebar + suppressed global StatRail on `/today`) and **14.2** home entry CTA.

1. **AC1 — Shell + internal two-column workbench** — Given `/today` in v2 shell, when viewport is `xl+`, then layout is **AppSidebar (14.1) + center reading workspace + right studio column**; global `StatRail` remains **suppressed** on `/today` (`AppShell.tsx`). Below `xl`, center stacks above right column (no horizontal scroll trap).

2. **AC2 — Session status bar** — Given Today with paragraph context loaded, when status bar renders, then it shows **Day N of 30 · Theme · Persona** on `bg-primary text-on-primary` and preserves **Warm-Up** launcher (Epic 5 `WarmUpDrill` dynamic import unchanged). `BackToHomeLink` remains above workspace.

3. **AC3 — Paragraph hard-word highlights** — Given paragraph body rendered, when token matches a hard word (case-insensitive), then word renders with **visible highlight** (`bg-surface-elevated` or `bg-primary-soft` per mockup — semantic tokens only). Tapping a hard word selects it, syncs TTS, and opens detail card (AC4). Non-hard words remain plain text (not buttons unless product decision: only hard words are interactive).

4. **AC4 — Bottom word detail card (center column)** — Given a hard word selected (from paragraph tap or right-column chip), when detail card opens below paragraph, then card shows:
   - Headword (title)
   - **IPA** from `HardWord.ipa` (not `pronunciationGuide`) + speak control
   - Meaning (part of speech + gloss when parseable)
   - Example sentence
   - Primary **"Add to collection"** via existing `useSaveWord` hook (fixes API-mode Dexie bypass in `handleSaveSelectedWord`)
   - Close control clears selection
   Card uses `bg-surface-card` or `bg-surface` + `border-divider rounded-lg` per mockup.

5. **AC5 — Right column: Recording studio** — Given paragraph on screen, when right column renders, then **Recording Studio** card wraps existing `RecordPanel` with `layout="studio"` (no reimplementation of recorder). Tips toggle, ready timer row, and Day-14 scroll anchor behavior preserved.

6. **AC6 — Right column: Difficult words list** — Given hard words exist, when right column renders, then **Difficult Words** section lists today's hard words as **chips with visible speaker icons**; active/selected word uses primary highlight consistent with paragraph selection (`selectedWordId` / `activeWordId` shared state). Section title + count badge match mockup copy (**"Difficult Words"** or existing **"Focus Words"** — pick **"Difficult Words"** for mockup parity). Link to `/collection` optional if already present.

7. **AC7 — Selection sync** — Given user selects word in paragraph OR right-column chip, when selection changes, then all three surfaces update: paragraph highlight, detail card, chip active state. TTS obeys existing toggle/cancel rules.

8. **AC8 — Preserve session behaviors** — Must not regress: `TodayParagraphControls`, LLM generate/offline pack errors, `markReadIt`, Day-14 takeover route, `useStatStreakSurface` paragraph flag, recording analysis panel (mockup "Live Feedback" — keep existing `RecordingAnalysis` UI; static placeholders deferred to **14.9**).

9. **AC9 — Tests** — Extract pure helpers to `apps/web/src/lib/today/` (e.g. `matchHardWordToken`, `parseMeaningParts` if moved from inline) with `node:test` coverage. `pnpm --filter @audiblytics/web test` + `typecheck` green.

10. **AC10 — Scope boundary** — No global StatRail on `/today`. No "Your Collection" recent-words card (mockup stretch — **14.5/14.9**). No live LLM analytics. Do not delete `ParagraphHero.tsx` unless confirmed zero imports (optional cleanup note only). Reading analysis stays as-is (not static placeholders).

## Tasks / Subtasks

- [x] **Task 1 — Audit + extract Today helpers** (AC: 3, 4, 9)
  - [x] 1.1 Create `apps/web/src/lib/today/hard-word-match.ts` — `normalizeWordKey(word)`, `findHardWordForToken(token, hardWords)`, `splitParagraphTokens(paragraph)`.
  - [x] 1.2 Move `getMeaningParts` from `today-app.tsx` → `apps/web/src/lib/today/word-meaning.ts` (or co-locate in hard-word-match file).
  - [x] 1.3 Add `hard-word-match.test.ts` — token match case-insensitive, non-match returns undefined, meaning parse with/without `·`.

- [x] **Task 2 — Word detail card component** (AC: 4, 7)
  - [x] 2.1 Create `TodayWordDetailCard.tsx` in `components/audiblytics/` — props: `word: HardWord`, `isSpeaking`, `onSpeak`, `onClose`, `onSaveToCollection`, `isSaving`, `isSaved`, `saveError`.
  - [x] 2.2 Display **IPA** + speak button; primary **Add to collection**; wire `useSaveWord` from parent (remove ad-hoc `db.collection.add` in `handleSaveSelectedWord`).
  - [x] 2.3 Remove **"Add to Focus Words"** unless needed for recycle flow — mockup has collection only; keep focus-word merge logic for generated words without extra CTA if redundant.

- [x] **Task 3 — Paragraph reading column polish** (AC: 3, 4, 7)
  - [x] 3.1 Refactor `TodayRouteBody` paragraph render to use extracted token helpers.
  - [x] 3.2 Hard-word tokens: highlight all hard words in body; selected word gets stronger active class (`bg-primary-soft text-primary` or mockup-equivalent tokens).
  - [x] 3.3 Mount `TodayWordDetailCard` below paragraph card when `selectedWord` resolved; close clears `selectedWordId` + cancels TTS if speaking that word.
  - [x] 3.4 Paragraph footer: retain difficult-word count; Previous/Next disabled stubs OK (single paragraph session).

- [x] **Task 4 — Right column polish** (AC: 5, 6, 7)
  - [x] 4.1 Rename section heading to **Difficult Words** + count badge.
  - [x] 4.2 Extend `HardWordsList` `variant="compact"` — show **Volume2/Play icon** on each chip (not sr-only); selected chip `bg-primary text-on-primary`.
  - [x] 4.3 Ensure `onToggleWord` sets `selectedWordId` so detail card opens from chip tap.
  - [x] 4.4 Keep Recording Studio + Reading analysis sections; verify sticky `xl:top-6` on aside.

- [x] **Task 5 — Layout + status bar verify** (AC: 1, 2, 8)
  - [x] 5.1 Confirm `AppShell` still hides StatRail on `/today` — no change unless regression found.
  - [x] 5.2 Session status bar: verify `Day {dayNumber} of 30 · {theme} · {persona}` + Warm-Up; do **not** wire unused `TodaySessionStatus` checklist (different UX — green bar is canonical per mockup).
  - [x] 5.3 Smoke: WarmUp open/exit, Day-14 banner scroll-to-record, generate/error/offline paths unchanged.

- [x] **Task 6 — Verification** (AC: 9, all)
  - [x] 6.1 `pnpm --filter @audiblytics/web test`
  - [x] 6.2 `pnpm --filter @audiblytics/web typecheck`
  - [x] 6.3 Manual: tap paragraph word → detail card IPA + save; tap chip → sync; record panel still saves; API mode collection save uses API when `isApiStorageBackend()`.

### Review Findings (2026-05-31)

- [x] [Review][Defer] Stale `selectedWordId` after New paragraph [`today-app.tsx:241-264`] — `handleGenerate` does not clear word selection; detail card hides (word not in new list) but chip highlight state can linger until next tap; clear on paragraph swap in polish pass.
- [x] [Review][Defer] `ParagraphHero.tsx` orphaned [`components/audiblytics/ParagraphHero.tsx`] — zero runtime imports after Today refactor; optional delete in cleanup pass (AC10).
- [x] [Review][Dismiss] Reading analysis vs mockup "Live Feedback" label — AC8 explicitly keeps existing analysis panel copy/behavior.
- [x] [Review][Dismiss] `isSaved` uses exact `word` string match — pre-existing `useCollection` / `HardWordRow` pattern; case-insensitive check out of 14.3 scope.

## Dev Notes

### Authority stack (read in order)

1. `epics.md` § Story 14.3 + UX-V2-UI3
2. Today mockup: `_bmad-output/design/ui-mockups-v2/ChatGPT_Image_May_27__2026__09_08_03_PM-*.png`
3. `14-1-design-tokens-and-app-shell-v2.md` — shell, StatRail suppression on `/today`
4. `14-2-home-dashboard.md` — `/today` entry from home CTA
5. `architecture.md` § Implementation Patterns — semantic tokens, `Result<T,E>`, inline errors, Zod schemas

### Brownfield baseline (critical — much already exists)

| File | Current state | 14.3 delta |
|------|---------------|------------|
| `features/today/today-app.tsx` | **~850 lines**; `xl:grid-cols-[1fr_28rem]` center+right; green status bar; inline paragraph token buttons; selected word section; `RecordPanel layout="studio"`; `HardWordsList variant="compact"`; ad-hoc Dexie save | Extract helpers + `TodayWordDetailCard`; IPA display; `useSaveWord`; chip icons; mockup polish — **mutate, do not rewrite** |
| `components/audiblytics/AppShell.tsx` | Hides StatRail when `pathname === '/today'` | Verify only |
| `components/audiblytics/HardWordsList.tsx` | `compact` chips without visible speaker icons | Add icons + selected styling |
| `components/audiblytics/ParagraphHero.tsx` | **Orphaned** — unused after today-app refactor | No action required (optional delete) |
| `components/audiblytics/TodaySessionStatus.tsx` | Checklist UI (paragraph/read/recording) — **not wired** | Do not mount — mockup uses green metadata bar |
| `components/audiblytics/RecordPanel.tsx` | `layout="studio"` with waveform bars | Reuse as-is |
| `lib/schemas/paragraph-cache.schema.ts` | `HardWord` has `ipa`, `pronunciationGuide`, `meaning`, `exampleSentence` | Detail card must show **`ipa`** |

### Mockup → implementation map

| Mockup element | Implementation |
|----------------|----------------|
| Back to Home | `BackToHomeLink` (existing) |
| Green status bar `Day 2 of 30 · Adventure · Storyteller` | `TodayRouteBody` primary bar + `THEME_LABEL` / `PERSONA_LABEL` |
| Warm-Up button | Existing `WarmUpDrill` launcher |
| Toolbar (New paragraph, Listen, font, theme, word count) | `TodayParagraphControls` (existing) |
| Paragraph with gray highlighted vocab | Token split + `findHardWordForToken` + highlight classes |
| Bottom card `miasma` + IPA + Add to collection | **`TodayWordDetailCard`** |
| Right Recording Studio | `RecordPanel layout="studio"` in bordered section |
| Live Feedback Pace/Clarity/Accuracy | Existing `recordingAnalysis` grid — **keep real values** (14.9 covers static fallback elsewhere) |
| Difficult Words chips + speaker | `HardWordsList variant="compact"` enhancement |
| Your Collection mini-list (right column) | **Out of scope** — Collection page is 14.5 |
| Global StatRail calendar/streak | **Suppressed on `/today`** — intentional per 14.1/14.2 |

### Layout wireframe (`xl+`)

```
┌──────────┬─────────────────────────────────┬──────────────────┐
│ Sidebar  │ Back to Home                    │ (no StatRail)    │
│ (14.1)   │ [Day N · Theme · Persona | Warm-Up]              │
│          │ [TodayParagraphControls]        │ Recording Studio │
│          │ ┌─────────────────────────────┐ │ RecordPanel      │
│          │ │ Paragraph (highlighted words)│ │ Live Feedback    │
│          │ └─────────────────────────────┘ │ Difficult Words  │
│          │ [TodayWordDetailCard]           │ (chips + speak)  │
│          │ [I read it →]                   │                  │
└──────────┴─────────────────────────────────┴──────────────────┘
```

### Hard word selection state (preserve single source)

```ts
// today-app.tsx — keep these synchronized:
const [activeWordId, setActiveWordId] = useState<string | null>(null);   // TTS
const [selectedWordId, setSelectedWordId] = useState<string | null>(null); // detail + chip
const rowId = `${hw.word}-${hw.ipa}`;
```

On paragraph/chip click: set both `selectedWordId` and invoke `toggleWordTts(rowId, word)`.

### Collection save — fix API-mode gap

**Deferred from 12.1 CR:** `handleSaveSelectedWord` writes Dexie directly. Replace with:

```ts
const { saveWord, isSaving, error } = useSaveWord();
// onSave: void saveWord({ entry: selectedWord, sourceParagraphId: paragraphId });
```

Render `InlineErrorSurface` on failure (no toast).

### Pure helper signatures (implement exactly)

```ts
// apps/web/src/lib/today/hard-word-match.ts
export function normalizeWordKey(word: string): string;
export function findHardWordForToken(
  token: string,
  hardWords: HardWord[],
): HardWord | undefined;
export function splitParagraphTokens(paragraph: string): string[];

// apps/web/src/lib/today/word-meaning.ts
export function parseWordMeaning(meaning: string): {
  partOfSpeech: string | null;
  gloss: string;
};
```

### Folder placement (architecture.md §641–656)

| New file | Location |
|----------|----------|
| Token/meaning helpers + tests | `apps/web/src/lib/today/` |
| Word detail card | `apps/web/src/components/audiblytics/TodayWordDetailCard.tsx` |
| Route body | mutate `apps/web/src/features/today/today-app.tsx` |
| HardWordsList compact variant | mutate existing component |

### Behaviors that MUST NOT break

- Day-14 full-bleed takeover (separate route/component — not in today-app layout path when active)
- `useMarkReadIt` + `hasReadIt` ghost button
- `useStatStreakSurface().setHasParagraphForTodayOnScreen`
- Offline pack + LLM `InlineErrorSurface` retry/settings
- `recordPanelAnchorRef` scroll for Day-14 soft banner
- API settings fetch path when `isApiStorageBackend()`
- Focus words merge (`focusWords` state) for user-added words — logic can stay; UI CTA optional

### Previous story intelligence

- **14.1:** StatRail hidden on `/today` is intentional (internal studio rail replaces it). `/calendar` not in sidebar until 14.8.
- **14.2:** Home CTA routes to `/today`; Today polish completes the primary daily loop UX.
- **12.1 deferral:** Wire `useSaveWord` in detail card — **in scope for 14.3 AC4**.

### Anti-patterns

- New `TodayAppV2.tsx` or parallel route — mutate `today-app.tsx`
- Mounting global `StatRail` on `/today`
- Showing `pronunciationGuide` where mockup shows IPA
- Toast/modal for save errors
- Arbitrary hex/px in TSX
- Rewriting `RecordPanel` recorder logic
- Static fake pace/clarity in place of real `RecordingAnalysis` (that's 14.9 stretch elsewhere)
- Building Collection mini-panel on Today right rail

### Testing approach

Web uses `tsx --test`. Minimum cases:

```ts
assert.equal(normalizeWordKey(' MiAsMa '), 'miasma');
assert.ok(findHardWordForToken('miasma', [{ word: 'Miasma', ipa: '/x/', ... }]));
assert.deepEqual(parseWordMeaning('noun · fog'), { partOfSpeech: 'noun', gloss: 'fog' });
assert.deepEqual(parseWordMeaning('plain gloss'), { partOfSpeech: null, gloss: 'plain gloss' });
```

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` § Story 14.3, UX-V2-UI3]
- [Source: `_bmad-output/design/ui-mockups-v2/index.md`]
- [Source: `apps/web/src/features/today/today-app.tsx`]
- [Source: `apps/web/src/components/audiblytics/HardWordsList.tsx`]
- [Source: `apps/web/src/lib/schemas/paragraph-cache.schema.ts`]
- [Source: `14-1-design-tokens-and-app-shell-v2.md`, `14-2-home-dashboard.md`]
- [Source: `_bmad-output/implementation-artifacts/deferred-work.md` § 12.1 focus-word save]

## AI Engineering Record

| AI-Phase | AI-Tool | Story-Ref |
|---|---|---|
| story | cursor/composer-2.5-fast | 14-3-today-session-three-column-layout |
| code | cursor/composer-2.5-fast | 14-3-today-session-three-column-layout |
| test | cursor/composer-2.5-fast | 14-3-today-session-three-column-layout |
| review | cursor/composer-2.5-fast | 14-3-today-session-three-column-layout |
| deploy | pending | |

## Dev Agent Record

### Agent Model Used

composer-2.5-fast

### Debug Log References

### Completion Notes List

- `lib/today/`: token matching, meaning parse, 6 unit tests.
- `TodayWordDetailCard`: IPA + speak + Add to collection via `useSaveWord` (API + Dexie).
- `today-app.tsx`: only hard words interactive; selection sync; removed Dexie-only save and focus-word CTA.
- `HardWordsList` compact: Play/Pause icons + `selectedWordId` highlight.
- **101 tests** pass; typecheck green. `AppShell` StatRail suppression on `/today` unchanged.

### File List

- `apps/web/src/lib/today/hard-word-match.ts`
- `apps/web/src/lib/today/hard-word-match.test.ts`
- `apps/web/src/lib/today/word-meaning.ts`
- `apps/web/src/components/audiblytics/TodayWordDetailCard.tsx`
- `apps/web/src/components/audiblytics/HardWordsList.tsx`
- `apps/web/src/features/today/today-app.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/14-3-today-session-three-column-layout.md`

## Change Log

- 2026-05-31: CR — approved; 2 defer, 2 dismiss; status → done.
- 2026-05-31: Implemented Today v2 layout polish — word detail card, IPA, useSaveWord, difficult words chips (101 tests).
- 2026-05-31: Story created — Today session three-column layout mockup alignment (ready-for-dev).
