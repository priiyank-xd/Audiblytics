# Story 9.3: Alembic Migrations for Users and User Settings

Status: done

## Story

As Priyank,
I want Alembic migrations for `users` and `user_settings`,
So that schema changes are versioned for Neon/production (BVR6).

## Acceptance Criteria

**Given** fresh Postgres
**When** `alembic upgrade head` runs
**Then** `users` and `user_settings` tables exist matching BV5 schema

## Dev Agent Record

### Completion Notes

Retroactive traceability file (Story 15.5 / BVR20). Implemented 2026-05-30.

## Change Log

- 2026-06-01: Retroactive story file created for Epic 9 traceability
