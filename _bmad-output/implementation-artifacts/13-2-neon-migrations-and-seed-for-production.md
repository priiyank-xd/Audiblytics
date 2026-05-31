# Story 13.2: Neon Migrations and Seed for Production

Status: done

## Story

As Priyank,
I want Alembic applied against Neon with seed script documented,
so that production DB matches local schema (BVR6, BVR15).

## Acceptance Criteria

1. **AC1 — Neon URL compatibility** — `DATABASE_URL` from Neon (`postgresql://` or `postgres://`) is normalized to `postgresql+asyncpg://` for SQLAlchemy and Alembic without manual editing.

2. **AC2 — `alembic upgrade head`** — All six revisions apply cleanly to Postgres; single head `20260531_0006`; verified in CI against Postgres 16 service.

3. **AC3 — Migration helper** — `scripts/migrate.sh` runs `alembic upgrade head` with `DATABASE_URL` required; documented for Neon + local.

4. **AC4 — Production seed** — `scripts/seed_user.py` does not call `init_db()` / `create_all`; fails with clear message if schema missing; documented in README Neon section.

5. **AC5 — Documentation** — `apps/api/README.md` Neon production steps: copy URL → migrate → seed; CI workflow referenced.

6. **AC6 — Tests** — pytest: URL normalization, settings integration, Alembic single-head + linear chain; full suite green (79 tests).

7. **AC7 — Scope** — No Dockerfile/entrypoint migration hook (13.1); no ADRs (13.3).

## Tasks / Subtasks

- [x] Task 1: `app/core/database_url.py` + `Settings` validator (AC1)
- [x] Task 2: `tests/test_database_url.py` (AC6)
- [x] Task 3: `tests/test_alembic_revisions.py` — single head, 6 revisions (AC2, AC6)
- [x] Task 4: `scripts/migrate.sh` (AC3)
- [x] Task 5: `seed_user.py` — Alembic-only, schema error message (AC4)
- [x] Task 6: `.github/workflows/api-migrations.yml` — Postgres service, dual URL schemes (AC2)
- [x] Task 7: README Neon section + `.env.example` note (AC5)
- [x] Task 8: Verification — 79 pytest; `migrate.sh` smoke on local Postgres when available (AC2)

### Review Findings (2026-05-31)

- [x] [Review][Patch] Deploy env table contradicts auto-normalize [`apps/api/README.md:88`] — row still says “change the scheme to postgresql+asyncpg://” while Neon section + AC1 say normalization is automatic.
- [x] [Review][Defer] `test_alembic_revisions` hardcodes `EXPECTED_HEAD` + `len == 6` [`tests/test_alembic_revisions.py:7-24`] — update on every new migration; acceptable guard for now.
- [x] [Review][Defer] CI runs two `upgrade head` on same Postgres service [`.github/workflows/api-migrations.yml:42-52`] — second step validates idempotent re-run + `postgresql://` normalization, not a fresh DB-only path.
- [x] [Review][Defer] Local `migrate.sh` fails when tables exist from `init_db()` without `alembic_version` — pre-existing dev path; README still documents `alembic stamp head` in Quick start.
- [x] [Review][Defer] CI workflow does not run `pytest` — migrations-only job; API tests remain local/optional CI follow-up.

## Dev Agent Record

### Agent Model Used

composer-2.5-fast

### Completion Notes List

- `normalize_async_database_url()` — `postgresql://` / `postgres://` → `postgresql+asyncpg://`.
- CI workflow runs `alembic upgrade head` with asyncpg and Neon-style URLs.
- `seed_user.py` requires migrated schema; no `init_db()`.
- **79 pytest** (+7).
- CR: Deploy env table aligned with auto-normalize (AC1/AC5).

### File List

- `apps/api/app/core/database_url.py`
- `apps/api/app/core/config.py`
- `apps/api/scripts/migrate.sh`
- `apps/api/scripts/seed_user.py`
- `apps/api/tests/test_database_url.py`
- `apps/api/tests/test_alembic_revisions.py`
- `apps/api/README.md`
- `apps/api/.env.example`
- `.github/workflows/api-migrations.yml`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/13-2-neon-migrations-and-seed-for-production.md`

## Change Log

- 2026-05-31: CR patch — Deploy `DATABASE_URL` row documents auto-normalize.
- 2026-05-31: Neon URL normalization, migrate.sh, seed fix, CI migrations workflow (79 pytest).

## AI Engineering Record

| Phase | AI-Tool | Story-Ref |
|-------|---------|-----------|
| code | cursor/composer-2.5-fast | 13-2-neon-migrations-and-seed-for-production |
| test | cursor/composer-2.5-fast | 13-2-neon-migrations-and-seed-for-production |
| review | cursor/composer-2.5-fast | 13-2-neon-migrations-and-seed-for-production |
