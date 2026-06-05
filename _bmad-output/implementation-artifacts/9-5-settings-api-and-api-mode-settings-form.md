# Story 9.5: Settings API and API-Mode Settings Form

Status: done

## Story

As Priyank,
I want theme, persona, length, retention, voice, and Gemini key saved via `PATCH /settings`,
So that preferences persist in Postgres across devices.

## Acceptance Criteria

**Given** authenticated session
**When** `PATCH /settings` with theme/persona/length
**Then** `GET /settings` returns updated values mirroring Zod shapes (BV10)

**Given** `geminiApiKey` in PATCH body
**When** settings save succeeds
**Then** `GET /settings` returns `hasGeminiApiKey: true` but never the raw key (BV-NFR2)

## Dev Agent Record

### Completion Notes

Retroactive traceability file (Story 15.5 / BVR20). Implemented 2026-05-30 · BVR2, BVR4.

## Change Log

- 2026-06-01: Retroactive story file created for Epic 9 traceability
