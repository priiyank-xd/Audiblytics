# Deferred work

## Deferred from: code review of 15-5-documentation-and-sprint-tracking-hygiene (2026-06-01)

- **UX spec cross-link to v2 addendum** — standalone addendum satisfies AC3; optional `referenceArtifacts` entry in `ux-design-specification.md` frontmatter.
- **Retroactive Epic 9–10 story File Lists** — AC4 met with story + AC copy; implementation file lists optional for retroactive traceability.

## Deferred from: code review of 15-4-stats-route-implement-or-remove-nav (2026-06-01)

- **`hasParagraphForTodayOnScreen` off Today route** — Stats (and Journey) may undercount today’s session when paragraph is only visible on Today; StatStreakSurface semantics pre-date 15.4.
- **Stats page `max-w-3xl` vs Journey full width** — optional polish to align stat grid width with Journey layout.

## Deferred from: code review (14-6-review-session-v2) — 2026-05-31

- **`useReviewQueue` Dexie-only in API mode** — review batch may be empty while server collection has words; follow-up when review sync lands.
- **Global keyboard shortcuts 1–4** — active window-wide when card revealed; optional card-focus scoping in polish pass.

## Deferred from: code review (14-5-collection-master-detail) — 2026-05-31

- **`useCollectionSourceMeta` Dexie-only** — API mode source labels fall back to saved date until paragraph cache syncs server-side.
- **Collection list responsive layout** — 4-column grid on narrow screens; stack columns below `sm` in polish pass.

## Deferred from: code review (14-4-voice-journal-page-v2) — 2026-05-31

- **API-mode download without blob** — `triggerRecordingDownload` no-op when `row.blob` missing; presign-then-download follow-up.
- **RecordPanel waveform DRY** — share `WAVEFORM_BAR_HEIGHT_CLASSES` with `RecordingWaveformPlaceholder`.

## Deferred from: code review (14-3-today-session-three-column-layout) — 2026-05-31

- **Stale `selectedWordId` after New paragraph** — clear `selectedWordId` / `activeWordId` when `handleGenerate` swaps paragraph id.
- **`ParagraphHero.tsx` orphaned** — no imports in `apps/web`; safe to delete in cleanup pass.

## Deferred from: code review (14-2-home-dashboard) — 2026-05-31

- **Featured streak duplicate copy when streak > 0** — headline and body both repeat day count; hide subtitle when streak > 0 except zero-state encouragement.
- **Greeting hour phrase fixed at mount** — `getHours()` evaluated once per render cycle; long-lived tab won't update phrase at noon boundary.

## Deferred from: code review (14-1-design-tokens-and-app-shell-v2) — 2026-05-31

- **`/calendar` unreachable from nav** — Stats→`/stats` stub, Journey→`/journey` stub; direct URL still works until 14.8 merges calendar into Journey.
- **HomeDashboard hardcoded "Neal"** — out of 14.1 scope (AC10); address in 14.2 home dashboard.
- **`TopNav.tsx` orphaned** — removed from `layout.tsx`; file kept; optional delete in cleanup.
- **Logout failure silent** — sidebar `void logout()`; no inline error; matches existing auth-context pattern.

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
- ~~**`useArchivedDay` Dexie-only recordings**~~ — **Resolved:** Story 15.2 (`GET /paragraphs/by-date`, API archived snapshot).
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

## Deferred from: code review (15-3-days-of-use-server-sync-day-14-parity) — 2026-06-01

- **Day14 `hasDay1Recording` Dexie-only in API mode** — `use-day-14-trigger.ts`; needs API recording query for full parity.
- **Server stamp failure → local-only until reload** — acceptable per AC local fallback.

## Deferred from: code review (15-2-archived-day-detail-in-api-mode) — 2026-06-01

- **Full `fetchRecordings()` per archived day** — client UTC filter; server `?date=` if list grows.
- **Archived API load failure → empty snapshot** — partial data not shown on mixed failure; matches completions degrade.
- **`/calendar?day=` 404** — route absent; Journey detail is canonical; link polish optional.

## Deferred from: code review (15-1-server-paragraph-dates-for-calendar-and-streak) — 2026-06-01

- **`_parse_query_utc_date` duplicated** — `paragraphs.py` / `completions.py`; extract shared util in hygiene pass.
- **Paragraph dates API fail → Dexie-only** — `load-paragraph-cache-utc-date-set.ts`; same silent-degrade as completions fetch.
- **No vitest for API merge branch** — `loadParagraphCacheUtcDateSet`; merge helper covered.
- **Unbounded dates query + no window params from hooks** — n=1 OK; optimize if history grows.

## Deferred from: code review (12-2-day-completions-api) — 2026-05-31

- ~~**`loadParagraphCacheUtcDateSet` Dexie-only in API mode**~~ — **Resolved:** Story 15.1 (`GET /paragraphs/dates` + Dexie ∪ server merge).
- **`fetchCompletions` load failure → empty map** — same defer as 12.1 collection; no inline error on calendar/streak fetch fail.
- **Upsert failure silent in markReadIt / recording stamp** — PUT fail leaves UI stale; no inline error surface.
- **No pytest for GET `from`/`to` range query params** — optional filter coverage.
