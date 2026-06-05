import type { CollectionWord } from '@/lib/schemas/collection.schema';

export function reviewProgressPercent(reviewedCount: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((reviewedCount / total) * 100);
}

export function upNextWords(
  queue: CollectionWord[],
  currentIndex: number,
  limit = 3,
): CollectionWord[] {
  return queue.slice(currentIndex + 1, currentIndex + 1 + limit);
}

export function difficultyDotClass(rating: number): string {
  if (rating <= 0) return 'bg-primary';
  if (rating === 1) return 'bg-tertiary';
  return 'bg-destructive';
}
