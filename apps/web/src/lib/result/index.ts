/**
 * Discriminated-union result type for all fallible operations in Audiblytics.
 * Throwing is reserved for programmer errors only — see architecture.md § Process Patterns
 * (error handling) and epics Additional Requirements AR9.
 */
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/** Construct a successful result. */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/** Construct a failed result. */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/** Map the success value, leaving errors untouched. */
export function map<T, U, E>(r: Result<T, E>, fn: (v: T) => U): Result<U, E> {
  return r.ok ? ok(fn(r.value)) : r;
}

/** Map the error, leaving success untouched. */
export function mapErr<T, E, F>(r: Result<T, E>, fn: (e: E) => F): Result<T, F> {
  return r.ok ? r : err(fn(r.error));
}

/** True iff the result is ok. */
export function isOk<T, E>(r: Result<T, E>): r is { ok: true; value: T } {
  return r.ok;
}

/** True iff the result is err. */
export function isErr<T, E>(r: Result<T, E>): r is { ok: false; error: E } {
  return !r.ok;
}
