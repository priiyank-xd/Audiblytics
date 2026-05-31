# Deferred work

## Deferred from: code review (13-3-architecture-adrs-3-minimum) — 2026-05-31

- **BV9 formal storage ports not implemented** — `isApiStorageBackend()` + feature hooks carry strangler flag; ADR describes BV9 target pattern.

## Deferred from: code review (13-2-neon-migrations-and-seed-for-production) — 2026-05-31

- **`test_alembic_revisions` hardcodes head + count 6** — bump `EXPECTED_HEAD` / count when adding migrations.
- **CI double `upgrade head` on one Postgres** — validates idempotent re-run, not isolated Neon-URL-first bootstrapping.
- **Local `migrate.sh` vs prior `init_db()` tables** — use `alembic stamp head` when tables pre-exist without `alembic_version`.
- **CI migrations workflow skips pytest** — add combined API CI job later if desired.

## Deferred from: code review (13-1-dockerfile-and-production-env-docs) — 2026-05-31

- **`CMD`/`HEALTHCHECK` use `sh -c`** — Docker JSONArgsRecommended warning; graceful SIGTERM to uvicorn may need `exec` or `tini` if platform reports slow shutdown.
- **Image runs as root** — no `USER` directive; acceptable for n=1 Railway/Fly demo.
- **`.dockerignore` excludes `uv.lock`** — image builds from `pyproject.toml` minimums only; pin via lockfile if reproducibility matters.
- **`ENVIRONMENT` gate exact `production` only** — typos like `prod` would still run `create_all`; docs mandate exact value.

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

## Deferred from: code review (12-1-collection-words-api) — 2026-05-31

- **`today-app.tsx` focus-word save Dexie-only in API mode** — AC10 scoped; `handleSaveSelectedWord` bypasses `useSaveWord`; consolidate in follow-up.
- **Review queue Dexie-only in API mode** — AC10; Epic 6 review sync deferred until dedicated story.
- **`fetchCollection` load failure → empty list** — same defer as recordings 11.4; no inline error on collection list fetch fail.
- **No pytest for POST 422 validation** — Pydantic boundary enforced; optional defense-in-depth test.
- **API-mode `useSaveWord` skips client word dedup** — server idempotent 200; acceptable extra POST for n=1.

## Deferred from: code review (12-2-day-completions-api) — 2026-05-31

- **`loadParagraphCacheUtcDateSet` Dexie-only in API mode** — streak/calendar `hasParagraphForDate` ignores server paragraph cache; completions sync alone insufficient for full cross-device calendar.
- **`fetchCompletions` load failure → empty map** — same defer as 12.1 collection; no inline error on calendar/streak fetch fail.
- **Upsert failure silent in markReadIt / recording stamp** — PUT fail leaves UI stale; no inline error surface.
- **No pytest for GET `from`/`to` range query params** — optional filter coverage.
