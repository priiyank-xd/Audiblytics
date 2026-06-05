import { invalidateServerParagraphUtcDatesCache } from '@/features/calendar/paragraph-dates-server-cache';

export const PARAGRAPH_DATES_MUTATED_EVENT = 'audiblytics:paragraph-dates-mutated';

export function notifyParagraphDatesMutated(): void {
  invalidateServerParagraphUtcDatesCache();
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(PARAGRAPH_DATES_MUTATED_EVENT));
}
