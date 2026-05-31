export const COLLECTION_MUTATED_EVENT = 'audiblytics:collection-mutated';

export function notifyCollectionMutated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(COLLECTION_MUTATED_EVENT));
}
