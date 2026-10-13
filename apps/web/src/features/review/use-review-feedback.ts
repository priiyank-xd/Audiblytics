'use client';

import { useCallback, useState } from 'react';

import {
  applyFeedbackToWord,
  applyReviewFeedback,
  type ReviewFeedbackOutcome,
} from '@/lib/review/apply-feedback';
import {
  mapFeedbackButtonToOutcome,
  type ReviewFeedbackButton,
} from '@/lib/review/feedback-outcome';
import type { CollectionWord } from '@/lib/schemas/collection.schema';
import type { StorageError } from '@/lib/storage/types';
import { cancelSpeech } from '@/lib/audio/tts';

export type { ReviewFeedbackOutcome } from '@/lib/review/apply-feedback';
export { applyFeedbackToWord, applyReviewFeedback } from '@/lib/review/apply-feedback';

export type UseReviewFeedbackResult = {
  isSubmitting: boolean;
  error: StorageError | null;
  clearError: () => void;
  submitFeedback: (
    word: CollectionWord,
    button: ReviewFeedbackButton,
  ) => Promise<{ ok: true } | { ok: false; error: StorageError }>;
};

export function useReviewFeedback(): UseReviewFeedbackResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<StorageError | null>(null);

  const submitFeedback = useCallback(async (word: CollectionWord, button: ReviewFeedbackButton) => {
    cancelSpeech();
    setIsSubmitting(true);
    setError(null);
    const outcome = mapFeedbackButtonToOutcome(button);
    const result = await applyReviewFeedback(word, outcome);
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return { ok: false as const, error: result.error };
    }
    return { ok: true as const };
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { isSubmitting, error, clearError, submitFeedback };
}
