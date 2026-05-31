export const COMPLETIONS_MUTATED_EVENT = 'audiblytics:completions-mutated';

export function notifyCompletionsMutated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(COMPLETIONS_MUTATED_EVENT));
}
