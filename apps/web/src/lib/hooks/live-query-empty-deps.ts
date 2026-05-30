/**
 * Stable empty dependency array for `useLiveQuery(querier, deps)`.
 * An inline `[]` is a **new reference every render**, which invalidates
 * `dexie-react-hooks`’ internal `useMemo` and churns the live subscription
 * (queries never settle → UI stuck on `undefined`).
 */
export const LIVE_QUERY_EMPTY_DEPS: unknown[] = [];
