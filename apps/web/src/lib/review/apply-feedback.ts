import type { ReviewFeedbackOutcome } from '@/lib/review/feedback-outcome';
import { collectionWordSchema, type CollectionWord } from '@/lib/schemas/collection.schema';
import { ok, type Result } from '@/lib/result';
import { updateCollectionWordReview } from '@/lib/api/collection';
import type { StorageError } from '@/lib/storage/types';

export type { ReviewFeedbackOutcome } from '@/lib/review/feedback-outcome';

/**
 * Applies FR51 field updates for tests and `applyReviewFeedback`.
 * `nowIso` must be UTC ISO datetime (NFR13).
 */
export function applyFeedbackToWord(
  row: CollectionWord,
  outcome: ReviewFeedbackOutcome,
  nowIso: string,
): CollectionWord {
  const reviewCount = row.reviewCount + 1;
  let difficultyRating = row.difficultyRating;
  if (outcome === 'got-it') {
    difficultyRating = Math.max(0, difficultyRating - 1);
  } else if (outcome === 'forgot') {
    difficultyRating = Math.min(2, difficultyRating + 1);
  }
  return collectionWordSchema.parse({
    ...row,
    reviewCount,
    lastReviewedAt: nowIso,
    difficultyRating,
  });
}

export async function applyReviewFeedback(
  row: CollectionWord,
  outcome: ReviewFeedbackOutcome,
): Promise<Result<void, StorageError>> {
  const next = applyFeedbackToWord(row, outcome, new Date().toISOString());
  const result = await updateCollectionWordReview(row.id, {
    reviewCount: next.reviewCount,
    lastReviewedAt: next.lastReviewedAt,
    difficultyRating: next.difficultyRating,
  });
  return result.ok ? ok(undefined) : result;
}
