---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: complete
completedAt: '2026-05-29'
workflowType: architecture
scope: backend-v2
supersedes: null
extends: _bmad-output/planning-artifacts/architecture.md
project_name: Audiblytics
user_name: Priyank
date: '2026-05-29'
inputDocuments:
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/implementation-readiness-report-2026-05-29.md
decisionPrefix: BV
stack:
  api: FastAPI 0.136.x
  orm: SQLAlchemy 2.0.x async + asyncpg
  db: Neon PostgreSQL
  blobs: Cloudflare R2
  auth: JWT httpOnly cookie
  migrations: Alembic
  frontend: Next.js 16 (existing)
---

# Architecture Decision Document — Audiblytics v2 (FastAPI Backend)

_Extends `architecture.md` (client-only n=1 MVP, complete 2026-05-03). This document defines the **backend + server persistence** layer for Stack A: Next.js → FastAPI → Neon Postgres + Cloudflare R2._

**Audience:** Solo user (Priyank) for dogfooding; architecture is **multi-tenant-ready** for interview narrative.

---

## BV0 — Scope transition

| v1 (`architecture.md`) | v2 (this document) |
|------------------------|-------------------|
| Browser-only SPA | Next.js + **FastAPI** API |
| API keys in `localStorage` | Keys in **server env** only (AR15 / NFR14 lifted) |
| Dexie + `localStorage` | **Postgres** + **R2**; client cache optional later |
| No auth | **JWT auth** (real flow; one seeded user OK) |
| Hard-scope guards block public deploy | Guards **removed/inverted** when `STORAGE_BACKEND=api` |

**Non-goal for v2 phase 1:** Full migration of all 64 FRs. Goal is **three interview-grade vertical slices** (auth/settings → paragraph proxy → one recording upload).

---

## BV1 — System context

```mermaid
flowchart TB
  subgraph client [Next.js Browser]
    UI[React UI]
    MR[MediaRecorder]
    TTS[SpeechSynthesis]
    Port[Storage Port abstraction]
  end

  subgraph api [FastAPI apps/api]
    Auth[JWT Auth]
    Routes[REST Routes]
    LLM[LLM Proxy Service]
    BlobSvc[Blob Orchestration]
  end

  subgraph data [Data Layer]
    PG[(Neon PostgreSQL)]
    R2[(Cloudflare R2)]
  end

  subgraph external [External]
    Gemini[Google Gemini API]
  end

  UI --> Port
  Port -->|HTTPS JSON| Routes
  MR -->|presigned PUT| R2
  Routes --> Auth
  Routes --> PG
  Routes --> BlobSvc
  BlobSvc --> R2
  LLM --> Gemini
  Routes --> LLM
  TTS -.->|stays client| UI
```

**Stays on client (unchanged in v2 phase 1):**

- `MediaRecorder` capture (FR30–FR34)
- `SpeechSynthesis` / TTS (FR22–FR25)
- UI components and routes

**Moves to server:**

- User identity and sessions
- Settings, completions, collection, paragraph cache **metadata**
- Recording **metadata**; blob bytes in R2
- LLM calls and API keys (FR9–FR13)

---

## BV2 — Technology stack (verified May 2026)

| Layer | Choice | Version / notes |
|-------|--------|-----------------|
| API framework | **FastAPI** | [0.136.x](https://pypi.org/project/fastapi/) — Pydantic v2, OpenAPI auto-gen |
| Runtime | Python | 3.12+ |
| ORM | **SQLAlchemy 2.0** async | [2.0.50+](https://github.com/sqlalchemy/sqlalchemy/releases) + `asyncpg` |
| Migrations | **Alembic** | Async-compatible revisions |
| Validation | **Pydantic v2** | Mirror Zod shapes from `apps/web/src/lib/schemas/` |
| Primary DB | **Neon PostgreSQL** | Serverless Postgres; `DATABASE_URL` with `postgresql+asyncpg://` |
| Object storage | **Cloudflare R2** | S3-compatible API; audio blobs |
| Auth | **JWT** in **httpOnly** cookie | `python-jose` or `PyJWT`; bcrypt password hashes |
| API client (frontend) | Generated or hand-written | OpenAPI → TypeScript via `openapi-typescript` or `orval` |
| Deploy (recommended) | Vercel (Next) + Railway/Fly (FastAPI) | Neon + R2 are hosted |

**Rejected for v2:**

| Option | Reason |
|--------|--------|
| Sync SQLAlchemy | Blocks FastAPI event loop |
| Blobs in Postgres `BYTEA` | Cost/latency; interview anti-pattern at scale |
| Supabase Auth (full stack) | User chose custom FastAPI backend for learning |
| GraphQL | REST + OpenAPI sufficient; better TS codegen story |

---

## BV3 — Repository layout

**Monorepo** (applied 2026-05-29):

```
Audiblytics/
  apps/
    web/                    # Next.js (@audiblytics/web)
      src/
      public/
      package.json
    api/                    # FastAPI (PyPI name: audiblytics-api)
      app/
        main.py             # health + future routes
        core/               # Phase 1+
        models/
        schemas/
        api/v1/
        services/
      alembic/
      tests/
      pyproject.toml
  packages/                 # optional later — OpenAPI contracts
  _bmad-output/
  pnpm-workspace.yaml
  package.json              # workspace root scripts
  docker-compose.yml        # optional: api + local postgres
```

**Decision ID for stories:** Reference `BV*` and `architecture-v2-fastapi-backend.md` when adding backend modules.

---

## BV4 — Authentication & authorization

### BV4.1 — Auth model

| Decision | Value |
|----------|-------|
| Registration | `POST /api/v1/auth/register` — allowed; for solo use, seed one user via script |
| Login | `POST /api/v1/auth/login` → sets httpOnly cookie `audiblytics_session` |
| Logout | `POST /api/v1/auth/logout` → clears cookie |
| Session transport | **httpOnly, Secure, SameSite=Lax** cookie (not localStorage — XSS-safe) |
| Token payload | `{ sub: user_id, exp }` |
| Password storage | bcrypt via `passlib` |

### BV4.2 — Authorization

Every data query **must** filter by `user_id = current_user.id`. No global queries.

```python
# Pattern — never optional user_id on tenant tables
stmt = select(CollectionWord).where(
    CollectionWord.user_id == user.id,
    CollectionWord.id == word_id,
)
```

### BV4.3 — Frontend gate

Replace `ProviderKeysGate` with `AuthGate`:

- Unauthenticated → `/login`
- Authenticated → app routes
- `NEXT_PUBLIC_STORAGE_BACKEND=api` enables API-backed stores

### BV4.4 — LLM keys

| v1 | v2 |
|----|-----|
| Per-user keys in `audiblytics.providerKeys` | **Server env** `GEMINI_API_KEY` (phase 1) |
| Browser → provider direct | FastAPI → provider only |

Phase 2 (optional): encrypted `user_provider_keys` table if BYO-key returns per user.

---

## BV5 — PostgreSQL schema

All timestamps **UTC** (`timestamptz`). IDs: **UUID v4** (match existing Zod `z.string().uuid()`).

### `users`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| email | VARCHAR UNIQUE NOT NULL | login identity |
| password_hash | VARCHAR NOT NULL | bcrypt |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `user_settings`

One row per user. Mirrors `settingsSchema`.

| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID PK FK → users | |
| theme | VARCHAR | enum match `themeSchema` |
| persona | VARCHAR | enum match `personaSchema` |
| length | INT | 100–200, default 150 |
| retention | VARCHAR | `90-day-rolling` \| `indefinite` |
| voice_uri | VARCHAR NULL | browser voice; client-only preference, synced for multi-device |
| active_provider | VARCHAR | default `gemini` |
| updated_at | timestamptz | |

### `collection_words`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK INDEX | |
| word | VARCHAR | |
| ipa | VARCHAR | |
| pronunciation_guide | VARCHAR | |
| meaning | TEXT | |
| example_sentence | TEXT | |
| saved_at | timestamptz INDEX | FR27 recency sort |
| source_paragraph_id | UUID NULL | |
| review_count | INT DEFAULT 0 | |
| last_reviewed_at | timestamptz NULL INDEX | FR49 |
| difficulty_rating | INT DEFAULT 1 | 0–2 |

Unique: `(user_id, word)` optional — product decision; v1 allowed duplicates? Check — schema uses UUID id per row.

### `recordings`

**Metadata only** — blob in R2.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | client-generated UUID preserved for idempotent retry |
| user_id | UUID FK INDEX | |
| recording_date | timestamptz INDEX | FR41 prune |
| paragraph_id | VARCHAR | UUID or warmup id pattern |
| duration_ms | INT | max 60000 |
| mime_type | VARCHAR | |
| storage_key | VARCHAR UNIQUE | R2 object key |
| day_of_use | INT | Day-14 / FR38 |
| created_at | timestamptz | |

Index: `(user_id, recording_date DESC)` for list view.

### `paragraph_cache`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK INDEX | |
| paragraph | TEXT | |
| hard_words | JSONB | array of hard word objects |
| theme | VARCHAR INDEX | |
| persona | VARCHAR INDEX | |
| generated_at | timestamptz INDEX | FR19 same-day reuse |

### `day_completions`

Normalized from v1 `audiblytics.completions` record.

| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID FK | |
| utc_date | DATE | `YYYY-MM-DD` UTC |
| has_read_it | BOOLEAN | |
| has_recording | BOOLEAN | |
| used_offline_pack | BOOLEAN | |
| PRIMARY KEY | (user_id, utc_date) | |

### `days_of_use`

| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID FK | |
| utc_date | DATE | |
| PRIMARY KEY | (user_id, utc_date) | idempotent day stamp |

### `day14_state`

| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID PK FK | |
| fired | BOOLEAN | |
| result | VARCHAR NULL | `yes` \| `no` |
| updated_at | timestamptz | |

### ER summary

```mermaid
erDiagram
  users ||--o| user_settings : has
  users ||--o{ collection_words : owns
  users ||--o{ recordings : owns
  users ||--o{ paragraph_cache : owns
  users ||--o{ day_completions : tracks
  users ||--o{ days_of_use : tracks
  users ||--o| day14_state : has
```

---

## BV6 — Object storage (Cloudflare R2)

### Key layout

```
recordings/{user_id}/{recording_id}.{ext}
```

`ext` from `mime_type` (`webm`, `mp4`, etc.).

### Upload flow (FR31, NFR8)

```mermaid
sequenceDiagram
  participant C as Next.js Client
  participant A as FastAPI
  participant R2 as Cloudflare R2
  participant PG as Postgres

  C->>A: POST /recordings (metadata draft)
  A->>PG: INSERT recording row status=pending
  A->>C: presigned PUT URL + recording id
  C->>R2: PUT blob (direct)
  C->>A: POST /recordings/{id}/complete
  A->>PG: confirm row, set storage_key
  A->>C: 200 RecordingResponse
```

### Playback

- `GET /recordings/{id}/playback-url` → short-lived presigned GET (60–300s)

### Retention (FR41)

- **On login** or **daily cron**: delete R2 objects + Postgres rows where `recording_date < now() - 90 days` AND user `retention = 90-day-rolling`
- Replaces client `use-prune-on-mount` when `STORAGE_BACKEND=api`

---

## BV7 — REST API surface (v1)

Base path: `/api/v1`. All routes except auth require valid session.

| Method | Path | Purpose | Phase |
|--------|------|---------|-------|
| GET | `/health` | Liveness | 1 |
| POST | `/auth/register` | Create account | 1 |
| POST | `/auth/login` | Session cookie | 1 |
| POST | `/auth/logout` | Clear session | 1 |
| GET | `/auth/me` | Current user | 1 |
| GET | `/settings` | User settings | 1 |
| PATCH | `/settings` | Update settings | 1 |
| GET | `/collection` | List words (recency) | 2 |
| POST | `/collection` | Save word | 2 |
| DELETE | `/collection/{id}` | Remove word | 2 |
| GET | `/completions` | Map or list by date range | 2 |
| PUT | `/completions/{utc_date}` | Upsert day completion | 2 |
| POST | `/paragraphs/generate` | LLM proxy + cache write | 2 |
| GET | `/paragraphs/today` | Same-day cache hit | 2 |
| GET | `/recordings` | List metadata | 3 |
| POST | `/recordings` | Start upload (presign) | 3 |
| POST | `/recordings/{id}/complete` | Finalize upload | 3 |
| GET | `/recordings/{id}/playback-url` | Presigned GET | 3 |
| DELETE | `/recordings/{id}` | Optional manual delete | 3 |

**Error shape** (align with frontend `Result<T,E>` spirit):

```json
{
  "error": {
    "kind": "validation_error | unauthorized | not_found | storage_error | llm_error",
    "message": "Human-readable string"
  }
}
```

HTTP status: 401 unauth, 403 forbidden, 404 missing, 422 validation, 502 llm upstream.

---

## BV8 — LLM proxy service

### Responsibilities

- Load prompt template (port from `apps/web/src/lib/llm/prompts/paragraph.ts` logic to Python or shared JSON)
- Call Gemini via `google-genai` SDK (or httpx to REST)
- Validate response with Pydantic model mirroring `paragraphSchema`
- Persist to `paragraph_cache`
- Return structured JSON to client

### Retry (FR12)

- Max 2 retries on transient errors server-side
- Surface unified `llm_error` to client (FR11)

### Secrets

```env
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
```

Never expose in API responses or Next.js `NEXT_PUBLIC_*`.

---

## BV9 — Frontend integration (strangler fig)

### Storage port pattern

```ts
// apps/web/src/lib/storage/ports/types.ts
export type StorageBackend = 'local' | 'api';

export interface SettingsRepository {
  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>): Promise<Settings>;
}
```

Implementations:

| Class | Backend |
|-------|---------|
| `LocalSettingsRepository` | existing `useLocalStorage` |
| `ApiSettingsRepository` | `fetch('/api/proxy/...')` or direct FastAPI URL |

Env:

```env
NEXT_PUBLIC_STORAGE_BACKEND=local|api
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Optional: Next.js **rewrite** in `next.config.ts` to same-origin `/api/v1/*` → FastAPI (avoids CORS in dev).

### CORS

FastAPI `CORSMiddleware`: allow Next.js origin only in production.

### What stays on Dexie during migration

Until phase 3 complete, **dual-write is forbidden** — use flag to switch whole backend per capability:

1. Phase 1: settings + auth only
2. Phase 2: collection + completions + paragraphs
3. Phase 3: recordings
4. Phase 4: day14, offline pack (defer)

---

## BV10 — Schema contract sync (Zod ↔ Pydantic)

**Source of truth:** Existing Zod schemas in `apps/web/src/lib/schemas/` until codegen pipeline exists.

| Zod file | Pydantic module |
|----------|-----------------|
| `settings.schema.ts` | `schemas/settings.py` |
| `collection.schema.ts` | `schemas/collection.py` |
| `recording.schema.ts` | `schemas/recording.py` (no `Blob` — use `storage_key`) |
| `paragraph-cache.schema.ts` | `schemas/paragraph_cache.py` |
| `completions.schema.ts` | `schemas/completions.py` |

**Rule BV10.1:** Field names in JSON API use **camelCase** to match frontend (exception to Python snake_case — use Pydantic `alias` / `populate_by_name`).

**Rule BV10.2:** Dates in API bodies are **ISO 8601 UTC strings** (match v1).

---

## BV11 — Security & NFR updates

| v1 NFR | v2 treatment |
|--------|--------------|
| NFR14 keys in localStorage | **Revoked** — keys server-side only |
| NFR16 no third-party tracking | Unchanged |
| NFR17 no exfiltration | Unchanged intent; user owns data via account |
| Multi-tenancy | **Now in scope** — `user_id` on all rows |
| Multi-device sync | **Enabled** via Postgres |
| Backup/DR | Neon PITR (document in README) |
| Rate limiting | Add slowapi or middleware on `/auth/login` + `/paragraphs/generate` |

**Remove when v2 ships:**

- `NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE` production guard (or repurpose as `STORAGE_BACKEND=local` only)
- Client-side `assertClientOnlySafeContext()` for LLM

---

## BV12 — Implementation sequence

| Phase | Deliverable | Interview demo |
|-------|-------------|----------------|
| **0** | This document + `apps/api/` scaffold | Explain diagram |
| **1** | Auth + `user_settings` API + login page | Log in, change theme, reload persists |
| **2** | Paragraph generate proxy + cache | Generate paragraph without browser key |
| **3** | Recording presigned upload + playback | Record 5s, play back from R2 |
| **4** | Collection + completions API | Full daily loop (stretch) |
| **5** | Deploy + README + 3 ADRs | Live URL on resume |

### Phase 1 task breakdown

1. `pyproject.toml` — fastapi, uvicorn, sqlalchemy[asyncio], asyncpg, alembic, pydantic-settings, python-jose, passlib
2. Neon database + Alembic init
3. Models: `users`, `user_settings`
4. Auth routes + JWT cookie
5. `scripts/seed_user.py` — create Priyank account locally
6. Next.js: `/login`, `AuthProvider`, `ApiSettingsRepository`
7. pytest: login flow + settings PATCH

---

## BV13 — Local development

```yaml
# docker-compose.yml (optional)
services:
  api:
    build: ./apps/api
    ports: ["8000:8000"]
    env_file: .env
  # postgres optional if not using Neon for dev
```

```env
# apps/api/.env.example
DATABASE_URL=postgresql+asyncpg://user:pass@host/db
JWT_SECRET=change-me
JWT_EXPIRE_MINUTES=10080
GEMINI_API_KEY=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=audiblytics-recordings
CORS_ORIGINS=http://localhost:3000
```

Root `.env.example` add:

```env
NEXT_PUBLIC_STORAGE_BACKEND=local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## BV14 — Testing strategy

| Layer | Tool | Minimum bar |
|-------|------|-------------|
| API unit | pytest + httpx AsyncClient | auth, settings, paragraph mock |
| API integration | pytest + test Neon branch OR docker postgres | migrations apply |
| Frontend | existing node:test for pure logic | storage port mocks |
| E2E | Manual demo script (MVP) | interview path |

No requirement to add Jest/Playwright for v2 phase 1.

---

## BV15 — Deployment topology

| Component | Host |
|-----------|------|
| Next.js | Vercel |
| FastAPI | Railway / Fly.io / Render |
| Postgres | Neon |
| R2 | Cloudflare |
| Secrets | Host env vars (never commit) |

**Health checks:** `GET /health` for API; Vercel built-in for frontend.

---

## BV16 — Interview demo script

1. Show architecture diagram (BV1) — explain scope transition from n=1
2. Log in at `/login`
3. Open Settings — change persona — show Network tab hitting FastAPI
4. Open `/today` — Generate — explain key never in browser Application tab
5. Record 5 seconds — show presigned upload to R2 in Network tab
6. Play back — signed URL flow
7. Mention strangler fig (`STORAGE_BACKEND`) and phased migration

**Sound bite:**

> "I evolved a deliberate client-only MVP into a production-shaped stack: FastAPI, async SQLAlchemy, Neon, R2, JWT cookies, and server-side LLM proxy — using a storage-port pattern to migrate incrementally."

---

## BV17 — Enforcement guidelines (backend)

Implementers MUST:

1. Read this document before writing `apps/api/` code.
2. Filter every query by `user_id` from JWT — no exceptions.
3. Use Pydantic v2 models aligned with Zod schemas (BV10).
4. Use Alembic for all schema changes — no manual DDL in production.
5. Never return LLM API keys or R2 secrets to the client.
6. Use presigned URLs for blob transfer — API does not stream multipart audio through itself in v2 phase 1.
7. Return structured error JSON matching BV7 error shape.
8. Reference decision IDs `BV1`–`BV17` in PR descriptions.

---

## BV18 — Open decisions (resolve during implementation)

| ID | Question | Default |
|----|----------|---------|
| BV-Q1 | Next.js rewrite proxy vs direct CORS to FastAPI? | **Rewrite** in dev and prod for same-origin cookies |
| BV-Q2 | SQLModel vs raw SQLAlchemy 2.0 Mapped? | **SQLAlchemy 2.0 Mapped** — interview-standard, less magic |
| BV-Q3 | Keep offline pack client-side in v2? | **Yes** — defer to phase 5 |
| BV-Q4 | Email verification for register? | **No** — solo + portfolio; add later |

---

## Relationship to v1 architecture

| Document | Role |
|----------|------|
| `architecture.md` | Client app patterns, components, Dexie era — **still valid** for `STORAGE_BACKEND=local` |
| `architecture-v2-fastapi-backend.md` | Server layer — **authoritative** when `STORAGE_BACKEND=api` |

When both modes coexist, feature code uses **storage ports**; never branch on backend inside UI components.

---

## Workflow completion

Architecture v2 (FastAPI backend) is **complete** and ready for Phase 1 implementation.

**Next implementation action:** Scaffold `apps/api/` (Phase 1 — auth + settings).
