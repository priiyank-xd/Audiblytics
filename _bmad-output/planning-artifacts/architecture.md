---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-05-03'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
  - '_bmad-output/planning-artifacts/product-brief-Audiblytics.md'
  - '_bmad-output/planning-artifacts/product-brief-Audiblytics-distillate.md'
  - '_bmad-output/brainstorming/brainstorming-session-2026-05-01-1215.md'
  - '_bmad-output/brainstorming/audiblytics-detailed-description-2026-05-01.md'
workflowType: 'architecture'
project_name: 'Audiblytics'
user_name: 'Priyank'
date: '2026-05-03'
---

# Architecture Decision Document — Audiblytics

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (64 FRs across 10 clusters):**

| Cluster | FR range | Architectural implication |
|---|---|---|
| Onboarding & Settings | FR1–FR8 | Settings persistence layer (localStorage); provider-key vault preserving keys across provider swaps (FR9) |
| LLM Provider Integration | FR9–FR13 | Provider-abstraction seam wrapping Vercel AI SDK; unified error parser; schema-validated structured JSON via Zod; auto-retry policy (≤2) |
| Paragraph Generation & Display | FR14–FR21 | Recycle-from-collection prompt builder with cold-start guard; today's-paragraph cache in IndexedDB; same-day reuse on app open |
| Audio Output / TTS | FR22–FR25 | SpeechSynthesis wrapper handling Chrome's async voice load + Safari's smaller voice set; voice persistence with fallback |
| Word Collection | FR26–FR29 | Dexie table with save-recency index; durable across restart/refresh/close |
| Voice Journal (load-bearing) | FR30–FR42 | MediaRecorder wrapper storing actual MIME with each blob; permission lifecycle; Day-14 trigger (NFR12 exact-once); same-word match heuristic for comparison player; 90-day rolling prune; zero-silent-loss IndexedDB writes |
| Pen-Drill Warm-Up | FR43–FR47 | Bundled tongue-twister library (≥10 phrases); 30s timer; reuses Voice Journal recording flow |
| Daily Review (Flashcards) | FR48–FR52 | Selection by oldest `lastReviewedAt`; cumulative `difficultyRating` (no SRS algorithm in MVP) |
| Calendar & Streak | FR53–FR59 | Day completion = paragraph generated AND ("I read it" tap OR recording saved); streak from consecutive completions; offline-pack badge; honest-empty missed days |
| Offline Pack & Error Recovery | FR60–FR64 | Separate Node generation script (out of app); IndexedDB-loaded pack; 3-action recovery surface (Retry / Settings / Use Pack); 30-day rolling de-dupe |

**Non-Functional Requirements (28 NFRs):**

- **Performance (NFR1–NFR7):** <2s cold load, <15s first-paragraph end-to-end, <300ms record-start, <100ms TTS-start, <200ms IndexedDB collection read, <500KB JS gzipped
- **Reliability (NFR8–NFR13):** Zero silent recording loss (NFR8), zero silent collection loss (NFR9), provider-downtime tolerance (NFR10), mic-denial tolerance (NFR11), Day-14 exact-once firing (NFR12), streak-correctness across DST/timezone (NFR13)
- **Security & Privacy (NFR14–NFR19):** API keys in `localStorage` (n=1 only, hard scope boundary); HTTPS for non-localhost; zero third-party tracking/telemetry; mic-permission lazy-requested; no exfiltration paths
- **Usability (NFR20–NFR24):** ≤5 min daily session, ≤3 min onboarding, no shame-inducing UI, single-action primary tasks, ≤60s Day-14 forced friction
- **Maintainability (NFR25–NFR28):** 6-months-later code legibility, dependency parsimony, zero-code provider swap, capability-area file organization

**Explicitly excluded NFR categories:** Scalability, Multi-tenancy, i18n, DR, Compliance, Audit logging, SLOs, Multi-device sync, Backup/restore, Capacity planning, Pen-testing. (Each becomes required if scope ever transitions to public.)

### Scale & Complexity

- **Project type:** Web app (client-side SPA, browser-only, zero backend)
- **Complexity:** PRD-classified `low` overall. Locally elevated in: provider abstraction (5 providers × 5 error vocabularies → 1 unified surface), Day-14 reliability semantics, IndexedDB no-silent-loss enforcement, cross-browser MediaRecorder MIME handling.
- **Estimated architectural modules:** ~10 (provider abstraction, storage/Dexie, settings/key management, audio I/O wrappers, day-counting/scheduling, error surface, schema/Zod, offline-pack runtime, prompt builder, dev-only components route)
- **UI component count (from UX spec):** 17 (DayRail, HybridProgressRibbon, ParagraphHero, HardWordRow, RecordPanel, VoiceJournalList, StatCardDark, StatCardLight, ProviderChip, HonestyFooter, TopNav, Day14Takeover, CompositePlayer, ButtonPair, WarmUpDrill, InlineErrorSurface, OnboardingShell, OfflineBadge)
- **Routes:** 1 primary (`/`) + 4 secondary (`/settings`, `/collection`, `/calendar`, `/review`) + 1 dev-only (`/_dev/components`). No dynamic routes, no catch-alls.

### Technical Constraints & Dependencies

**Pre-locked stack (PRD §Implementation Considerations):**

- Framework: Next.js 15 (App Router), TypeScript, primarily client components
- Styling: Tailwind 4 + shadcn/ui (Radix primitives)
- LLM: Vercel AI SDK (`ai`) + `@ai-sdk/google` (default), `@ai-sdk/openai`, `@ai-sdk/anthropic`, `ollama-ai-provider` (community), OpenRouter via OpenAI-compatible mode
- Storage: Dexie.js (IndexedDB wrapper) + vanilla `localStorage`
- Validation: Zod
- Audio: native `MediaRecorder`, `SpeechSynthesis` (no libraries)
- Build: Next.js defaults; ESLint + Prettier; no test framework (per NFR26)

**Excluded by NFR26 dependency parsimony:** Redux/Zustand or any state-management library, UI component frameworks beyond shadcn primitives, animation libraries, Toast/Sonner, analytics SDKs, error-reporting (Sentry/PostHog).

**Hard scope boundary (NFR14):** API key in browser `localStorage` and direct browser→provider calls are acceptable for n=1 only. Public deployment is forbidden until a backend proxy closes the API-key security gate. Architecture must encode this in a way that can't be casually flipped.

**Browser matrix:**

- Chrome (latest 2) — primary, reference
- Safari (latest 2, macOS) — secondary; `MediaRecorder` defaults to `audio/mp4` (vs Chrome's `audio/webm`); `SpeechSynthesis.getVoices()` returns smaller set
- Edge (Chromium) — inherits Chrome
- Firefox — best-effort
- Mobile — out of MVP scope (renders, no optimization)

### Cross-Cutting Concerns

| Concern | Spans |
|---|---|
| **Provider abstraction (LLM seam)** | All paragraph generation; error parsing across 5 providers' vocabularies (Gemini `RESOURCE_EXHAUSTED`/`403`, OpenAI `429`/`401`/`quota_exceeded`, Anthropic `overloaded_error`/`rate_limit_error`, Ollama `connection refused`, OpenRouter); schema validation; retry; fallback chain to offline pack |
| **IndexedDB persistence (Dexie)** | Word Collection, Voice Journal recordings, Paragraph Cache, Offline Pack; 90-day prune; quota-error surfacing; live queries for collection list |
| **Day-counting semantics** | Day-14 trigger exact-once (NFR12); streak across DST/timezone (NFR13); calendar completion logic (FR53); 90-day retention pruning (FR41); HybridProgressRibbon "X to first replay" copy |
| **Unified error surface** | Provider errors (FR11) → 3-action recovery (FR64); IndexedDB write failures (FR42); mic permission denial (FR33); all rendered inline (no modals), all with concrete recovery actions |
| **Schema validation (Zod)** | LLM paragraph response validation (FR17); persisted record shapes (collection word, recording, settings, day14 outcome); offline-pack JSON schema identical to runtime LLM schema |
| **Audio I/O abstraction** | MediaRecorder write with stored MIME (Safari/Chrome divergence); SpeechSynthesis voice load lifecycle (Chrome async, Safari sync); voice persistence + fallback to system default; getUserMedia permission lifecycle |
| **Settings & key management** | Provider switch (FR9) preserves previously entered keys; provider-client construction is settings-derived; key never leaves browser; "Get a free key" deep-link per provider |
| **Public-deployment gate** | Architecture must keep the n=1 boundary structurally visible — e.g., a single configuration flag or environment guard that a future contributor cannot accidentally bypass without explicit acknowledgment |

## Starter Template Evaluation

### Primary Technology Domain

**Web app — client-side SPA on Next.js App Router.** Confirmed by PRD §Implementation Considerations and §Web App-Specific Requirements. No backend, no ORM, no auth, no real-time, no PWA. Stack family is pre-locked; this step formalizes the scaffold command and folder shape.

### Starter Options Considered

| Option | Verdict | Rationale |
|---|---|---|
| `create-next-app@latest` | ✅ Selected | Produces exact PRD shape (TS + Tailwind 4 + App Router + ESLint + Turbopack) in one command; zero excluded deps; AGENTS.md defaults help coding-agent workflows |
| `create-t3-app` | Rejected | Bundles tRPC + Prisma + NextAuth — all explicitly excluded by NFR26 (no backend, no ORM, no auth) |
| `npx shadcn@latest init -t next` | Rejected | Less auditable — single command does both Next.js + shadcn but obscures which Next.js flags are enabled |
| Custom from scratch | Rejected | Reinvents what create-next-app provides; no benefit |
| Paid SaaS boilerplates | Rejected | All assume backend + auth + Stripe — wrong shape for n=1 client-only personal tool |

### Selected Starter: `create-next-app@latest` (currently 16.2.3)

**Rationale for Selection:**

`create-next-app` is the official Vercel scaffold, always synchronized with Next.js releases, and produces exactly the stack PRD §Implementation Considerations specifies — with no excluded dependencies bundled in. T3 Stack and SaaS boilerplates would force us to delete more than they add. The `--src-dir` + `--import-alias "@/*"` + `--turbopack` flags align with shadcn/ui's expected layout and Tailwind 4's CSS-first config.

**Version-pinning decision:** PRD §Implementation says "Next.js 15"; `create-next-app@latest` currently pulls Next.js 16. We use Next.js 16 latest because (a) the PRD wording predates the 16 release by days and was a stack-family lock not a version lock, (b) App Router behavior is stable across 15→16, (c) Tailwind 4 + AGENTS.md defaults reduce subsequent setup steps. This is a deliberate, documented divergence from PRD wording with PRD intent preserved. Fully reversible by pinning `create-next-app@15` if needed.

**Initialization Command:**

```bash
pnpm create next-app@latest audiblytics \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --turbopack \
  --use-pnpm
```

**Follow-on shadcn/ui setup:**

```bash
cd audiblytics
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button select input label dialog tabs collapsible tooltip
```

**Audiblytics-specific dependencies (added after starter):**

```bash
pnpm add ai @ai-sdk/google @ai-sdk/openai @ai-sdk/anthropic ollama-ai-provider zod dexie dexie-react-hooks
pnpm add -D @types/dom-speech-recognition
```

### Architectural Decisions Provided by Starter

**Language & Runtime:**
- TypeScript (strict mode, Next.js 16 defaults)
- React 19 (canary built into App Router)
- Node.js ≥18.17 (Next.js 16 minimum)

**Styling Solution:**
- Tailwind CSS 4 with CSS-first `@theme` config
- oklch color space (replaces hex/hsl)
- Lightning CSS engine (sub-millisecond HMR)
- shadcn/ui primitives layered on top (added separately so the install list is explicit)

**Build Tooling:**
- Turbopack as default dev/build engine (Webpack still available via `--webpack` flag if needed)
- ESLint with Next.js recommended config
- No Prettier in starter — add manually if desired (NFR26 dependency parsimony permits it)

**Testing Framework:**
- None. Per PRD NFR26, no test framework ships in MVP. Priyank's daily use IS the integration test.
- If added post-MVP: Vitest is the natural choice (fast, ESM-native, Vite-aligned).

**Code Organization:**
- `src/` directory enabled (`--src-dir`)
- App Router under `src/app/` (Next.js requirement)
- Path alias `@/*` → `./src/*`
- AGENTS.md + CLAUDE.md auto-included for coding-agent workflows

**Folder shape (extended from starter to honor NFR28 capability-area colocation):**

```
src/
  app/                       # routes (App Router)
    layout.tsx
    page.tsx                 # Today
    settings/page.tsx
    collection/page.tsx
    review/page.tsx
    calendar/page.tsx
    _dev/components/page.tsx # dev-only component gallery
  components/
    ui/                      # shadcn primitives
    audiblytics/             # custom composites (17 components per UX spec)
  features/                  # capability-area code per NFR28
    paragraph/
    voice-journal/
    word-collection/
    review/
    calendar/
    warmup/
    offline-pack/
  lib/
    llm/                     # provider abstraction (the seam)
    storage/                 # Dexie schema, localStorage wrapper
    audio/                   # SpeechSynthesis + MediaRecorder wrappers
    schemas/                 # Zod schemas
    errors/                  # unified error parser
    day-counter/             # day-of-use counting (NFR12, NFR13)
  styles/
    globals.css              # tokens, font imports
scripts/
  generate-offline-pack.ts   # FR60 separate Node script
public/
  offline-pack.json          # output of script (FR61)
```

**Development Experience:**
- `pnpm dev` — Turbopack dev server, sub-millisecond HMR
- `pnpm build` + `pnpm start` — production build
- `pnpm lint` — ESLint
- AGENTS.md / CLAUDE.md auto-included to guide downstream coding-agent BMAD stories

**Note:** Project initialization using the command above should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (block implementation):**
- LLM call API (must use AI SDK 6 `generateText` + `Output.object`, not deprecated `generateObject`)
- Provider abstraction shape (single seam in `lib/llm/`)
- Dexie schema (collection / recordings / paragraphCache / offlinePack tables + indexes)
- Day-counting primitive (UTC-anchored, idempotent, used by Day-14 trigger + streak + retention)
- Day-14 gate location (layout-level, URL-unbypassable)

**Important Decisions (shape architecture):**
- Multi-provider key vault layout (`audiblytics.providerKeys` namespaced object)
- Per-provider error parsers + discriminated `LlmError` union
- Recording MIME auto-detection + persistence with blob
- TTS voice load lifecycle (Chrome async / Safari sync)
- Hard-scope-boundary structural guards (3 friction points)
- Server-vs-client component policy (almost all client; layout server-only for fonts)

**Deferred Decisions (post-MVP / Public-Future):**
- LLM streaming (non-streaming for MVP; streaming when partial-validation pattern matures)
- Encryption at rest (none in MVP — contradicts ≤3 min onboarding; revisit at public-future)
- CI/CD pipeline (none in MVP — no tests, no team)
- Test framework (none in MVP per NFR26 — Vitest is the natural choice if added later)
- Analytics / monitoring / error reporting (none in MVP per NFR16)

### PRD-Divergence Notes (deliberate, documented)

| PRD says | Architecture chooses | Reason |
|---|---|---|
| Next.js 15 | Next.js 16 (latest) | PRD wording predates 16 release by days; App Router stable across 15→16; Tailwind 4 + AGENTS.md defaults |
| `generateObject` for structured JSON | `generateText({ output: Output.object({ schema }) })` from `ai@^6` | AI SDK 6 (Dec 2025) deprecated `generateObject`; current API unifies tool-calling + structured output |
| Gemini "~1,500 RPD free quota" | **250 RPD on Flash, 1000 RPD on Flash-Lite** as of April 2026 | Google cut free-tier quotas Dec 2025 + April 2026; runtime n=1 daily use still well within Flash; offline-pack script switches to Flash-Lite to fit 1000-paragraph batch in one day |
| Default model: "Gemini Flash" | `gemini-2.5-flash` runtime; `gemini-2.5-flash-lite` for offline-pack script | Same model family; Flash for daily quality, Flash-Lite for batch throughput under free-tier RPD limits |

### Data Architecture

**Storage layers:**

| Layer | Technology | Used for |
|---|---|---|
| Hot KV | `localStorage` | Settings (active provider, model, theme, persona, length, voice, retention); per-provider API keys (vault); calendar (`daysOfUse: string[]` UTC dates); `day14Result`; `day14PromptFired`; current streak cache |
| Persistent | IndexedDB via Dexie 4.4.x | Word Collection; Voice Journal recordings (with MIME); paragraph cache; offline pack |
| Reactive bindings | `dexie-react-hooks` 4.2.x `useLiveQuery` | Collection list, recordings list — auto-update on writes from any component |

**Dexie schema (single version):**

```ts
class AudiblyticsDB extends Dexie {
  collection!:     Table<CollectionWord, string>;
  recordings!:     Table<VoiceRecording, string>;
  paragraphCache!: Table<CachedParagraph, string>;
  offlinePack!:    Table<OfflinePackEntry, string>;

  constructor() {
    super('audiblytics');
    this.version(1).stores({
      collection:     '++id, savedAt, lastReviewedAt, word',
      recordings:     '++id, recordingDate, paragraphId, dayOfUse',
      paragraphCache: '++id, generatedAt, theme, persona',
      offlinePack:    '++id, theme, persona, lastSurfacedAt',
    });
  }
}
```

**Index rationale:**
- `collection.savedAt` — FR27 sort by recency; `lastReviewedAt` — FR49 oldest-first review pick
- `recordings.recordingDate` — VoiceJournalList sort; `paragraphId` — Day-14 same-word match (FR38); `dayOfUse` — Day-14 trigger reads earliest recording where `dayOfUse=1`
- `paragraphCache.generatedAt` — same-day reuse on app open (FR19); `theme + persona` — analytic introspection
- `offlinePack.theme + persona` — selection diversity; `lastSurfacedAt` — FR63 30-day rolling de-dupe

**Schema versioning policy:** Single `version(1)` to start. Dexie v4 auto-handles non-breaking schema diffs without version bumps. Bump version + add `.upgrade()` callback only on breaking shape changes (rename, type change, removal). Forward-only — no down-migrations.

**Validation:** All persisted records validated through Zod schemas in `lib/schemas/` *before* write to Dexie. Invalid data never reaches IndexedDB. Read-side validation runs once on first load (defends against schema drift across app versions).

**Quota handling (FR42, NFR8):** All Dexie writes wrapped in `try/catch`; `QuotaExceededError` surfaced to user via `InlineErrorSurface` with `[Open Settings]` action (deep-link to retention policy).

### Authentication & Security

**Auth:** None. Single user, no PII, no session, no cookies, no sign-in surface (NFR16, §Project Classification).

**API key vault (FR9):**

```ts
// localStorage key: 'audiblytics.providerKeys'
type ProviderKeys = {
  gemini?:     string;
  openai?:     string;
  anthropic?:  string;
  openrouter?: string;
  ollama:      null;  // local, no key needed
};

// localStorage key: 'audiblytics.activeProvider'
type ActiveProvider = 'gemini' | 'openai' | 'anthropic' | 'openrouter' | 'ollama';
```

Active provider key resolved at LLM-client-construction time. Keys never deleted on provider swap (FR9 satisfied structurally).

**Hard-scope-boundary enforcement (NFR14) — three structural guards:**

1. **Build-time guard** in `next.config.ts`: emits build warning if `NODE_ENV === 'production'` AND `process.env.NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE !== 'true'`. Forces explicit env-var to deploy.
2. **Runtime guard** in `lib/llm/client.ts`: `assertClientOnlySafeContext()` runs at module load; hard-fails if `typeof window === 'undefined'` (prevents accidental server-side LLM call that would expose key in server logs).
3. **Documentation guard:** `README.md` opens with "PERSONAL-USE ONLY" SECURITY block; `app/layout.tsx` carries `// HARD-SCOPE-BOUNDARY: see architecture.md NFR14` banner comment.

A future contributor cannot remove the boundary without consciously editing three files and acknowledging the security implication.

**Encryption at rest:** None for MVP. localStorage + IndexedDB are origin-isolated; passphrase encryption would force user-memorized secret, contradicting NFR21 ≤3 min onboarding. Documented exception. Re-evaluate at public-future scope.

**HTTPS:** Required for non-localhost (NFR15) — Vercel inherits automatically. localhost exempt per browser `getUserMedia` policy.

**Outbound network surface:** (a) configured LLM provider, (b) "Get a free key" deep-link in new tab, (c) static asset fetch. Nothing else. Zero telemetry (NFR16). Zero exfiltration paths (NFR17).

### API & Communication Patterns

**No backend API.** Browser → provider direct via Vercel AI SDK.

**LLM call canonical shape (AI SDK 6+):**

```ts
import { generateText, Output } from 'ai';
import { z } from 'zod';

const paragraphSchema = z.object({
  paragraph: z.string().min(1),
  hardWords: z.array(z.object({
    word:            z.string().min(1),
    ipa:             z.string().min(1),
    meaning:         z.string().min(1),
    exampleSentence: z.string().min(1),
  })).min(1).max(10),
});

const { output } = await generateText({
  model: getProvider(settings),
  prompt: buildPrompt({ theme, persona, length, recycleWords }),
  output: Output.object({ schema: paragraphSchema }),
});
```

`generateObject` (PRD-mentioned) is deprecated in AI SDK 6 — replaced by `generateText` + `Output.object()`. Implementation stories use the v6 form.

**Streaming:** **Non-streaming for MVP.** Schema-validated structured output cannot be safely partially validated mid-stream (Vercel AI SDK docs explicitly note this). Skeleton + ~5s spinner pattern matches UX expectation (UX `ParagraphHero` `loading` state). Streaming is post-MVP enhancement once partial-validation pattern matures.

**Provider abstraction (the central seam):**

```
src/lib/llm/
  client.ts         # getProvider(settings): LanguageModel
  generate.ts       # generateParagraph(provider, opts): Promise<ParagraphResult>
  prompts/
    paragraph.ts    # buildPrompt({theme, persona, length, recycleWords})
  models.ts         # MODEL_BY_PROVIDER lookup table
  errors/
    index.ts        # parseLlmError(provider, raw): LlmError
    gemini.ts
    openai.ts
    anthropic.ts
    openrouter.ts
    ollama.ts
```

All call sites use `generateParagraph()`. The seam exposes one verb, hides 5 providers (NFR27 satisfied).

**Default models:**

| Use | Model | Why |
|---|---|---|
| Runtime daily generation | `gemini-2.5-flash` | Best free-tier quality/RPM balance (10 RPM, 250 RPD — fits ~1 req/day with 250x headroom) |
| Offline-pack batch script | `gemini-2.5-flash-lite` | Higher free-tier RPD (1000) needed for ~1000-paragraph batch in one day |
| User overrides | All 5 providers | Settings-driven |

**Error model:**

```ts
type LlmError =
  | { kind: 'rate_limit';         providerCode: string; message: string; retryable: true;  retryAfterMs?: number }
  | { kind: 'quota_exceeded';     providerCode: string; message: string; retryable: false }
  | { kind: 'auth';               providerCode: string; message: string; retryable: false }
  | { kind: 'network';            providerCode: string; message: string; retryable: true }
  | { kind: 'malformed_response'; providerCode: string; message: string; retryable: true }
  | { kind: 'unknown';            providerCode: string; message: string; retryable: false };
```

Per-provider parser modules normalize native errors → `LlmError`. UI's `InlineErrorSurface` renders 3-action recovery (FR64): `[Retry]` shown when `retryable: true`, `[Open Settings]` always, `[Use Offline Pack]` when offline pack loaded.

**Retry policy (FR12):** Up to 2 automatic retries on `retryable: true` errors with exponential backoff `[1s, 3s]`. After exhausted, surface error to user.

**Rate limiting:** Runtime app does ~1 call/day → no client throttle. Offline-pack script throttles to ≤10 RPM (safety margin under Flash-Lite's 15 RPM).

### Frontend Architecture

**Framework + tooling:** Next.js 16 App Router + React 19 + TypeScript strict + Tailwind 4 + shadcn/ui (Radix). All from starter.

**Component pattern:** UX-spec-locked — 17 custom composites in `src/components/audiblytics/`, shadcn primitives (8 used, others banned) in `src/components/ui/`. No animation library.

**Server vs client components:**

| Component | Type | Why |
|---|---|---|
| `app/layout.tsx` | **Server** | Hosts `next/font` (EB Garamond, Inter, JetBrains Mono); imports `globals.css`; mounts `<Day14Gate>` |
| All route `page.tsx` files | **Client** (`"use client"`) | Every route reads localStorage / IndexedDB / browser APIs |
| All `components/audiblytics/*` | **Client** | Stateful or browser-API-touching |
| shadcn primitives | Mixed (shadcn defaults) | shadcn handles `"use client"` correctly per primitive |

No server actions. No API routes. No middleware (default).

**State management:**

| State kind | Mechanism |
|---|---|
| Ephemeral UI (modal open, hover, recording timer) | `useState` / `useReducer` |
| Persistent reactive (collection list, recordings list) | Dexie `useLiveQuery` (auto-rerender on table writes) |
| Persistent KV (settings, calendar, day-counter, day14_outcome) | Custom `useLocalStorage<T>(key, defaultValue)` hook with cross-tab `storage` event sync |
| Cross-component LLM client | Constructed per-call via `getProvider(settings)` — no global instance, no singleton state |

**No global state library** (NFR26). React Context used sparingly (only for theme/font providers if needed).

**Routing model:** App Router file-based.

```
app/
  layout.tsx                 # server, fonts, Day14Gate
  page.tsx                   # / → Today (client)
  settings/page.tsx          # /settings (client)
  collection/page.tsx        # /collection (client)
  review/page.tsx            # /review (client)
  calendar/page.tsx          # /calendar?day=N (client)
  _dev/components/page.tsx   # /_dev/components (client, dev-gated)
```

`/calendar?day=N` is the only query param in the entire app.

**Day-14 gate (FR37, UX Optimization 3):**

```tsx
// app/_internal/Day14Gate.tsx — client component mounted in layout
export function Day14Gate({ children }: { children: ReactNode }) {
  const day = useDistinctDayOfUse();      // localStorage-derived
  const { fired } = useDay14State();      // localStorage-derived
  if (day === 14 && !fired) return <Day14Takeover />;
  return <>{children}</>;
}
```

Layout-level gate → URL changes cannot bypass it (TopNav clicks land back in the same layout, which still renders `<Day14Takeover>`). Satisfies FR37 + UX §Modal Patterns rule 3.

**Day-counting primitive (NFR12, NFR13):**

```ts
// lib/day-counter/index.ts
export function recordDayOfUse(now: Date = new Date()): void {
  const utcDate = formatUtcDate(now);                        // 'YYYY-MM-DD'
  const days = readArr('audiblytics.daysOfUse');             // string[]
  if (!days.includes(utcDate)) writeArr('audiblytics.daysOfUse', [...days, utcDate]);
}

export function distinctDaysOfUse(): number {
  return readArr('audiblytics.daysOfUse').length;
}

export function currentStreak(now: Date = new Date()): number {
  // walk backwards from today checking consecutive days in the set
}

export function isCompleted(date: string): boolean { /* ... */ }
```

UTC-anchored to satisfy NFR13 (DST/timezone correctness). Display layer converts to local for UX rendering. Idempotent — calling `recordDayOfUse()` twice in the same UTC day is a no-op.

**Audio I/O wrappers:**

```ts
// lib/audio/recorder.ts
export function createRecorder(): {
  start: () => Promise<void>;
  stop:  () => Promise<{ blob: Blob; mimeType: string; durationMs: number }>;
  state: 'idle' | 'requesting-permission' | 'recording' | 'error';
}
// Handles: MediaRecorder MIME auto-detect (Chrome webm-opus / Safari mp4),
// 60s hard cap, getUserMedia permission lifecycle, RecorderError discriminated union

// lib/audio/tts.ts
export function useVoices(): SpeechSynthesisVoice[];   // Chrome async / Safari sync
export function speak(text: string, voice?: SpeechSynthesisVoice): void;
export function getPersistedVoice(): SpeechSynthesisVoice | null;  // FR25 fallback
```

**Form library:** None. Native `<form>` + `useState` sufficient for Onboarding + Settings (NFR26).

**Performance optimization:**
- Next.js automatic code-splitting per route
- `next/dynamic` for `WarmUpDrill` and `Day14Takeover` (loaded only when triggered, keeps Today route initial bundle small)
- `next/font` for all three fonts (zero-CLS, self-hosted, no third-party requests — supports NFR16)
- `@next/bundle-analyzer` as devDep for manual checks before any release-equivalent moment

### Infrastructure & Deployment

**Deployment target:** Local `next dev` is sufficient for n=1 daily use. Optional Vercel free-tier deploy if HTTPS needed for `getUserMedia` outside localhost (e.g., personal LAN access from another device — out of MVP scope but trivial if wanted).

**CI/CD:** None for MVP. No tests to run, no preview deploys needed, no team to gate.

**Environment configuration:**

| File | Purpose | Gitignored |
|---|---|---|
| `.env.local` | Offline-pack script provider keys | ✅ |
| `.env.example` | Documents expected vars for script | ❌ |

App itself has no `.env` — all settings via in-app Settings UI persisted to `localStorage`.

**Monitoring / logging / analytics / error reporting:** None (NFR16, NFR Excluded). Console errors only.

**Public-deployment guard (NFR14):** `next.config.ts` runtime check emits build-time warning when `NODE_ENV === 'production'` AND `process.env.NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE !== 'true'`. Forces conscious override to deploy.

### Decision Impact Analysis

**Implementation sequence (dependency order):**

1. Project init (`create-next-app` + shadcn init)
2. Token system (`globals.css` + Tailwind theme + `next/font`)
3. Storage layer (`lib/storage/db.ts` Dexie schema + `useLocalStorage` hook)
4. Schema layer (`lib/schemas/` Zod definitions)
5. Day-counter primitive (`lib/day-counter/`)
6. Provider abstraction (`lib/llm/` — client, generate, prompts, models)
7. Error parsers + unified `LlmError` (`lib/llm/errors/`)
8. Audio wrappers (`lib/audio/recorder.ts` + `lib/audio/tts.ts`)
9. shadcn primitives install + reskin
10. Custom composites (UX 17 components — order per UX §Implementation Roadmap)
11. Routes (Today → Settings → Collection → Review → Calendar)
12. Day-14 gate wiring in `app/layout.tsx`
13. Offline-pack script (`scripts/generate-offline-pack.ts`) — runnable independently
14. Hard-scope-boundary guards (3 structural enforcement points)

**Cross-component dependencies:**

| Module | Depends on |
|---|---|
| `lib/llm/generate` | `lib/schemas`, `lib/llm/client`, `lib/llm/prompts`, `lib/llm/errors` |
| `Day14Gate` | `lib/day-counter`, `lib/storage` (recordings query for FR38), `Day14Takeover` component |
| `RecordPanel` | `lib/audio/recorder`, `lib/storage` (recordings table), `lib/day-counter` (record day-of-use on save) |
| `HardWordRow` | `lib/audio/tts`, `lib/storage` (collection table) |
| `OnboardingShell` | `lib/llm/generate`, `lib/storage` (settings + provider keys) |
| `InlineErrorSurface` | `lib/llm/errors` (typed `LlmError`), `lib/storage` (offline-pack presence check) |
| `Calendar` | `lib/day-counter` (streak + completion lookup), `lib/storage` (paragraphCache for archived day view) |

## Implementation Patterns & Consistency Rules

### Why this section exists

A downstream coding agent (or future Priyank) implementing any story in this codebase MUST follow these patterns. They exist to prevent two agents working on adjacent stories from writing incompatible code that compiles individually but breaks at integration. Treat this section as enforceable: any deviation requires explicit acknowledgment in the story file.

`AGENTS.md` and `CLAUDE.md` (auto-generated by `create-next-app`) should be edited to point downstream agents at this section as the source of truth for naming, placement, and shape conventions.

### Naming Patterns

**File naming:**

| Kind | Convention | Example |
|---|---|---|
| React component file | `PascalCase.tsx` | `RecordPanel.tsx`, `Day14Takeover.tsx` |
| Route page file | `page.tsx` (Next.js requirement) | `app/settings/page.tsx` |
| Hook file | `useCamelCase.ts` | `useLocalStorage.ts`, `useVoices.ts` |
| Lib module file | `kebab-case.ts` | `day-counter.ts`, `error-parser.ts` |
| Lib module folder | `kebab-case/` | `lib/llm/`, `lib/day-counter/` |
| Schema file | `*.schema.ts` | `paragraph.schema.ts`, `recording.schema.ts` |
| Type-only file | `types.ts` (per folder) | `lib/llm/types.ts` |
| Test file | n/a (no tests in MVP per NFR26) | — |
| Script file | `kebab-case.ts` in `scripts/` | `scripts/generate-offline-pack.ts` |

**Symbol naming:**

| Kind | Convention | Example |
|---|---|---|
| React component | `PascalCase` | `RecordPanel`, `HardWordRow` |
| React props interface | `ComponentNameProps` | `RecordPanelProps`, `HardWordRowProps` |
| Hook | `useCamelCase` | `useLocalStorage`, `useDistinctDayOfUse` |
| Plain function | `camelCase` verb-first | `recordDayOfUse`, `parseLlmError`, `buildPrompt` |
| Constant | `SCREAMING_SNAKE` | `MAX_RECORDING_MS`, `PARAGRAPH_LENGTH_RANGE` |
| Type alias | `PascalCase` noun | `LlmError`, `CollectionWord`, `ProviderKeys` |
| Discriminated union tag | `kind` field, `snake_case` values | `kind: 'rate_limit' \| 'quota_exceeded'` |
| Zod schema export | `xxxSchema` | `paragraphSchema`, `recordingSchema` |
| Inferred type from schema | matching record name | `type CollectionWord = z.infer<typeof collectionWordSchema>` |
| Boolean variable | positive phrasing, `is/has/can/should` | `isRecording`, `hasOfflinePack`, `canRetry` |
| Event handler prop | `onPascalCase` | `onPlaybackComplete`, `onSaveWord` |
| Internal helper inside file | leading `_` only if truly file-private | `_normalizeMime` |

**localStorage key naming (FR1–FR8, FR9, FR54, FR57):**

All keys MUST be namespaced under `audiblytics.*`. No bare keys.

| Key | Type (inferred from Zod) | Notes |
|---|---|---|
| `audiblytics.activeProvider` | `'gemini' \| 'openai' \| 'anthropic' \| 'openrouter' \| 'ollama'` | FR1 |
| `audiblytics.providerKeys` | `ProviderKeys` (object) | FR9 — preserved across provider swaps |
| `audiblytics.settings` | `Settings` — `{ theme, persona, length, retention, voiceURI }` | FR4–FR8 |
| `audiblytics.daysOfUse` | `string[]` of UTC ISO dates `YYYY-MM-DD` | NFR12, NFR13 |
| `audiblytics.day14State` | `{ fired: boolean; result: 'yes' \| 'no' \| null }` | FR37, FR39, FR40 |
| `audiblytics.completions` | `Record<string, { hasReadIt: boolean; hasRecording: boolean; usedOfflinePack: boolean }>` keyed by UTC date | FR53, FR59 |

Reading/writing localStorage MUST go through the `useLocalStorage<T>(key, defaultValue, schema)` hook (which validates via Zod on read). Direct `window.localStorage.getItem` is forbidden in component code; only the hook implementation may touch it.

**Dexie table column naming:**

`camelCase` (TS-native). Do not use `snake_case`. Do not prefix `fk_` or suffix `_id` for foreign-key-like fields — use the natural noun (`paragraphId`, `dayOfUse`).

**Component prop and event naming:**

- Props are passed by name, never positional
- Event handlers prefixed `on*`, paired with internal handlers prefixed `handle*`
- Boolean props phrased positive (`isOpen`, not `isClosed`)

### Structure Patterns

**Capability-area colocation (NFR28):** Code grouped by *what feature it serves*, not *what kind of file it is*. The `features/` folder is the home for capability-area code; `components/`, `lib/`, `app/` are technical layers that capability code may reference.

**Folder decision tree — "where does this new file go?":**

| New file is... | Goes in... |
|---|---|
| Generic React UI primitive (Button, Input, Dialog) — already shadcn-supplied | `src/components/ui/` (shadcn-managed) |
| UX-spec custom composite (Day14Takeover, RecordPanel, etc.) | `src/components/audiblytics/` |
| Capability logic (paragraph generation, voice journal recording, calendar streak) | `src/features/<capability>/` |
| Cross-cutting infra (LLM client, storage, schemas, errors, day-counter, audio wrappers) | `src/lib/<concern>/` |
| Hook used by ≥2 capabilities | `src/lib/hooks/` |
| Hook used by exactly one capability | `src/features/<capability>/hooks/` |
| Zod schema for a persisted record | `src/lib/schemas/<entity>.schema.ts` |
| Zod schema for an LLM response | `src/lib/llm/schemas/<thing>.schema.ts` |
| Per-provider error parser | `src/lib/llm/errors/<provider>.ts` |
| Route page | `src/app/<route>/page.tsx` |
| Dev-only experiment / component gallery | `src/app/_dev/<thing>/page.tsx` (gated by build-time flag) |
| One-shot script (offline pack gen, etc.) | `scripts/<task>.ts` (NOT inside `src/`) |

**File shape — every component file:**

```tsx
'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/storage/db';
import { cn } from '@/lib/utils';
import type { CollectionWord } from '@/lib/schemas/collection.schema';

export type HardWordRowProps = {
  word: CollectionWord;
  onSave: (word: CollectionWord) => void;
};

export function HardWordRow({ word, onSave }: HardWordRowProps) {
  // ... implementation
}
```

Rules:
- Always **named export** (no `export default`) — keeps imports symmetric and grep-friendly
- Props **type alias exported** above the component
- `'use client'` directive **only when needed** — never reflexively
- Imports **ordered**: React → third-party → `@/` internal → relative (rare; only sibling files within same feature folder)
- Use `cn()` from `@/lib/utils` for conditional class names (never string concatenation)

### Format Patterns

**Persisted record shapes:** Single source of truth is the Zod schema. Derive the TypeScript type via `z.infer<>`. Never hand-write a parallel TS type for the same shape.

```ts
// lib/schemas/collection.schema.ts
import { z } from 'zod';

export const collectionWordSchema = z.object({
  id:               z.string().uuid(),
  word:             z.string().min(1),
  ipa:              z.string().min(1),
  meaning:          z.string().min(1),
  exampleSentence:  z.string().min(1),
  savedAt:          z.string().datetime(),
  sourceParagraphId:z.string().uuid().nullable(),
  reviewCount:      z.number().int().nonnegative().default(0),
  lastReviewedAt:   z.string().datetime().nullable().default(null),
  difficultyRating: z.number().int().min(0).max(2).default(1),
});

export type CollectionWord = z.infer<typeof collectionWordSchema>;
```

**Date/time format (NFR13):**

| Use | Format | Why |
|---|---|---|
| Persisted "day" identifier (calendar, day-counter) | UTC ISO date `YYYY-MM-DD` (string) | DST/timezone correctness |
| Persisted timestamp (savedAt, recordingDate) | UTC ISO datetime `YYYY-MM-DDTHH:mm:ss.sssZ` (string) | Round-trippable, sortable |
| In-memory time math | `Date` object | JS-native |
| Display to user | Local-time formatted via `Intl.DateTimeFormat` | UX expectation |

Conversion happens at the display boundary — `lib/day-counter` exposes UTC-anchored APIs only; presentation components convert to local for rendering.

**Error format:**

```ts
type LlmError = { kind: ...; providerCode: string; message: string; retryable: boolean; ... };
type RecorderError = { kind: 'permission_denied' | 'unsupported' | 'aborted' | 'unknown'; message: string };
type StorageError = { kind: 'quota_exceeded' | 'access_denied' | 'unknown'; message: string };
```

All app-layer errors are **discriminated unions returned via Result-shaped functions**, not thrown.

```ts
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

async function generateParagraph(...): Promise<Result<ParagraphResult, LlmError>> { ... }
```

Throwing is permitted only for **programmer errors** (assertion failures, never-reached branches) — caught by React error boundaries.

**JSON field naming (LLM responses + offline pack):** `camelCase`. The Zod schema is the contract; LLM prompt explicitly requests `camelCase` field names.

### Communication Patterns

**No event bus.** No pub/sub. State changes flow through:

| Channel | Use |
|---|---|
| React props ↓ | Parent → child |
| Callback props ↑ | Child → parent (`onSaveWord`, `onPlaybackComplete`) |
| `useLocalStorage` hook | Cross-component KV state with auto-rerender on `storage` event |
| Dexie `useLiveQuery` | Cross-component reactive DB queries with auto-rerender on writes |
| URL query params | Only `/calendar?day=N` |

**No global event names**, no action types, no reducers above component scope.

**State management decision tree** (use this order — first match wins):

1. State exists only inside one component's render? → `useState` / `useReducer`
2. State persists to Dexie and ≥2 components need it? → `useLiveQuery(() => db.<table>.<query>())`
3. State persists to localStorage and ≥1 component needs it? → `useLocalStorage<T>(key, default, schema)`
4. Otherwise → reconsider; you probably want #2 or #3

`React.Context` is permitted for theme/font providers only. Not for app state.

### Process Patterns

**Error handling pattern (where errors render):**

| Error origin | Render where | Component |
|---|---|---|
| LLM call failure (provider, schema, network) | Replaces paragraph zone in center column | `<InlineErrorSurface />` |
| IndexedDB write failure (quota, permission) | Inline next to the failing action | `<InlineErrorSurface variant="storage" />` |
| Microphone permission denial | Inline next to record button | Embedded in `<RecordPanel />` |
| Voice load failure (no voices available) | Caption inside Settings voice picker | Embedded in `<VoicePicker />` |
| Programmer error (assertion, unreachable) | React error boundary at route level | `app/<route>/error.tsx` (Next.js convention) |

Banned: toasts, modals, alerts, snackbars, browser `alert()`, `confirm()`, `window.onerror` global handlers.

**Loading state pattern:**

| Operation | Indicator |
|---|---|
| LLM call (paragraph gen) | Skeleton (3 grey lines via `--cream-dim`) replacing paragraph zone |
| Generate-button click | Mini-spinner inline + button text → "Generating…" + button disabled |
| MediaRecorder permission request | Helper text + record button disabled |
| TTS playback | Icon flips to pause-icon (no spinner) |
| IndexedDB read/write | None (instant) |
| Route change | None (instant) |

Banned: full-page loading overlays, fake progress bars, "Loading…" text without visual indicator.

**Retry pattern:**

LLM-only. `lib/llm/generate.ts` implements `withRetry(fn, opts)` — internal helper:

```ts
async function withRetry<T, E extends LlmError>(
  fn: () => Promise<Result<T, E>>,
  opts: { maxAttempts: 2; backoffMs: [1000, 3000] }
): Promise<Result<T, E>>
```

Only retries when `error.retryable === true`. Other layers do NOT implement custom retry — they surface the error.

**Validation timing:**

| What | When | Where |
|---|---|---|
| LLM response | After receive, before render | `lib/llm/generate.ts` (Zod schema check) |
| User-typed API key | On Generate-button click only | `OnboardingShell` / `SettingsForm` |
| Form fields | On submit only (no live validation) | UX §Form Patterns rule 1 |
| Persisted records on first read | Once at app load | `lib/storage/db.ts` `verifyOnLoad()` |
| Inbound query params | On route render | Per page |

### Styling Patterns

**Token system is the single source of truth for color/type/spacing.** Components reference semantic tokens via Tailwind classes — never hex literals, never arbitrary values from outside the token set.

```tsx
// correct — semantic tokens
<div className="bg-surface text-primary border border-divider p-4">

// wrong — arbitrary hex
<div className="bg-[#f5f0e6] text-[#1a1a1a] border-[#d9d2c5] p-[16px]">
```

Banned: arbitrary color values (`bg-[#xxx]`), arbitrary spacing (`p-[17px]`), inline `style={{}}` for color/typography (positioning OK if dynamic), CSS-in-JS libraries.

Class ordering (when many classes): layout → box → typography → color → state. `cn()` from `@/lib/utils` for conditional composition.

### Logging Patterns

`console.warn` for recoverable issues, `console.error` for unrecoverable. `console.log` allowed only during dev — must not ship in committed code.

No logging library. No log levels beyond browser-native. No structured-log JSON. No `debug` package. Per NFR16 + NFR26.

### Comment Patterns

JSDoc on **public exports of `lib/`** modules only — describes purpose, edge cases, gotchas. No JSDoc inside components or routes.

No narration comments inside function bodies (`// loop through items`, `// increment counter`). Only "why" comments — explaining non-obvious intent or trade-off.

```ts
// correct — explains why
// MediaRecorder defaults differ across browsers; store actual MIME with the blob
// so playback uses the right codec on every device.

// wrong — narrates what
// Set the MIME type to webm
```

### Enforcement Guidelines

**All AI Agents implementing stories in this codebase MUST:**

1. Read this `architecture.md` § Implementation Patterns before writing code
2. Use exported Zod schemas as the source of truth for any persisted shape — never hand-write a parallel TS type
3. Place new files using the folder decision tree
4. Use namespaced `audiblytics.*` localStorage keys via the `useLocalStorage` hook
5. Return `Result<T, E>` discriminated unions for fallible operations; throw only for programmer errors
6. Render errors via the appropriate inline surface — never via toast/modal/alert
7. Use semantic tokens for color/spacing/typography — never arbitrary hex/px values
8. Anchor all persisted dates to UTC ISO strings; convert at the display boundary only
9. Mark client components with `'use client'` only when needed (browser API, hook, state)
10. Reference `architecture.md` decision IDs in PR/story descriptions when adding new modules

**Pattern enforcement mechanisms:**

- **`AGENTS.md` / `CLAUDE.md`** at repo root edited to point downstream agents at this section
- **`README.md`** "Development" section restates the folder decision tree
- **ESLint custom rules** (post-MVP if drift observed): forbid `console.log`, forbid `window.localStorage.getItem` outside `useLocalStorage` impl, forbid arbitrary Tailwind values
- **Code review by Priyank** (the only enforcement mechanism in MVP)

**Pattern updates:** Any pattern change requires an explicit revision to this section *before* the implementing story merges. Patterns are immutable within a story; deviation requires architecture-doc edit first.

### Pattern Examples — Anti-Patterns to Reject

```ts
// WRONG — Bare localStorage access
const key = window.localStorage.getItem('apiKey');

// RIGHT — Namespaced + validated
const [keys] = useLocalStorage('audiblytics.providerKeys', {}, providerKeysSchema);

// WRONG — Throwing for app-flow errors
async function generate() {
  if (!apiKey) throw new Error('No key');
}

// RIGHT — Result discriminated union
async function generate(): Promise<Result<ParagraphResult, LlmError>> {
  if (!apiKey) return { ok: false, error: { kind: 'auth', ... } };
}

// WRONG — Toast notification on success
saveWord(word).then(() => toast.success('Word saved!'));

// RIGHT — Optimistic UI / state-flip is the feedback
saveWord(word);  // useLiveQuery automatically re-renders the saved-icon as filled

// WRONG — Modal "Are you sure?" confirmation
<Dialog>Save these settings?</Dialog>

// RIGHT — Single-tap commit (per UX NFR23)
<Button onClick={handleSave}>Save Settings</Button>

// WRONG — Local-time date storage
localStorage.setItem('today', new Date().toLocaleDateString());

// RIGHT — UTC anchored (per NFR13)
recordDayOfUse(new Date());

// WRONG — Hand-written parallel TS type
type Word = { id: string; word: string; ... };

// RIGHT — z.infer<>
type CollectionWord = z.infer<typeof collectionWordSchema>;

// WRONG — Hex literal in component
<div className="bg-[#f5f0e6]">

// RIGHT — Semantic token
<div className="bg-surface">

// WRONG — Default export
export default function RecordPanel() { ... }

// RIGHT — Named export
export function RecordPanel() { ... }
```

## Project Structure & Boundaries

### Requirements → Module Mapping

No epics yet (epics generation comes after architecture). Mapping by FR-cluster instead.

| FR cluster | Lives in |
|---|---|
| FR1, FR9, FR10–FR12, FR14, FR16, FR23 (LLM provider, generation, retry, errors) | `src/lib/llm/` |
| FR4–FR8 (Settings: theme/persona/length/retention/voice) | `src/features/settings/` + `src/lib/storage/use-local-storage.ts` |
| FR2, FR15, FR17–FR19 (Paragraph generation + cache + same-day reuse) | `src/features/paragraph/` |
| FR20, FR23–FR26 (TTS playback, voice load, fallback) | `src/lib/audio/tts.ts` + `src/components/audiblytics/CompositePlayer.tsx` |
| FR21–FR22, FR27–FR30, FR48–FR50 (Word Collection: save, list, review) | `src/features/collection/` |
| FR31–FR36, FR41–FR43 (Voice Journal: record, persist, list, MIME, quota) | `src/features/voice-journal/` + `src/lib/audio/recorder.ts` |
| FR37–FR40 (Day-14 climax: trigger, takeover, decision, persist outcome) | `src/components/audiblytics/Day14Takeover.tsx` + `src/app/_internal/Day14Gate.tsx` + `src/features/day14/` |
| FR44–FR47 (Onboarding flow) | `src/features/onboarding/` + `src/components/audiblytics/OnboardingShell.tsx` |
| FR51–FR55, FR58–FR60 (Calendar, streaks, retention, archive) | `src/features/calendar/` + `src/lib/day-counter/` |
| FR56–FR57, FR61–FR63 (Offline pack: surface, dedupe, quota fallback) | `src/features/offline-pack/` + `scripts/generate-offline-pack.ts` |
| FR64 (Inline error surface) | `src/components/audiblytics/InlineErrorSurface.tsx` |
| NFR12–NFR13 (UTC day-counting, streaks) | `src/lib/day-counter/` |
| NFR14, NFR16–NFR17 (Hard scope boundary, no telemetry, no exfiltration) | `next.config.ts` + `src/lib/llm/client.ts` + `README.md` |
| NFR21–NFR24 (Onboarding ≤3 min, single-tap commits) | `src/features/onboarding/` |
| NFR26 (No global state lib, no test framework) | (architectural absence — no folder) |

### Complete Project Tree

```
audiblytics/
├── README.md                                      # PERSONAL-USE banner; dev workflow; folder decision tree
├── AGENTS.md                                      # Auto-gen by create-next-app; edited to point at architecture.md § Implementation Patterns
├── CLAUDE.md                                      # Same as AGENTS.md (mirror file for Claude Code)
├── .cursor/
│   └── rules/
│       └── architecture.mdc                       # Mirrors AGENTS.md guidance for Cursor
├── package.json                                   # pnpm; deps locked per architecture
├── pnpm-lock.yaml
├── tsconfig.json                                  # Strict; create-next-app default + paths { "@/*": ["./src/*"] }
├── next.config.ts                                 # Hard-scope-boundary build-time guard (NFR14)
├── postcss.config.mjs                             # Tailwind 4 PostCSS plugin
├── eslint.config.mjs                              # Next.js + custom rules (post-MVP)
├── .gitignore                                     # node_modules, .next, .env*.local
├── .env.example                                   # Documents OFFLINE_PACK_PROVIDER_KEY for script
├── .env.local                                     # Gitignored; contains script-only secrets
├── public/
│   └── (favicon if desired; no other static assets initially)
├── scripts/
│   └── generate-offline-pack.ts                   # Standalone Node script; uses gemini-2.5-flash-lite (FR61–FR63)
└── src/
    ├── app/                                       # Next.js App Router
    │   ├── globals.css                            # Tailwind v4 directives + token CSS variables
    │   ├── layout.tsx                             # SERVER component; next/font (EB Garamond, Inter, JetBrains Mono); mounts <Day14Gate>
    │   ├── page.tsx                               # CLIENT; / route → Today
    │   ├── error.tsx                              # Root error boundary (programmer errors)
    │   ├── not-found.tsx                          # 404 (minimal; n=1 unlikely to hit)
    │   ├── _internal/
    │   │   ├── Day14Gate.tsx                      # Layout-mounted gate component (FR37, UX Optimization 3)
    │   │   └── README.md                          # Explains why _internal exists (Next.js underscore = ignored route)
    │   ├── settings/
    │   │   ├── page.tsx                           # /settings (FR4–FR9)
    │   │   └── error.tsx
    │   ├── collection/
    │   │   ├── page.tsx                           # /collection (FR27–FR30)
    │   │   └── error.tsx
    │   ├── review/
    │   │   ├── page.tsx                           # /review (FR48–FR50)
    │   │   └── error.tsx
    │   ├── calendar/
    │   │   ├── page.tsx                           # /calendar?day=N (FR51–FR55, FR58–FR60)
    │   │   └── error.tsx
    │   └── _dev/
    │       └── components/
    │           └── page.tsx                       # /_dev/components — gallery for dev only; gated by NEXT_PUBLIC_DEV_GALLERY env
    ├── components/
    │   ├── ui/                                    # shadcn-managed primitives (7 used)
    │   │   ├── button.tsx
    │   │   ├── input.tsx
    │   │   ├── select.tsx
    │   │   ├── label.tsx
    │   │   ├── dialog.tsx                         # Used as base for Day14Takeover only
    │   │   ├── card.tsx                           # Used as base for StatCardDark/Light
    │   │   └── tooltip.tsx
    │   └── audiblytics/                           # 18 custom composites (UX-spec locked)
    │       ├── DayRail.tsx
    │       ├── HybridProgressRibbon.tsx
    │       ├── TopNav.tsx
    │       ├── ParagraphHero.tsx
    │       ├── HardWordRow.tsx
    │       ├── RecordPanel.tsx
    │       ├── VoiceJournalList.tsx
    │       ├── CompositePlayer.tsx
    │       ├── ButtonPair.tsx
    │       ├── WarmUpDrill.tsx                    # Lazy-loaded via next/dynamic
    │       ├── Day14Takeover.tsx                  # Lazy-loaded via next/dynamic
    │       ├── OnboardingShell.tsx
    │       ├── InlineErrorSurface.tsx             # FR64 + variant="storage"
    │       ├── ProviderChip.tsx
    │       ├── HonestyFooter.tsx
    │       ├── OfflineBadge.tsx                   # FR56–FR57
    │       ├── StatCardDark.tsx
    │       ├── StatCardLight.tsx
    │       └── Flashcard.tsx                      # FR50 flip-card UI (Daily Review)
    ├── features/                                  # Capability-area logic (NFR28)
    │   ├── paragraph/
    │   │   ├── use-paragraph-of-the-day.ts        # FR15, FR17–FR19 (same-day reuse)
    │   │   ├── use-generate-paragraph.ts          # Wraps lib/llm/generate.ts; manages loading state
    │   │   └── select-recycle-words.ts            # FR15 word-recycling selector (oldest unused from collection)
    │   ├── settings/
    │   │   ├── use-settings.ts                    # FR4–FR8 useLocalStorage wrapper
    │   │   ├── use-provider-keys.ts               # FR9 vault accessor
    │   │   └── settings-form.tsx                  # Dumb form bound to Settings page
    │   ├── collection/
    │   │   ├── use-collection.ts                  # FR27 useLiveQuery sorted by savedAt desc
    │   │   ├── use-save-word.ts                   # FR21–FR22 idempotent insert
    │   │   └── use-remove-word.ts                 # FR28 delete word from collection
    │   ├── voice-journal/
    │   │   ├── use-recordings.ts                  # FR35 useLiveQuery
    │   │   ├── use-save-recording.ts              # FR34 persist with MIME + dayOfUse stamp
    │   │   ├── use-recording-state-machine.ts     # FR31–FR33 idle→requesting→recording→stopped
    │   │   ├── use-compare-recordings.ts          # FR36 dual-source compare driver for CompositePlayer
    │   │   └── prune-recordings.ts                # FR41 90-day retention pruner (called by use-prune-on-mount)
    │   ├── warm-up/                               # FR43–FR47 Warm-Up flow
    │   │   ├── drill-library.ts                   # FR44 ≥10 tongue-twister phrases
    │   │   └── use-warm-up-state-machine.ts      # idle → with-pen (30s) → without-pen → done
    │   ├── review/                                # FR48–FR52 Daily Review
    │   │   ├── use-review-queue.ts                # FR49 oldest-first selector by lastReviewedAt
    │   │   ├── use-review-feedback.ts             # FR51 update reviewCount + lastReviewedAt + difficultyRating
    │   │   └── use-flashcard-state.ts             # FR50 flip + Got it/Almost/Forgot state machine
    │   ├── day14/
    │   │   ├── use-day-14-state.ts                # Reads audiblytics.day14State
    │   │   ├── use-day-14-trigger.ts              # FR37 distinctDayOfUse===14 && !fired
    │   │   ├── select-day-1-recording.ts          # FR38 first recording where dayOfUse===1
    │   │   └── persist-day-14-outcome.ts          # FR39–FR40
    │   ├── onboarding/
    │   │   ├── use-onboarding-state-machine.ts    # FR44–FR47 5-step finite state machine
    │   │   └── validate-api-key.ts                # FR46 single-shot validation on Generate click
    │   ├── calendar/
    │   │   ├── use-calendar-grid.ts               # FR55 30-day grid composer
    │   │   ├── use-streak.ts                      # FR57 + NFR12 currentStreak() reactive wrapper
    │   │   ├── use-archived-day.ts                # FR56 paragraphCache + recordings lookup by day
    │   │   ├── evaluate-completion.ts             # FR53 day-completion evaluator (paragraph + (read-it OR recording))
    │   │   └── use-mark-read-it.ts                # FR54 "I read it" action handler
    │   └── offline-pack/
    │       ├── use-offline-pack.ts                # FR56–FR57 surface decision logic
    │       ├── select-from-offline-pack.ts        # FR63 30-day rolling de-dupe selector
    │       └── pack-loader.ts                     # FR62 import script-output JSON into Dexie offlinePack table
    ├── lib/                                       # Cross-cutting infrastructure
    │   ├── utils.ts                               # cn() helper from shadcn (only thing that lives here at root)
    │   ├── llm/                                   # Provider abstraction seam (NFR27)
    │   │   ├── client.ts                          # getProvider(settings); HARD-SCOPE-BOUNDARY runtime guard
    │   │   ├── generate.ts                        # generateParagraph(opts): Result<ParagraphResult, LlmError>
    │   │   ├── models.ts                          # MODEL_BY_PROVIDER lookup table
    │   │   ├── with-retry.ts                      # FR12 internal retry helper [1s, 3s]
    │   │   ├── types.ts
    │   │   ├── prompts/
    │   │   │   └── paragraph.ts                   # buildPrompt({theme, persona, length, recycleWords})
    │   │   ├── schemas/
    │   │   │   └── paragraph.schema.ts            # Zod schema for LLM response (single source of truth)
    │   │   └── errors/
    │   │       ├── index.ts                       # parseLlmError(provider, raw): LlmError; types
    │   │       ├── gemini.ts
    │   │       ├── openai.ts
    │   │       ├── anthropic.ts
    │   │       ├── openrouter.ts
    │   │       └── ollama.ts
    │   ├── storage/
    │   │   ├── db.ts                              # AudiblyticsDB Dexie class + verifyOnLoad()
    │   │   ├── use-local-storage.ts               # Hook with cross-tab sync + Zod validation on read
    │   │   └── types.ts                           # Re-exports of Zod-inferred record types
    │   ├── schemas/                               # Zod schemas for persisted records
    │   │   ├── settings.schema.ts                 # FR4–FR8
    │   │   ├── provider-keys.schema.ts            # FR9
    │   │   ├── collection.schema.ts               # FR21
    │   │   ├── recording.schema.ts                # FR34 (Blob stored alongside)
    │   │   ├── paragraph-cache.schema.ts          # FR19
    │   │   ├── offline-pack.schema.ts             # FR62
    │   │   ├── day14-state.schema.ts              # FR39
    │   │   ├── days-of-use.schema.ts              # NFR12
    │   │   └── completions.schema.ts              # FR53
    │   ├── day-counter/
    │   │   ├── index.ts                           # recordDayOfUse, distinctDaysOfUse, currentStreak, isCompleted
    │   │   ├── format-utc-date.ts                 # 'YYYY-MM-DD' formatter (NFR13)
    │   │   └── use-distinct-day-of-use.ts         # React hook wrapping localStorage read
    │   ├── audio/
    │   │   ├── recorder.ts                        # createRecorder(); MIME auto-detect; 60s cap; permission lifecycle
    │   │   ├── tts.ts                             # speak(); useVoices(); getPersistedVoice() (FR23–FR26)
    │   │   └── types.ts                           # RecorderError, RecorderState
    │   ├── result/
    │   │   └── index.ts                           # Result<T, E> type + helpers (ok, err, map, mapErr)
    │   └── hooks/                                 # Cross-feature hooks (used by ≥2 features)
    │       ├── use-mounted.ts                     # Common SSR-safe mounted check
    │       └── use-prune-on-mount.ts              # Calls features/voice-journal/prune-recordings.ts on app open (FR41)
    └── types/
        └── globals.d.ts                           # Augment Window if needed; ambient types
```

### Architectural Boundaries

**API Boundaries:**

No HTTP API surface owned by this app. The only outbound API is the configured LLM provider — accessed exclusively through `src/lib/llm/generate.ts`. No call site outside `lib/llm/` may import provider-specific SDKs. This is the abstraction seam (NFR27).

**Component Boundaries:**

Three concentric layers with strict import direction:

```
app/         (routes)         ──can import──>  components/, features/, lib/
features/    (capability)     ──can import──>  components/, lib/
components/  (UI atoms)       ──can import──>  lib/, components/
lib/         (infra)          ──can import──>  lib/ only
```

- `lib/` MUST NOT import from `features/`, `components/`, or `app/`
- `components/` MUST NOT import from `features/` or `app/`
- `features/` MAY import from `components/` and `lib/` but MUST NOT import other `features/<other>/` (cross-feature reuse goes through `lib/` instead)
- `app/` is the only layer that composes everything

This direction makes `lib/` independently testable (post-MVP) and reusable.

**Data Boundaries:**

| Boundary | Owner | Crossed via |
|---|---|---|
| localStorage ↔ React | `src/lib/storage/use-local-storage.ts` | `useLocalStorage(key, default, schema)` hook only |
| IndexedDB ↔ React | `src/lib/storage/db.ts` + `dexie-react-hooks` | `useLiveQuery(() => db.<table>.<query>())` |
| LLM provider ↔ App | `src/lib/llm/generate.ts` | `generateParagraph(opts)` returning `Result<ParagraphResult, LlmError>` |
| MediaRecorder ↔ App | `src/lib/audio/recorder.ts` | `createRecorder()` factory |
| SpeechSynthesis ↔ App | `src/lib/audio/tts.ts` | `speak()`, `useVoices()` |
| Calendar/UTC math ↔ App | `src/lib/day-counter/index.ts` | Named exports only |
| Schema validation | `src/lib/schemas/*.schema.ts` + `src/lib/llm/schemas/*.schema.ts` | Imported wherever the shape is used; types via `z.infer<>` |

No raw `localStorage`, `indexedDB`, `MediaRecorder`, `speechSynthesis`, `Date.toLocaleDateString()`, or provider-SDK imports outside the owning module.

### Integration Points

**Internal communication:**

- Parent component → child: props
- Child → parent: callback props (`onSaveWord`, `onPlaybackComplete`)
- Sibling → sibling: shared state lifted to common ancestor OR via reactive store (`useLiveQuery` / `useLocalStorage`) — never via direct refs
- Layout → routes: `Day14Gate` short-circuits rendering at layout level

**External integrations:**

| External | Integration point | Module |
|---|---|---|
| LLM provider HTTP API | Direct fetch via Vercel AI SDK 6 `generateText` | `src/lib/llm/client.ts` + `generate.ts` |
| Browser MediaRecorder | `navigator.mediaDevices.getUserMedia` + `MediaRecorder` | `src/lib/audio/recorder.ts` |
| Browser SpeechSynthesis | `window.speechSynthesis` + `SpeechSynthesisUtterance` | `src/lib/audio/tts.ts` |
| IndexedDB | Dexie 4.4.x | `src/lib/storage/db.ts` |
| localStorage | `window.localStorage` + `storage` event | `src/lib/storage/use-local-storage.ts` |

**Data flow (Today happy-path J2):**

```
User opens / → app/page.tsx renders
  → useParagraphOfTheDay() reads paragraphCache via useLiveQuery (FR19)
  → if same UTC day → render <ParagraphHero> with cached
  → else → useGenerateParagraph() calls lib/llm/generate.ts
    → buildPrompt({theme, persona, length, recycleWords from useCollection oldest-N})
    → generateText({ model: getProvider(settings), output: Output.object({ schema }) })
    → on Result.ok: write to paragraphCache → useLiveQuery rerenders
    → on Result.err: <InlineErrorSurface error={error} /> in paragraph zone
  → User clicks "Save" on <HardWordRow> → useSaveWord() inserts into collection table
  → User taps record on <RecordPanel> → recorder lifecycle → useSaveRecording() persists Blob + MIME
  → useSaveRecording() also calls recordDayOfUse() → daysOfUse[] grows
  → if distinctDaysOfUse() === 14 && !day14State.fired → next route render triggers <Day14Gate>
```

### File Organization Patterns

**Configuration files** (root-level only):
- `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `.gitignore`, `.env.example`, `.env.local`
- No `tailwind.config.ts` — Tailwind v4 uses CSS-in-CSS configuration in `globals.css`

**Source organization:**
- `src/app/` — routing only (one folder = one route; one `page.tsx` per folder)
- `src/components/` — pure presentation; no business logic; no Dexie/localStorage direct access
- `src/features/` — business logic + hooks; one folder per capability
- `src/lib/` — infrastructure; framework-agnostic where possible
- `src/types/` — ambient/global type augmentations only

**Test organization:**

None in MVP (NFR26). When tests are added post-MVP:
- Co-located with source: `<file>.test.ts` next to `<file>.ts`
- Vitest as the runner (matches Vite-aligned tooling philosophy)
- No separate `__tests__` folder, no top-level `tests/` folder

**Asset organization:**
- `public/` — static assets served at root path; minimal (favicon if used)
- Fonts loaded via `next/font` from layout — NOT placed in `public/`
- No image assets planned in MVP per UX (typography-led design)

### Development Workflow Integration

**Development server:**
- `pnpm dev` → `next dev --turbopack` (Turbopack default in Next.js 16)
- Localhost — no HTTPS needed for `getUserMedia` on localhost
- Hot reload: instant for React components; full restart for `next.config.ts` changes

**Build process:**
- `pnpm build` → `next build` → `.next/` output
- Build emits warning if `NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE !== 'true'` in production (NFR14 guard)
- Bundle analyzer: `pnpm dlx @next/bundle-analyzer` for occasional manual checks

**Deployment (optional):**
- `pnpm build && pnpm start` for local serving, OR
- Vercel deploy with `NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE=true` env var (acknowledges personal-use scope)

**Offline-pack script:**
- `pnpm tsx scripts/generate-offline-pack.ts` — runs independently; reads `.env.local` for provider key; writes JSON output to a known path; user imports into running app via Settings → "Load offline pack" UI (FR62)

### Boundary Enforcement Mechanisms

| Rule | Mechanism |
|---|---|
| `lib/` cannot import from `features/`, `components/`, `app/` | TypeScript path linting (post-MVP ESLint rule); manual review in MVP |
| Component cannot import from another `features/<other>/` | Same as above |
| Provider SDKs only imported in `lib/llm/` | grep audit on PR; ESLint rule post-MVP |
| Raw `window.localStorage` only in `lib/storage/use-local-storage.ts` | grep audit on PR; ESLint rule post-MVP |
| Raw `MediaRecorder` only in `lib/audio/recorder.ts` | grep audit on PR; ESLint rule post-MVP |
| Server component default in `layout.tsx`; everything else `"use client"` as needed | Code review by Priyank |

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility — verified:**

| Pair | Compatible? | Notes |
|---|---|---|
| Next.js 16 + React 19 + Tailwind 4 | Yes | Next.js 16 ships React 19 by default; Tailwind 4 supported since Next.js 15.1+ |
| Tailwind 4 + shadcn/ui | Yes | shadcn published Tailwind 4 + React 19 migration Jan 2026; `npx shadcn@latest init` auto-configures |
| Vercel AI SDK 6 + all 5 providers | Yes | `@ai-sdk/google`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@openrouter/ai-sdk-provider`, `ollama-ai-provider-v2` all v6-compatible |
| Dexie 4.4.x + dexie-react-hooks 4.2.x + React 19 | Yes | dexie-react-hooks 4.2 explicitly supports React 19 |
| Zod + AI SDK 6 `Output.object()` | Yes | AI SDK 6 accepts Zod schemas natively |
| Turbopack (default in Next 16) + everything | Yes | No known incompatibilities |

No version conflicts. No contradictory decisions.

**Pattern Consistency — verified:**

- Naming patterns (PascalCase components, kebab-case lib files, camelCase symbols) align with Next.js + React idiom
- Folder decision tree maps cleanly onto the proposed structure (every leaf has a defined home)
- `Result`-discriminated-union pattern aligns with the `LlmError` type and the no-throw philosophy
- Token-only styling aligns with Tailwind 4's CSS-variable-driven theming

**Structure Alignment — verified:**

- All 18 UX-spec custom composites + 1 added Flashcard (= 19) have explicit file paths in `components/audiblytics/`
- All 7 used shadcn primitives mapped to `components/ui/`
- All 5 routes mapped to `app/<route>/page.tsx`
- All cross-cutting infra (LLM, storage, day-counter, audio, schemas, result, hooks) mapped to `lib/`
- Capability-area colocation (NFR28) reflected via `features/` top-level folder with 9 capabilities

### Requirements Coverage Validation

Walked every FR1–64 and NFR1–28 against the architecture. Results:

**FR coverage (post-remediation):** 64 of 64 ✅
**NFR coverage:** 28 of 28 ✅

### Gap Analysis Results

7 critical/important gaps were identified during validation and **have been remediated inline above** in § Project Structure & Boundaries:

| # | Gap | Severity | Affected FR | Remediation (already applied to project tree) |
|---|---|---|---|---|
| G1 | No `use-remove-word.ts` hook in `features/collection/` | Critical | FR28 | Added `features/collection/use-remove-word.ts` |
| G2 | `CompositePlayer` exists but dual-source compare mode (today vs earliest, or any two) not explicit | Important | FR36 | Added `features/voice-journal/use-compare-recordings.ts` driving `<CompositePlayer mode="compare" sourceA sourceB />` |
| G3 | No 90-day retention pruner; only schema mentioned retention policy | Critical | FR41 | Added `features/voice-journal/prune-recordings.ts` + `lib/hooks/use-prune-on-mount.ts` (invoked from `layout.tsx`) |
| G4 | `WarmUpDrill` component listed but no `features/warm-up/` folder with drill library + state machine | Critical | FR43–FR47 | Added `features/warm-up/{drill-library.ts, use-warm-up-state-machine.ts}`; drill-library exports ≥10 phrases per FR44 |
| G5 | No separate `features/review/` for FR50–FR52 feedback handlers; flashcard UI component missing | Critical | FR50–FR52 | Moved `use-review-queue.ts` from `features/collection/` → `features/review/`; added `use-review-feedback.ts`, `use-flashcard-state.ts`, and `components/audiblytics/Flashcard.tsx` |
| G6 | No completion evaluator function; `completions` schema existed but no logic | Critical | FR53 | Added `features/calendar/evaluate-completion.ts`; called from `useSaveRecording`, `useMarkReadIt`, and on paragraph-generation success |
| G7 | "I read it" action handler not explicit | Important | FR54 | Added `features/calendar/use-mark-read-it.ts`; wired into `<HonestyFooter>` per UX spec |

**Minor gaps (acknowledged, not blocking):**

- **NFR20 (5-min session) is implicit only** — no measurement mechanism. Acceptable for n=1 (Priyank measures informally). No remediation needed.
- **NFR1 (cold load <2s) is unverified** — Next.js 16 + ~all-client-components could exceed 2s on cold load; bundle analyzer is the only check. Mitigation already in plan: `next/dynamic` for `WarmUpDrill` + `Day14Takeover`. Watch list item, not blocker.
- **shadcn-init + Tailwind 4 + Next.js 16 first-time integration risk** — the combination is recent (Q1 2026); recommend running `pnpm dlx shadcn@latest init` against an empty `create-next-app` first to verify before authoring component stories. Documented as story-1 acceptance check.

### Implementation Readiness Validation

After applying all 7 gap remediations:

| Check | Status |
|---|---|
| All 64 FRs have specific module(s) | ✅ |
| All 28 NFRs have architectural support | ✅ |
| Every UX composite has a file path | ✅ (18 spec + 1 added Flashcard) |
| Every shadcn primitive has a file path | ✅ (7/7) |
| Versions verified for top-level deps | ✅ (Next 16, React 19, Tailwind 4, AI SDK 6, Dexie 4.4, dexie-react-hooks 4.2) |
| Naming, folder, error, styling, date patterns documented with examples | ✅ |
| Cross-component dependency graph documented | ✅ |
| Build-, runtime-, doc-level guards for hard scope boundary | ✅ (3 guards) |
| Implementation sequence (dependency order) documented | ✅ (14-step in § Decision Impact Analysis) |

### Architecture Completeness Checklist

**Requirements Analysis** — ✅
- [x] Project context thoroughly analyzed (Step 2)
- [x] Scale and complexity assessed (n=1 SPA, low complexity with local hotspots)
- [x] Technical constraints identified (browser API access, free-tier quotas, hard scope boundary)
- [x] Cross-cutting concerns mapped (provider abstraction, IndexedDB, day-counting, errors, Zod, audio I/O)

**Architectural Decisions** — ✅
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined (provider seam, error parsing, retry, schema validation)
- [x] Performance considerations addressed (skeleton, code-split, instant Dexie reads)

**Implementation Patterns** — ✅
- [x] Naming conventions established (file, symbol, localStorage, Dexie columns, props)
- [x] Structure patterns defined (capability colocation, folder decision tree, layered import direction)
- [x] Communication patterns specified (no event bus; props + reactive stores)
- [x] Process patterns documented (errors, loading, retry, validation timing)

**Project Structure** — ✅ (after remediation)
- [x] Complete directory structure defined
- [x] Component boundaries established (`lib/` ← `components/` ← `features/` ← `app/`)
- [x] Integration points mapped (5 external surfaces + 7 data boundaries)
- [x] Requirements to structure mapping complete (FR1–64 all assigned)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** HIGH

**Key Strengths:**
- Provider abstraction is a single, defensible seam (NFR27)
- Hard scope boundary defended at three layers (build, runtime, docs) so the n=1 assumption can't be silently broken
- Day-14 gate placed at layout-level, structurally URL-unbypassable (FR37 + UX Optimization 3)
- Zod schemas as single source of truth eliminate parallel-type-drift risk
- UTC-anchored day-counting primitive eliminates DST/timezone correctness bugs (NFR13)
- All UX composites mapped to specific files; no vague "we'll figure it out"
- Implementation sequence is dependency-ordered — agents won't accidentally build a leaf before its trunk

**Areas for Future Enhancement (Public-Future scope, NOT MVP):**
- Backend proxy + server-side key vault (when multi-user)
- Encryption-at-rest (when multi-user; trades against onboarding NFR21)
- Streaming LLM responses (when partial-validation patterns mature)
- Test framework (Vitest co-located) once Priyank wants regression confidence
- ESLint custom rules for boundary enforcement (currently relies on review)
- Telemetry for funnel measurement (when scale > n=1)

### Implementation Handoff

**AI Agent Guidelines:**

1. Read this `architecture.md` end-to-end (especially § Implementation Patterns and § Project Structure) before writing any code
2. Implement stories in the dependency order documented in § Decision Impact Analysis (14-step sequence)
3. Use exported Zod schemas as the source of truth for any persisted shape
4. Follow the folder decision tree for any new file placement
5. Never deviate from layered import direction (`app/` → `features/` → `components/` → `lib/`)
6. Reference architecture decision IDs in PR descriptions when adding new modules

**First Implementation Priority — Story 1.1 (Project Init):**

```bash
pnpm create next-app@latest audiblytics \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --turbopack \
  --use-pnpm

cd audiblytics
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button input select label dialog card tooltip
pnpm add ai @ai-sdk/google @ai-sdk/openai @ai-sdk/anthropic @openrouter/ai-sdk-provider ollama-ai-provider-v2 dexie@^4.4 dexie-react-hooks@^4.2 zod
pnpm add -D @next/bundle-analyzer tsx
```

Then verify the trio works (Next 16 + Tailwind 4 + shadcn) by reskin-ing one primitive (Button → forest accent). If that compiles, proceed to Story 1.2 (token system).
