# Story 16.2: Told What Happens to My Voice Before I Record

Status: done

## Story

As a first-time user,
I want to be told where my recording goes and how long it is kept before I press record,
so that I am not handing over my voice on blind trust (NFR31, BV17.2).

**Scope:** `apps/web` only. No `apps/api` change, no schema change, no migration.

## Acceptance Criteria

1. **AC1 — Disclosure before the first recording** — On an account that has never completed a recording, the record control is presented with an inline disclosure stating where audio is stored, the active retention period, and that deletion is available on demand.

2. **AC2 — Inline, never a modal** — The disclosure renders inline inside the record panel, as a `role="status"` region. No modal, toast or alert is used (mandatory rule 6).

3. **AC3 — It does not come back** — Once the user acknowledges it, or once they successfully save a recording, the disclosure does not reappear on a later day. State persists in a namespaced `audiblytics.*` key through `useLocalStorage`.

4. **AC4 — Same information reachable from Settings** — The identical three facts render on `/settings/data`, from the same source module, so the two surfaces cannot drift.

5. **AC5 — Honest in both storage backends** — The storage sentence tells the truth for the active backend: local mode says audio stays in this browser and is never uploaded; API mode says audio is uploaded to private per-account storage. The retention sentence reflects the user's actual policy (`90-day-rolling` vs `indefinite`).

## Tasks / Subtasks

- [x] **Task 1 — Persisted "seen" flag** (AC3)
  - [x] 1.1 `lib/schemas/recording-disclosure.schema.ts` — Zod schema as the source of truth for the persisted shape, plus `RECORDING_DISCLOSURE_STORAGE_KEY = 'audiblytics.recordingDisclosure'`.

- [x] **Task 2 — Single source for the three facts** (AC4, AC5)
  - [x] 2.1 `features/voice-journal/recording-privacy-facts.ts` — `recordingPrivacyFacts(location, retention)` returning `{ storage, retention, deletion }`. Pure function, no React, so it is directly testable.

- [x] **Task 3 — Inline disclosure component** (AC1, AC2)
  - [x] 3.1 `components/audiblytics/RecordingPrivacyNotice.tsx` — `role="status"` section using semantic tokens only (`border-divider`, `bg-surface-elevated`, `text-caption`, `text-secondary`). Renders a "Got it" button only when `onAcknowledge` is passed, so the same component serves as reference copy in Settings.

- [x] **Task 4 — Wire into the record panel** (AC1, AC3, AC5)
  - [x] 4.1 `RecordPanel` reads the flag via `useLocalStorage` and renders the notice above the controls while unacknowledged.
  - [x] 4.2 Acknowledge on the "Got it" button and also after the first successful save, so the notice cannot linger for someone who recorded without dismissing it.
  - [x] 4.3 New optional `retention` prop, passed from `TodayRouteBody` (which already resolves settings for both backends); falls back to the persisted local settings value.

- [x] **Task 5 — Settings mirror** (AC4)
  - [x] 5.1 `SettingsDataPage` renders `RecordingPrivacyNotice` without `onAcknowledge`, driven by `retentionDraft` and `isApiStorageBackend()`.

- [x] **Task 6 — Tests and verification** (AC5)
  - [x] 6.1 `recording-privacy-facts.test.ts` — both locations, both retention policies, deletion always disclosed.
  - [x] 6.2 `pnpm typecheck`, `pnpm test`, `pnpm lint` from `apps/web`.

## Dev Notes

### Why a pure copy module

The disclosure and the Settings section have to say the same thing, and the sentences depend on two runtime facts (backend, retention policy). Putting the strings in a plain function keeps them in one place, makes AC5 testable without rendering React, and matches how this repo already tests logic (`node:test` via `tsx`, no component-test harness).

### Storage location is derived, not configured

`isApiStorageBackend()` is the existing capability switch (ADR 0003), so `location` is `'account'` in API mode and `'browser'` otherwise. Nothing new to keep in sync.

### Acknowledgement, not recording count

The epic frames the trigger as "an account that has never completed a recording". Counting recordings across two storage backends to decide whether to show a notice would be more machinery than the guarantee needs. A single acknowledged flag, set on dismissal or first successful save, satisfies both AC scenarios: the notice is there before the first recording, and it never comes back afterwards.

### Decision IDs

NFR31 (voice-data disclosure before first recording), BV17.2, ADR 0003 (`STORAGE_BACKEND`), `architecture.md` mandatory rules 2 (Zod as source of truth), 4 (namespaced keys via `useLocalStorage`), 6 (inline surfaces only), 7 (semantic tokens).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 16.2]
- [Source: _bmad-output/planning-artifacts/epics.md#v3 Requirements Delta] — NFR31

## Dev Agent Record

### Agent Model Used

Claude Opus 5 (Cursor, bmad-dev-story workflow)

### Completion Notes List

- Web suite: **164 passed** (5 new), `pnpm typecheck` clean, `pnpm lint` unchanged at the pre-existing 17 errors / 19 warnings — none in the files touched here (verified by linting with these changes stashed).
- The notice is rendered inside `RecordPanel`, so it reaches every path that presents the record control from Today.
- Retention is read through `useLocalStorage` rather than the synchronous `readPersistedSettingsRetention()` helper, to keep the server-rendered markup and the first client render identical.

### File List

- `apps/web/src/lib/schemas/recording-disclosure.schema.ts` (new)
- `apps/web/src/features/voice-journal/recording-privacy-facts.ts` (new)
- `apps/web/src/features/voice-journal/recording-privacy-facts.test.ts` (new)
- `apps/web/src/components/audiblytics/RecordingPrivacyNotice.tsx` (new)
- `apps/web/src/components/audiblytics/RecordPanel.tsx`
- `apps/web/src/features/today/today-app.tsx`
- `apps/web/src/features/settings/settings-data-page.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-08-10: Story 16.2 implemented — inline pre-record voice-data disclosure with a persisted acknowledgement, mirrored on Settings → Data & Storage from one shared copy module (review).
- 2026-08-10: Code review passed with no changes requested — web 164 passed, typecheck clean, no files changed (done).
