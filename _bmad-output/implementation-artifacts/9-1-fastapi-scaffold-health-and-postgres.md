# Story 9.1: FastAPI Scaffold, Health, and Postgres

Status: done

## Story

As Priyank,
I want a monorepo `apps/api/` FastAPI service with health check and async Postgres connection,
So that the backend foundation exists for auth and settings.

## Acceptance Criteria

**Given** `docker compose up postgres` and `uvicorn app.main:app`
**When** `GET /api/v1/health` is called
**Then** response is 200 with liveness payload (BVR1 scaffold)

**Given** `DATABASE_URL` points at Postgres
**When** the API starts
**Then** SQLAlchemy async engine connects without error (BV2)

## Dev Agent Record

### Completion Notes

Retroactive traceability file (Story 15.5 / BVR20). Implemented 2026-05-30.

## Change Log

- 2026-06-01: Retroactive story file created for Epic 9 traceability
