# Story 11.3: POST /recordings/{id}/complete and Playback URL

Status: done

## Story

As Priyank,
I want to finalize upload and play back via short-lived GET URL,
so that Voice Journal works with cloud blobs (BVR11, FR35).

## Acceptance Criteria

1. **AC1** — Authenticated `POST /api/v1/recordings/{id}/complete` on pending row sets `storage_key` via `build_storage_key` and returns `RecordingResponse` (200).
2. **AC2** — Idempotent complete: row already has `storage_key` → 200 with same `RecordingResponse` (no error).
3. **AC3** — Complete on missing/wrong-user recording → 404 `not_found`.
4. **AC4** — Authenticated `GET /api/v1/recordings/{id}/playback-url` on completed row returns `playbackUrl` + `expiresIn` (camelCase); TTL 60–300s.
5. **AC5** — Playback on pending row (`storage_key` NULL) → 409 `conflict`.
6. **AC6** — Playback with missing R2 config → 503 `storage_error`.
7. **AC7** — Unauthenticated on either route → 401.

## Tasks / Subtasks

- [x] Task 1: `presign_get_playback` in `app/services/r2_client.py` (AC4, AC6)
- [x] Task 2: `RecordingPlaybackUrlResponse` schema (AC4)
- [x] Task 3: `POST /recordings/{id}/complete` handler (AC1–AC3, AC7)
- [x] Task 4: `GET /recordings/{id}/playback-url` handler (AC4–AC7)
- [x] Task 5: `tests/test_r2_recordings.py` presign GET unit tests (AC4, AC6)
- [x] Task 6: `tests/test_recordings.py` route integration tests (AC1–AC7)
- [x] Task 7: Full pytest green (35 passed)

### Review Findings (2026-05-31)

- [x] [Review][Patch] `ValueError` from `build_storage_key` uncaught on complete [`app/api/v1/recordings.py:145`] — fixed: → 422 `validation_error`.
- [x] [Review][Patch] `IntegrityError` uncaught on complete commit [`app/api/v1/recordings.py:146`] — fixed: rollback + re-fetch idempotent row or 409.
- [x] [Review][Patch] No cross-user complete isolation test [`tests/test_recordings.py`] — fixed: `test_complete_cross_user_not_found`.
- [x] [Review][Defer] Complete without R2 object HEAD/exists check [`app/api/v1/recordings.py:144-147`] — deferred; BV6 trusts client PUT; optional verify in 11.4 integration.
- [x] [Review][Defer] New boto3 client per `presign_get_playback` call [`app/services/r2_client.py:101`] — deferred; same as 11.1 presign PUT pattern.
- [x] [Review][Defer] `start_recording_upload` duplicates select instead of `_get_user_recording` [`app/api/v1/recordings.py:57-59`] — deferred; pre-11.3 style, refactor optional.

## Dev Notes

- Pending = `storage_key IS NULL` (11.1). Complete derives key from row `mime_type` — no client body.
- `presign_get_playback(storage_key)` uses `get_object` presign; `PRESIGN_GET_EXPIRES_SECONDS = 120`.
- Mirror 11.2 error shape: `detail.error.kind` + `message`.
- Idempotent complete matches 11.2 pending-retry pattern.

## Dev Agent Record

### Agent Model Used

composer-2.5-fast

### Completion Notes List

- `POST /api/v1/recordings/{id}/complete` sets `storage_key` via `build_storage_key`; idempotent 200.
- `GET /api/v1/recordings/{id}/playback-url` returns presigned GET (120s TTL).
- `_get_user_recording` helper shared by complete + playback routes.
- **35 passed** (9 new route tests + 2 r2 presign GET tests).
- CR 2026-05-31: ValueError→422, IntegrityError idempotent re-fetch, cross-user complete test; **37 passed**.

### File List

- `apps/api/app/services/r2_client.py`
- `apps/api/app/schemas/recording.py`
- `apps/api/app/api/v1/recordings.py`
- `apps/api/tests/test_r2_recordings.py`
- `apps/api/tests/test_recordings.py`

## AI Engineering Record

| Phase | AI-Tool | Story-Ref |
|-------|---------|-----------|
| code | cursor/composer-2.5-fast | 11-3-post-recordings-id-complete-and-playback-url |
| test | cursor/composer-2.5-fast | 11-3-post-recordings-id-complete-and-playback-url |
| review | cursor/composer-2.5-fast | 11-3-post-recordings-id-complete-and-playback-url |

## Change Log

- 2026-05-31: Story 11.3 — complete + playback-url routes, `presign_get_playback`, tests (35 passed).
- 2026-05-31: CR patches — ValueError/IntegrityError guards, cross-user test (37 passed).
