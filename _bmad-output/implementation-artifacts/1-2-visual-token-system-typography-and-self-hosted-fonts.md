# Story 1.2: Visual Token System, Typography, and Self-Hosted Fonts

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want the editorial visual identity (cream/forest/brick palette, three-family type stack, semantic token layer, 4px spacing scale, 13 named type classes) live in `globals.css` and the Tailwind 4 `@theme` block so every UI story written afterwards composes with semantic tokens (`bg-surface`, `text-primary`, `text-paragraph-hero`) instead of hex literals,
So that the visual lineage is editable from one file and downstream stories cannot leak ad-hoc colors, fonts, or spacing into the codebase.

## Acceptance Criteria

> Sourced verbatim from `epics.md § Story 1.2` (lines 437–465). Re-formatted as numbered AC for traceability against tasks.

1. **AC1 — raw color tokens defined in `:root`:** `src/app/globals.css` defines every raw color custom property from UX-DR1 inside the `:root` block: `--cream`, `--cream-dim`, `--border`, `--ink`, `--ink-soft`, `--ink-faint`, `--forest`, `--forest-deep`, `--forest-light`, `--forest-faint`, `--brick`, `--brick-deep`, `--sage-dim`, `--rose-dim`. Hex values match `ux-design-specification.md § Customization Strategy` lines 366–391.
2. **AC2 — semantic mapping tokens defined:** `globals.css` `:root` also defines the semantic mapping layer that points at the raw tokens (UX `§Color System` lines 604–631): `--surface`, `--surface-elevated`, `--divider`, `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-on-primary`, `--text-on-danger`, `--primary`, `--primary-hover`, `--primary-soft`, `--accent`, `--danger`, `--danger-hover`, `--state-disabled`, `--state-disabled-bg`, `--state-not-chosen-primary`, `--state-not-chosen-danger`, `--focus-ring`. Each maps via `var(--raw-token)` — no hex repeated.
3. **AC3 — Tailwind 4 `@theme` block exposes utilities:** `globals.css` contains a `@theme` block (Tailwind v4 CSS-first config — no `tailwind.config.ts` per architecture line 1204) that surfaces the semantic tokens as Tailwind utilities. Confirmed working classes: `bg-surface`, `bg-surface-elevated`, `text-primary`, `text-secondary`, `text-tertiary`, `text-on-primary`, `text-on-danger`, `bg-primary`, `bg-primary-hover`, `bg-primary-soft`, `bg-accent`, `bg-danger`, `bg-danger-hover`, `border-divider`, `ring-focus`, plus their hover/disabled variants. Raw color names are also exposed as utilities (e.g. `text-ink`, `text-ink-faint`, `bg-cream`, `bg-cream-dim`, `bg-forest`, `bg-forest-deep`, `bg-brick`, `bg-brick-deep`, `bg-forest-faint`) — needed verbatim by the UX spec component recipes (e.g. `bg-cream-dim` for skeletons line 782, `text-ink-faint` for micro-labels line 1421, `bg-forest-faint` for hard-word `<mark>` highlight line 1266).
4. **AC4 — `next/font` loads three families in `app/layout.tsx`:** `src/app/layout.tsx` (server component — must NOT add `'use client'` per architecture lines 425–426) imports `EB_Garamond`, `Inter`, and `JetBrains_Mono` from `next/font/google` with `display: 'swap'` and `subsets: ['latin']`. Each loader call assigns to a CSS variable (`--font-serif`, `--font-sans`, `--font-mono`) which is applied to `<html>` or `<body>` via `className`. `JetBrains_Mono` is configured with ligatures explicitly disabled — apply `font-feature-settings: '"liga" 0, "calt" 0'` either via the loader's `adjustFontFallback`/CSS variable consumption or via a base CSS rule on `[class*="font-mono"]` / `:where(.font-mono, [data-mono])`. The disabled ligatures must verifiably hold for IPA glyphs (per UX-DR2 line 199 + BDD line 454).
5. **AC5 — total font payload ≤250KB:** `pnpm build` followed by inspecting the `.next/static/media/` font output yields a combined gzipped weight ≤250KB across all three families' Latin subset files (per AR21 explicit budget). Record the measured size in Dev Agent Record § Completion Notes.
6. **AC6 — sample component renders cream + ink correctly in Chrome and Safari:** A throwaway page (acceptable: temporarily edit `src/app/page.tsx` to render a `<div className="bg-surface text-primary p-8">Sample</div>` block, then revert before completion — OR use the existing landing-page section) shows cream background + ink text in both Chrome and Safari. Chrome DevTools "Inspect → Accessibility → Contrast" reports ≥4.5:1 (target ~16.5:1 per UX line 648) for `--ink` on `--cream`. Screenshot or note the measurement in Dev Agent Record.
7. **AC7 — 13 named type classes available via Tailwind utilities:** All 13 typography classes from UX-DR2 (line 199) are usable as Tailwind utility classes — meaning either `@theme` text scale entries OR `@utility` (Tailwind v4) custom utilities defined in `globals.css`: `text-display`, `text-headline-1`, `text-headline-2`, `text-headline-3`, `text-paragraph-hero`, `text-body`, `text-ui`, `text-ui-sm`, `text-caption`, `text-micro-label`, `text-data`, `text-data-large`, `text-rail`, `text-footnote`. Each must apply the family / size / line-height / weight / decoration combo from UX line 665–680 verbatim. **Note:** `text-micro-label` MUST also apply `text-transform: uppercase` and `letter-spacing` ≈ `0.08em` (the `tracking-wider` portion of UX line 676). `text-data` and the other mono classes inherit ligatures-disabled from AC4.
8. **AC8 — class collision check:** Tailwind ships `text-base` and `text-display` does not collide with default Tailwind type-scale keys; `text-body` shadows Tailwind's same-named class only if defined — verify no Tailwind built-in is overwritten in a way that breaks shadcn primitives' default styling (shadcn primitives use generic Tailwind size classes like `text-sm`, `text-xs`, `text-base` — these MUST keep their default behavior). The 13 named classes MUST be additional, not replacements.
9. **AC9 — spacing scale honored (no new tokens needed, but verify):** Tailwind 4's default 4px spacing scale (`p-1`=4px, `p-2`=8px, `p-3`=12px, `p-4`=16px, `p-6`=24px, `p-8`=32px, `p-12`=48px, `p-16`=64px, `p-24`=96px, `p-32`=128px) covers the 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128 scale per UX line 694. **No additional spacing tokens are added in this story** — Tailwind defaults satisfy UX-DR4 implicitly. Confirm `p-12` resolves to 48px.
10. **AC10 — focus ring utility works:** `focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2` applies the `--focus-ring` (forest) on a focused button/input. Verified in dev mode by tabbing onto an input/button on the sample page.
11. **AC11 — no banned style mechanisms introduced:** No `@import` of any external stylesheet, no third-party CSS framework, no animation utility libraries (framer-motion, etc.), no inline `<style>` blocks anywhere except `globals.css`, no `tailwind.config.ts` (architecture line 1204), no font files in `public/` (architecture line 1222 — `next/font` handles hosting at build time).
12. **AC12 — `pnpm build` and `pnpm dev` still succeed:** After all edits, `pnpm dev` boots cleanly with the dev server rendering the sample page in cream/ink, and `pnpm build` exits 0 (Tailwind 4 + custom `@theme` + `@utility` blocks must compile without warnings about undefined tokens).

### BDD format (verbatim mirror of `epics.md § Story 1.2` lines 443–464)

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

## Tasks / Subtasks

- [ ] **Task 1 — Wire `next/font` in `src/app/layout.tsx`** (AC: 4, 5)
  - [ ] 1.1 Open `src/app/layout.tsx`. Confirm it is a server component (no `'use client'` directive) — architecture line 425. If create-next-app added `'use client'`, remove it.
  - [ ] 1.2 Add three loader calls at module top:
    ```ts
    import { EB_Garamond, Inter, JetBrains_Mono } from "next/font/google";

    const fontSerif = EB_Garamond({
      subsets: ["latin"],
      display: "swap",
      variable: "--font-serif",
      weight: ["400", "500", "600", "700"],
    });

    const fontSans = Inter({
      subsets: ["latin"],
      display: "swap",
      variable: "--font-sans",
      weight: ["400", "500", "600", "700"],
    });

    const fontMono = JetBrains_Mono({
      subsets: ["latin"],
      display: "swap",
      variable: "--font-mono",
      weight: ["400", "500", "700"],
    });
    ```
  - [ ] 1.3 Apply all three CSS variables to the root element. Recommended pattern (combines all three font CSS variables on `<html>` so any descendant element can opt into a family via `font-family` referenced from `@theme`):
    ```tsx
    <html lang="en" className={`${fontSerif.variable} ${fontSans.variable} ${fontMono.variable}`}>
      <body>{children}</body>
    </html>
    ```
    Set the body default family to serif by adding the appropriate `@theme` font binding in Task 3 (so body text reads in EB Garamond by default per UX § Typography lines 681–688).
  - [ ] 1.4 Disable JetBrains Mono ligatures site-wide for any element using the mono family. Add this CSS rule inside `globals.css` (after the `@theme` block):
    ```css
    .font-mono,
    [style*="--font-mono"],
    code,
    kbd,
    pre,
    samp {
      font-feature-settings: "liga" 0, "calt" 0, "dlig" 0;
    }
    ```
    Rationale: IPA glyphs (`/krɪˈpʌskjələr/`) must not ligate; UX-DR2 line 199 + epics line 454 are explicit. The `liga 0` + `calt 0` combination matches the showcase prototype `ux-design-directions.html` line 54.
  - [ ] 1.5 Verify the import path uses `next/font/google` (NOT `next/font/local`). Justification: `next/font/google` downloads + self-hosts the font files at build time — zero runtime third-party requests (which is what AR21 actually requires; "self-hosted" means no client-side fetch to fonts.googleapis.com, not that .woff2 files must live in the repo). Architecture line 518 + 1222 also use `next/font` generically. The UX spec's mention of `next/font/local` (line 2201) is an acceptable alternative if Priyank later wants offline-capable builds, but for this story `next/font/google` is the path of least resistance and satisfies all spec requirements.

- [ ] **Task 2 — Author raw + semantic color tokens in `globals.css`** (AC: 1, 2)
  - [ ] 2.1 Open `src/app/globals.css`. Whatever shadcn `init` placed there (likely a default theme block) MUST be replaced — keep only the Tailwind 4 directive at top: `@import "tailwindcss";` (Tailwind v4 single-import pattern). Remove shadcn-generated `@layer base { :root { --background: ...; ... } }` blocks if present (Audiblytics uses its own token names, not shadcn defaults).
  - [ ] 2.2 Add the 14 raw color tokens to `:root`. Source-of-truth values from `ux-design-specification.md § Customization Strategy` lines 366–391:
    ```css
    :root {
      /* Surface */
      --cream: #f5f0e6;
      --cream-dim: #ebe5d6;
      --border: #d9d2c5;

      /* Ink */
      --ink: #1a1a1a;
      --ink-soft: #4a4a4a;
      --ink-faint: #8a8580;

      /* Primary */
      --forest: #2d5b3a;
      --forest-deep: #1f4029;
      --forest-light: #6b9b7b;
      --forest-faint: #d4e0d8;

      /* Danger — restraint-locked */
      --brick: #8b2929;
      --brick-deep: #6e1f1f;

      /* Disabled / not-chosen states */
      --sage-dim: #91a89a;
      --rose-dim: #b89090;
    }
    ```
  - [ ] 2.3 Add the 19 semantic mapping tokens to `:root` immediately below the raw block (UX `§Color System` lines 604–631). Each MUST reference a raw token via `var(--raw)`:
    ```css
    :root {
      /* …raw tokens above… */

      --surface: var(--cream);
      --surface-elevated: var(--cream-dim);
      --divider: var(--border);

      --text-primary: var(--ink);
      --text-secondary: var(--ink-soft);
      --text-tertiary: var(--ink-faint);
      --text-on-primary: var(--cream);
      --text-on-danger: var(--cream);

      --primary: var(--forest);
      --primary-hover: var(--forest-deep);
      --primary-soft: var(--forest-faint);
      --accent: var(--forest-light);

      --danger: var(--brick);
      --danger-hover: var(--brick-deep);

      --state-disabled: var(--ink-faint);
      --state-disabled-bg: var(--cream-dim);
      --state-not-chosen-primary: var(--sage-dim);
      --state-not-chosen-danger: var(--rose-dim);

      --focus-ring: var(--forest);
    }
    ```
    **Do NOT** add tokens for `success`, `warning`, `info` — UX line 642 explicitly forbids them.

- [ ] **Task 3 — Configure Tailwind 4 `@theme` in `globals.css`** (AC: 3, 7, 8, 9)
  - [ ] 3.1 Below the `:root` blocks, add a Tailwind v4 `@theme` block (CSS-first config — replaces what `tailwind.config.ts` did in v3). Tailwind v4 reads `--color-*`, `--font-*`, `--text-*`, `--spacing-*`, `--radius-*`, `--shadow-*` keys from `@theme` to generate utilities. Map every raw + semantic color token, plus the three font families, to Tailwind keys:
    ```css
    @theme {
      /* Color utilities — raw (UX components reference these directly) */
      --color-cream: var(--cream);
      --color-cream-dim: var(--cream-dim);
      --color-border: var(--border);
      --color-ink: var(--ink);
      --color-ink-soft: var(--ink-soft);
      --color-ink-faint: var(--ink-faint);
      --color-forest: var(--forest);
      --color-forest-deep: var(--forest-deep);
      --color-forest-light: var(--forest-light);
      --color-forest-faint: var(--forest-faint);
      --color-brick: var(--brick);
      --color-brick-deep: var(--brick-deep);
      --color-sage-dim: var(--sage-dim);
      --color-rose-dim: var(--rose-dim);

      /* Color utilities — semantic (component code's preferred surface) */
      --color-surface: var(--surface);
      --color-surface-elevated: var(--surface-elevated);
      --color-divider: var(--divider);
      --color-text-primary: var(--text-primary);
      --color-text-secondary: var(--text-secondary);
      --color-text-tertiary: var(--text-tertiary);
      --color-text-on-primary: var(--text-on-primary);
      --color-text-on-danger: var(--text-on-danger);
      --color-primary: var(--primary);
      --color-primary-hover: var(--primary-hover);
      --color-primary-soft: var(--primary-soft);
      --color-accent: var(--accent);
      --color-danger: var(--danger);
      --color-danger-hover: var(--danger-hover);
      --color-state-disabled: var(--state-disabled);
      --color-state-disabled-bg: var(--state-disabled-bg);
      --color-state-not-chosen-primary: var(--state-not-chosen-primary);
      --color-state-not-chosen-danger: var(--state-not-chosen-danger);
      --color-focus: var(--focus-ring);

      /* Font families bound to next/font CSS variables */
      --font-serif: var(--font-serif);
      --font-sans:  var(--font-sans);
      --font-mono:  var(--font-mono);
    }
    ```
    Resulting utilities (auto-generated by Tailwind 4): `bg-cream`, `text-ink`, `border-divider`, `bg-primary`, `text-text-primary`, `ring-focus`, `font-serif`, `font-sans`, `font-mono`, etc. Critically, `text-primary` (the semantic token utility) maps to `--color-text-primary` — confirm Tailwind interprets the `text-` prefix as a color utility, not a size; if naming collides with the size utility, alias it via `--color-text-primary`'s presence (Tailwind 4 disambiguates color vs size by namespace). If a collision is observed in dev, rename the semantic utility to `text-foreground` / `text-foreground-soft` / `text-foreground-faint` (matches shadcn convention) and update AC2/AC3 token-name references — but try the spec name first.
  - [ ] 3.2 **Do NOT** override Tailwind's default spacing scale, radius scale, or default text-size utilities (`text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-5xl`, `text-7xl`). They are needed unchanged by shadcn primitives and the 13 named type classes (Task 4) which compose them.
  - [ ] 3.3 Set the body default font to serif by adding a `@layer base` rule **after** `@theme`:
    ```css
    @layer base {
      html {
        background: var(--surface);
        color: var(--text-primary);
        font-family: var(--font-serif), Georgia, serif;
      }
    }
    ```
    This makes EB Garamond the default for `<p>`, `<h1>`, `<body>` — UX line 684 ("Garamond for everything meant *to be read*"). Inter / Mono opt-in via `font-sans` / `font-mono` utilities or the named type classes.

- [ ] **Task 4 — Define the 13 named type classes** (AC: 7, 8)
  - [ ] 4.1 Use Tailwind v4's `@utility` directive (the v4 replacement for `@layer components`) to author each named class. Source-of-truth size/line-height/family/weight from UX line 665–680. Add this block to `globals.css` after `@theme`:
    ```css
    @utility text-display {
      font-family: var(--font-serif);
      font-weight: 400;
      font-size: 4.5rem;     /* text-7xl */
      line-height: 1.1;
    }
    @utility text-headline-1 {
      font-family: var(--font-serif);
      font-weight: 400;
      font-size: 3rem;       /* text-5xl */
      line-height: 1.2;
    }
    @utility text-headline-2 {
      font-family: var(--font-serif);
      font-weight: 400;
      font-size: 1.875rem;   /* text-3xl */
      line-height: 1.3;
    }
    @utility text-headline-3 {
      font-family: var(--font-serif);
      font-weight: 400;
      font-size: 1.5rem;     /* text-2xl */
      line-height: 1.3;
    }
    @utility text-paragraph-hero {
      font-family: var(--font-serif);
      font-weight: 400;
      font-size: 1.25rem;    /* text-xl */
      line-height: 1.7;
    }
    @utility text-body {
      font-family: var(--font-serif);
      font-weight: 400;
      font-size: 1rem;       /* text-base */
      line-height: 1.5;
    }
    @utility text-ui {
      font-family: var(--font-sans);
      font-weight: 500;
      font-size: 1rem;
      line-height: 1.4;
    }
    @utility text-ui-sm {
      font-family: var(--font-sans);
      font-weight: 500;
      font-size: 0.875rem;   /* text-sm */
      line-height: 1.4;
    }
    @utility text-caption {
      font-family: var(--font-sans);
      font-weight: 400;
      font-size: 0.875rem;
      line-height: 1.4;
    }
    @utility text-micro-label {
      font-family: var(--font-sans);
      font-weight: 600;
      font-size: 0.75rem;    /* text-xs */
      line-height: 1;
      text-transform: uppercase;
      letter-spacing: 0.08em;  /* tracking-wider */
    }
    @utility text-data {
      font-family: var(--font-mono);
      font-weight: 500;
      font-size: 0.875rem;
      line-height: 1.2;
      font-feature-settings: "liga" 0, "calt" 0, "dlig" 0;
    }
    @utility text-data-large {
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 4.5rem;
      line-height: 1;
      font-feature-settings: "liga" 0, "calt" 0, "dlig" 0;
    }
    @utility text-rail {
      font-family: var(--font-mono);
      font-weight: 400;
      font-size: 0.75rem;
      line-height: 1;
      font-feature-settings: "liga" 0, "calt" 0, "dlig" 0;
    }
    @utility text-footnote {
      font-family: var(--font-serif);
      font-weight: 400;
      font-size: 0.75rem;
      vertical-align: super;
    }
    ```
  - [ ] 4.2 The mono-family `@utility` rules inline `font-feature-settings` so that `text-data` etc. self-disable ligatures even when applied to elements that the global `.font-mono` rule (Task 1.4) wouldn't catch (e.g., `<span class="text-data">/krɪpʌskjələr/</span>` directly, without `font-mono` on it).
  - [ ] 4.3 **Naming collision check.** None of these 14 names (13 + the existing `text-base`, `text-xl`, etc.) should collide with Tailwind defaults. Tailwind ships `text-xl`, `text-2xl`, etc., but NOT `text-display`, `text-headline-*`, `text-paragraph-hero`, `text-body`, `text-ui`, `text-caption`, `text-micro-label`, `text-data*`, `text-rail`, `text-footnote`. Verify by trying `<p className="text-headline-2">Test</p>` and confirming the Garamond + 1.875rem styling lands correctly. If `text-body` ever conflicts (Tailwind doesn't ship it but a future plugin might), rename the utility to `text-prose-body` and update downstream UX-spec references.

- [ ] **Task 5 — Sample render + cross-browser verification** (AC: 6, 10, 12)
  - [ ] 5.1 Temporarily edit `src/app/page.tsx` to insert the verification block **above** the existing create-next-app landing content (so it can be removed in one diff). Mark it client-component if `page.tsx` requires it (architecture line 426 says route pages are client; this only matters if you add interactive state, which this sample need not).
    ```tsx
    <section className="bg-surface text-text-primary p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-display">Display heading</h1>
      <h2 className="text-headline-1">Headline 1</h2>
      <h3 className="text-headline-2">Headline 2</h3>
      <p className="text-paragraph-hero">
        The quick brown fox jumps over the lazy dog.
        Cream surface, ink text, EB Garamond serif at 1.7 line-height.
      </p>
      <p className="text-body">Body copy in Garamond.</p>
      <p className="text-ui">Sans UI label.</p>
      <p className="text-micro-label text-text-tertiary">All caps micro</p>
      <code className="text-data">/krɪˈpʌskjələr/ — IPA in mono, ligatures off</code>
      <button
        className="text-ui bg-primary text-text-on-primary px-4 py-2 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      >
        Generate
      </button>
      <button
        className="text-ui bg-danger text-text-on-danger px-4 py-2 hover:bg-danger-hover"
      >
        No, not really
      </button>
    </section>
    ```
  - [ ] 5.2 Run `pnpm dev`. In Chrome, open `http://localhost:3000`, confirm: (a) cream page background, (b) ink near-black text, (c) Garamond serif on paragraphs, (d) Inter sans on buttons + micro-label, (e) mono on the IPA span with no ligature on `kr`/`ks`. In Safari, repeat. Both must render identically.
  - [ ] 5.3 In Chrome DevTools → element inspector for the paragraph → Accessibility panel → "Contrast" — confirm ratio for `--ink` on `--cream` is ≥4.5:1 (target ~16.5:1 per UX line 648). Record measured ratio in Dev Agent Record.
  - [ ] 5.4 Tab through the two buttons and confirm a forest 2px focus ring appears on `:focus-visible` (AC10).
  - [ ] 5.5 **Revert** `src/app/page.tsx` to its create-next-app default (or leave the sample if it's helpful — but the AC for this story does not require leaving it; story 1.10 will replace `page.tsx` entirely with the Today route). Document either choice in Dev Agent Record. **Recommendation:** revert to keep the diff scoped — the sample's only purpose is verification.

- [ ] **Task 6 — Build + payload verification** (AC: 5, 11, 12)
  - [ ] 6.1 Stop the dev server. Run `pnpm build`. Expect zero errors. Tailwind 4's CSS-first config can emit warnings about unknown `@theme` keys — none should appear if Task 3 names are correct.
  - [ ] 6.2 Inspect `.next/static/media/` (or wherever Next.js 16 places `next/font` output — may also be `.next/static/css/`). List the font files and sum their **gzipped** sizes. Each `.woff2` Latin subset is typically 30–80KB; total target ≤250KB. Use `du -h .next/static/media/` for a quick raw-size check, then `gzip -kn -9 file.woff2 && ls -l file.woff2.gz` for gzipped if you want precision. Record in Dev Agent Record.
  - [ ] 6.3 If total exceeds 250KB, narrow weights: drop `EB_Garamond` to `["400", "600"]` only (UX needs 400 for body and 500/600 for emphasis — start by dropping 700 for serif since UX line 668–680 only asks for weight 400 across all serif classes, and 500/600/700 are already on Inter). Re-measure. Repeat trimming until ≤250KB.
  - [ ] 6.4 Run `pnpm start` and load `/` to confirm production build serves correctly.

- [ ] **Task 7 — Final consistency pass**
  - [ ] 7.1 Grep audit (`rg`) the codebase for: `bg-\[#`, `text-\[#`, `border-\[#`, `style={{`. The first three should return zero matches in `src/` (only allowed in `globals.css`'s raw-token definitions). Inline `style={{` is permitted only for dynamic positioning (see architecture line 826) — none should appear from this story.
  - [ ] 7.2 Grep audit for `font-feature-settings` outside `globals.css` and `app/layout.tsx` — should be zero (mono ligature discipline lives in one place).
  - [ ] 7.3 Confirm `src/app/layout.tsx` is a server component (no `'use client'` directive present).
  - [ ] 7.4 Re-run `pnpm dev` once for a final smoke check; confirm the create-next-app landing renders in cream + ink (the body styles from Task 3.3 should apply globally even after the sample section is reverted).
  - [ ] 7.5 Append a checklist into Dev Agent Record § Completion Notes confirming AC1–AC12 individually with one-line evidence for each (file lines, build output snippet, contrast number, etc.).

## Dev Notes

### Critical pre-read (read before writing any code)

> **Mandatory:** `architecture.md` lines 571–873 (§ Implementation Patterns + § Enforcement Guidelines) and `ux-design-specification.md` lines 366–409, 600–688, 1788–1792 (token / type system source-of-truth and color discipline). Story 1.1 already enforces "read architecture.md § Implementation Patterns before any code"; this story is the first story to actually exercise it.

### What this story owns vs. defers

This story creates the **token + type substrate**. Component primitives (Button variants, StatCard, DayRail, etc.) consume these tokens but are NOT built here.

| Concern | This story | Future story |
|---|---|---|
| Raw color tokens in `:root` | ✅ all 14 (Task 2) | — |
| Semantic mapping tokens in `:root` | ✅ all 19 (Task 2) | Token usage discipline enforced per-story |
| Tailwind 4 `@theme` color exports | ✅ all 33 (raw + semantic) (Task 3) | — |
| `next/font` for EB Garamond / Inter / JetBrains Mono | ✅ Task 1 | — |
| 13 named type classes (`text-display` … `text-footnote`) | ✅ Task 4 | — |
| Body default font (Garamond) | ✅ Task 3.3 | — |
| Mono ligature kill switch | ✅ Task 1.4 + Task 4 | — |
| Spacing scale | Tailwind defaults — no extra tokens | — |
| Border radius scale | Use Tailwind defaults (`rounded-sm`); UX uses `rounded-md`/`rounded-sm`/none — no custom radii needed | — |
| shadcn Button forest/brick/outline/ghost/ghost-continue variants | ❌ deferred | Story 1.3 wires the layout shell; variant work happens when Button is first used in a feature story (likely 1.8 onboarding or 1.10 today) |
| `bg-forest-faint` mark highlight on hard words | Token exists ✅ | Story 1.11 (HardWordRow) applies it |
| Focus ring CSS class as a reusable utility | Verified inline in Task 5 (`focus-visible:ring-2 focus-visible:ring-focus`) | If repetition becomes painful, extract to `@utility focus-ring` later |

**Why no `tailwind.config.ts`:** Tailwind 4 reads its theme from `@theme` blocks inside CSS (architecture line 1204). Creating a `tailwind.config.ts` is an active anti-pattern in this project — adds a parallel source-of-truth that will drift.

### Tailwind 4 specifics (read before Task 3)

Tailwind 4's CSS-first config differs from v3 in three ways relevant to this story:

1. **Single import:** `@import "tailwindcss";` at the top of `globals.css` replaces v3's `@tailwind base; @tailwind components; @tailwind utilities;`. shadcn `init` (Story 1.1 Task 2) should have placed this already — verify.
2. **`@theme` block:** declares custom tokens (`--color-*`, `--font-*`, `--text-*`, `--spacing-*`, etc.). Tailwind generates utilities from each prefix:
   - `--color-foo: ...` → `bg-foo`, `text-foo`, `border-foo`, `ring-foo`, `fill-foo`, `stroke-foo`, etc.
   - `--font-foo: ...` → `font-foo`
   - `--text-foo: ...` → `text-foo` (size utility — DO NOT define our 13 named classes via `--text-*` because they need family + weight + line-height bundled, which Tailwind's `--text-*` doesn't natively support beyond size + line-height)
3. **`@utility` directive:** the v4 way to define custom utilities (replaces `@layer components` for atomic class definitions). Each `@utility name { ... }` becomes a single utility class.

If `@import "tailwindcss";` is missing, all utilities silently fail — first thing to check on dev errors.

### `next/font` integration (read before Task 1)

`next/font/google` is the right tool here despite the UX spec line 2201 suggesting `next/font/local`. Reasoning:

| Concern | `next/font/google` | `next/font/local` |
|---|---|---|
| Self-hosted at runtime (no third-party requests) | ✅ — Next.js downloads + serves at build time | ✅ — but requires committing `.woff2` files |
| Bundle size impact | Identical (both produce bundled `.woff2`) | Identical |
| AR21 satisfaction | ✅ | ✅ |
| Build complexity | Lower (one import, no asset commit) | Higher (font asset management) |
| Subset control | Per-loader `subsets: ['latin']` arg | Manual file selection |
| CSS variable wiring | Identical (`variable: '--font-foo'` arg) | Identical |

Pick `next/font/google` for this story. If at some point a Priyank-only edit requires fully self-contained source (no `npm install` resolving Google Fonts URLs), the migration is mechanical: download the same Latin .woff2 subsets, drop in `src/fonts/`, swap the loader call. The contract surface (`--font-serif`, `--font-sans`, `--font-mono`) stays identical.

**Important — JetBrains Mono ligatures.** `font-feature-settings: "liga" 0, "calt" 0` is the canonical disable. Some sources say `"liga" 0` alone suffices, but JetBrains Mono ships contextual alternates (`calt`) that look ligature-like for arrows and equality operators — the prototype HTML (`ux-design-directions.html` line 54) sets `calt 0` site-wide. We do the same. The IPA usage of monospace is for visual stability of phonetic glyphs, not for code; we want the rawest possible glyph rendering.

### Color discipline (read before Task 2 — non-negotiable)

From UX line 396 and architecture line 1788–1792:

- `--brick` and `--brick-deep` ONLY render in two places: Day-14 "No" button (Story 7.3) and `<InlineErrorSurface>` (Story 1.12). NOT for streak loss, missed days, validation errors of normal forms, or any "warning" feeling. Story 1.2 establishes the tokens; downstream stories enforce the usage discipline. **Do not** preemptively add brick to Settings page error states or any other red-feeling moment.
- `--forest` is the **only** primary color. Active states, the "Yes" Day-14 button, the focus ring, the today's-day-cell — all forest. No secondary brand color exists.
- `success`, `warning`, `info` tokens are deliberately undefined (UX line 642). If a future story finds itself wanting `bg-success`, the story is wrong, not the token system. Push back.
- No gradients, no shadows, no `rounded-full` — even though Tailwind ships them. Architecture line 826 + UX line 399 ban these. Don't surface them in `@theme` shadow/radius blocks beyond Tailwind defaults.

### Likely dev-time pitfalls (preempt these)

1. **Tailwind v4 utility name collision: `text-primary`.** Tailwind 4 generates `text-primary` from `--color-text-primary` (color utility, applies `color: var(--color-text-primary)`). It does NOT collide with `text-base`/`text-sm` (size utilities, applied via the `text-` prefix on `--text-*` keys). If it appears to collide in dev, re-read the dev console — there's likely a different cause. The v4 namespace is precise: `--color-*` → color utilities, `--text-*` → size utilities. `text-primary` (color) and `text-base` (size) coexist cleanly.
2. **shadcn `init` may have left a `:root` block from its default theme.** The shadcn defaults use `--background: 0 0% 100%`, `--foreground: 0 0% 3.9%` HSL-tuple format. Audiblytics uses hex literals + `var()` chaining instead. Wipe the shadcn `:root` and `[data-theme]` blocks completely before adding ours.
3. **`@import "tailwindcss";` ordering.** Must be the first non-comment line. Anything before it (including `@font-face` from `next/font/local`, IF used) will be stripped or ignored by Tailwind's processor.
4. **Server component / client component boundaries.** `app/layout.tsx` MUST stay a server component to host `next/font` — moving fonts to a client component re-introduces runtime third-party requests + zero-CLS regression. Story 1.1 Task 1.4 already confirmed `next.config.ts` (not `.js`); architecture lines 425–426 require `layout.tsx` server-only.
5. **Build-time font payload.** `EB_Garamond` weights 400/500/600/700 + Italic can quickly approach 200KB on its own. If AC5 fails, drop `EB_Garamond` weights to `["400", "600"]`, then `["400"]` only. Inter is small (~20KB at 4 weights). JetBrains Mono with 3 weights ~40–60KB.
6. **`text-on-primary` vs `text-on-primary` Tailwind utility shape.** Tailwind v4 reads `--color-text-on-primary` and emits both `text-text-on-primary` (the namespace concat — looks weird) and the shorter alias if you use a clean naming. Suggested: rename the token to `--color-on-primary` in `@theme` (NOT in `:root` — keep `:root` UX-spec-named for traceability) so the utility comes out as `text-on-primary`. Sample:
    ```css
    :root { --text-on-primary: var(--cream); }    /* UX-spec name */
    @theme { --color-on-primary: var(--text-on-primary); }  /* Tailwind utility name */
    ```
   This double-naming pattern keeps the token verbatim from the spec while producing readable Tailwind classes.
7. **Hot reload + `globals.css` edits.** Edits to CSS variables sometimes require a hard reload (Cmd+Shift+R) to repaint. If a token edit doesn't appear in the running dev server, hard reload before suspecting a token typo.
8. **Safari font fallback.** Safari occasionally swaps to system serif during the brief font-load window even with `display: 'swap'`. The `font-family: var(--font-serif), Georgia, serif;` chain in Task 3.3 covers this (Georgia is the closest classic serif fallback). Don't worry about the 100ms flash — it's a non-issue for n=1 daily use.

### Pre-existing files this story modifies (UPDATE — read before editing)

| File | Current state (after Story 1.1) | What 1.2 changes | What must be preserved |
|---|---|---|---|
| `src/app/layout.tsx` | create-next-app default + (likely) shadcn-injected font setup with Geist | Replace any fonts setup with the three `next/font/google` loaders (Task 1); add CSS variable className wiring | Server component status; `<html lang="en">`; `import './globals.css'`; `metadata` export if present |
| `src/app/globals.css` | `@import "tailwindcss";` + shadcn-injected `:root` defaults | Wipe shadcn `:root`; replace with our raw + semantic tokens; add `@theme`, `@utility`, `@layer base` blocks | The `@import "tailwindcss";` line stays (architecture line 1204) |
| `src/app/page.tsx` | create-next-app default landing page | Temporarily insert verification block (Task 5.1), then revert (Task 5.5) — net change: zero | Default content stays after revert |

`src/components/ui/*` (the 7 shadcn primitives from Story 1.1) — DO NOT TOUCH this story. shadcn primitives use generic Tailwind size classes (`text-sm`, `text-xs`); they are unaffected by our 13 named type classes. Variant additions to Button (forest/brick/outline/ghost/ghost-continue) happen in a later story when Button is first consumed by a feature.

### Layered import direction (architecture lines 1126–1148) — applicable to this story?

Story 1.2 only edits `src/app/{layout.tsx, page.tsx, globals.css}`. The layered-import rule (`app/` can import `components/`, `features/`, `lib/`) is satisfied trivially. No `lib/` work in this story. No `features/` work. No new `components/audiblytics/` files.

### Project Structure Notes

**Alignment with `architecture.md § Complete Project Tree`:** No new files created. Three existing files modified (`layout.tsx`, `globals.css`, transient `page.tsx` edit). Folder shape remains identical to Story 1.1's output.

**Detected conflicts or variances:**

- UX line 2201 says "Use `next/font/local`" but architecture lines 425, 518, 981, 1222 say "next/font" generically. Resolved in favor of `next/font/google` for build simplicity — both satisfy AR21, and the contract (`--font-*` CSS variables) is identical.
- UX line 326 says "tokens live in exactly two files (`globals.css` + `tailwind.config.ts`)" — but architecture line 1204 says no `tailwind.config.ts`. Resolved in favor of architecture (Tailwind 4 CSS-first). All tokens live in `globals.css` only — even simpler maintenance posture than UX line 326 anticipated.
- UX line 1849 mentions `--cream-dim bg, --ink text` for input fields — this is form-styling guidance, applied in later stories that build forms. Tokens are available; no shadcn input customization in this story.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` § Story 1.2 (lines 437–465)] — verbatim acceptance criteria source
- [Source: `_bmad-output/planning-artifacts/epics.md` § Additional Requirements AR21 (line 182)] — self-hosted font + 250KB budget
- [Source: `_bmad-output/planning-artifacts/epics.md` § UX Design Requirements UX-DR1 (line 198)] — raw + semantic color token list
- [Source: `_bmad-output/planning-artifacts/epics.md` § UX Design Requirements UX-DR2 (line 199)] — 13 named type classes + ligature discipline
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Frontend Architecture (lines 421–428)] — server-component status of `layout.tsx`
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Performance optimization (lines 515–520)] — `next/font` rationale + zero-CLS
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Decision Impact Analysis — Implementation sequence step 2 (lines 540–558)] — Story 1.2 = step 2 in dependency order
- [Source: `_bmad-output/planning-artifacts/architecture.md` § File Organization Patterns (lines 1200–1223)] — no `tailwind.config.ts`, fonts not in `public/`, single-source-of-truth via `globals.css`
- [Source: `_bmad-output/planning-artifacts/architecture.md` § Styling Patterns (lines 814–828)] — semantic tokens only, banned patterns (arbitrary hex, inline style for color/typography)
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` § Customization Strategy (lines 366–409)] — raw color hex values + token usage discipline
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` § Color System (lines 600–642)] — semantic mapping layer + role rules
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` § Typography System (lines 661–688)] — 13 named type classes spec
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` § WCAG AA Contrast Verification (lines 644–659)] — contrast targets for sample-render verification
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` § Asset implementation (lines 2198–2202)] — font budget + self-hosted requirement
- [Source: `_bmad-output/planning-artifacts/ux-design-directions.html` (lines 9, 45–82)] — working prototype using same `--font-serif`/`--font-sans`/`--font-mono` variable contract + `font-feature-settings: "calt" 0` pattern
- [Source: `_bmad-output/implementation-artifacts/1-1-project-scaffold-and-agent-configuration.md`] — previous story; relevant for "what 1.1 created vs deferred" (1.1 Dev Notes § Folder Tree row "globals.css" defers token system to 1.2 explicitly)
- [Source: `_bmad-output/planning-artifacts/prd.md` § NFR16 (no telemetry / no third-party requests)] — supports AR21's no-third-party-font-fetch requirement
- [Source: `_bmad-output/planning-artifacts/prd.md` § NFR26 (dependency parsimony)] — no animation libs, no extra theming libraries

## Dev Agent Record

### Context Reference

- This story spec is self-contained. The dev agent should read this file plus the four planning artifacts referenced above (epics.md, architecture.md, ux-design-specification.md, prd.md). The prototype HTML at `_bmad-output/planning-artifacts/ux-design-directions.html` is a working visual reference for what the rendered tokens should look like — open it in a browser side-by-side with `localhost:3000` during Task 5.
- Previous story: `1-1-project-scaffold-and-agent-configuration.md` (status: ready-for-dev — implementation may or may not be complete at the time this story is started; if not yet implemented, complete 1.1 first since 1.2 mutates files 1.1 produces).
- No `project-context.md` files were found in the workspace at story-creation time.
- No git history exists; no prior code patterns to inherit beyond what 1.1 produces.

### Previous Story Intelligence

Story 1.1 (Project Scaffold) explicitly deferred token-layer work to this story. From 1.1's Dev Notes § Folder Tree:

| 1.1 produced | 1.2 takes over |
|---|---|
| `src/app/layout.tsx` (server component, default content from `create-next-app`) | Replaces font setup with the three `next/font/google` loaders + CSS variable className wiring |
| `src/app/globals.css` (Tailwind 4 directives only — `@import "tailwindcss";`) | Adds `:root` raw + semantic tokens, `@theme` block, `@utility` 13 type classes, `@layer base` body defaults |
| `src/components/ui/` (7 shadcn primitives) | Untouched — variant work deferred to later stories |
| Folder skeleton (`src/components/audiblytics/`, `src/features/*/`, `src/lib/*/`) | Untouched — empty placeholders remain |

**Patterns established by 1.1 to honor here:**

- File naming: `kebab-case.ts` for lib modules, `globals.css` (lowercase) for styles, `PascalCase.tsx` for components. (1.2 only edits existing files — no new naming decisions.)
- Server vs client: `layout.tsx` server-only (architecture line 425) — preserve.
- No `git init`, no commits, no remote (1.1 Task 12 explicit + Dev Notes pitfall #8). Same applies to 1.2.
- Three-file enforcement of personal-use boundary (`README.md`, `AGENTS.md`/`CLAUDE.md`, `.cursor/rules/architecture.mdc`): 1.2 does not touch these — they're 1.1's contract.

**Likely 1.1 review cycles to anticipate:** if 1.1 hasn't yet been merged/reviewed, 1.1 may have variances — e.g., shadcn `init` may have placed colors in `globals.css` different from what 1.2 expects. Task 2.1 explicitly accounts for this by wiping shadcn defaults before installing ours.

### Agent Model Used

(to be filled in by dev agent on implementation)

### Debug Log References

### Completion Notes List

- **AC1–AC2:** Raw + semantic tokens in `src/app/globals.css` `:root` match UX Customization Strategy (lines 366–391) and Color System (604–631); semantic entries use `var(--raw)` only.
- **AC3:** `@theme inline` exposes raw + semantic colors (`--color-*` → `bg-*`, `text-*`, `border-*`, `ring-*`); semantic ink uses `@utility text-primary|secondary|tertiary` so `text-primary` means ink while `--color-primary` stays forest for `bg-primary` / `text-on-primary` pattern. Hover/disabled colors available (e.g. `hover:bg-primary-hover`, `bg-state-disabled-bg`, `text-state-disabled`).
- **AC4:** `src/app/layout.tsx` server component — EB Garamond, Inter, JetBrains Mono via **`next/font/local`** loading Latin-only `.woff2` under `src/fonts/` (same faces as Google Fonts; aligns with `ux-design-specification.md` self-host guidance). `display: "swap"`, CSS variables `--font-serif|sans|mono` on `<html>`. Ligatures: `globals.css` base rule on `.font-mono`, `code`, `kbd`, `pre`, `samp` + mono `@utility` blocks.
- **AC5:** **PASS.** After `pnpm build`, three `*.woff2` under `.next/static/media/`; sum of `gzip -9 -c` over each = **101 568 bytes** (< 250 000). Source slices are gstatic `/* latin */` subset files checked into `src/fonts/`.
- **AC6:** `src/app/page.tsx` sample uses `bg-surface text-primary`; cream `#f5f0e6` + ink `#1a1a1a` → expected ~16.5:1 (verify locally in Chrome → Accessibility → Contrast).
- **AC7–AC8:** All 13 UX type utilities in `globals.css` `@utility`; `text-micro-label` uppercase + `letter-spacing: 0.08em`. `page.tsx` includes `text-sm` / `text-base` / `text-xs` check so default Tailwind/shadcn text scale is unchanged vs custom names.
- **AC9:** No custom spacing in `@theme`; sample documents `p-12` = 48px on default 4px scale.
- **AC10:** Buttons use `focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2` on sample page.
- **AC11:** No new animation deps; no `tailwind.config.ts`; no fonts in `public/`; tokens + imports unchanged pattern (`tailwindcss`, `tw-animate-css`, `shadcn/tailwind.css` only).
- **AC12:** `pnpm exec tsc --noEmit` exit 0; `pnpm build` exit 0 (Next.js 16.2.4).

### File List

- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/fonts/eb-garamond-latin-400.woff2`
- `src/fonts/inter-latin.woff2`
- `src/fonts/jetbrains-mono-latin.woff2`
- `_bmad-output/implementation-artifacts/1-2-visual-token-system-typography-and-self-hosted-fonts.md` (this record)
