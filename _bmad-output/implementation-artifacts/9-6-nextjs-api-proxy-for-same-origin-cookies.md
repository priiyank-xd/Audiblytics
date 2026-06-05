# Story 9.6: Next.js API Proxy for Same-Origin Cookies

Status: done

## Story

As Priyank,
I want `/api/v1/*` proxied through Next.js with cookie forwarding,
So that httpOnly session cookies work in local dev and production (BVR5).

## Acceptance Criteria

**Given** web on `:3000` and API on `:8000`
**When** browser calls `/api/v1/settings`
**Then** request reaches FastAPI with `Cookie` header and `Set-Cookie` from login is stored

## Dev Agent Record

### Completion Notes

Retroactive traceability file (Story 15.5 / BVR20). Implemented 2026-05-30.

## Change Log

- 2026-06-01: Retroactive story file created for Epic 9 traceability
