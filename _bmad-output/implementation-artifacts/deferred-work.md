# Deferred work

## Deferred from: code review (11-1-recordings-table-and-r2-client-service) — 2026-05-31

- **New boto3 client per presign call** — acceptable for Story 11.1; pool or reuse client if upload volume grows in 11.2+.
- **No DB CHECK on duration_ms** — Pydantic caps 0–60000; add Postgres check constraint later if defense-in-depth needed.

## Deferred from: code review (11-3-post-recordings-id-complete-and-playback-url) — 2026-05-31

- **Complete without R2 object HEAD/exists check** — BV6 presign flow trusts client PUT; optional server-side verify if ghost completions appear in 11.4.
- **New boto3 client per `presign_get_playback` call** — same defer as 11.1; pool if hot path.
- **`start_recording_upload` duplicate select vs `_get_user_recording`** — cosmetic refactor; not blocking.

## Deferred from: code review (11-5-server-side-90-day-retention-prune) — 2026-05-31

- **Sync boto3 delete in async prune path** — same defer as 11.1 presign; pool/reuse if login/me latency matters.
- **R2 delete failures swallowed without logging** — orphan R2 keys possible; add structured log if storage audit needed.
- **Naive UTC cutoff in SQL compare** — SQLite test compat; assumes UTC Postgres host for production boundary accuracy.
- **R2-before-DB ordering on partial commit failure** — ghost rows until next successful prune; rare for n=1.
- **No vitest for API-mode client prune skip** — AC6 pytest-only; optional frontend test.
- **PATCH /settings retention change** — prune runs on next login/me, not immediately; matches Dexie mount-hook behavior.

## Deferred from: code review (11-4-frontend-save-recording-via-api) — 2026-05-31

- **`enrichRecordingsWithTheme` Dexie-only paragraph cache** — API mode theme labels "Unknown" until paragraph cache syncs server-side.
- **`useArchivedDay` Dexie-only recordings** — calendar archived-day drill-in broken in API mode; follow-up story.
- **RecordPanel replacement skipped in API mode** — needs DELETE /recordings route.
- **`fetchRecordings` load failure → empty list** — no inline error on voice journal list fetch fail.
- **PUT ok / complete fail pending orphan** — idempotent POST retry path; same as 11.2.

## Deferred from: code review (3-1-mediarecorder-wrapper) — 2026-05-15

- **Task 6 manual browser checks** — Chrome/Safari MIME smoke, real 60s auto-stop, &lt;300ms start latency (AC4–AC6). Automated tests use mocks; recommend spot-check before production use.
- **RecordPanel 60s auto-save integration** — Recorder finalizes blob on cap (AC5 met in `recorder.ts`); `RecordPanel` does not persist when cap fires without user stop. Verify E2E on Today or add idle-transition handler (Story 3.3 territory).
