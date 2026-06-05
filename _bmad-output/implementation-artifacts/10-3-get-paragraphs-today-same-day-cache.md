# Story 10.3: GET /paragraphs/today Same-Day Cache

Status: done

## Story

As Priyank,
I want today's cached paragraph returned without re-generation,
So that app open on the same UTC day shows the existing paragraph (BVR8, FR19).

## Acceptance Criteria

**Given** a paragraph generated today UTC
**When** `GET /paragraphs/today`
**Then** 200 with cached row

**Given** no paragraph today
**When** `GET /paragraphs/today`
**Then** 404 with structured not_found error

## Dev Agent Record

### Completion Notes

Retroactive traceability file (Story 15.5 / BVR20). Implemented 2026-05-30.

## Change Log

- 2026-06-01: Retroactive story file created for Epic 10 traceability
