'use client';

import { useMemo } from 'react';

import { useCollection } from '@/features/collection/use-collection';
import type { CollectionWord } from '@/lib/schemas/collection.schema';

/** PRD open decision Q3: default daily review batch size (FR48–FR49). */
export const REVIEW_BATCH_SIZE = 7;

function compareOldestReviewedFirst(a: CollectionWord, b: CollectionWord): number {
  const aNever = a.lastReviewedAt == null;
  const bNever = b.lastReviewedAt == null;
  if (aNever && !bNever) return -1;
  if (!aNever && bNever) return 1;
  if (aNever && bNever) {
    return a.savedAt.localeCompare(b.savedAt);
  }
  return a.lastReviewedAt!.localeCompare(b.lastReviewedAt!);
}

/**
 * Selects up to {@link REVIEW_BATCH_SIZE} words: never-reviewed first (tie-break
 * `savedAt` ascending), then ascending `lastReviewedAt` (UTC ISO, lexicographic
 * order matches time per NFR13). Single implementation for Daily Review — do not
 * re-sort in flashcard UI (Stories 6.2–6.3).
 */
export function selectReviewQueueBatch(collection: CollectionWord[]): CollectionWord[] {
  const sorted = [...collection].sort(compareOldestReviewedFirst);
  return sorted.slice(0, REVIEW_BATCH_SIZE);
}

export type UseReviewQueueResult = {
  queue: CollectionWord[];
  isLoading: boolean;
  /** Rows in `collection` ; used to show UX-DR34 only when truly empty). */
  collectionCount: number;
};

export function useReviewQueue(): UseReviewQueueResult {
  const collection = useCollection();

  return useMemo(() => {
    if (collection === undefined) {
      return { queue: [], isLoading: true, collectionCount: 0 };
    }
    return {
      queue: selectReviewQueueBatch(collection),
      isLoading: false,
      collectionCount: collection.length,
    };
  }, [collection]);
}
