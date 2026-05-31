# Story 12.1: Collection Words API

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want collection CRUD on the server,
so that saved words sync when using API mode (BVR13, FR26–FR29).

## Acceptance Criteria

> Sourced from `epics.md` § Story 12.1, `architecture-v2-fastapi-backend.md` BV5/BV7/BV10/BV12 Phase 4, and FR26–FR29. Numbered for task traceability.

1. **AC1 — `collection_words` table** — Given a fresh Postgres database, when `alembic upgrade head` runs, then the `collection_words` table exists with columns matching BV5 (see Dev Notes schema block). FK `user_id → users.id` ON DELETE CASCADE.

2. **AC2 — Indexes and uniqueness** — Table has index on `user_id`, index on `saved_at` (FR27 recency sort), index on `last_reviewed_at` (FR49 future review), and **unique constraint `(user_id, word)`** — matches client idempotency in `use-save-word.ts` L31–33 (`where('word').equals(...)`).

3. **AC3 — Client UUID primary key** — `id` column is UUID PK; POST accepts **client-provided** `id` from `collectionWordSchema` for idempotent retry (same pattern as recordings Story 11.2).

4. **AC4 — GET /collection** — Given authenticated user, when `GET /api/v1/collection`, then returns user's words sorted by `savedAt` descending (newest first), camelCase JSON per BV10, user-scoped (other users' rows never returned).

5. **AC5 — POST /collection** — Given authenticated user and valid word payload mirroring `collectionWordSchema`, when `POST /api/v1/collection`, then word persists with `user_id` scope and appears in subsequent GET. **Idempotent:** duplicate `(user_id, word)` returns existing row (200) or 409 with existing — pick one and test; duplicate `id` with same metadata returns existing; duplicate `id` with different metadata → 409 conflict (mirror `recordings.py` pattern).

6. **AC6 — DELETE /collection/{id}** — Given authenticated user and word owned by user, when `DELETE /api/v1/collection/{id}`, then row removed and subsequent GET excludes it. Foreign user's word → 404. FR28.

7. **AC7 — Pydantic mirror** — `app/schemas/collection.py` mirrors `apps/web/src/lib/schemas/collection.schema.ts` for API JSON (**camelCase** field names per BV10): `id`, `word`, `ipa`, `pronunciationGuide`, `meaning`, `exampleSentence`, `savedAt`, `sourceParagraphId`, `reviewCount`, `lastReviewedAt`, `difficultyRating`. Use `ConfigDict(populate_by_name=True)` and Field aliases like `app/schemas/recording.py`.

8. **AC8 — Frontend API mode hooks** — When `isApiStorageBackend()`:
   - `useCollection` loads from `GET /collection` (not Dexie `useLiveQuery`).
   - `useSaveWord` POSTs to API (idempotent by word).
   - `useRemoveWord` DELETEs via API.
   - `HardWordsList` saved-state check uses API collection (not Dexie `useLiveQuery`).
   - `useGenerateParagraph` loads recycle candidates from API collection (not `db.collection.toArray()`).
   Local mode (`STORAGE_BACKEND=local`) unchanged — Dexie paths still work.

9. **AC9 — Tests** — pytest covers GET list (auth, empty, recency sort, user scope), POST (create, idempotent word, id conflict), DELETE (success, 404 foreign/missing); mocked auth via `auth_client` fixture. Vitest for `lib/api/collection.ts` mapping/validation. All existing tests green.

10. **AC10 — Scope boundary** — Does **not** implement `day_completions` (Story 12.2), review-queue API updates (Epic 6 Dexie path acceptable until review sync story), or `today-app.tsx` inline Dexie save (L260–285) — refactor to `useSaveWord` if touched, otherwise defer. No dual-write.

## Tasks / Subtasks

- [x] **Task 1 — SQLAlchemy model + Alembic** (AC: 1, 2, 3)
  - [x] 1.1 Create `app/models/collection_word.py` per BV5 schema block below.
  - [x] 1.2 Add `collection_words` relationship on `app/models/user.py`; export in `app/models/__init__.py`.
  - [x] 1.3 Add migration `alembic/versions/20260531_0005_collection_words.py` revising current head (`20260531_0004` — verify with `alembic heads`).

- [x] **Task 2 — Pydantic schemas** (AC: 7)
  - [x] 2.1 Create `app/schemas/collection.py` with `CollectionWordCreate`, `CollectionWordResponse`.
  - [x] 2.2 Validators: `savedAt`/`lastReviewedAt` ISO UTC strings; `difficultyRating` 0–2; `sourceParagraphId` nullable UUID; `reviewCount` ≥ 0.

- [x] **Task 3 — API routes** (AC: 4, 5, 6)
  - [x] 3.1 Create `app/api/v1/collection.py` with router prefix `/collection`.
  - [x] 3.2 `GET ""` — list by `saved_at DESC`, user-scoped.
  - [x] 3.3 `POST ""` — insert with client id; handle `(user_id, word)` unique violation → return existing or 409; handle id reuse conflict like recordings.
  - [x] 3.4 `DELETE "/{id}"` — user-scoped delete; 404 if not found or wrong user.
  - [x] 3.5 Register router in `app/api/v1/router.py`.

- [x] **Task 4 — Backend tests** (AC: 9)
  - [x] 4.1 Create `tests/test_collection.py` — auth required, CRUD, recency order, user isolation, idempotent POST by word.
  - [x] 4.2 Run full `pytest` in `apps/api` — all green.

- [x] **Task 5 — Frontend API client** (AC: 8, 9)
  - [x] 5.1 Create `apps/web/src/lib/api/collection.ts` — `fetchCollection`, `saveCollectionWord`, `deleteCollectionWord`; `Result<T, StorageError>`; Zod validate responses via `collectionWordSchema`.
  - [x] 5.2 Add `apps/web/src/lib/api/collection.test.ts`.
  - [x] 5.3 Add `collection-mutated.ts` event (mirror `recordings-mutated.ts`) for list refresh after save/delete.

- [x] **Task 6 — Frontend hooks API branches** (AC: 8)
  - [x] 6.1 Update `use-collection.ts` — API mode: `useEffect` + fetch + mutation event; local mode: keep `useLiveQuery`.
  - [x] 6.2 Update `use-save-word.ts` — API branch via `saveCollectionWord`; notify mutation event.
  - [x] 6.3 Update `use-remove-word.ts` — API branch via `deleteCollectionWord`.
  - [x] 6.4 Update `HardWordsList.tsx` — saved-words set from API when `isApiStorageBackend()` (replace Dexie `useLiveQuery` in API mode).
  - [x] 6.5 Update `use-generate-paragraph.ts` L46–48 — fetch collection from API in api mode before `selectRecycleWords`.

- [x] **Task 7 — Verification** (AC: all)
  - [x] 7.1 Run `pytest` in `apps/api`.
  - [x] 7.2 Run web unit tests (`pnpm --filter @audiblytics/web test`).
  - [x] 7.3 Manual smoke (optional): API mode — save word from Today hard-words list → appears on Collection route → remove → gone.

### Review Findings (2026-05-31)

- [x] [Review][Patch] `fetchCollection` throw breaks generate in API mode [`use-generate-paragraph.ts:47-48`] — fixed: `loadCollectionForRecycle` try/catch → `[]` cold-start fallback (FR16).
- [x] [Review][Defer] `today-app.tsx` focus-word save still Dexie-only [`today-app.tsx:260-285`] — AC10 out of scope; consolidate to `useSaveWord` in follow-up.
- [x] [Review][Defer] Review queue Dexie-only in API mode [`review/page.tsx`] — AC10; Epic 6 sync deferred.
- [x] [Review][Defer] `fetchCollection` load failure → empty list silently [`use-collection.ts:37-41`] — same pattern as recordings 11.4; no inline error surface.
- [x] [Review][Defer] No pytest for POST 422 validation [`tests/test_collection.py`] — low priority; Pydantic rejects invalid bodies.
- [x] [Review][Defer] API-mode `useSaveWord` skips client word dedup [`use-save-word.ts:49`] — extra POST on duplicate; server returns 200 idempotent.

## Dev Notes

### BV5 `collection_words` columns (authoritative)

| Column | SQLAlchemy type | JSON alias | Notes |
|--------|-----------------|------------|-------|
| `id` | UUID PK | `id` | Client-supplied on insert |
| `user_id` | UUID FK → `users.id` CASCADE, indexed | — | |
| `word` | String | `word` | Unique per user |
| `ipa` | String | `ipa` | |
| `pronunciation_guide` | String | `pronunciationGuide` | |
| `meaning` | Text | `meaning` | |
| `example_sentence` | Text | `exampleSentence` | |
| `saved_at` | timestamptz, indexed | `savedAt` | ISO UTC at save |
| `source_paragraph_id` | UUID NULL | `sourceParagraphId` | |
| `review_count` | Integer default 0 | `reviewCount` | |
| `last_reviewed_at` | timestamptz NULL, indexed | `lastReviewedAt` | FR49 |
| `difficulty_rating` | Integer default 1 | `difficultyRating` | 0–2 |

Unique: `(user_id, word)`.

### Architecture compliance

- **Phase 4 (stretch):** BV12 — collection switches when `NEXT_PUBLIC_STORAGE_BACKEND=api`; Dexie path unchanged in local mode. **No dual-write.**
- **BV10:** JSON camelCase on API bodies; Python snake_case columns with Pydantic aliases.
- **BV7 error shape:** 401 unauth, 404 not found, 409 conflict, 422 validation — use `detail={"error": {"kind": "...", "message": "..."}}` like `recordings.py`.
- **Security:** All routes require `CurrentUser` dependency; never return other users' words.
- **Colocation:** Backend under `apps/api/app/` — `models/`, `schemas/`, `api/v1/`; frontend under `apps/web/src/lib/api/` + `features/collection/`.

### Technical requirements

- **Idempotency by word:** Client checks `db.collection.where('word')` before insert — server must enforce `(user_id, word)` unique and return existing row on duplicate POST (preferred: 200 with existing body) to avoid save errors on retry.
- **Review fields on create:** Accept client defaults (`reviewCount: 0`, `lastReviewedAt: null`, `difficultyRating: 1`) — PATCH for review updates is **out of scope** (Epic 6 review still Dexie until review-sync story).
- **SQLite tests:** Same `conftest.py` `:memory:` pattern as recordings/paragraph tests.
- **Date parsing:** Reuse ISO UTC validation pattern from `recording.py` `recording_date_from_iso` or shared helper.

### Frontend contract (Zod source of truth)

```typescript
// apps/web/src/lib/schemas/collection.schema.ts
collectionWordSchema: {
  id, word, ipa, pronunciationGuide, meaning, exampleSentence,
  savedAt, sourceParagraphId, reviewCount, lastReviewedAt, difficultyRating
}
```

**Save call sites today:**
- `use-save-word.ts` — primary hook used by `HardWordsList.tsx`
- `today-app.tsx` L260–285 — inline Dexie save (defer unless refactoring; out of AC10 scope)

**List call sites:**
- `use-collection.ts` → `collection/page.tsx`
- `use-generate-paragraph.ts` L46 — recycle word selection
- `HardWordsList.tsx` L36–39 — "already saved" badge state
- Epic 6 review (`review/page.tsx`) — **still Dexie** in API mode until follow-up; document in completion notes

### Previous story intelligence (Epic 11)

- **Migration pattern:** `alembic/versions/20260531_0004_recordings.py` — FK CASCADE, indexes, Postgres `postgresql_ops` for DESC if composite index added.
- **Route pattern:** `app/api/v1/recordings.py` — `_get_user_*` helper, idempotent POST with metadata match, conflict 409.
- **Frontend API pattern:** `lib/api/recordings.ts` + mutation event + hook `useEffect` branch on `isApiStorageBackend()`.
- **Test count baseline:** 51 pytest (post 11.5 CR); web tests ~75+.

### Deferred / follow-up (do not block 12.1)

From `deferred-work.md` and Epic 11 learnings:
- Review session API sync (Epic 6) — review queue still reads Dexie in API mode.
- `today-app.tsx` duplicate inline save — consolidate to `useSaveWord` in future story.
- `fetchCollection` load failure → empty list silently (same pattern as recordings — optional inline error surface).

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` § Epic 12 / Story 12.1]
- [Source: `_bmad-output/planning-artifacts/architecture-v2-fastapi-backend.md` BV5 L237–254, BV7 L383–385, BV10 L482–496, BV12 L527]
- [Source: `apps/web/src/lib/schemas/collection.schema.ts`]
- [Source: `apps/web/src/features/collection/use-save-word.ts`]
- [Source: `apps/api/app/api/v1/recordings.py` — idempotent POST pattern]

## Dev Agent Record

### Agent Model Used

composer-2.5-fast

### Debug Log References

### Completion Notes List

- `CollectionWord` model + Alembic `20260531_0005`; unique `(user_id, word)`.
- `GET/POST/DELETE /api/v1/collection` — idempotent POST returns 200 for duplicate word/id; 409 on id metadata mismatch.
- Frontend: `lib/api/collection.ts`, `collection-mutated.ts`, hooks + `HardWordsList` + `use-generate-paragraph` API branches.
- **61 pytest passed** (+10 collection); **81 web tests passed** (+6 collection).
- Deferred: Epic 6 review queue Dexie-only in API mode; `today-app.tsx` inline save unchanged.
- CR 2026-05-31: `loadCollectionForRecycle` — fetch fail → `[]` for recycle cold-start; **81 web tests green**.

### File List

- `apps/api/app/models/collection_word.py`
- `apps/api/app/models/user.py`
- `apps/api/app/models/__init__.py`
- `apps/api/app/schemas/collection.py`
- `apps/api/app/api/v1/collection.py`
- `apps/api/app/api/v1/router.py`
- `apps/api/app/core/database.py`
- `apps/api/alembic/env.py`
- `apps/api/alembic/versions/20260531_0005_collection_words.py`
- `apps/api/tests/test_collection.py`
- `apps/web/src/lib/api/collection.ts`
- `apps/web/src/lib/api/collection.test.ts`
- `apps/web/src/features/collection/collection-mutated.ts`
- `apps/web/src/features/collection/use-collection.ts`
- `apps/web/src/features/collection/use-save-word.ts`
- `apps/web/src/features/collection/use-remove-word.ts`
- `apps/web/src/components/audiblytics/HardWordsList.tsx`
- `apps/web/src/features/paragraph/use-generate-paragraph.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-05-31: Story created — collection_words backend + API-mode frontend hooks (ready-for-dev).
- 2026-05-31: Implemented — backend CRUD + frontend API hooks (61 pytest, 81 web tests).
- 2026-05-31: CR patch — `loadCollectionForRecycle` cold-start fallback on fetch fail.
