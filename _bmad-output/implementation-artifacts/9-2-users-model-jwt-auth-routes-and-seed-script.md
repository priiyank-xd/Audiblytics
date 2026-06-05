# Story 9.2: Users Model, JWT Auth Routes, and Seed Script

Status: done

## Story

As Priyank,
I want register, login, logout, and `/auth/me` with httpOnly JWT cookie,
So that I can authenticate securely without storing tokens in localStorage.

## Acceptance Criteria

**Given** a new email/password via `POST /auth/register`
**When** login succeeds
**Then** `audiblytics_session` httpOnly cookie is set and `GET /auth/me` returns user id + email

**Given** `scripts/seed_user.py`
**When** run locally
**Then** seeded account exists for dogfooding (BV12)

## Dev Agent Record

### Completion Notes

Retroactive traceability file (Story 15.5 / BVR20). Implemented 2026-05-30 · BVR1.

## Change Log

- 2026-06-01: Retroactive story file created for Epic 9 traceability
