# Story 10.2: POST /paragraphs/generate Gemini Proxy

Status: done

## Story

As Priyank,
I want paragraph generation to run on the server using my DB-stored Gemini key,
So that the browser never calls Gemini directly in API mode (BVR7, AR15 lifted).

## Acceptance Criteria

**Given** authenticated user with `gemini_api_key` saved
**When** `POST /paragraphs/generate` with optional recycleWords
**Then** response matches paragraph schema and row is inserted into `paragraph_cache`

**Given** missing Gemini key
**When** generate is called
**Then** 502 with `error.kind: auth` and inline-friendly message (BV7)

## Dev Agent Record

### Completion Notes

Retroactive traceability file (Story 15.5 / BVR20). Implemented 2026-05-30 · FR14.

## Change Log

- 2026-06-01: Retroactive story file created for Epic 10 traceability
