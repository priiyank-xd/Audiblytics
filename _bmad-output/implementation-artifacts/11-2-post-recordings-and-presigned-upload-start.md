# Story 11.2: POST /recordings and Presigned Upload Start

Status: done

## Story

As Priyank,
I want to start an upload and receive a presigned PUT URL,
so that audio bytes go direct to R2 without streaming through FastAPI (BV6, BVR10).

## Acceptance Criteria

1. **AC1** — Authenticated `POST /api/v1/recordings` with `RecordingCreateRequest` body persists a row with `storage_key` NULL (pending).
2. **AC2** — Response includes `recordingId`, `uploadUrl`, `expiresIn` (camelCase JSON).
3. **AC3** — Client-provided `id` is used as PK (idempotent retry: same `id` + pending → new presign; completed → 409).
4. **AC4** — Missing R2 config → 503 with structured `error` detail (not 500).
5. **AC5** — Unauthenticated → 401.

## Tasks / Subtasks

- [x] Task 1: `RecordingUploadStartResponse` schema
- [x] Task 2: `app/api/v1/recordings.py` POST handler
- [x] Task 3: Wire router
- [x] Task 4: `tests/test_recordings.py`
- [x] Task 5: pytest green (21 passed)

### Review Findings (2026-05-31)

- [x] [Review][Patch] Cross-user client UUID collision → unhandled `IntegrityError` [app/api/v1/recordings.py:53-54] — fixed: `IntegrityError` → 409.
- [x] [Review][Patch] Idempotent retry ignores body drift [app/api/v1/recordings.py:30-41] — fixed: `_metadata_matches` with UTC-normalized dates.
- [x] [Review][Patch] `ValueError` from `presign_put_upload` uncaught [app/api/v1/recordings.py:57-58] — fixed: → 422 `validation_error`.
- [x] [Review][Defer] Idempotent retry returns 201 not 200 [app/api/v1/recordings.py:18] — REST nuance; acceptable for n=1 until 11.4.
- [x] [Review][Defer] Row committed before presign; 503 leaves pending orphan [app/api/v1/recordings.py:54] — deferred; retry path is intentional per 11.1 design.

## Dev Agent Record

### Agent Model Used

composer-2.5-fast

### Completion Notes List

- `POST /api/v1/recordings` inserts pending row, returns presigned PUT metadata.
- Idempotent pending retry; 409 when `storage_key` set.
- `R2ConfigurationError` → 503 `storage_error`.
- CR: IntegrityError 409, metadata drift guard, ValueError → 422; **24 passed**.

### File List

- `apps/api/app/schemas/recording.py`
- `apps/api/app/api/v1/recordings.py`
- `apps/api/app/api/v1/router.py`
- `apps/api/tests/test_recordings.py`
