import { collectionWordSchema, type CollectionWord } from '@/lib/schemas/collection.schema';
import { err, ok, type Result } from '@/lib/result';
import { db, safeWrite, type StorageError } from '@/lib/storage/db';

export type ReviewFeedbackOutcome = 'got-it' | 'almost' | 'forgot';

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
  wordId: string,
  outcome: ReviewFeedbackOutcome,
): Promise<Result<void, StorageError>> {
  const row = await db.collection.get(wordId);
  if (!row) {
    return err({ kind: 'unknown', message: 'Collection entry not found.' });
  }

  const next = applyFeedbackToWord(row, outcome, new Date().toISOString());
  const write = await safeWrite(() => db.collection.put(next));
  if (!write.ok) {
    return write;
  }
  return ok(undefined);
}
