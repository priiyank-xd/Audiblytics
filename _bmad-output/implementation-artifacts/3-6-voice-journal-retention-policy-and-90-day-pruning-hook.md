# Story 3.6: Voice Journal Retention Policy and 90-Day Pruning Hook

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,  
I want a Settings option to choose between {90-day rolling, indefinite} retention, with the rolling option pruning recordings older than 90 days on app open,  
so that my IndexedDB stays within the ~50MB budget without manual housekeeping while preserving an opt-out for users who want full history.

## Acceptance Criteria

> Sourced from `_bmad-output/planning-artifacts/epics.md` § Story 3.6, plus architecture/UX constraints referenced below.

1. **AC1 — Settings: Retention select shows two options** (FR6)  
   Given the user opens Settings → Retention  
   When the panel renders  
   Then a select shows `90-day rolling (default)` and `Indefinite` options  
   And the active value is loaded from `audiblytics.settings.retention`

2. **AC2 — Rolling retention: prune runs on app mount via hook** (FR41, AR23)  
   Given the retention policy is `90-day rolling` and the app mounts  
   When `lib/hooks/use-prune-on-mount.ts` runs (called from `app/layout.tsx`)  
   Then `features/voice-journal/prune-recordings.ts` deletes any recording where `recordingDate` is older than `now - 90 days`  
   And the prune is idempotent and runs at most once per app mount

3. **AC3 — Indefinite retention: prune becomes a no-op**  
   Given the retention policy is `Indefinite`  
   When the prune hook runs  
   Then no recordings are deleted

4. **AC4 — One-way prune behavior is documented**  
   Given the user changes retention from `90-day rolling` to `Indefinite`  
   When they save  
   Then existing recordings already pruned are NOT recovered (one-way prune; documented in helper text)  
   And future prune runs become no-ops while the policy is `Indefinite`

## Tasks / Subtasks

- [ ] **Task 0 — Preconditions / alignment checks** (AC: all)
  - [ ] 0.1 Ensure app scaffold exists (`package.json`, `src/`). If not, implement Story 1.1 first.
  - [ ] 0.2 Ensure Stories 3.1–3.5 exist (recordings persisted with `recordingDate` + `mimeType`, Voice Journal list route, CompositePlayer exists).
  - [ ] 0.3 Confirm the Settings shell supports subsections/tabs; retention likely lives under Settings → Retention per UX.

- [ ] **Task 1 — Read files being modified (UPDATE — non-negotiable)** (AC: all)
  - [ ] 1.1 Read Settings route/components to locate where retention controls live (Provider / Defaults / Voice / Retention tabs per UX).
  - [ ] 1.2 Read `lib/storage/use-local-storage.ts` and `lib/schemas/settings.schema.ts` to confirm canonical settings shape and validation.
  - [ ] 1.3 Read `lib/storage/db.ts` + recording schema to confirm `recordingDate` format (UTC ISO datetime string) and indexed fields.
  - [ ] 1.4 Read `app/layout.tsx` (and any `_internal/Day14Gate` mounting) to ensure the pruning hook is invoked without breaking layout-level gates.

- [ ] **Task 2 — Add retention setting to settings schema + persistence** (AC: 1, 4)
  - [ ] 2.1 Ensure `audiblytics.settings.retention` exists in the Zod schema with allowed values (exact casing and storage enum must match UI labels).
  - [ ] 2.2 Default retention to `90-day rolling` on first-run.
  - [ ] 2.3 Ensure Settings save writes through the `useLocalStorage` hook (no raw `window.localStorage` in components).

- [ ] **Task 3 — Settings UI: Retention select + helper text** (AC: 1, 4)
  - [ ] 3.1 Implement the select in Settings → Retention section with options:
    - `90-day rolling (default)`
    - `Indefinite`
  - [ ] 3.2 Display helper text directly under the select:  
    - For rolling: mention recordings older than 90 days are deleted on app open.  
    - For indefinite: mention no automatic deletions.  
    - Always: one-way note: switching to Indefinite does not restore recordings already pruned.
  - [ ] 3.3 Ensure keyboard navigation + focus ring matches existing Settings controls (Radix/shadcn baseline).

- [ ] **Task 4 — Implement prune behavior in voice-journal feature** (AC: 2, 3)
  - [ ] 4.1 Create/Update `src/features/voice-journal/prune-recordings.ts` (or `features/voice-journal/prune-recordings.ts`) to:
    - compute cutoff = `now - 90 days` (use UTC; store/compare timestamps consistently)
    - delete recordings where `recordingDate < cutoff`
    - return a `Result<{ deletedCount: number }, StorageError>` (or match established error pattern)
  - [ ] 4.2 Ensure pruning is safe:
    - idempotent (re-running yields `deletedCount=0` once caught up)
    - does not throw in normal conditions
    - surfaces quota / IndexedDB access failures inline via the existing storage error surface pattern (AR25)

- [ ] **Task 5 — Hook: run prune at most once per mount when rolling** (AC: 2, 3)
  - [ ] 5.1 Implement/Update `src/lib/hooks/use-prune-on-mount.ts` that:
    - runs once on mount (React effect with stable deps)
    - reads `audiblytics.settings.retention`
    - if `90-day rolling`: calls prune function
    - if `Indefinite`: no-op
  - [ ] 5.2 Ensure layout wires this hook (called from `app/layout.tsx`) without creating rerender loops or repeated pruning.

- [ ] **Task 6 — Minimal manual verification** (AC: all)
  - [ ] 6.1 Set retention to rolling; seed test recordings with old `recordingDate` values; reload app; confirm those entries disappear.
  - [ ] 6.2 Set retention to Indefinite; reload app; confirm no deletions occur.
  - [ ] 6.3 Switch rolling → Indefinite; confirm helper text states pruned recordings aren’t restored.
  - [ ] 6.4 Confirm app still loads, and Day-14 layout gate (if present) still works.

## Dev Notes

### Non-negotiable guardrails (avoid common disasters)

- **No background worker**: pruning runs on app mount via a hook (AR23).  
- **No raw IndexedDB usage in components**: DB access stays in the storage layer / feature utilities; UI uses hooks.  
- **UTC-anchored date math**: `recordingDate` is stored as a UTC ISO datetime string; cutoff comparisons must be consistent with that and not use locale dates.  
- **Idempotent + once-per-mount**: prune must not run in a loop or on every rerender; it should run once when the app mounts, max.

### Expected file targets (align to architecture)

- **Settings UI**:
  - `src/app/settings/page.tsx` (UPDATE)
  - `src/features/settings/*` (UPDATE as needed)
  - `src/lib/schemas/settings.schema.ts` (UPDATE)
  - `src/lib/storage/use-local-storage.ts` (REUSE; update only if required)
- **Pruning**:
  - `src/features/voice-journal/prune-recordings.ts` (NEW or UPDATE)
  - `src/lib/hooks/use-prune-on-mount.ts` (NEW or UPDATE)
  - `src/app/layout.tsx` (UPDATE to invoke hook)

### Error handling expectations

- If pruning encounters storage failures, use the existing inline error surface pattern with an `[Open Settings]` recovery affordance, consistent with AR25 and the general no-toasts/no-modals approach.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` § Story 3.6] — canonical story + ACs  
- [Source: `_bmad-output/planning-artifacts/prd.md` FR6, FR41] — retention policy + 90-day rolling prune requirement  
- [Source: `_bmad-output/planning-artifacts/architecture.md` AR23, AR25 + “IndexedDB Quotas & Storage Hygiene”] — prune-on-mount hook, quota/error surfacing expectations, storage budget rationale  
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` Settings pill-tab pattern + Voice Journal principles] — Settings → Retention placement and UX constraints

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Debug Log References

### Completion Notes List

### File List

- `_bmad-output/implementation-artifacts/3-6-voice-journal-retention-policy-and-90-day-pruning-hook.md`

