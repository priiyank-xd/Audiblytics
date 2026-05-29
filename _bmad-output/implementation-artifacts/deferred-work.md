# Deferred work

## Deferred from: code review (3-1-mediarecorder-wrapper) — 2026-05-15

- **Task 6 manual browser checks** — Chrome/Safari MIME smoke, real 60s auto-stop, &lt;300ms start latency (AC4–AC6). Automated tests use mocks; recommend spot-check before production use.
- **RecordPanel 60s auto-save integration** — Recorder finalizes blob on cap (AC5 met in `recorder.ts`); `RecordPanel` does not persist when cap fires without user stop. Verify E2E on Today or add idle-transition handler (Story 3.3 territory).
