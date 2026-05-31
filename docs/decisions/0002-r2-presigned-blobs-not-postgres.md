# ADR 0002: Audio blobs in R2 via presigned URLs (not Postgres)

**Status:** Accepted  
**Date:** 2026-05-31  
**Decision IDs:** BV6 (Object storage), BV17 (Enforcement)

## Context

Voice journal recordings are up to 60s per clip (FR31, NFR8). Storing `BYTEA` in Neon would increase cost, backup size, and API latency. The v1 MVP used IndexedDB blobs; v2 must scale to cloud persistence without streaming large bodies through FastAPI.

## Decision

- Store **metadata only** in Postgres (`recordings` table: dates, MIME, `storage_key`, etc.).
- Store **audio bytes** in **Cloudflare R2** (S3-compatible API).
- Upload flow:
  1. `POST /recordings` → insert row (`storage_key` NULL = pending), return **presigned PUT** (≤15 min TTL).
  2. Client **PUT** directly to R2.
  3. `POST /recordings/{id}/complete` → set `storage_key`, return `RecordingResponse`.
- Playback: `GET /recordings/{id}/playback-url` → short-lived presigned GET (60–300s).
- Object key layout: `recordings/{user_id}/{recording_id}.{ext}` (BV6).
- **Never** return R2 access keys to the client; **never** accept multipart audio on FastAPI in v2 phase 1 (BV17).

## Consequences

**Positive**

- API stays CPU/memory light; upload bandwidth hits R2 edge, not Railway/Fly.
- Clear interview story vs “blobs in the database.”
- Retention job deletes R2 object then Postgres row (90-day rolling).

**Negative / trade-offs**

- Eventual consistency: “complete” without successful PUT leaves pending rows (`storage_key IS NULL`).
- Orphan R2 keys possible if DB delete fails — mitigated by n=1 volume and retry on prune.
- Extra moving part (R2 credentials in host env).

## References

- `apps/api/app/services/r2_client.py`, `apps/api/app/api/v1/recordings.py`
- `_bmad-output/planning-artifacts/architecture-v2-fastapi-backend.md` § BV6, BV17
