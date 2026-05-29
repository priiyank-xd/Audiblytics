/**
 * UTC calendar day as `YYYY-MM-DD` (NFR13). Uses UTC getters only — stable across DST and timezone changes.
 */
export function formatUtcDate(now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
