# Story 11.4: Frontend Save Recording via API

Status: done

## Story

As Priyank,
I want `saveRecording` to use the API path when `STORAGE_BACKEND=api`,
so that recordings persist to R2 instead of Dexie blobs (BVR12, FR31).

## Acceptance Criteria

1. **AC1** — API mode save: presign → PUT R2 → complete → `notifyRecordingsMutated` / list refresh via `GET /recordings`.
2. **AC2** — Local mode unchanged: Dexie `saveRecording` path still works.
3. **AC3** — Upload failure → `Result` err → `<InlineErrorSurface variant="storage">` (existing RecordPanel/warm-up wiring).
4. **AC4** — `useRecordings` loads from API when `isApiStorageBackend()`.
5. **AC5** — API list playback via `GET /recordings/{id}/playback-url` when blob absent.
6. **AC6** — `GET /recordings` backend list (completed rows only, user-scoped).

## Tasks / Subtasks

- [x] Task 1: `GET /recordings` route + tests (AC6)
- [x] Task 2: `recordingListItemSchema` + `lib/api/recordings.ts` (AC1)
- [x] Task 3: `saveRecording` API branch + `notifyRecordingsMutated` (AC1–AC3)
- [x] Task 4: `useRecordings` API branch (AC4)
- [x] Task 5: Playback via presigned URL when no blob (AC5)
- [x] Task 6: Unit tests + pytest + typecheck green (40 API + 73 web)

### Review Findings (2026-05-31)

- [x] [Review][Patch] `saveRecordingViaApi` uncaught `fetch` network errors [`lib/api/recordings.ts:98-145`] — fixed: try/catch → `err({ kind: 'unknown' })`.
- [x] [Review][Patch] `mapRecordingResponse` throws on malformed complete JSON [`lib/api/recordings.ts:143`] — fixed: `mapRecordingResponseResult` + `safeParse`.
- [x] [Review][Defer] `enrichRecordingsWithTheme` uses Dexie `paragraphCache` only [`enrich-recordings-with-theme.ts`] — API mode theme labels may be "Unknown" until server paragraph sync.
- [x] [Review][Defer] `useArchivedDay` Dexie-only recordings [`use-archived-day.ts`] — out of 11.4 AC; calendar drill-in needs API filter in follow-up.
- [x] [Review][Defer] RecordPanel replacement skipped in API mode [`RecordPanel.tsx:257`] — documented; needs DELETE route.
- [x] [Review][Defer] `fetchRecordings` failure → empty list silently [`use-recordings.ts:54-58`] — no inline error surface on list load.
- [x] [Review][Defer] PUT succeeds / complete fails leaves pending row [`recordings.ts:127-140`] — idempotent retry via 11.2 POST; same as 11.2 orphan pattern.

## Dev Notes

- API mode RecordPanel skips Dexie replacement dialog (no DELETE route yet).
- Download in VoiceJournalList requires local blob.

## Dev Agent Record

### Agent Model Used

composer-2.5-fast

### Completion Notes List

- `GET /api/v1/recordings` — completed rows, user-scoped, desc by date.
- `saveRecordingViaApi` — presign → PUT → complete; errors → `StorageError`.
- `useRecordings` / RecordPanel API load + `audiblytics:recordings-mutated`.
- `playRecordingItem` — blob or presigned GET playback.
- CR 2026-05-31: network try/catch + safeParse complete body; **75 web tests**.

### File List

- `apps/api/app/api/v1/recordings.py`
- `apps/api/tests/test_recordings.py`
- `apps/web/src/lib/schemas/recording.schema.ts`
- `apps/web/src/lib/api/recordings.ts`
- `apps/web/src/lib/api/recordings.test.ts`
- `apps/web/src/lib/audio/play-recording.ts`
- `apps/web/src/features/voice-journal/use-save-recording.ts`
- `apps/web/src/features/voice-journal/use-recordings.ts`
- `apps/web/src/features/voice-journal/recordings-mutated.ts`
- `apps/web/src/features/voice-journal/enrich-recordings-with-theme.ts`
- `apps/web/src/components/audiblytics/VoiceJournalList.tsx`
- `apps/web/src/components/audiblytics/RecordPanel.tsx`
- `apps/web/src/components/audiblytics/CompositePlayer.tsx`

## AI Engineering Record

| Phase | AI-Tool | Story-Ref |
|-------|---------|-----------|
| code | cursor/composer-2.5-fast | 11-4-frontend-save-recording-via-api |
| test | cursor/composer-2.5-fast | 11-4-frontend-save-recording-via-api |
| review | cursor/composer-2.5-fast | 11-4-frontend-save-recording-via-api |

## Change Log

- 2026-05-31: Story 11.4 — API save path, GET /recordings, playback-url integration (40 + 73 tests).
- 2026-05-31: CR patches — fetch try/catch, safeParse complete (75 web tests).
