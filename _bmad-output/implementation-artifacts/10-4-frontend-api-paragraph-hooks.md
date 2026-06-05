# Story 10.4: Frontend API Paragraph Hooks

Status: done

## Story

As Priyank,
I want `use-generate-paragraph` and `use-paragraph-of-the-day` to call the API in API mode,
So that Today works end-to-end without Dexie paragraph cache (BVR9).

## Acceptance Criteria

**Given** `NEXT_PUBLIC_STORAGE_BACKEND=api`
**When** user taps Generate on Today
**Then** network tab shows `POST /api/v1/paragraphs/generate` not provider SDK

**Given** same UTC day reload
**When** Today mounts
**Then** `GET /paragraphs/today` hydrates paragraph without generate tap

## Dev Agent Record

### Completion Notes

Retroactive traceability file (Story 15.5 / BVR20). Implemented 2026-05-30.

## Change Log

- 2026-06-01: Retroactive story file created for Epic 10 traceability
