# Alembic

Phase 1 uses `init_db()` on API startup for local/dev table creation.

For production (Neon), generate migrations once Postgres is wired:

```bash
cd apps/api
alembic init alembic   # if not already configured
alembic revision --autogenerate -m "initial users and settings"
alembic upgrade head
```

See `architecture-v2-fastapi-backend.md` BV5.
