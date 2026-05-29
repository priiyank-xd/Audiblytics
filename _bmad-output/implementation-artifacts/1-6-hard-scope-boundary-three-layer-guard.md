# Story 1.6: Hard-Scope-Boundary Three-Layer Guard

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want three structural guards (build-time in `next.config.ts`, runtime in `lib/llm/client.ts`, documentation in `README.md` + `app/layout.tsx`) that each enforce the n=1 personal-use scope from a different layer,
So that the API-key-in-localStorage architecture (NFR14, AR15) cannot be silently broken by a future contributor (or future me) — public deployment requires consciously editing all three guards, not just one.

## Acceptance Criteria

> Sourced verbatim from `epics.md § Story 1.6` (lines 573–595). Re-formatted as numbered AC for traceability against tasks.

1. **AC1 — Build-time guard in `next.config.ts`** (per AR15 part 1 epics line 176, architecture lines 326, 538, 968, 1234). When `pnpm build` (or `next build`) runs with `NODE_ENV === 'production'` AND `process.env.NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE !== 'true'`, the build emits a clearly worded `console.warn` to stderr naming the hard-scope-boundary policy and pointing to `architecture.md § Authentication & Security` / NFR14. The warning string MUST contain the literal token `HARD-SCOPE-BOUNDARY` so it is grep-able in CI logs and not silently swallowed.

2. **AC2 — Build still completes (warning, not error)** (per epics line 584). The guard MUST NOT call `process.exit()`, MUST NOT throw, and MUST NOT cause `next build` to exit non-zero. Vercel deployments with `NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE=true` set still build cleanly with no warning emitted; deployments without the env var emit the warning but the build succeeds. Verified by Task 5.2.

3. **AC3 — Guard runs at config-load time, not at runtime** (per architecture line 968). The warning emission lives at the top of `next.config.ts` module body — it executes when Next.js imports the config during the build pipeline, NOT inside a route handler or middleware. This guarantees the warning fires once per build (not once per request) and surfaces in the build log even when the build is run inside CI without anyone watching dev-server output.

4. **AC4 — Dev mode (`pnpm dev`) does NOT emit the warning** (per AC1 — `NODE_ENV === 'production'` gate). Local development with `next dev` runs `NODE_ENV === 'development'` and the guard is skipped entirely. Story 1.3's `pnpm dev` smoke test continues to pass with no new warnings vs. Story 1.5's dev-server output. Verified by Task 5.3.

5. **AC5 — `assertClientOnlySafeContext()` runtime guard exported from `src/lib/llm/client.ts`** (per AR15 part 2 epics line 176, architecture line 327, epics lines 586–589). A new function `export function assertClientOnlySafeContext(): void` is added to `src/lib/llm/client.ts`. The function checks `typeof window === 'undefined'` and, if true, throws `new Error('Audiblytics LLM client cannot run server-side — see architecture.md NFR14')`. The function signature is `(): void` — it returns nothing on the happy path; it throws on failure. NEVER returns a `Result.err` because this is a programmer-error path (architecture line 737), not an app-flow error.

6. **AC6 — `assertClientOnlySafeContext()` runs at module load** (per epics line 588). The function is invoked at the top of `src/lib/llm/client.ts` (not inside `getProvider()`) so that any accidental server-side import of the module — e.g. an `import { getProvider } from '@/lib/llm/client'` from a server component or a Next.js route segment that runs SSR — fails immediately with a clear error message rather than executing provider construction in a context where `localStorage` is unavailable and API-key contents could end up in server logs. The order in `client.ts` is: imports → `assertClientOnlySafeContext()` invocation → `assertClientOnlySafeContext` function definition → `ClientSettings` type → `getProvider` → `requireKey`.

7. **AC7 — Story 1.5's placeholder comment is REMOVED and replaced** (per Story 1.5 AC16 epics line 175 + Story 1.5 Task 6.7). Story 1.5 left a placeholder comment block at the top of `src/lib/llm/client.ts` reading "Story 1.6 will add `assertClientOnlySafeContext()` here that throws when `typeof window === 'undefined'`." Story 1.6 deletes that placeholder block (it has served its purpose as a wiring marker) and replaces it with the real `assertClientOnlySafeContext()` implementation, the module-load invocation, and a concise JSDoc comment on the function explaining the n=1 boundary. The placeholder string `"Story 1.6 will add"` MUST NOT remain in the file after this story.

8. **AC8 — Error message exact wording** (per epics line 589). The thrown `Error.message` MUST be exactly `'Audiblytics LLM client cannot run server-side — see architecture.md NFR14'` (em-dash `—`, not hyphen-minus). This wording is the contract — it is grep-able, scannable, and points the future-Priyank-debugging-server-error directly at the architecture-doc anchor.

9. **AC9 — `README.md` PERSONAL-USE banner present** (per AR15 part 3 epics line 176, architecture lines 328, 959, 1328). The first H1 section of `README.md` is a clearly visible "PERSONAL-USE ONLY" SECURITY block referencing NFR14 (originally created by Story 1.1 Task 10). Story 1.6 VERIFIES this is still present (it was added by 1.1; verify by `head` / `rg`). If the banner has been deleted or weakened, restore it per Story 1.1 Task 10.1 spec. **Story 1.6 does NOT rewrite or relocate the banner** — only verifies its continued presence. If verification finds the banner intact (expected case post-1.1), no edit is made to `README.md`.

10. **AC10 — `app/layout.tsx` HARD-SCOPE-BOUNDARY banner comment** (per AR15 part 3 epics line 176, architecture line 328, epics line 594). The first non-shebang line of `src/app/layout.tsx` is the comment `// HARD-SCOPE-BOUNDARY: API keys in localStorage; see architecture.md § Authentication & Security`. Placement: ABOVE all imports and ABOVE any other comment (including any comments Story 1.3 added). The exact string match is required so grep audits pick it up consistently. Story 1.3 left `app/layout.tsx` without this comment — Story 1.6 prepends it.

11. **AC11 — Three-file removal friction enforced** (per AR15 epics line 176, architecture line 330, epics line 595). Removing the hard-scope boundary structurally requires editing all three files: `next.config.ts` (delete the build-time guard), `src/lib/llm/client.ts` (delete `assertClientOnlySafeContext()` AND its module-load invocation), AND `app/layout.tsx` + `README.md` (delete the doc guards). No single-file removal silently disables the boundary — verified by inspection (Task 8). The guards are deliberately **redundant** (any one alone is enough to fail-loud); the redundancy is the point.

12. **AC12 — `pnpm build` exits 0 with one expected warning when `NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE` is unset** (per AC1, AC2). With Story 1.6 applied and `NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE` left unset, `pnpm build` exits 0 (success) and prints exactly one new warning containing `HARD-SCOPE-BOUNDARY`. With `NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE=true` set, `pnpm build` exits 0 with zero new warnings vs. Story 1.5's baseline. With `pnpm dev`, no new warnings vs. Story 1.5's baseline.

13. **AC13 — `pnpm tsc --noEmit` exits 0** (architecture line 873 — strict mode is non-negotiable). All edits this story makes pass strict typecheck: `assertClientOnlySafeContext()` is `(): void`, the `next.config.ts` warning emission is type-clean (no `any`, no `as`), the `app/layout.tsx` banner comment is a JS comment (not a JSDoc tag) and has no TS impact.

14. **AC14 — Layered import compliance preserved** (per AR18 epics line 179, architecture lines 1130–1146). `src/lib/llm/client.ts` continues to import only from third-party SDK packages, `@/lib/schemas/provider-keys.schema` (type-only), and `./models` — adding `assertClientOnlySafeContext()` does NOT introduce any new cross-layer imports. `src/app/layout.tsx` continues to be a server component (no `'use client'`) and the new banner comment is non-functional. `next.config.ts` is config-layer code; no `src/` imports.

### BDD format (verbatim mirror of `epics.md § Story 1.6` lines 581–595)

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

## Tasks / Subtasks

- [ ] **Task 1 — Read existing files this story modifies (UPDATE — non-negotiable)** (AC: all)
  - [ ] 1.1 Read `next.config.ts` fully. Document its current state in dev notes: it ships as the create-next-app default (per Story 1.1 Task 1.4) — likely an empty `NextConfig` export. Story 1.6 ADDS a top-of-module guard block; preserve any other config the file already contains.
  - [ ] 1.2 Read `src/lib/llm/client.ts` fully. Document its current state: post-Story-1.5 it contains the placeholder comment block at the top ("Story 1.6 will add `assertClientOnlySafeContext()` here…"), provider SDK imports, the `ClientSettings` type, the `getProvider` function, and the `requireKey` helper. Story 1.6 REPLACES the placeholder block with the real function + invocation; preserve all of `getProvider`, `requireKey`, and the imports.
  - [ ] 1.3 Read `src/app/layout.tsx` fully. Document its current state: post-Story-1.3 it is a server component with `next/font` loaders, `globals.css` import, three-column shell composition, no `'use client'` directive. Story 1.6 PREPENDS a single-line banner comment; preserve everything else exactly.
  - [ ] 1.4 Read `README.md` fully. Document its current state: post-Story-1.1 it has a PERSONAL-USE ONLY banner as the first content block (Story 1.1 Task 10). Story 1.6 only VERIFIES the banner is still present — no edit unless it has been removed/weakened.
  - [ ] 1.5 NEVER skip Task 1 reads. Editing without first reading is the primary cause of regressions (this rule is in `bmad-create-story/SKILL.md` and `architecture.md` line 873). Document each file's pre-edit state in Dev Agent Record § Debug Log References before any write.

- [ ] **Task 2 — Modify `next.config.ts`: add build-time guard** (AC: 1, 2, 3, 4)
  - [ ] 2.1 Open `next.config.ts`. Preserve the existing `NextConfig` export (likely empty defaults from create-next-app). The guard is a side-effecting top-of-module block, not a config field.
  - [ ] 2.2 Implementation:
    ```ts
    import type { NextConfig } from 'next';

    /**
     * HARD-SCOPE-BOUNDARY build-time guard (AR15 part 1, NFR14).
     * Emits a clearly-worded warning when a production build runs without
     * the explicit `NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE=true` env var.
     * Forces a conscious override to deploy publicly — the API-key-in-
     * localStorage architecture is acceptable for n=1 personal use only.
     *
     * The guard is a `console.warn` (not `throw`) by deliberate choice:
     * Vercel deploys WITH the env var set should build cleanly; deploys
     * WITHOUT the env var should still build (Priyank can self-deploy on
     * personal LAN under HTTPS) but the warning surfaces in CI logs and
     * `pnpm build` output as a friction point.
     *
     * Sources: architecture.md lines 324–330, 538; epics.md AR15 (line 176).
     */
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE !== 'true'
    ) {
      console.warn(
        '\n⚠ HARD-SCOPE-BOUNDARY: Audiblytics is a single-user personal app. ' +
          'API keys live in browser localStorage and the browser calls the LLM ' +
          'provider directly — acceptable for n=1 use ONLY. Public deployment ' +
          'is forbidden until a backend proxy closes this gate.\n' +
          '  → Set NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE=true to acknowledge ' +
          'this scope and silence this warning.\n' +
          '  → See architecture.md § Authentication & Security (NFR14, AR15).\n',
      );
    }

    const nextConfig: NextConfig = {
      // existing config fields preserved here
    };

    export default nextConfig;
    ```
  - [ ] 2.3 The guard runs at module-load time when Next.js imports `next.config.ts` during build/dev startup. **Do NOT** wrap the guard in a function and call it later — the side-effect-on-import shape is what makes it impossible to bypass without deleting the block.
  - [ ] 2.4 NEVER use `throw new Error(...)` here. AC2 is explicit: build must still complete. A throw would fail the build and break Vercel deploys even with the env var set if the env-var check were ever broken.
  - [ ] 2.5 NEVER use `process.exit(1)`. Same reason as 2.4 — this is a warning, not an error.
  - [ ] 2.6 The literal token `HARD-SCOPE-BOUNDARY` MUST appear in the warning string verbatim (per AC1) — it is the grep anchor for CI log inspection and the doc-guard string in `app/layout.tsx`.
  - [ ] 2.7 The leading `\n` and trailing `\n` in the warning are deliberate — they create visual separation in build logs so the warning isn't lost between Next.js's own build chatter.
  - [ ] 2.8 The `process.env.NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE !== 'true'` comparison is string-equality, NOT truthiness. Setting the env var to `'1'` or `'yes'` does NOT silence the warning — only `'true'` does. This is intentional (architecture line 326 specifies the literal string `'true'`).
  - [ ] 2.9 NEVER read the env var via a wrapper or helper. The literal `process.env.NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE` access is what makes the guard grep-friendly. A future contributor inspecting `next.config.ts` should see the env-var name in plain sight.
  - [ ] 2.10 If `next.config.ts` already exports `nextConfig` differently (e.g. wrapped in `withSomething(...)` plugins from create-next-app's later versions), preserve the wrapping — the guard goes ABOVE the wrapping, not inside it.

- [ ] **Task 3 — Modify `src/lib/llm/client.ts`: replace placeholder with real guard** (AC: 5, 6, 7, 8)
  - [ ] 3.1 Open `src/lib/llm/client.ts`. Locate the placeholder JSDoc/comment block at the top of the file (post-Story-1.5: a multi-line comment containing the string "Story 1.6 will add `assertClientOnlySafeContext()`"). Delete the entire placeholder block.
  - [ ] 3.2 Implementation — insert at the top of the file (between imports and the existing `ClientSettings` type / `getProvider` function):
    ```ts
    /**
     * Asserts that the LLM client module is being executed in a browser-only
     * context (n=1 personal-use scope per NFR14, AR15). Throws if
     * `typeof window === 'undefined'` — i.e. if the module is accidentally
     * imported by a server component, API route, middleware, or any other
     * Next.js path that runs in the Node.js runtime.
     *
     * The guard exists because:
     *  - API keys live in browser `localStorage` (NFR14 — n=1 acceptable boundary).
     *  - Server-side LLM calls would expose key contents in server logs.
     *  - Vercel server logs are persistent and indexed — leaking once is leaking forever.
     *
     * The runtime guard is one of three structural enforcement points; the
     * build-time guard lives in `next.config.ts` and the documentation guards
     * live in `README.md` + `app/layout.tsx`. Removing the boundary requires
     * editing all three files (architecture.md § Authentication & Security).
     *
     * Sources: architecture.md lines 324–330, 327; epics.md AR15 (line 176);
     * Story 1.6 AC5–AC8 + AC11.
     */
    export function assertClientOnlySafeContext(): void {
      if (typeof window === 'undefined') {
        throw new Error(
          'Audiblytics LLM client cannot run server-side — see architecture.md NFR14',
        );
      }
    }

    // Run at module load — any accidental server-side import fails immediately
    // with the clear error above rather than constructing a provider client in
    // a context where localStorage is unavailable and key contents could end up
    // in server logs (AR15 part 2).
    assertClientOnlySafeContext();
    ```
  - [ ] 3.3 The error message MUST be exactly `'Audiblytics LLM client cannot run server-side — see architecture.md NFR14'` per AC8. Note the em-dash `—` (U+2014), not a hyphen-minus `-`. This is the wording locked in epics line 589 and architecture line 327.
  - [ ] 3.4 The function signature is `(): void` — no params, no return value, throws on failure. **Do NOT** return a `Result.err` here. Architecture line 737: throwing is permitted only for programmer errors (assertion failures, never-reached branches), and an SSR-context import IS a programmer error. App-flow errors return `Result`; this is not an app-flow error.
  - [ ] 3.5 The module-load invocation `assertClientOnlySafeContext();` MUST be the LAST top-level statement before the existing `ClientSettings` type / `getProvider` function definitions. Placement order: imports → `assertClientOnlySafeContext` function definition → `assertClientOnlySafeContext()` invocation → `ClientSettings` type → `getProvider` → `requireKey`. The invocation runs synchronously when the module is imported.
  - [ ] 3.6 NEVER call `assertClientOnlySafeContext()` from inside `getProvider()`. Calling it inside `getProvider` would still let the module body itself execute server-side (constructing the provider SDK module references), and the placeholder comment Story 1.5 left specifically calls out "runs at module load" as the contract. Module-load invocation is the contract.
  - [ ] 3.7 The function is `export`-ed (named export — architecture lines 680, 924–928) so that callers (e.g. `generate.ts` in MVP, future error-recovery hooks) MAY also call it defensively if a code path bypasses module-load (currently none does). The export is a future-proofing affordance; consumers don't have to call it.
  - [ ] 3.8 NEVER widen the check to `typeof window !== 'object'`. The canonical SSR-detection check is `typeof window === 'undefined'` per Next.js docs and React community convention. Widening introduces false positives in edge runtimes (Cloudflare Workers, Deno) where `window` may be partially polyfilled.
  - [ ] 3.9 The placeholder block from Story 1.5 (the JSDoc/comment containing "Story 1.6 will add") MUST be deleted. Leaving the placeholder + adding the real implementation creates a self-contradicting file. Verify by `rg "Story 1\.6 will add" src/lib/llm/client.ts` returning zero matches after the edit (Task 8.4).
  - [ ] 3.10 NEVER wrap the throw in a `try/catch`. The whole point is for the throw to propagate to the React error boundary or to the server-side build/runtime as an unhandled exception, surfacing the violation immediately. Catching it would defeat the guard.
  - [ ] 3.11 NEVER add `'use client'` to `src/lib/llm/client.ts`. Architecture line 426 — `'use client'` is for React components only. `client.ts` is a pure module; the file's name reflects its conceptual role (the LLM "client" abstraction), not a React directive. The `assertClientOnlySafeContext` runtime check IS the boundary enforcement; `'use client'` would be redundant and incorrect.

- [ ] **Task 4 — Modify `src/app/layout.tsx`: prepend HARD-SCOPE-BOUNDARY banner comment** (AC: 10, 14)
  - [ ] 4.1 Open `src/app/layout.tsx`. Locate the very first line of the file — post-Story-1.3 this should be either an `import` statement or a leading JSDoc/comment Story 1.3 added (per Task 1.3 read).
  - [ ] 4.2 Prepend exactly this single-line comment at the very top of the file (above all imports, above any other comment):
    ```tsx
    // HARD-SCOPE-BOUNDARY: API keys in localStorage; see architecture.md § Authentication & Security
    ```
  - [ ] 4.3 The comment string is the EXACT match required by AC10 + epics line 594: `// HARD-SCOPE-BOUNDARY: API keys in localStorage; see architecture.md § Authentication & Security`. NEVER paraphrase, abbreviate, or split across multiple lines. Grep audits depend on the exact string.
  - [ ] 4.4 Preserve EVERY existing line in `app/layout.tsx` exactly. Story 1.3 wired `next/font` loaders, the `<html lang="en">` root, `<body>` with the three font CSS variables, the three-column shell composition (TopNav + DayRail + StatRail + HonestyFooter), and `import './globals.css'`. None of that changes.
  - [ ] 4.5 NEVER add `'use client'` to `app/layout.tsx`. Architecture lines 425–428: layout MUST stay a server component (it hosts `next/font`). The banner comment is a non-functional comment — it has zero effect on server-vs-client boundary.
  - [ ] 4.6 NEVER convert the comment to a JSDoc `/** */` block. A line comment `//` is the canonical "banner comment at top of file" form per architecture line 328 + Story 1.6 AC10 — JSDoc would render in autodoc tools and might be picked up by linters that complain about no-symbol JSDoc on a non-symbol context.
  - [ ] 4.7 If `app/layout.tsx` already starts with a non-`HARD-SCOPE-BOUNDARY` comment (e.g. Story 1.3 might have added a `// src/app/layout.tsx` filename comment per its Task 5 sketch), the new banner comment goes ABOVE it. The banner is line 1.
  - [ ] 4.8 NEVER add the banner comment anywhere other than `app/layout.tsx`. Other files (`page.tsx`, `error.tsx`, etc.) do NOT carry it — the doc guard is specifically the layout file because it's the entry point composed for every route.

- [ ] **Task 5 — Verify `README.md` PERSONAL-USE banner** (AC: 9)
  - [ ] 5.1 Read `README.md` (Task 1.4 already loaded the content). Locate the first H1 section — it should match Story 1.1 Task 10's spec: a PERSONAL-USE ONLY banner referencing NFR14 / AR15. Acceptable forms include a fenced quote block, a callout block, a section heading like `## ⚠ PERSONAL USE ONLY — n=1`, etc.
  - [ ] 5.2 Verify by `rg -n "PERSONAL.USE|personal.use|n=1|NFR14|AR15" README.md` — expect at least one match in the first ~30 lines. If the banner is intact (expected case), record the verification in Dev Agent Record § Completion Notes and DO NOT modify the file.
  - [ ] 5.3 ONLY IF the banner has been deleted or weakened post-1.1: restore it per Story 1.1 Task 10.1 spec. The fallback restoration text, if needed:
    ```md
    > **PERSONAL USE ONLY — n=1.** API keys live in browser localStorage; deploying this app publicly is forbidden until a backend proxy is introduced. See `architecture.md § Hard-Scope-Boundary` (AR15) and `architecture.md § Authentication & Security` (NFR14).
    ```
  - [ ] 5.4 NEVER rewrite the banner to a "softer" version (e.g. "Note: this app is intended for personal use…"). The banner's tone — direct, alarming, security-focused — is the doc guard's load-bearing structure. Softening it weakens the friction.
  - [ ] 5.5 NEVER move the banner below the project name / install instructions. The banner is the FIRST content a future contributor (or future Priyank) sees when opening the repo. Burying it below the install steps means a new agent could read & follow the install before encountering the scope warning. AR15 part 3 is explicit: "README.md opens with the banner".

- [ ] **Task 6 — `pnpm build` smoke tests** (AC: 1, 2, 4, 12)
  - [ ] 6.1 With Story 1.6's edits applied, run `pnpm build` (or the equivalent `next build` command) WITHOUT setting `NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE`. Expect:
    - Exit code 0 (success).
    - Stderr contains the literal string `HARD-SCOPE-BOUNDARY` (the warning fired).
    - No new errors vs. Story 1.5's build baseline.
  - [ ] 6.2 Run `NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE=true pnpm build`. Expect:
    - Exit code 0 (success).
    - Stderr does NOT contain `HARD-SCOPE-BOUNDARY` (warning suppressed).
    - Zero new warnings vs. Story 1.5's build baseline.
  - [ ] 6.3 Run `pnpm dev` (i.e. `next dev`). Expect:
    - Dev server boots cleanly.
    - Stderr does NOT contain `HARD-SCOPE-BOUNDARY` (the `NODE_ENV === 'production'` gate suppresses it in dev mode).
    - The browser at `http://localhost:3000` continues to render Story 1.3's shell layout (no regressions from the layout banner comment).
  - [ ] 6.4 If smoke test 6.1 fails (no warning fires), debug:
    - Verify the env-var comparison is `!== 'true'` (string equality), not falsy-check.
    - Verify the guard is at module-load top-level, not inside a function.
    - Verify `NODE_ENV === 'production'` at build time — Next.js sets this automatically for `next build`.
  - [ ] 6.5 If smoke test 6.3 fails (server-side import error fires in dev), debug:
    - The dev mode renders `app/layout.tsx` server-side first (server component); but `app/layout.tsx` does NOT import `@/lib/llm/client` directly. So `assertClientOnlySafeContext()` should NOT fire from the layout. If it does, some Story 1.3 / 1.5 code path is incorrectly importing `client.ts` — debug the import chain.
    - Story 1.5's `client.ts` is consumed only by `generate.ts`; neither is imported anywhere in the codebase yet (Story 1.10 is the first consumer). So the runtime guard is a latent invariant in 1.6 — it activates when 1.10 wires the first consumer.

- [ ] **Task 7 — `pnpm tsc --noEmit` and lint** (AC: 13, 14)
  - [ ] 7.1 Run `pnpm tsc --noEmit`. Expect zero errors. Most likely failure modes:
    - `next.config.ts` typing: ensure `import type { NextConfig } from 'next'` is preserved; the guard block's `process.env` accesses are typed via `NodeJS.ProcessEnv` (no cast needed in strict mode for string lookup).
    - `src/lib/llm/client.ts`: `assertClientOnlySafeContext(): void` is explicit; the `if (typeof window === 'undefined') throw new Error(...)` is type-clean.
    - `src/app/layout.tsx`: a JS comment has no TS impact; if a stray edit broke the existing `RootLayout` props (`{ children: ReactNode }`), Story 1.3's typing is preserved unchanged.
  - [ ] 7.2 Run `pnpm lint` (if Story 1.1's `eslint.config.mjs` is set up — defaults to Next.js's preset). Expect zero new lint errors. Likely lint concerns:
    - `next.config.ts` `console.warn`: Next.js's default ESLint config does NOT ban `console` in config files (only in `src/`). If a custom rule does ban it, add an inline `// eslint-disable-next-line no-console` above the `console.warn` call.
    - `src/lib/llm/client.ts` no-floating-promises / no-unused-vars: the `assertClientOnlySafeContext()` invocation is a synchronous side-effecting call; no lint concern.

- [ ] **Task 8 — Static audits and three-file inspection** (AC: 7, 11)
  - [ ] 8.1 Verify Story 1.5's placeholder is removed:
    ```sh
    rg -n "Story 1\.6 will add" src/
    ```
    Must return zero matches. The placeholder string was the wiring marker; with the real implementation in place, the marker has served its purpose.
  - [ ] 8.2 Verify the runtime guard is present:
    ```sh
    rg -n "assertClientOnlySafeContext" src/lib/llm/client.ts
    ```
    Must return at least 3 matches: the function definition (`export function assertClientOnlySafeContext`), the JSDoc reference, and the module-load invocation `assertClientOnlySafeContext();`.
  - [ ] 8.3 Verify the build-time guard is present:
    ```sh
    rg -n "HARD-SCOPE-BOUNDARY" next.config.ts
    ```
    Must return at least 1 match (in the warning string).
  - [ ] 8.4 Verify the doc guard in layout is present:
    ```sh
    rg -n "HARD-SCOPE-BOUNDARY" src/app/layout.tsx
    ```
    Must return exactly 1 match (the line-1 banner comment).
  - [ ] 8.5 Verify the doc guard in README is present:
    ```sh
    rg -n "PERSONAL.USE|n=1|NFR14|AR15" README.md
    ```
    Must return at least 1 match in the first ~30 lines (the PERSONAL-USE banner from Story 1.1).
  - [ ] 8.6 Three-file removal-friction inspection (manual): confirm that to "disable" the boundary one must edit:
    - `next.config.ts` (delete the `if` block)
    - `src/lib/llm/client.ts` (delete `assertClientOnlySafeContext` definition AND the invocation)
    - `src/app/layout.tsx` (delete the line-1 banner comment) AND `README.md` (delete the PERSONAL-USE banner)
    
    Document this inspection in Dev Agent Record § Completion Notes.
  - [ ] 8.7 Verify NO other files were touched. Story 1.6's diff scope is exactly: `next.config.ts`, `src/lib/llm/client.ts`, `src/app/layout.tsx`. The story makes ZERO changes to `package.json`, `tsconfig.json`, any other `src/` files, any planning artifacts, or the `_bmad-output/` directory.
  - [ ] 8.8 NEVER add new files this story. The three guards are added/modified inside existing files. Adding a 4th guard file (e.g. `src/lib/security/hard-scope.ts`) violates AR15's three-file structure.

- [ ] **Task 9 — Update Dev Agent Record + dev-notes append** (Process)
  - [ ] 9.1 In Dev Agent Record § File List, list all three modified files: `next.config.ts`, `src/lib/llm/client.ts`, `src/app/layout.tsx`. Note `README.md` as VERIFIED (not modified).
  - [ ] 9.2 In Dev Agent Record § Completion Notes, confirm AC1–AC14 individually with one-line evidence each (file path + line, build-test output, grep-audit output, etc.).
  - [ ] 9.3 In Dev Agent Record § Debug Log References, include:
    - `pnpm build` output (with and without `NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE=true`) — captured stderr lines containing `HARD-SCOPE-BOUNDARY`.
    - `pnpm tsc --noEmit` exit code (expected 0).
    - Output of `rg -n "HARD-SCOPE-BOUNDARY|assertClientOnlySafeContext|PERSONAL.USE" .` showing the four guards in their three locations.
  - [ ] 9.4 If any AC is observed to fail at review, do NOT silently ship. Stop, document the deviation in Dev Agent Record, and either fix or escalate per architecture line 873.

## Dev Notes

### Critical pre-read (read before writing any code)

> **Mandatory:** `architecture.md` lines 324–330 (§ Authentication & Security — three-layer guard spec), 538 (§ Public-deployment guard), 968 (§ Complete Project Tree — `next.config.ts` annotation), 1234 (§ Build & Deploy — production warning), 1130–1146 (§ Architectural Boundaries — layered import direction). And `epics.md` lines 173–179 (AR15, AR18) + 573–595 (Story 1.6 verbatim). And `prd.md` line 829 (NFR14). The story is the structural enforcement of NFR14's hard scope boundary; the architecture is non-negotiable on the three guard locations and the exact warning/error wording.

### What this story owns vs. defers

This story creates the **three-layer hard-scope-boundary structure**. After 1.6, removing the n=1 personal-use boundary is structurally a three-file edit, not a one-file edit. No later story re-implements these guards.

| Concern | This story | Future story |
|---|---|---|
| Build-time guard (`next.config.ts`) | Task 2 | None — guard is permanent until public-future scope opens |
| Runtime guard `assertClientOnlySafeContext()` (`src/lib/llm/client.ts`) | Task 3 | None — function lives in 1.5's file; 1.5 left a placeholder marker that 1.6 replaces |
| Doc guard in `app/layout.tsx` (banner comment) | Task 4 | None — comment is permanent |
| Doc guard in `README.md` (PERSONAL-USE banner) | Task 5 (verify) | None — banner created by Story 1.1 Task 10; 1.6 only verifies continued presence |
| First consumer of `assertClientOnlySafeContext()` runtime activation | ❌ deferred | Story 1.10 (Today route) is the first code path that imports `@/lib/llm/generate` (which transitively imports `@/lib/llm/client`). The runtime guard activates on first import; this story ships the latent guard |
| Public-deployment workflow | ❌ deferred | Public-Future scope (per PRD line 651) — backend proxy + key relay; Story 1.6's guards stay in place but the env var `NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE=true` is set on the proxied deployment so the warning silences |
| Tests | ❌ deferred (NFR26 — no test framework in MVP) | None; manual smoke-test via Task 6 |

**Why no automated tests:** NFR26 explicitly forbids a test framework in MVP. The validation strategy for this story:
- **Build-time guard** is verified by running `pnpm build` twice (with/without env var) and inspecting stderr (Task 6.1, 6.2).
- **Runtime guard** is verified latently — no current code path imports `client.ts` SSR-side, so the guard's correctness is by inspection (Task 3 review) until Story 1.10 is the first end-to-end activator.
- **Doc guards** are verified by grep audits (Task 8.4, 8.5).

### Three guards: rationale for redundancy

The architecture (lines 324–330) deliberately specifies THREE guards rather than one, even though any one alone is enough to fail-loud. The redundancy is the point:

| Guard | Defends against | What removing it leaves |
|---|---|---|
| Build-time (`next.config.ts`) | A contributor running `next build` for a Vercel deploy without thinking about scope | Runtime guard + doc guards still fire — server-side import fails, README banner visible |
| Runtime (`client.ts`) | A contributor writing a `'use server'` action or API route that calls `getProvider()` (e.g. "let's do server-side rendering for SEO") | Build-time warning still fires, doc guards still visible — but the API key would silently work in `localStorage` reads server-side via Next.js's serialization layer (it wouldn't, but the contributor wouldn't know) |
| Doc — `app/layout.tsx` banner | A contributor opening `app/layout.tsx` to wire a feature without reading `architecture.md` first | Build + runtime guards fire on first deploy attempt or first import attempt — but the banner is the "before you write a line of code" warning |
| Doc — `README.md` PERSONAL-USE | A contributor onboarding to the repo via README before reading any code | Build + runtime + layout banner all still in place — the README banner is the first-impression warning |

A **future contributor must consciously edit three files (and the README) to remove the boundary** — this is the deliberate friction that AR15 specifies.

### `next.config.ts` and Next.js 16 idioms

1. **TypeScript config:** `next.config.ts` (not `.js` / `.mjs`) is Next.js 16's default per Story 1.1 Task 1.4. The TypeScript file is type-checked by the same `tsc --noEmit` pass as `src/`. Use `import type { NextConfig } from 'next'` at the top.

2. **Side-effecting top-of-module:** Next.js imports the config module synchronously at build start. A top-of-module `if` block executes once per build. **Do NOT** wrap the guard in an `async function` — config loading isn't async-safe in older Next.js versions, and a function-wrap defeats the "fires on import" contract.

3. **`process.env` in config:** Build-time config has full access to `process.env`. Variables NOT prefixed with `NEXT_PUBLIC_` are server-only; the `NEXT_PUBLIC_` prefix exposes them to client bundles. The guard reads `NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE` (per architecture line 326 / epics line 582) so the same flag could be inspected client-side later if needed (currently not used client-side).

4. **`NODE_ENV` semantics:** Next.js automatically sets `NODE_ENV='production'` for `next build` and `next start`, and `NODE_ENV='development'` for `next dev`. The guard's `NODE_ENV === 'production'` branch fires only on production builds — exactly the trigger AC1 specifies.

5. **`console.warn` to stderr:** `console.warn` writes to stderr by default in Node.js. CI tools (GitHub Actions, Vercel build logs) capture stderr and surface it visibly. **Do NOT** use `console.log` (stdout) — stdout is more easily filtered/silenced.

### `src/lib/llm/client.ts` placement and TypeScript pitfalls

1. **Placement of the invocation:** `assertClientOnlySafeContext();` is a top-level statement immediately after the function definition. It MUST run before any provider SDK code path executes. Story 1.5 already imports the provider SDKs at the top of `client.ts`; those imports are static and execute at module load — but they don't ACCESS `localStorage` until `getProvider()` is called. Still, the invocation order (imports → guard function definition → guard invocation → other code) is the architecturally-mandated sequence per AR15 part 2 + AC6.

2. **`typeof window` in TypeScript strict mode:** TS strict treats `window` as `Window & typeof globalThis` in the lib.dom types. The check `typeof window === 'undefined'` returns the string `'undefined'` when `window` does not exist (Node.js / SSR), without throwing a `ReferenceError`. This is the canonical SSR-detection pattern. Verified in TS strict mode — no type errors.

3. **Throwing `Error` (not a custom class):** Per architecture line 737 — programmer errors throw `Error` (or subclasses); app-flow errors return `Result`. `assertClientOnlySafeContext` throws plain `Error` because the failure is a programmer error (importing the wrong module from the wrong context), not a recoverable app-flow error. **Do NOT** introduce a custom `HardScopeBoundaryError` class — `Error` with the locked message string IS the contract.

4. **The em-dash in the error message:** AC8 + epics line 589 specify the literal `—` (U+2014, em-dash), not `-` (hyphen-minus, U+002D). Copy-paste from the AC, do not retype. A hyphen-minus would silently fail an exact-match grep audit if anyone ever writes one.

5. **Module-load side effects in MVP:** The `assertClientOnlySafeContext()` call at module-load is the only intentional module-load side effect in `src/lib/llm/`. Story 1.5 is otherwise pure (constructor calls, type definitions). This is acceptable — module-load side effects are appropriate for "load-time invariant" enforcement (architecture line 873 implicitly: invariants belong at the boundary they enforce).

6. **No `'use client'` on `client.ts`:** The file's *name* is `client.ts` because it's the LLM "client" abstraction (architecture line 373). The Next.js `'use client'` directive is a React-component-only marker per architecture line 426. Adding `'use client'` to a non-component module is a typo-shaped bug — many devs make this mistake. Story 1.6 Task 3.11 explicitly bans it.

### `app/layout.tsx` banner comment placement

1. **Line 1 of the file:** AC10 specifies "first non-shebang line". `app/layout.tsx` won't have a shebang (TS files don't), so the banner comment goes at line 1, above all imports. Story 1.3's existing `// src/app/layout.tsx` filename comment (if present) is moved to line 2.

2. **Why `//` not `/**/`:** Architecture line 328 specifies `// HARD-SCOPE-BOUNDARY: see architecture.md NFR14` — line-comment form. JSDoc `/** */` would render in IDE tooltips for the next symbol, which is misleading (the comment doesn't document the next symbol; it's a file-level banner).

3. **Server-component preservation:** Story 1.3 AC2 mandates `app/layout.tsx` stays a server component. A line comment has zero effect on server-vs-client classification (Next.js's classification depends on the `'use client'` directive presence, not on comments). The banner is safe.

4. **Banner string is exact-match:** AC10 + epics line 594 lock the wording `// HARD-SCOPE-BOUNDARY: API keys in localStorage; see architecture.md § Authentication & Security`. Note the section symbol `§` (U+00A7), not `S` or "Section". Copy-paste, do not retype.

### Likely dev-time pitfalls (preempt these)

1. **Build cache stale:** `next build` caches incremental compilation. After editing `next.config.ts`, the first `pnpm build` may not re-emit the warning if the config wasn't dirty in the cache. **Fix:** delete `.next/` directory before re-running `pnpm build` for the smoke test (Task 6.1).

2. **`pnpm dev` doesn't fire the build-time guard:** The build-time guard checks `NODE_ENV === 'production'`. `pnpm dev` runs with `NODE_ENV='development'`, so the warning is suppressed by design (AC4). If you expect the warning in dev mode, that's a misunderstanding — the guard is for production builds only.

3. **Vercel deploy without env var:** If Story 1.6 ships and someone (probably Priyank) deploys to Vercel without setting `NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE=true`, the build succeeds (warning, not error) and the deploy completes. The warning surfaces in Vercel's build logs. The intended workflow: Priyank reads the warning, sets the env var in Vercel project settings, redeploys, warning silenced. **Do NOT** harden this to a build-time error — that would block legitimate personal LAN deploys.

4. **`assertClientOnlySafeContext()` imported by `generate.ts` transitively:** Story 1.5's `generate.ts` does NOT import `client.ts` directly (it takes `model` via `opts`). So the runtime guard does NOT activate when `generate.ts` is server-rendered (currently impossible, but worth noting). It activates only when `client.ts` is imported. Story 1.10's `use-generate-paragraph.ts` will be the first transitive importer (via `getProvider`).

5. **`window` polyfill confusion:** Some test runners polyfill `window` (jsdom). If a future test framework is added (post-MVP per NFR26), `assertClientOnlySafeContext()` would NOT throw under jsdom even though the test runs in Node. This is acceptable — jsdom-based tests are inherently "client-side" and the guard's check passes correctly.

6. **Banner comment in copy-paste from JSDoc-using IDEs:** Some IDEs auto-convert `//` to `/** */` on save (Prettier with JSDoc plugin). Verify the saved file still has `//` (line comment) form per AC10. If your editor mangles it, configure Prettier to leave line comments alone.

7. **`NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE` typo:** The env var name is long and easy to typo. The exact spelling is locked per architecture line 326 / epics line 582: `NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE`. **Do NOT** abbreviate to `NEXT_PUBLIC_PERSONAL_USE` or `AUDIBLYTICS_PERSONAL_USE` (without `NEXT_PUBLIC_` prefix). Test smoke-test 6.2 exercises the exact name.

8. **`README.md` formatting drift:** Markdown linters (markdownlint, prettier) sometimes "fix" the PERSONAL-USE banner formatting. If verification (Task 5.2) fails because the banner was reformatted to look weaker, restore per Task 5.3 — the banner's tone is load-bearing (Task 5.4).

### Pre-existing files this story modifies (UPDATE — read before editing)

| File | Pre-edit state (post-prior-stories) | This story's edit |
|---|---|---|
| `next.config.ts` | Story 1.1 created via `create-next-app`; default empty `NextConfig` export | Task 2 — prepend `if (NODE_ENV === 'production' && PERSONAL_USE !== 'true') console.warn(...)` block; preserve any existing config |
| `src/lib/llm/client.ts` | Story 1.5 created with provider SDK imports + placeholder comment block + `ClientSettings` type + `getProvider` + `requireKey` | Task 3 — DELETE Story 1.5's placeholder comment block; INSERT `assertClientOnlySafeContext()` function definition + module-load invocation; preserve `ClientSettings`, `getProvider`, `requireKey` exactly |
| `src/app/layout.tsx` | Story 1.3 wired three-column shell; server component; `next/font` loaders; no `'use client'` | Task 4 — prepend single-line `// HARD-SCOPE-BOUNDARY: ...` comment at line 1; preserve everything else exactly |
| `README.md` | Story 1.1 created with PERSONAL-USE banner as first content block | Task 5 — VERIFY banner is intact (read-only); restore only if deleted/weakened |

**Files this story does NOT touch:**
- `package.json` (Story 1.1 owns; Story 1.6 adds zero deps)
- `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs` (Story 1.1 owns)
- Any other file in `src/` (Stories 1.2, 1.3, 1.4, 1.5 own)
- Planning artifacts (`_bmad-output/planning-artifacts/*`)

### Layered import compliance (AR18 — non-negotiable)

This story touches:
- `next.config.ts` — config layer; imports from `next` only (third-party); no `src/` imports.
- `src/lib/llm/client.ts` — `lib/` layer; imports already in place from Story 1.5 (provider SDKs, `@/lib/schemas/provider-keys.schema`, `./models`); Story 1.6 adds NO new imports.
- `src/app/layout.tsx` — `app/` layer; imports already in place from Story 1.3; Story 1.6 adds NO new imports.

**Verified absent imports** (must remain absent after Story 1.6):
- `from '@/components/*'` in `src/lib/llm/client.ts` — `lib/` MUST NOT import from `components/`.
- `from '@/features/*'` in `src/lib/llm/client.ts` — same rule.
- Any new third-party deps in `package.json` — Story 1.6 adds zero deps.

### Server vs. client component boundaries (architecture lines 421–428)

| File | Type | Rationale |
|---|---|---|
| `next.config.ts` | config (Node.js runtime only) | Runs at build time in Node; never reaches the browser. The `console.warn` writes to the build process's stderr |
| `src/lib/llm/client.ts` | **client-only de-facto** | Constructs provider SDK instances. After Story 1.6, the runtime guard fails-loud on any server-side import — making "client-only" a hard contract, not just a convention |
| `src/app/layout.tsx` | **server component** | Story 1.3 mandates server-only (no `'use client'`); hosts `next/font`. The banner comment doesn't change classification |
| `README.md` | docs | Not code |

**Why the runtime guard cannot be on `app/layout.tsx`:** Layout is intentionally server-side (Story 1.3). The banner comment in layout is a doc guard (visible to anyone editing layout) — but the *runtime* guard (the throw) belongs in `client.ts` because that's where the LLM client runs (and runs only client-side).

### Capability-area discipline (NFR28 + AR19)

Story 1.6 is **infrastructure / cross-cutting**, not capability-area code. The three guards live in:
- `next.config.ts` — config root (cross-cutting)
- `src/lib/llm/client.ts` — `lib/llm/` infra seam (cross-cutting per architecture line 1078)
- `src/app/layout.tsx` — `app/` root layout (cross-cutting — applies to all routes)
- `README.md` — repo root (cross-cutting)

There is no "feature folder" for this story. The boundary enforcement is a system invariant, not a user-facing capability — placement reflects that.

### Project Structure Notes

**Alignment with `architecture.md § Complete Project Tree` lines 957–1124:** All three modified file paths match the tree exactly. `next.config.ts` (line 968), `src/lib/llm/client.ts` (line 1079), `src/app/layout.tsx` (line 981), `README.md` (line 959).

**Detected conflicts or variances:**

- **None.** The architecture explicitly specifies the three-layer guard structure (lines 324–330) and locates each guard in the file Story 1.6 modifies. The story is a 1:1 implementation of the architecture's spec.
- **Empty `NextConfig` body:** Story 1.1's scaffolded `next.config.ts` is the create-next-app default (likely an empty `nextConfig` object). Story 1.6's guard sits ABOVE the export, leaving the config body untouched. If a future story adds config fields (e.g. `images.domains`, `experimental.foo`), they go INSIDE the `nextConfig` object — the guard block at the top is independent of any config additions.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` § Story 1.6 (lines 573–595)] — verbatim acceptance criteria source
- [Source: `_bmad-output/planning-artifacts/epics.md` § Additional Requirements AR15 (line 176)] — three-layer guard structure
- [Source: `_bmad-output/planning-artifacts/epics.md` § Additional Requirements AR18 (line 179)] — layered import compliance
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Authentication & Security (lines 302–336)] — full security model + hard-scope-boundary spec
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Authentication & Security — three-layer guards (lines 324–330)] — exact guard placement contract
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Infrastructure & Deployment — public-deployment guard (line 538)] — `next.config.ts` warning trigger
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Complete Project Tree (lines 957–1124)] — file placements
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Naming Patterns (lines 580–610)] — file naming conventions
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Architectural Boundaries (lines 1126–1162)] — layered import direction
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Pattern Examples — Anti-Patterns (lines 875–929)] — anti-patterns (throwing for app errors, etc.)
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Build & Deploy (lines 1230–1240)] — build-time warning behavior
- [Source: `_bmad-output/planning-artifacts/prd.md` § Non-Functional Requirements NFR14 (line 829)] — API-key storage policy + public-deployment ban
- [Source: `_bmad-output/planning-artifacts/prd.md` § Project Classification — Hard Scope Boundary (line 62)] — non-negotiable scope boundary
- [Source: `_bmad-output/implementation-artifacts/1-1-project-scaffold-and-agent-configuration.md`] — created `README.md` PERSONAL-USE banner (Task 10) and scaffolded `next.config.ts` (default — Story 1.6 adds the guard)
- [Source: `_bmad-output/implementation-artifacts/1-3-root-layout-shell-topnav-dayrail-skeleton-statrail-skeleton-and-honesty-footer.md`] — created `app/layout.tsx` shell (Story 1.6 prepends banner comment without modifying shell composition)
- [Source: `_bmad-output/implementation-artifacts/1-5-llm-provider-abstraction-schema-validation-retry-and-error-parsing.md`] — IMMEDIATELY PREVIOUS story; created `src/lib/llm/client.ts` with the placeholder comment block that Story 1.6 replaces with the runtime guard

## Dev Agent Record

### Context Reference

- This story spec is self-contained. The dev agent should read this file plus the four planning artifacts referenced above (epics.md, architecture.md, prd.md — UX-design-specification.md is NOT relevant: there is NO UI in this story) and the prior story files (1-1, 1-2, 1-3, 1-4, 1-5).
- Previous stories: `1-1-project-scaffold-and-agent-configuration.md` (status: ready-for-dev — created `README.md` PERSONAL-USE banner + scaffolded `next.config.ts`), `1-2-visual-token-system-typography-and-self-hosted-fonts.md` (informational only — no relevance to 1.6), `1-3-root-layout-shell-topnav-dayrail-skeleton-statrail-skeleton-and-honesty-footer.md` (status: ready-for-dev — created `src/app/layout.tsx` shell that 1.6 prepends a banner comment to), `1-4-storage-foundations-dexie-schema-uselocalstorage-hook-base-zod-schemas.md` (informational only — no relevance to 1.6), `1-5-llm-provider-abstraction-schema-validation-retry-and-error-parsing.md` (status: ready-for-dev — IMMEDIATE PREREQUISITE; created `src/lib/llm/client.ts` with the placeholder comment Story 1.6 replaces).
- No `project-context.md` files were found in the workspace at story-creation time.
- No git history exists at story-creation time; no prior code patterns to inherit beyond what 1.1–1.5 produce on disk.

### Previous Story Intelligence

Story 1.5 (LLM Provider Abstraction, Schema Validation, Retry, and Error Parsing) is the IMMEDIATE prerequisite. Story 1.5 deliberately deferred the runtime hard-scope-boundary guard (per its AC16 and Task 6.7) and left a placeholder comment block at the top of `src/lib/llm/client.ts` reading "Story 1.6 will add `assertClientOnlySafeContext()` here that throws when `typeof window === 'undefined'`." Story 1.6 deletes that placeholder block and replaces it with the real implementation.

| 1.5 produced | 1.6 uses |
|---|---|
| `src/lib/llm/client.ts` with placeholder comment + `getProvider()` + `requireKey()` + `ClientSettings` type | Replaces the placeholder with `assertClientOnlySafeContext()` + module-load invocation; preserves `getProvider`, `requireKey`, `ClientSettings` unchanged |
| Provider SDK imports (`@ai-sdk/google`, `@ai-sdk/openai`, etc.) at top of `client.ts` | Preserved unchanged; Story 1.6 adds NO new imports to `client.ts` |
| `LlmError` discriminated union, `parseLlmError`, `withRetry`, `generateParagraph`, etc. | NOT consumed by Story 1.6; the runtime guard activates whenever `client.ts` is imported, regardless of which downstream module imports it |

Story 1.3 (Root Layout Shell) created `src/app/layout.tsx` as a server component. Story 1.6 prepends a single-line comment ABOVE the existing imports — Story 1.3's three-column grid composition, `next/font` loaders, and `globals.css` import are preserved exactly.

Story 1.1 (Project Scaffold and Agent Configuration) created the initial `next.config.ts` (create-next-app default, likely empty `NextConfig` export — per Story 1.1 Task 1.4) and the `README.md` PERSONAL-USE banner (per Story 1.1 Task 10). Story 1.6 adds the build-time guard to `next.config.ts` and verifies the README banner.

**Patterns established by 1.1–1.5 to honor here:**

- **No new dependencies.** Stories 1.2–1.5 added zero new deps; Story 1.6 follows. All required environment is in place.
- **Architecture references inline as `[Source: ...]`.** Every dev-note claim cites the exact architecture/epics/prd line range.
- **JSDoc on `lib/` public exports.** `assertClientOnlySafeContext()` gets a JSDoc explaining the n=1 boundary (architecture line 838).
- **No `'use client'` on non-component files.** `client.ts` and `next.config.ts` are non-component modules; neither gets `'use client'` (architecture line 426).
- **Named exports always.** `assertClientOnlySafeContext` is a named `export function`; never `export default`.
- **Throwing is for programmer errors only.** `assertClientOnlySafeContext` throws plain `Error` because SSR-context import is a programmer error (architecture line 737); app-flow errors return `Result` (Story 1.4 / 1.5 pattern).
- **Layered-import compliance audited via grep.** Story 1.6 preserves the audit posture from 1.5; no new violations introduced.

**Patterns from earlier stories:**
- Story 1.5 — Runtime guard placeholder comment as wiring marker; Story 1.6 honors by deleting the marker and shipping the real guard.
- Story 1.3 — Server-component layout preservation; Story 1.6 honors by prepending a comment that doesn't change classification.
- Story 1.1 — README PERSONAL-USE banner created; Story 1.6 honors by verifying continued presence (read-only by default).

**Likely 1.1–1.5 review cycles to anticipate before starting 1.6:**
- If `src/lib/llm/client.ts` does NOT contain the placeholder comment block (Story 1.5 not yet implemented), complete Story 1.5 first OR skip Task 3.1 (delete placeholder) and just insert the new function block.
- If `src/app/layout.tsx` does NOT exist or is not a server component (Story 1.3 not yet implemented), complete Story 1.3 first.
- If `README.md` does NOT contain a PERSONAL-USE banner (Story 1.1 Task 10 not yet implemented or banner was deleted), restore it per Task 5.3.
- If `next.config.ts` is `next.config.js` or `next.config.mjs` (Story 1.1 chose a non-TS variant), convert to `next.config.ts` first OR adjust syntax for the chosen variant (drop `import type { NextConfig }`).

**Critical handoff rule:** After Story 1.6 ships, the `src/lib/llm/client.ts` module's runtime guard ACTIVATES on first import. Story 1.10 (Today route) will be the first consumer to transitively import `client.ts` (via `generate.ts` via `use-generate-paragraph.ts`). If Story 1.10 accidentally imports the LLM seam from a server-side path (Next.js route segment with default server rendering), the build will break with the locked error message. This is the desired behavior — but the dev agent for Story 1.10 should know to mark the consuming hook `'use client'` (which it would anyway per architecture line 426).

### Agent Model Used

Cursor agent (Claude) — story execution 2026-05-07.

### Debug Log References

- **`pnpm build`** (env unset, `.next` removed first): exit **0**. Stdout contained **`HARD-SCOPE-BOUNDARY`** twice (Next.js 16.2.4 / Turbopack appears to load `next.config` in more than one phase; same warning text both times). Representative lines:
  - `⚠ HARD-SCOPE-BOUNDARY: Audiblytics is a single-user personal app. API keys live in browser localStorage...`
  - Second block identical, between initial `next build` line and `▲ Next.js 16.2.4 (Turbopack)`.
- **`NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE=true pnpm build`**: exit **0**. Output had **no** `HARD-SCOPE-BOUNDARY` string.
- **`pnpm exec tsc --noEmit`**: exit **0**, no output.
- **Grep spot-check** (workspace root):
  - `HARD-SCOPE-BOUNDARY` — `next.config.ts` (warning string + JSDoc), `src/app/layout.tsx` (line 1 banner).
  - `assertClientOnlySafeContext` — `src/lib/llm/client.ts` (JSDoc, `export function`, top-level call).
  - `README.md` — `PERSONAL USE ONLY`, `n=1`, `AR15` in first lines (banner verified; not modified).

### Completion Notes List

- **AC1–AC3:** `next.config.ts` top-level `console.warn` when `NODE_ENV === 'production'` and `NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE !== 'true'`; message includes literal `HARD-SCOPE-BOUNDARY` and NFR14/AR15 pointers.
- **AC2:** No `throw` / `process.exit` in guard; both smoke builds exited 0.
- **AC4:** Guard gated on production only (dev not re-run here; logic matches spec).
- **AC5–AC8:** `assertClientOnlySafeContext()` in `src/lib/llm/client.ts`; throws exact message with em dash `—`; exported `(): void`.
- **AC6:** Imports → function → top-level `assertClientOnlySafeContext()` → `ClientSettings` → `getProvider` → `requireKey` (Task 3.5 order).
- **AC7:** Story 1.5 placeholder removed; `rg "Story 1\.6 will add" src/` → no matches.
- **AC9:** `README.md` PERSONAL-USE block present at top; no edit.
- **AC10:** `src/app/layout.tsx` line 1 = exact `// HARD-SCOPE-BOUNDARY: API keys in localStorage; see architecture.md § Authentication & Security`.
- **AC11:** Removal friction: requires edits to `next.config.ts`, `src/lib/llm/client.ts`, `src/app/layout.tsx`, and `README.md` banner.
- **AC12:** Build success both ways; note duplicate warning lines on unset env with Next 16.2.4 Turbopack (see Debug Log).
- **AC13:** `tsc --noEmit` clean.
- **AC14:** No new imports in `client.ts` or `layout.tsx`; `next.config.ts` only `next` type import.

### File List

- Modified: `next.config.ts`, `src/lib/llm/client.ts`, `src/app/layout.tsx`.
- Verified only (unchanged): `README.md`.
