export const RECORDINGS_MUTATED_EVENT = 'audiblytics:recordings-mutated';

export function notifyRecordingsMutated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(RECORDINGS_MUTATED_EVENT));
}
