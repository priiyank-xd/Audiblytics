# Story 13.3: Architecture ADRs (3 minimum)

Status: done

## Story

As Priyank,
I want ADRs for auth, R2-not-DB-blobs, and strangler migration,
so that interview narrative has written decisions (BVR15).

## Acceptance Criteria

1. **AC1 — `docs/decisions/`** — Directory exists with index README.

2. **AC2 — Three ADRs** — At least three numbered ADRs covering:
   - JWT httpOnly cookie auth (BV4)
   - R2 presigned blobs, not Postgres BYTEA (BV6, BV17)
   - Strangler `STORAGE_BACKEND` migration (BV0, BV9)

3. **AC3 — BV references** — Each ADR cites explicit `BV*` decision IDs from `architecture-v2-fastapi-backend.md`.

4. **AC4 — Discoverability** — Root `README.md` and `apps/api/README.md` link to `docs/decisions/`.

5. **AC5 — Tests** — pytest guards ADR count and BV references; full API suite green.

6. **AC6 — Scope** — Documentation only; no application code changes beyond tests/links.

## Tasks / Subtasks

- [x] Task 1: `docs/decisions/README.md` index (AC1)
- [x] Task 2: ADR 0001 auth — BV4 (AC2, AC3)
- [x] Task 3: ADR 0002 R2 blobs — BV6, BV17 (AC2, AC3)
- [x] Task 4: ADR 0003 strangler flag — BV0, BV9 (AC2, AC3)
- [x] Task 5: README links (AC4)
- [x] Task 6: `tests/test_adrs.py` (AC5)
- [x] Task 7: Verification — 81 pytest (AC5)

### Review Findings (2026-05-31)

- [x] [Review][Patch] ADR 0003 References cite non-existent port tree [`docs/decisions/0003-strangler-storage-backend-flag.md:39`] — `apps/web/src/lib/storage/` is only `.gitkeep`; actual switch is `lib/config/storage-backend.ts` + feature hooks (`isApiStorageBackend()`).
- [x] [Review][Defer] BV9 repository interfaces not fully extracted — ADR describes target strangler pattern; hooks branch per capability (matches phased migration intent).
- [x] [Review][Defer] `test_adrs` checks BV regex only, not ADR title/topic mapping — sufficient for AC5 guard.
- [x] [Review][Dismiss] Architecture doc mentions passlib; ADR/code use bcrypt directly — ADR matches implementation.

## Dev Agent Record

### Agent Model Used

composer-2.5-fast

### Completion Notes List

- 3 ADRs + index under `docs/decisions/`.
- **81 pytest** (+2 `test_adrs`).
- CR: ADR 0003 references aligned with `storage-backend.ts` + feature hooks.

### File List

- `docs/decisions/README.md`
- `docs/decisions/0001-jwt-httponly-cookie-auth.md`
- `docs/decisions/0002-r2-presigned-blobs-not-postgres.md`
- `docs/decisions/0003-strangler-storage-backend-flag.md`
- `apps/api/tests/test_adrs.py`
- `README.md`
- `apps/api/README.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/13-3-architecture-adrs-3-minimum.md`

## Change Log

- 2026-05-31: CR patch — ADR 0003 references match actual web paths.
- 2026-05-31: ADRs for BV4, BV6, BV9 + index, links, pytest guards (81 tests).

## AI Engineering Record

| Phase | AI-Tool | Story-Ref |
|-------|---------|-----------|
| code | cursor/composer-2.5-fast | 13-3-architecture-adrs-3-minimum |
| test | cursor/composer-2.5-fast | 13-3-architecture-adrs-3-minimum |
| review | cursor/composer-2.5-fast | 13-3-architecture-adrs-3-minimum |
