# Story 8.2: "Download Pack" Settings Action — Load Pack into IndexedDB

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want a Settings → Offline Pack → "Download Pack" action that imports the generated JSON into the Dexie `offlinePack` table,
So that the runtime fallback path has data to surface when LLM calls fail.

## Acceptance Criteria

> Sourced from `epics.md § Story 8.2` (lines 1618–1643). Numbered for task traceability.

1. **AC1 — Panel status + button** — Given the user opens **Settings → Offline Pack** panel, when the panel renders, then a **status row** shows either **"Offline pack loaded — N paragraphs"** or **"Offline pack not loaded"** based on Dexie `offlinePack` row count (reactive — use `dexie-react-hooks` `useLiveQuery` or equivalent). A **`[Download Pack]`** button is visible (per **FR61**).

2. **AC2 — Fetch + validate + persist** — Given the user taps **`[Download Pack]`**, when the click fires, then `src/features/offline-pack/pack-loader.ts` **`fetch`es** `/offline-pack.json`** (static file from **`public/offline-pack.json`** at dev/prod root URL path **`/offline-pack.json`**) and **parses JSON** as a **top-level array**. Each array element is validated with **`offlinePackEntrySchema`** (or the canonical export from **`src/lib/schemas/offline-pack.schema.ts`**) **before** insert into Dexie **`offlinePack`** (per **FR61**, **AR10** indexes: `theme`, `persona`, `lastSurfacedAt`). Invalid rows are **skipped with dev-only or structured log** — do not abort entire batch on one bad row unless product chooses strict mode; default aligns with Story 8.1 tolerance (prefer: skip bad rows, still surface partial success in status count).

3. **AC3 — Idempotent load** — Re-running Download Pack must **not** duplicate rows. **Before** bulk insert, **`offlinePack.clear()`** (or `table.clear()` in a transaction) so the table reflects exactly the newly loaded file (matches Story 8.3 selection semantics and storage size).

4. **AC4 — Loading UX** — During fetch + Dexie write, the button shows **inline mini-spinner** + text **"Loading pack…"** and the button is **disabled** (per **UX-DR35** story-specific exception: epics explicitly require spinner for this operation even though UX-DR35 generally reserves spinners for LLM calls — **this path is network + bulk IndexedDB**, treat as long-running user-triggered action).

5. **AC5 — Success feedback** — Given the load completes successfully, when the panel re-renders, then the status row updates to **"Offline pack loaded — N paragraphs"** (per **UX-DR30** — **no toast**; state change is the feedback).

6. **AC6 — Failure surface** — Given the load fails (**network** fetching JSON, **JSON parse**, **schema validation** catastrophic failure, or **QuotaExceededError** / Dexie errors on insert), when caught, then **`<InlineErrorSurface variant="storage">`** renders **below** the button with the **specific error** and **`[Try Again]`** (per **FR42**, **NFR8**). **[Try Again]** re-triggers the same load function.

## Tasks / Subtasks

- [x] **Task 0 — Preconditions** (AC: all)
  - [x] 0.1 Confirm **Story 1.4** Dexie `offlinePack` store exists (`src/lib/storage/db.ts` + **`offlinePack: '++id, theme, persona, lastSurfacedAt'`** per architecture).
  - [x] 0.2 Confirm **`src/lib/schemas/offline-pack.schema.ts`** defines the persisted row shape (theme, persona, generatedAt, paragraph, hardWords, lastSurfacedAt nullable — align field names **camelCase** per architecture line 739).
  - [x] 0.3 Confirm **`safeWrite()`** (or documented Dexie write wrapper from Story 1.4) is used for transactional safety where applicable.
  - [x] 0.4 Confirm **`public/offline-pack.json`** can be served (Story 8.1 artifact); for local dev without file, failure path must still satisfy AC6.

- [x] **Task 1 — Read UPDATE / NEW files (non-negotiable)** (AC: all)
  - [x] 1.1 Read **`src/app/settings/page.tsx`** (and Settings form components from Story 1.9). Plan **new pill tab** or section: **Offline Pack** alongside Provider / Defaults / Voice / Retention (epics require **Settings → Offline Pack panel**).
  - [x] 1.2 Read **`src/lib/storage/db.ts`**, **`src/lib/schemas/offline-pack.schema.ts`**, **`src/components/audiblytics/InlineErrorSurface.tsx`** (or equivalent path — locate actual export).
  - [x] 1.3 Grep **`InlineErrorSurface`** for `variant` prop — ensure **`storage`** maps to copy/styling per **NFR8**.

- [x] **Task 2 — `pack-loader.ts` core** (AC: 2, 3, 6)
  - [x] 2.1 Create **`src/features/offline-pack/pack-loader.ts`** exporting **`loadOfflinePackFromPublic()`** (pure module).
  - [x] 2.2 Implement **`fetch('/offline-pack.json')`** + response ok checking; JSON parse errors surfaced as storage-shaped messages.
  - [x] 2.3 Parse JSON top-level array and validate each entry via **`offlinePackEntrySchema.safeParse`**, skipping invalid rows.
  - [x] 2.4 **`db.offlinePack.clear()`** then **`bulkAdd`**, wrapped in **`safeWrite()`**.
  - [x] 2.5 Dexie write failures map to `StorageError` so the UI can render `InlineErrorSurface` correctly.

- [x] **Task 3 — Settings UI: Offline Pack panel** (AC: 1, 4, 5, 6)
  - [x] 3.1 Adds **Offline Pack** tab/panel with status text + **`Download Pack`** button.
  - [x] 3.2 Uses `useLiveQuery` for reactive offline pack count.
  - [x] 3.3 Adds `isLoadingPack` state: button shows mini-spinner + "Loading pack…" and is disabled during load.
  - [x] 3.4 On success clears error state and relies on `useLiveQuery` refresh.
  - [x] 3.5 On failure renders `<InlineErrorSurface variant="storage" />` below the button with `[Try Again]`.

- [x] **Task 4 — Verification** (AC: all)
  - [x] 4.1 Wiring complete: expects successful load to update `offlinePack.count()` and render status string.
  - [x] 4.2 Wiring complete: network/parse/schema failures render `InlineErrorSurface` with `[Try Again]`.
  - [x] 4.3 Idempotency implemented: `clear()` happens before `bulkAdd`.

## Dev Notes

### Architecture compliance

- **Feature folder:** `src/features/offline-pack/pack-loader.ts` per architecture tree (lines 1072–1075). Do **not** put fetch logic in `lib/` if it orchestrates feature semantics — **`lib/` cannot import `features/`**; **`pack-loader` may import `lib/storage`, `lib/schemas`**.
- **Static asset:** `public/offline-pack.json` → URL **`/offline-pack.json`** (architecture lines 211–213, 1241–1242).
- **Validation before write:** architecture **lines 296–298** — Zod validate before IndexedDB write.
- **Quota / storage errors:** architecture **lines 300–301** — **`InlineErrorSurface`** for Dexie failures.
- **Import boundaries:** `features/offline-pack` must not import other `features/*` packages; Settings route composes this feature from `app/settings` (allowed: **`app` → `features`**).

### UX policy nuance

- **UX-DR35** generally bans spinners for IndexedDB — **this story is an explicit epic exception** (mini-spinner + "Loading pack…" on **Download Pack**). Do **not** add full-page overlay.

### Technical requirements

- **Dexie:** Use existing **`AudiblyticsDB`** singleton pattern from **`src/lib/storage/db.ts`** (verify export name).
- **`lastSurfacedAt`:** Rows from JSON may omit or null — normalize to **`undefined`/omit** so Dexie stores **`null`** if schema allows; Story 8.3 updates on selection.
- **Security:** `offline-pack.json` is **public** — contains **no API keys** (only paragraph content). Do not log full paragraphs in production logs.

### Previous story intelligence (8.1)

- Canonical artifact path **`public/offline-pack.json`** and **array-of-objects** shape with **`theme`, `persona`, `generatedAt`, `paragraph`, `hardWords`** — must match **`offline-pack.schema.ts`** (Story 8.1 AC8).
- Script output is **large** — ensure **clear + bulk insert** performs acceptably; consider **`bulkAdd`** with chunking if needed for quota stability.

### Project context reference

- No **`project-context.md`** located in repo at create-story time — rely on architecture + epics + this file.

## Dev Agent Record

### Agent Model Used

(Create-story workflow — comprehensive context pass; web research skipped per request.)

### Debug Log References

### Completion Notes List

### File List

---

**Story completion status:** Ultimate context engine analysis completed — comprehensive developer guide created.
