# Story 11.1: Recordings Table and R2 Client Service

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Priyank,
I want a `recordings` SQLAlchemy model, Alembic migration, and an R2 presign helper service,
so that Stories 11.2–11.3 can orchestrate presigned upload and playback without streaming audio through FastAPI (BVR10, BV6, BV12 Phase 3).

## Acceptance Criteria

> Sourced from `epics.md` § Story 11.1 and `architecture-v2-fastapi-backend.md` BV5/BV6/BV10. Numbered for task traceability.

1. **AC1 — `recordings` table** — Given a fresh Postgres database, when `alembic upgrade head` runs, then the `recordings` table exists with columns matching BV5 (see Dev Notes schema block). **`storage_key` is nullable** until upload completes (Story 11.3 sets it). There is **no** separate `status` column — pending uploads are rows where `storage_key IS NULL` (resolves BV6 diagram “pending” vs BV5 table).

2. **AC2 — Indexes and FK** — Table has FK `user_id → users.id` ON DELETE CASCADE, index on `user_id`, index on `recording_date`, and composite-friendly list index `(user_id, recording_date DESC)` per BV5.

3. **AC3 — Client UUID primary key** — `id` column is UUID PK; migration does **not** force server-only defaults on insert — Story 11.2 will accept **client-provided** `id` from `use-save-recording.ts` `rowId` for idempotent retry (BV5 L262, `saveRecording` L11–28).

4. **AC4 — `paragraph_id` shape** — Column is `VARCHAR` (not UUID-only). Values include standard paragraph UUIDs and warm-up ids matching `WARMUP_RECORDING_ID_RE` in `apps/web/src/lib/warmup-recording-id.ts` (`/^warmup-[0-9a-f]{8}-(pen|nop)$/`).

5. **AC5 — R2 settings** — `app/core/config.py` `Settings` loads `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` from env (documented in `apps/api/.env.example`). Presign helpers fail fast with a clear error when any required R2 setting is missing.

6. **AC6 — Presigned PUT** — Given R2 env vars configured, when `presign_put_upload(user_id, recording_id, mime_type)` is called, then returned URL expires in **≤15 minutes** (900s) and object key is `recordings/{user_id}/{recording_id}.{ext}` where `ext` is derived from `mime_type` (e.g. `audio/webm` → `webm`, `audio/mp4` → `mp4`).

7. **AC7 — Pydantic mirror (no routes yet)** — `app/schemas/recording.py` mirrors `apps/web/src/lib/schemas/recording.schema.ts` for API JSON (**camelCase** field names per BV10): `id`, `recordingDate`, `paragraphId`, `durationMs`, `mimeType`, `dayOfUse`, optional `storageKey`. **No `blob`** on server models. Use `ConfigDict(populate_by_name=True)` and Field aliases like `app/schemas/paragraph.py`.

8. **AC8 — Tests without live R2** — `tests/test_r2_recordings.py` (or equivalent) mocks boto3 `generate_presigned_url` / client; verifies key format, TTL ≤900s, MIME→ext mapping, and missing-config error. Migration/model tests use existing `conftest.py` sqlite `:memory:` pattern — **no** real R2 calls in CI.

9. **AC9 — Scope boundary** — This story does **not** add HTTP routes (`POST /recordings`, etc. — Story 11.2), frontend changes (`use-save-recording` — Story 11.4), or retention prune (Story 11.5). Register model on `User` relationship only; do not wire `api_router` yet.

## Tasks / Subtasks

- [x] **Task 1 — Dependencies and settings** (AC: 5, 6)
  - [x] 1.1 Add `boto3` to `apps/api/pyproject.toml` (pin a stable 1.x release).
  - [x] 1.2 Extend `Settings` in `app/core/config.py` with R2 fields; add `@property` or helper `r2_configured: bool`.
  - [x] 1.3 Confirm `apps/api/.env.example` documents all four R2 vars (already present — align names with `Settings`).

- [x] **Task 2 — SQLAlchemy model + Alembic** (AC: 1, 2, 3, 4)
  - [x] 2.1 Create `app/models/recording.py` per BV5 schema block below.
  - [x] 2.2 Add `recordings` relationship on `app/models/user.py`; export in `app/models/__init__.py`.
  - [x] 2.3 Add migration `alembic/versions/20260531_0004_recordings.py` revising `20260530_0003` (or current head — verify with `alembic heads` before implementing).

- [x] **Task 3 — Pydantic schemas** (AC: 7)
  - [x] 3.1 Create `app/schemas/recording.py` with camelCase JSON aliases matching Zod `recording.schema.ts` (minus `blob`).
  - [x] 3.2 Add validators: `durationMs` 0–60000; `paragraphId` accepts UUID string or warm-up regex.

- [x] **Task 4 — R2 client service** (AC: 5, 6)
  - [x] 4.1 Create `app/services/r2_client.py` with `build_storage_key(user_id, recording_id, mime_type) -> str`.
  - [x] 4.2 Implement `presign_put_upload(...)` using boto3 S3 client pointed at R2 endpoint (`https://{account_id}.r2.cloudflarestorage.com`).
  - [x] 4.3 Implement `mime_type_to_extension(mime_type: str) -> str` with explicit map for recorder MIME types used in web (`audio/webm`, `audio/mp4`, `audio/ogg` if applicable).

- [x] **Task 5 — Tests** (AC: 8)
  - [x] 5.1 Unit tests for `build_storage_key` and `mime_type_to_extension`.
  - [x] 5.2 Mocked presign tests: TTL, key path, missing R2 config raises/returns structured failure.
  - [x] 5.3 Migration smoke: after `init_db` / alembic in test fixture, `recordings` table exists with nullable `storage_key`.

- [x] **Task 6 — Verification** (AC: all)
  - [x] 6.1 Run `pytest` in `apps/api` — all tests green.
  - [x] 6.2 Run `alembic upgrade head` against local Postgres (manual) and confirm table shape.

### Review Findings (2026-05-31)

- [x] [Review][Patch] Composite index missing `recording_date DESC` [alembic/versions/20260531_0004_recordings.py:38] — fixed: `postgresql_ops` DESC + model `recording_date.desc()`.
- [x] [Review][Patch] `recordingDate` accepts arbitrary strings [app/schemas/recording.py:69] — fixed: `_validate_recording_date` on create/response.
- [x] [Review][Patch] `mimeType` not validated at API schema boundary [app/schemas/recording.py:72] — fixed: `_validate_mime_type` against `MIME_TO_EXTENSION`.
- [x] [Review][Patch] Presign `ContentType` not normalized to lowercase [app/services/r2_client.py:71] — fixed: `.lower()` on base MIME.
- [x] [Review][Defer] New boto3 client per `presign_put_upload` call [app/services/r2_client.py:70] — deferred, acceptable for 11.1 presign-only scope; revisit if hot path.
- [x] [Review][Defer] No DB `CHECK (duration_ms <= 60000)` [alembic/versions/20260531_0004_recordings.py:27] — deferred, Pydantic enforces today; DB constraint optional for 11.2+.

## Dev Notes

### BV5 `recordings` columns (authoritative)

| Column | SQLAlchemy type | Notes |
|--------|-----------------|-------|
| `id` | UUID PK | Client-supplied on insert (11.2) |
| `user_id` | UUID FK → `users.id` CASCADE, indexed | |
| `recording_date` | timestamptz, indexed | ISO UTC at save time |
| `paragraph_id` | String | UUID or `warmup-{hash}-{pen\|nop}` |
| `duration_ms` | Integer | max 60000 |
| `mime_type` | String | |
| `storage_key` | String, unique, **nullable** | NULL = pending upload |
| `day_of_use` | Integer | From client `dayOfUse` snapshot |
| `created_at` | timestamptz | server default now() |

Index: `(user_id, recording_date DESC)` for list view (BV5 L272).

### Pending vs “status” column

BV6 sequence diagram mentions `status=pending`. **Do not add a `status` column.** Pending = `storage_key IS NULL`. Story 11.2 AC wording “row status is pending” means this nullable-key convention — document for 11.2 implementer.

### Architecture compliance

- **Phase 3 only:** BV12 — recordings switch when `NEXT_PUBLIC_STORAGE_BACKEND=api`; Dexie path unchanged until Story 11.4. No dual-write.
- **BV10:** JSON camelCase on API bodies; Python models use aliases.
- **BV6:** Presigned PUT only in v2 phase 1 — API must not accept multipart audio bodies.
- **Security:** Never return R2 secret keys in API responses (11.2+).
- **Colocation:** Backend under `apps/api/app/` — `models/`, `schemas/`, `services/` (mirror `paragraph_cache`, `gemini_paragraph`).

### Technical requirements

- **boto3:** Sync client inside async route is acceptable for presign-only (no I/O heavy streaming); keep presign logic in `r2_client.py` for testability.
- **R2 endpoint:** `endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com"`, `region_name="auto"` (Cloudflare R2 convention).
- **Presign TTL:** `ExpiresIn=900` (15 minutes max per AC6).
- **SQLite tests:** Use same patterns as `paragraph_cache` — types compatible with `init_db()` in `conftest.py`.

### Frontend contract (for 11.2–11.4 — read-only this story)

- Zod source: `apps/web/src/lib/schemas/recording.schema.ts` — includes `blob` client-only.
- Save path: `apps/web/src/features/voice-journal/use-save-recording.ts` — `rowId`, `dayOfUse` from `dayOfUseAtRecordingSave()`.
- Warm-up saves use same `saveRecording` via `use-warm-up-recording.ts`.

### Previous story intelligence (Epic 10)

- **Migration pattern:** `alembic/versions/20260530_0002_paragraph_cache.py` — FK, indexes, Postgres JSONB variants.
- **Model pattern:** `app/models/paragraph_cache.py` — `Mapped`, `relationship` on `User`.
- **Schema pattern:** `app/schemas/paragraph.py` — camelCase, `from_row` helpers, `Field` aliases.
- **Test pattern:** `tests/test_paragraphs.py` + `tests/conftest.py` `auth_client` fixture.
- **Router:** `app/api/v1/router.py` — do not register recordings router until 11.2.

### Cross-story dependencies

| Story | Depends on 11.1 |
|-------|-----------------|
| 11.2 | Model + `presign_put_upload` + schemas for POST body/response |
| 11.3 | `storage_key` update + presigned GET helper (add `presign_get_playback` in same service file or 11.3) |
| 11.4 | API client hooks; uses 11.2–11.3 routes |
| 11.5 | `recording_date` + R2 delete by `storage_key` |

### Deferred / out of scope

- `deferred-work.md` RecordPanel 60s cap auto-save → Story 11.4 integration territory.
- `GET /recordings` list, playback URL, retention — Stories 11.2–11.5.

### Project structure notes

**New files (expected):**

- `apps/api/app/models/recording.py`
- `apps/api/app/schemas/recording.py`
- `apps/api/app/services/r2_client.py`
- `apps/api/alembic/versions/20260531_0004_recordings.py`
- `apps/api/tests/test_r2_recordings.py`

**Modified files (expected):**

- `apps/api/pyproject.toml`
- `apps/api/app/core/config.py`
- `apps/api/app/models/user.py`
- `apps/api/app/models/__init__.py`

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 11, Story 11.1]
- [Source: `_bmad-output/planning-artifacts/architecture-v2-fastapi-backend.md` — BV5 `recordings`, BV6, BV10, BV12 Phase 3]
- [Source: `apps/web/src/lib/schemas/recording.schema.ts`]
- [Source: `apps/web/src/features/voice-journal/use-save-recording.ts`]
- [Source: `apps/api/app/models/paragraph_cache.py`, `apps/api/tests/test_paragraphs.py`]

## Dev Agent Record

### Agent Model Used

composer-2.5-fast

### Debug Log References

### Completion Notes List

- `recordings` model + migration `20260531_0004`; pending upload = `storage_key IS NULL`.
- R2: `Settings.r2_configured`, `presign_put_upload` (900s TTL), `R2ConfigurationError` when env incomplete.
- Pydantic `RecordingResponse` / `RecordingCreateRequest` with warmup + UUID `paragraphId` validators.
- `database.py` imports all models so `init_db()` creates `recordings` table.
- pytest: 8 new tests in `test_r2_recordings.py`; **14 passed** total in `apps/api`.
- CR: DESC composite index, ISO `recordingDate` + `mimeType` validators, presign `ContentType` lowercase; **14 passed** after patches.

### File List

- `apps/api/pyproject.toml`
- `apps/api/app/core/config.py`
- `apps/api/app/core/database.py`
- `apps/api/app/models/recording.py`
- `apps/api/app/models/user.py`
- `apps/api/app/models/__init__.py`
- `apps/api/app/schemas/recording.py`
- `apps/api/app/services/r2_client.py`
- `apps/api/alembic/versions/20260531_0004_recordings.py`
- `apps/api/alembic/env.py`
- `apps/api/tests/test_r2_recordings.py`

## Change Log

- 2026-05-31: Story created with validate-create-story findings (pending=`storage_key` NULL, client UUID, R2 settings, boto3, scope fence).
- 2026-05-31: Implemented model, migration, R2 presign service, schemas, tests (DS).
- 2026-05-31: CR patches — DESC index, ISO recordingDate, mimeType validation, Content-Type lowercase (CR).
