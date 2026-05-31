# ADR 0001: JWT session in httpOnly cookie

**Status:** Accepted  
**Date:** 2026-05-31  
**Decision IDs:** BV4 (Authentication & authorization)

## Context

Audiblytics v1 stored LLM keys in `localStorage` and had no server account. v2 adds FastAPI with Postgres-backed users and settings. The browser must stay authenticated across page loads without exposing session tokens to JavaScript (XSS).

## Decision

- Issue a **JWT** on login/register with payload `{ sub: user_id, exp }`.
- Transport the token in an **httpOnly, Secure (production), SameSite=Lax** cookie named `audiblytics_session` (configurable via `COOKIE_NAME`).
- Hash passwords with **bcrypt**; never return password hashes or JWT secrets in API responses.
- **Authorize** every tenant query with `user_id` from the validated session — no global reads on user-owned tables.
- Frontend: **`AuthGate`** redirects unauthenticated users to `/login` when `NEXT_PUBLIC_STORAGE_BACKEND=api`.

## Consequences

**Positive**

- Session not readable from `document.cookie` or trivial XSS exfiltration paths.
- Same-origin cookie flow works with Next.js rewrite proxy (BV-Q1 default).
- Aligns with portfolio narrative: real auth, not “fake local-only app.”

**Negative / trade-offs**

- Cross-origin API deploy requires explicit `CORS_ORIGINS` + `COOKIE_SECURE=true`.
- JWT revocation is coarse (expire-only) — acceptable for n=1; no refresh-token rotation in v2 phase 1.

## References

- `apps/api/app/api/v1/auth.py`, `apps/api/app/core/deps.py`, `apps/api/app/core/security.py`
- `_bmad-output/planning-artifacts/architecture-v2-fastapi-backend.md` § BV4
