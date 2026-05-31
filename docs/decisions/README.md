# Architecture Decision Records (ADRs)

Short, interview-ready decisions for the Audiblytics v2 backend. Each ADR maps to decision IDs in [`architecture-v2-fastapi-backend.md`](../../_bmad-output/planning-artifacts/architecture-v2-fastapi-backend.md).

| ADR | Title | BV refs |
|-----|-------|---------|
| [0001](0001-jwt-httponly-cookie-auth.md) | JWT session in httpOnly cookie | BV4 |
| [0002](0002-r2-presigned-blobs-not-postgres.md) | Audio blobs in R2 via presigned URLs | BV6, BV17 |
| [0003](0003-strangler-storage-backend-flag.md) | Strangler migration via `STORAGE_BACKEND` | BV0, BV9 |
