export const DAYS_OF_USE_MUTATED_EVENT = 'audiblytics:days-of-use-mutated';

/** Notifies subscribers to reload days-of-use (does not clear server cache). */
export function notifyDaysOfUseMutated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(DAYS_OF_USE_MUTATED_EVENT));
}
