# Story 9.4: Next.js Login, AuthProvider, and AppGate

Status: done

## Story

As Priyank,
I want `/login` and `AuthGate` wrapping the app when API mode is on,
So that unauthenticated users are redirected to login instead of the provider-key vault.

## Acceptance Criteria

**Given** `NEXT_PUBLIC_STORAGE_BACKEND=api` and no session cookie
**When** visiting `/today`
**Then** user is redirected to `/login` with inline error on failed login (no toast)

**Given** valid credentials
**When** login succeeds
**Then** user lands on home/today and session persists across reload

## Dev Agent Record

### Completion Notes

Retroactive traceability file (Story 15.5 / BVR20). Implemented 2026-05-30 · BVR3, UX-V2-1.

## Change Log

- 2026-06-01: Retroactive story file created for Epic 9 traceability
