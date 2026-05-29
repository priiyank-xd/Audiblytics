/**
 * Resolved value for {@link useDay14Trigger}:
 * - `true` → Day14Gate opens takeover (Story 7.2)
 * - `'no-recording'` → Today-route banner path (Story 7.3); takeover suppressed
 * - `false` → no Day-14 UX (premature, already fired, wrong day count, or loading)
 */
export type Day14TriggerResult = false | true | 'no-recording';

/**
 * Pure trigger semantics (FR37, NFR12). `day1RecordingKnown` is `null` while Dexie
 * live query is still loading — returns `false` until the Day-1 clip check settles.
 */
export function evaluateDay14Trigger(
  distinctDays: number,
  fired: boolean,
  day1RecordingKnown: boolean | null,
): Day14TriggerResult {
  if (fired) return false;
  if (distinctDays !== 14) return false;
  if (day1RecordingKnown === null) return false;
  if (!day1RecordingKnown) return 'no-recording';
  return true;
}
