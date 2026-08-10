# ADR 0004: ORM-enforced tenant scoping

**Status:** Accepted  
**Date:** 2026-08-10  
**Decision IDs:** BV4.2 (every query filtered by `user_id`), BV17 (enforcement, no exceptions), BV7 (error shape), NFR30 (enforced tenant scoping), NFR19 revised

## Context

Every user-owned table already carries `user_id`, and every authenticated route already resolves a `CurrentUser`. But the owning-user predicate was written by hand in each route. That is a convention, not a mechanism: one forgotten `.where(Model.user_id == user.id)` in a future epic reads the whole table, and nothing in the test suite would notice. Epics 17–19 add more user-owned tables on top of this foundation, so the gap gets wider with every story.

## Decision

- One SQLAlchemy `do_orm_execute` listener in `app/core/tenant_scope.py` applies `with_loader_criteria(Model, Model.user_id == tenant)` to every ORM SELECT, ORM UPDATE and ORM DELETE that touches a model in `TENANT_MODELS`. Per-route predicates are deleted — the guard is the only place the predicate lives.
- The tenant is bound to the session at the auth boundary (`get_current_user_id`, plus `login` and `register`), so no route has to remember anything.
- **Fail closed.** Reading a user-owned model through a session with no tenant bound raises `TenantScopeError`. Fail-open would make the guarantee unprovable: a route that forgot to bind would silently read every account's rows. `TenantScopeError` is a programmer error, so it is raised rather than mapped to a structured error body (`architecture.md` § Enforcement Guidelines).
- **404, not 403,** when a request names another account's identifier. 403 confirms that the id exists and belongs to someone; 404 does not. The affected routes already returned 404 because their scoped lookup missed — after this change the miss comes from the guard. No route in this API returns 403.
- `unscoped(session)` is the one deliberate escape hatch, for administrative access that must cross the tenant boundary: export (Story 16.3) and account deletion (Story 16.4).
- INSERT stays explicit: `user_id=user.id` is set by the route, because the guard does not cover inserts.

## Consequences

**Positive**

- A query written without a user filter cannot return another account's rows, and a test asserts that for every model and every route.
- A future table cannot silently escape the guard: a test introspects `Base.registry.mappers` and fails if any mapped class with a `user_id` column is missing from `TENANT_MODELS`.
- Routes got shorter, and cross-tenant behaviour is specified in one file instead of seventeen endpoints.

**Negative / trade-offs**

- **Relationship loads are not guarded.** `selectinload(User.settings)` and any other `User.<children>` traversal is a relationship load, which the listener skips. It is safe here because the parent `users` row is always the authenticated user, but `user.recordings` must never be used as a data-access path — query the tenant entity directly. A test pins this behaviour so a future SQLAlchemy change surfaces in CI.
- Sessions built outside a request (scripts, test helpers) must bind a tenant or opt into `unscoped()`. That is the cost of failing closed, and it is paid once per helper.
- Client-supplied ids (`recordings.id`, `collection_words.id`) are globally unique primary keys, so a create that collides with another account's id still returns 409. Only the message was changed so it no longer confirms the id exists. Re-keying to a composite `(user_id, id)` primary key is recorded as deferred.

## References

- `apps/api/app/core/tenant_scope.py` — guard, binding helpers, `unscoped`, `get_owned_or_404`
- `apps/api/tests/test_tenant_scope.py` — AC2/AC3/AC4 proofs, including the relationship-load boundary
- `apps/api/tests/test_route_tenant_isolation.py` — all seventeen authenticated user-owned endpoints
- `docs/decisions/0001-jwt-httponly-cookie-auth.md` — the session `user_id` this guard anchors to
- `_bmad-output/planning-artifacts/architecture-v2-fastapi-backend.md` § BV4.2, § BV17
- `_bmad-output/planning-artifacts/epics.md` § Story 16.1
