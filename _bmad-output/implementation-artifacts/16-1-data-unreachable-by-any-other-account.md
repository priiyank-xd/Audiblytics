# Story 16.1: Data Unreachable by Any Other Account

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want my recordings, words and notes to be structurally unreachable by any other account,
so that opening the app to signups does not put my practice in someone else's hands (NFR30, BV4.2, BV17.2).

**Scope:** `apps/api` only. No `apps/web` change. No schema change, therefore **no Alembic migration** and **no edit to `test_alembic_revisions.py`**.

**Why this story is first in Epic 16:** every later Epic 16–19 table inherits the guard installed here. Stories 16.3 (export) and 16.4 (account deletion) both need the deliberate escape hatch built in Task 4.

## Acceptance Criteria

1. **AC1 — Owning-user predicate applied by a shared layer** — A single module (`app/core/tenant_scope.py`) applies `user_id == <session tenant>` to every ORM read/update/delete of a user-owned model via one SQLAlchemy `do_orm_execute` listener. Per-route `.where(Model.user_id == user.id)` predicates are removed from `paragraphs.py`, `recordings.py`, `collection.py`, `completions.py`, `days_of_use.py`, `recording_retention.py` — the guard is the only place the predicate lives. Explicit `user_id=user.id` on **INSERT** stays (the guard does not cover inserts).

2. **AC2 — A query written without a user filter cannot return another user's rows** — With a session bound to user A, each of these returns only A's rows: `select(Model)`, `select(Model.column)`, `select(Model)` joined from `users`, `session.get(Model, id)`, ORM-enabled `update()` / `delete()`. Proven by test for every model in the registry.

3. **AC3 — Fail-closed on an unbound session** — Reading a user-owned model through a session with no tenant bound raises `TenantScopeError` rather than returning rows. Non-owned tables (`users`) are unaffected.

4. **AC4 — Registry cannot silently miss a table** — A test introspects `Base.registry.mappers` and fails if any mapped class exposing a `user_id` column is absent from `TENANT_MODELS`. A future Epic 17–19 table therefore cannot be added without either registering it or breaking the suite.

5. **AC5 — 404, not 403, for another account's identifier** — Where a route reads or mutates a resource selected by an identifier, a request from user B for a resource of user A's returns **404** with `detail.error.kind == "not_found"`. No route returns 403, and none is introduced. Covered routes: `POST /recordings/{id}/complete`, `GET /recordings/{id}/playback-url`, `DELETE /collection/{id}`, and the date-keyed read `GET /paragraphs/by-date/{utc_date}` for a date on which only A has a paragraph.

6. **AC6 — Isolation asserted for every remaining user-owned route** — Every read route returns only the caller's rows and every write route touches only the caller's rows: `GET /settings`, `PATCH /settings` (B's patch leaves A's row untouched), `GET /paragraphs/dates`, `GET /paragraphs/today`, `POST /paragraphs/generate`, `GET /recordings`, `GET /collection`, `POST /collection`, `GET /completions`, `PUT /completions/{utc_date}` (B upserting a date A already has creates B's own row and does not read or alter A's), `GET /days-of-use`, `POST /days-of-use` (same date, separate rows). Twelve routes here, four in AC5, and `POST /recordings` in AC7 — all seventeen authenticated user-owned endpoints are covered.

7. **AC7 — Client-supplied id collision does not confirm ownership** — `POST /recordings` and `POST /collection` with an id already owned by another account still return **409 `conflict`**, but the message must not assert that the id exists (e.g. `"Recording id unavailable."`). Rationale in Dev Notes; composite-key alternative recorded as deferred.

8. **AC8 — Auth and administrative paths keep working** — `register`, `login` (including the retention prune it triggers), `/auth/me`, `PATCH /settings` commit+refresh, and `scripts/seed_user.py` all succeed under the guard. `apps/api/tests` passes with no test disabled or weakened.

9. **AC9 — ADR recorded** — `docs/decisions/0004-orm-enforced-tenant-scoping.md` documents the mechanism, the fail-closed choice, the 404-over-403 choice, and the known relationship-load boundary. References at least one `BV*` id (required by `tests/test_adrs.py`) and is added to the `docs/decisions/README.md` table.

## Tasks / Subtasks

- [x] **Task 1 — Tenant guard module** (AC1, AC2, AC3, AC4)
  - [x] 1.1 Create `apps/api/app/core/tenant_scope.py` with: `TENANT_MODELS`, `TENANT_SESSION_KEY = "tenant_user_id"`, `TENANT_BYPASS_KEY`, `TenantScopeError`, `bind_tenant(session, user_id)`, `current_tenant(session)`, `assert_tenant(session, user_id)`, `unscoped(session)`, `install_tenant_guard()`.
  - [x] 1.2 Register `TENANT_MODELS = (UserSettings, ParagraphCache, Recording, CollectionWord, DayCompletion, DaysOfUse)` — all six user-owned tables; `users` is the tenant root and must stay out. No import cycle: models import only `models/base.py`, and `database.py` already imports every model.
  - [x] 1.3 Implement the `do_orm_execute` listener exactly as specified in Dev Notes § Guard mechanism (verified against SQLAlchemy 2.0.50 — do not improvise the predicate detection).
  - [x] 1.4 Call `install_tenant_guard()` from `app/core/database.py` at module import so sessions built directly from `get_session_factory()` (tests, `scripts/seed_user.py`) are guarded too, not just request-scoped ones. Make it idempotent.
  - [x] 1.5 Add `get_owned_or_404(db, model, obj_id, *, message)` returning the row or raising `HTTPException(404, {"error": {"kind": "not_found", "message": message}})`.

- [x] **Task 2 — Bind the tenant at the auth boundary** (AC1, AC8)
  - [x] 2.1 In `app/core/deps.py::get_current_user_id`, call `bind_tenant(db, user_id)` immediately after the `User.id` existence check passes. This covers every authenticated route — FastAPI caches `get_db`, so the route's `db` is the same `AsyncSession`.
  - [x] 2.2 In `app/api/v1/auth.py::login`, call `bind_tenant(db, user.id)` after password verification and **before** `_prune_recordings_best_effort` (the prune selects `Recording` directly and would otherwise fail closed).
  - [x] 2.3 In `auth.py::register`, call `bind_tenant(db, user.id)` after the successful commit.
  - [x] 2.4 Leave `selectinload(User.settings)` in `login` and `get_current_user` as-is — relationship loads are outside the guard (see Dev Notes § Known boundary) and are already constrained by the parent `users` row.

- [x] **Task 3 — Route refactor to the shared layer** (AC1, AC5, AC7)
  - [x] 3.1 `collection.py` — drop the `user_id` predicate from `_get_user_word` / `_get_user_word_by_text`; `DELETE /collection/{id}` uses `get_owned_or_404`; keep `user_id=user.id` in `_row_from_body`.
  - [x] 3.2 `recordings.py` — drop the predicate from `_get_user_recording` and from the inline select in `start_recording_upload`; `complete` and `playback-url` use `get_owned_or_404`; keep `user_id=user.id` on the new `Recording`.
  - [x] 3.3 `paragraphs.py` — drop `ParagraphCache.user_id == user.id` from `/dates`, `/by-date/{utc_date}`, `/today`; keep `user_id=user.id` in `/generate`.
  - [x] 3.4 `completions.py` and `days_of_use.py` — drop `user_id` predicates from selects; keep `user_id=user.id` on insert.
  - [x] 3.5 `services/recording_retention.py` — drop the `user_id` predicate from both the `select` and the ORM `delete`, and add `assert_tenant(db, user.id)` at the top so a session bound to a different user is a loud failure rather than a silent no-op.
  - [x] 3.6 Reword the two client-id conflict messages so they do not confirm the identifier exists (AC7). `test_start_upload_cross_user_id_conflict` asserts only `kind == "conflict"`, so it stays green.

- [x] **Task 4 — Escape hatch for administrative access** (AC8)
  - [x] 4.1 `unscoped(session)` — sync context manager setting `session.info[TENANT_BYPASS_KEY]`, restoring the prior value on exit (including on exception). This is the seam Stories 16.3/16.4 use for export and account deletion.
  - [x] 4.2 Verify `scripts/seed_user.py` still runs; it selects only `users` and inserts `UserSettings`, so it should need no change — confirm, do not assume.

- [x] **Task 5 — Tests** (AC2, AC3, AC4, AC5, AC6, AC7)
  - [x] 5.1 New `apps/api/tests/test_tenant_scope.py` — registry completeness (AC4); unbound-session `TenantScopeError` per model for entity **and** column-only selects (AC3); bound-session filtering for entity select, column-only select, `session.get`, join from `users`, ORM `update`, ORM `delete` (AC2); `unscoped()` lifts and restores; `assert_tenant` mismatch raises; a test pinning the relationship-load boundary so a future change to it is noticed rather than discovered.
  - [x] 5.2 New `apps/api/tests/test_route_tenant_isolation.py` — two registered accounts; A creates data on every user-owned route; then as B assert 404 + `not_found` on each AC5 route and empty/own-only payloads on each AC6 route; finally re-login as A and assert A's data is intact. Mock `presign_put_upload` / `presign_get_playback` and `generate_paragraph_with_gemini` as `test_recordings.py` / `test_paragraphs.py` already do.
  - [x] 5.3 Update raw-session helpers to bind or bypass: `tests/test_recording_retention.py` (`_set_retention`, the `prune_expired_recordings` call sites, and every post-condition `select(Recording)`) and `tests/test_recordings.py` lines ~96/133/249/357. Prefer `unscoped(session)` for assertion-only reads and `bind_tenant` where a specific user is under test.
  - [x] 5.4 Add a `PATCH /settings` isolation case — B's PATCH must not alter A's settings row (AC6).

- [x] **Task 6 — ADR + verification** (AC8, AC9)
  - [x] 6.1 Write `docs/decisions/0004-orm-enforced-tenant-scoping.md` (cite BV4.2, BV17, NFR30) and add the row to `docs/decisions/README.md`.
  - [x] 6.2 `cd apps/api && pytest` — all green; record the new total in Completion Notes (baseline after Story 15.3 was **98**).
  - [x] 6.3 Confirm no Alembic revision was added and `tests/test_alembic_revisions.py` still expects head `20260601_0007`.
  - [x] 6.4 Add the composite-key deferral to `_bmad-output/implementation-artifacts/deferred-work.md` with the AC7 rationale.
  - [x] 6.5 No `apps/web` file changes — the web suite needs no run for this story.

## Dev Notes

### Guard mechanism — verified, implement as written

Probed against this repo's exact stack (SQLAlchemy **2.0.50**, `AsyncSession` + `aiosqlite`). Every claim below was executed, not inferred.

```python
@event.listens_for(Session, "do_orm_execute")
def _apply_tenant_criteria(state: ORMExecuteState) -> None:
    if state.is_column_load or state.is_relationship_load:
        return
    if not (state.is_select or state.is_update or state.is_delete):
        return
    touched = [m.class_ for m in state.all_mappers if m.class_ in TENANT_MODELS]
    if not touched:
        return
    if state.session.info.get(TENANT_BYPASS_KEY):
        return
    tenant_id = state.session.info.get(TENANT_SESSION_KEY)
    if tenant_id is None:
        raise TenantScopeError(...)
    for model in touched:
        state.statement = state.statement.options(
            with_loader_criteria(model, model.user_id == tenant_id, include_aliases=True)
        )
```

Load-bearing details:

- **Listen on `sqlalchemy.orm.Session`, not `AsyncSession`.** `AsyncSession` delegates to a sync `Session`, the event fires there, and `AsyncSession.info is sync_session.info` — verified `True`. `bind_tenant` can therefore write to `AsyncSession.info` directly.
- **Detect entities with `state.all_mappers`** (public `ORMExecuteState` API). Verified to report the mapper for `select(Model)`, `select(Model.column)`, `select(Model.a, Model.b)`, joins, ORM `update()`, and `session.get()`. Do **not** use `sqlalchemy.sql.util.find_tables` — it needs five non-default keyword arguments to catch column-only selects and is semi-private.
- **Use the plain-expression criteria form** `model.user_id == tenant_id`, not the `lambda cls: ...` form. Both were probed across five sequential tenants in one process with zero cache contamination; the expression form simply avoids the lambda-caching question entirely.
- **`is_column_load` / `is_relationship_load` must be skipped first.** Skipping column loads is what keeps `await db.refresh(row)` working after commit (`settings.py`, `collection.py`, `paragraphs.py`, `completions.py`, `recordings.py` all rely on it) — verified working under an active tenant binding.
- **`db.delete(row)` is unaffected** — unit-of-work deletes flush by primary key and never reach `do_orm_execute`. The row was already fetched through the guard, so it is already owned.
- **`session.info` survives `rollback()` and `commit()`** — verified. The 409 recovery ladders in `collection.py:126-154` and `recordings.py:109-119` roll back and then re-query tenant tables; those re-queries stay scoped instead of raising. Do not re-bind after rollback.

### Known boundary — relationship loads are not guarded

`selectinload(User.settings)` and any other `User.<children>` traversal issues a *relationship load*, which the listener skips, so no criteria is applied and no `TenantScopeError` is raised. This is intentional and safe here: the parent `users` row is always the authenticated user, so its children are the caller's own. Two consequences to honour:

- Never treat `user.recordings` / `user.collection_words` / `user.paragraph_cache` / `user.day_completions` / `user.days_of_use` as a data-access path. Query the tenant entity directly so the guard applies. No current code does this — keep it that way.
- Pin this behaviour with a test (Task 5.1) so a future SQLAlchemy upgrade or a `propagate_to_loaders` change surfaces in CI instead of in production.

### Fail-closed is the point

Fail-open (skip filtering when no tenant is bound) would make AC2 unprovable: a route that forgot to bind would silently read the whole table. Fail-closed converts that class of mistake into a loud 500 in the first test that touches it. The cost is the three binding sites in Task 2 and the test-helper updates in Task 5.3 — pay it.

`TenantScopeError` is a **programmer error**, not an app-level failure: raise it, do not map it to a `Result`/structured error body. This is the `architecture.md` § Error Handling carve-out ("throw only for programmer errors", line 859) and mirrors the frontend rule.

### Why 404 and not 403 (AC5)

403 confirms the identifier exists and belongs to someone. 404 does not. Every affected route already returns 404 with `{"error": {"kind": "not_found", ...}}` because its scoped lookup misses — after Task 3 the miss comes from the guard instead of a hand-written predicate, and the status stays the same. Nothing in the API returns 403 today; do not introduce it. `architecture-v2-fastapi-backend.md` § BV7 lists 403 generically, and Story 16.1's AC overrides it for cross-tenant lookups.

### Why the id-collision path stays 409 (AC7)

`recordings.id` and `collection_words.id` are client-supplied and globally unique primary keys. When B posts an id A already owns, the scoped pre-check finds nothing (correct), then the INSERT hits the PK unique violation and the handler returns 409. Turning that into 404 would be a lie about a create, and re-keying to a composite `(user_id, id)` primary key means a migration plus reworking `recordings.storage_key` uniqueness — out of scope. The honest fix now is to stop the *message* confirming the id exists. Record the composite-key option in `deferred-work.md` with this rationale.

### Files being modified — current state and what must not break

| File | Current state | Change | Must keep working |
|---|---|---|---|
| `app/core/deps.py:17-41` | `get_current_user_id` decodes cookie, checks `users` row | bind tenant after the check | 401 bodies for missing/expired/unknown session |
| `app/core/deps.py:44-57` | `get_current_user` eager-loads `settings` | none | `user.settings` non-`None` for `settings.py` asserts and `/generate` |
| `app/core/database.py:29-46` | `async_sessionmaker(expire_on_commit=False)`, `get_db` | install guard on import | `reset_engine()` per-test rebuild |
| `app/api/v1/auth.py:54-68` | login eager-loads settings, then prunes | bind before prune | invalid-credentials 401; prune best-effort swallow (`test_login_succeeds_when_prune_raises`) |
| `app/api/v1/recordings.py` | `_get_user_recording`, 3 scoped selects, 409 paths | predicates → guard, 404 via helper, reword conflict | pending-upload `storage_key IS NULL` semantics; 409 on already-completed; 503 on R2 misconfig; 422 on bad mime |
| `app/api/v1/collection.py` | 2 helpers, idempotent-POST 200/201 ladder | predicates → guard | 200-on-identical-repost, 409-on-metadata-drift, 204 delete |
| `app/api/v1/paragraphs.py` | 3 scoped selects, `/dates` before dynamic segments | predicates → guard | route order; 422 on bad dates; 502 on `LlmServiceError` |
| `app/api/v1/completions.py` | OR-merge upsert on `(user_id, utc_date)` | predicates → guard | OR-merge never clears a true flag; 422 on bad date |
| `app/api/v1/days_of_use.py` | `select(DaysOfUse.utc_date)` column-only | predicates → guard | **column-only select must stay scoped** — the guard covers it (verified); idempotent stamp |
| `app/services/recording_retention.py` | scoped select + ORM `delete` | predicates → guard + `assert_tenant` | 90-day cutoff; `indefinite` skip; best-effort R2 delete; returns count |
| `tests/test_recording_retention.py` | raw factory sessions, unscoped selects | bind or bypass | every existing assertion unchanged in meaning; `select(User).options(selectinload(User.settings))` needs no change (relationship load) |
| `tests/test_recordings.py:96,133,249,357` | raw factory sessions reading `Recording` | bind or bypass | storage-key assertions |

### Conventions to follow

- Error bodies: `detail={"error": {"kind": "...", "message": "..."}}`. Kinds in use: `unauthorized`, `not_found`, `conflict`, `validation_error`, `storage_error`, `llm_error`.
- Async SQLAlchemy only — sync `Session` is explicitly rejected (`architecture-v2-fastapi-backend.md` line 124). The event listener registers against the `Session` *class* only because that is where async sessions dispatch.
- Test naming: `test_<area>_user_isolation` / `test_<action>_cross_user_not_found`, matching `test_collection.py:125`, `test_recordings.py:328`.
- pytest is `asyncio_mode = "auto"`; existing files still mark `@pytest.mark.asyncio` — match the file you are editing.
- Fixtures: `client` (in-memory SQLite, fresh engine per test) and `auth_client` (registers `test@example.com`). Multi-user tests reuse `client` and re-register/re-login to swap the session cookie — cookies persist on the `AsyncClient`.
- No `ruff`/`mypy` configured for `apps/api`; `pytest` is the whole gate.

### Decision IDs

NFR30 (tenant isolation), NFR19 revised (recordings reachable only by the owning user), BV4.2 (authorization — every query filtered by `user_id`), BV17.2 (enforcement — no exceptions), BV7 (error shape), ADR 0001 (authorize every tenant query from the validated session). Epic 16 also carries FR71 and NFR31, delivered by Stories 16.3 and 16.2.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 16.1] — ACs, and the framing that scoping today is "a convention repeated per route rather than an enforced mechanism"
- [Source: _bmad-output/planning-artifacts/epics.md#v3 Requirements Delta] — NFR30, NFR19 revised (FR71/NFR30/NFR31 are defined here, not in `prd.md`)
- [Source: _bmad-output/planning-artifacts/architecture-v2-fastapi-backend.md#BV4.2] — "Every data query **must** filter by `user_id = current_user.id`. No global queries."
- [Source: _bmad-output/planning-artifacts/architecture-v2-fastapi-backend.md#BV17] — enforcement list; reference `BV*` ids in PR descriptions
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] — line 859, throw only for programmer errors
- [Source: docs/decisions/0001-jwt-httponly-cookie-auth.md] — session `user_id` is the authorization anchor
- [Source: _bmad-output/implementation-artifacts/12-1-collection-words-api.md] — DELETE-foreign-word → 404 precedent
- [Source: _bmad-output/implementation-artifacts/11-3-post-recordings-id-complete-and-playback-url.md] — `_get_user_recording` and cross-user 404 precedent

## Dev Agent Record

### Agent Model Used

Claude Opus 5 (Cursor, bmad-dev-story workflow)

### Debug Log References

- First full run after the guard was installed: 10 failures, all in raw-session test helpers failing closed exactly as designed (`test_recording_retention.py` × 6, `test_recordings.py` × 4). Every route test passed unchanged, which is the evidence that `select`, column-only `select`, and `session.get` are all covered.
- `with_loader_criteria` confirmed to apply to ORM `UPDATE` and ORM `DELETE` on this stack: `test_orm_update_touches_only_bound_tenant` and `test_orm_delete_touches_only_bound_tenant` both pass, and the pre-existing `test_prune_does_not_touch_other_users` still passes with its `user_id` predicate removed from `delete(Recording)`.
- `scripts/seed_user.py` run twice against a fresh SQLite file under the guard — create then "already exists" — no change needed (Task 4.2 confirmed, not assumed).

### Completion Notes List

- **Test total: 116 passed** (baseline after Story 15.3 was 98; the pre-change baseline measured on this branch was 99). 17 new tests: 12 in `test_tenant_scope.py`, 5 in `test_route_tenant_isolation.py`. No test disabled or weakened.
- The guard is a single `do_orm_execute` listener on `sqlalchemy.orm.Session`, installed from `database.py` at import so sessions built directly from `get_session_factory()` are guarded too. Implemented exactly as specified in Dev Notes § Guard mechanism — `state.all_mappers` for entity detection, plain-expression criteria, `is_column_load` / `is_relationship_load` skipped first.
- Per-route `user_id` predicates are gone from all six modules. `user: CurrentUser` stays on every route — it is what binds the tenant, even where the handler no longer reads `user.id`.
- `assert_tenant(db, user.id)` at the top of `prune_expired_recordings` means a session bound to the wrong user is a loud failure. In `/auth/me` and `login` it is bound correctly; `_prune_recordings_best_effort` would swallow a mismatch as a logged error rather than silently pruning nothing.
- AC7: both client-supplied-id conflict messages reworded to `"Recording id unavailable."` / `"Collection word id unavailable."`. `test_start_upload_cross_user_id_conflict` asserts only `kind == "conflict"` and stayed green.
- Test-helper updates followed the story's guidance: `unscoped(session)` for assertion-only reads, `bind_tenant` where a specific user is under test. `test_recording_retention.py` gained `_recording_rows()` and `_load_user_for_prune()` so the bypass/bind decision is made in one place per intent.
- No Alembic revision added; `tests/test_alembic_revisions.py` still expects head `20260601_0007`. No `apps/web` file touched.

### File List

- `apps/api/app/core/tenant_scope.py` (new)
- `apps/api/app/core/database.py`
- `apps/api/app/core/deps.py`
- `apps/api/app/api/v1/auth.py`
- `apps/api/app/api/v1/collection.py`
- `apps/api/app/api/v1/completions.py`
- `apps/api/app/api/v1/days_of_use.py`
- `apps/api/app/api/v1/paragraphs.py`
- `apps/api/app/api/v1/recordings.py`
- `apps/api/app/services/recording_retention.py`
- `apps/api/tests/test_tenant_scope.py` (new)
- `apps/api/tests/test_route_tenant_isolation.py` (new)
- `apps/api/tests/test_recording_retention.py`
- `apps/api/tests/test_recordings.py`
- `docs/decisions/0004-orm-enforced-tenant-scoping.md` (new)
- `docs/decisions/README.md`
- `_bmad-output/implementation-artifacts/deferred-work.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-08-10: Story 16.1 created — ORM-enforced tenant scoping, fail-closed unbound sessions, 404-not-403 cross-user lookups, full route isolation matrix (ready-for-dev).
- 2026-08-10: Story 16.1 implemented — `tenant_scope.py` guard installed at import and bound at the auth boundary; per-route `user_id` predicates removed from six modules; `unscoped()` escape hatch for Stories 16.3/16.4; ADR 0004 recorded; 116 tests passing (review).
- 2026-08-10: Code review passed with no changes requested — API 127 passed, web 164 passed, typecheck clean, no files changed (done).
