'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { FeatureRouteShell } from '@/components/audiblytics/FeatureRouteShell';
import { ReviewFeedbackRow } from '@/components/audiblytics/ReviewFeedbackRow';
import { ReviewFlashcard } from '@/components/audiblytics/ReviewFlashcard';
import { ReviewProgressRing } from '@/components/audiblytics/ReviewProgressRing';
import { ReviewUpNextList } from '@/components/audiblytics/ReviewUpNextList';
import { useReviewFeedback } from '@/features/review/use-review-feedback';
import { useReviewQueue } from '@/features/review/use-review-queue';
import { useReviewSession } from '@/features/review/use-review-session';
import type { ReviewFeedbackButton } from '@/lib/review/feedback-outcome';
import { upNextWords } from '@/lib/review/review-session';
import type { CollectionWord } from '@/lib/schemas/collection.schema';

export default function ReviewPage() {
  const router = useRouter();
  const { queue, isLoading, collectionCount } = useReviewQueue();
  const [sessionQueue, setSessionQueue] = useState<CollectionWord[]>([]);
  const sessionFrozenRef = useRef(false);

  useEffect(() => {
    if (isLoading || collectionCount === 0 || queue.length === 0) return;
    if (sessionFrozenRef.current) return;
    sessionFrozenRef.current = true;
    setSessionQueue([...queue]);
  }, [isLoading, collectionCount, queue]);

  const {
    currentWord,
    currentIndex,
    isRevealed,
    isComplete,
    reviewedCount,
    advance,
    setRevealed,
  } = useReviewSession(sessionQueue);
  const { isSubmitting, error, clearError, submitFeedback } = useReviewFeedback();

  const upNext = upNextWords(sessionQueue, currentIndex, 3);

  const handleFeedback = useCallback(
    async (button: ReviewFeedbackButton) => {
      if (!currentWord || !isRevealed || isSubmitting) return;
      clearError();
      const result = await submitFeedback(currentWord.id, button);
      if (result.ok) {
        advance();
      }
    },
    [currentWord, isRevealed, isSubmitting, submitFeedback, clearError, advance],
  );

  useEffect(() => {
    if (!isRevealed || isComplete) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
      if (isSubmitting) return;

      const map: Record<string, ReviewFeedbackButton> = {
        '1': 'easy',
        '2': 'medium',
        '3': 'hard',
        '4': 'again',
      };
      const button = map[e.key];
      if (button) {
        e.preventDefault();
        void handleFeedback(button);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isRevealed, isComplete, isSubmitting, handleFeedback]);

  const waitingForSession =
    !isLoading && collectionCount > 0 && sessionQueue.length === 0 && !isComplete;

  return (
    <FeatureRouteShell>
      {isLoading || waitingForSession ? (
        <div className="space-y-3" aria-busy="true">
          <div className="h-8 max-w-[16rem] rounded-sm bg-cream-dim" />
          <div className="h-5 max-w-[24rem] rounded-sm bg-cream-dim" />
          <div className="h-48 rounded-lg bg-cream-dim" />
          <p className="text-caption text-primary">Loading…</p>
        </div>
      ) : collectionCount === 0 ? (
        <header className="space-y-1">
          <h1 className="text-headline-2 text-primary">Review</h1>
          <p className="pt-6 font-serif text-body text-secondary italic">
            No words to review yet. Save some hard words from today&apos;s paragraph.
          </p>
        </header>
      ) : isComplete ? (
        <header className="space-y-1">
          <h1 className="text-headline-2 text-primary">Review</h1>
          <p className="pt-6 font-serif text-body text-secondary italic">Done for today.</p>
        </header>
      ) : !currentWord ? (
        <div className="space-y-3" aria-busy="true">
          <p className="text-caption text-primary">Loading…</p>
        </div>
      ) : (
        <div className="space-y-8">
          <header className="space-y-1 border-divider border-b pb-4">
            <h1 className="text-headline-2 text-primary">Review</h1>
            <p className="text-caption text-secondary">
              Practice words. Reinforce memory. Build confidence.
            </p>
          </header>

          <div className="grid min-w-0 grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="min-w-0 space-y-6">
              <ReviewFlashcard
                word={currentWord}
                wordIndex={currentIndex}
                queueLength={sessionQueue.length}
                isRevealed={isRevealed}
                onReveal={() => setRevealed(true)}
                feedbackError={error}
                onOpenSettings={() => router.push('/settings')}
              />

              {isRevealed ? (
                <ReviewFeedbackRow
                  disabled={isSubmitting}
                  onSelect={(button) => void handleFeedback(button)}
                />
              ) : null}
            </div>

            <aside className="min-w-0 space-y-5 xl:sticky xl:top-6 xl:self-start">
              <ReviewProgressRing
                reviewedCount={reviewedCount}
                total={sessionQueue.length}
              />
              <ReviewUpNextList words={upNext} startIndex={currentIndex} />
            </aside>
          </div>
        </div>
      )}
    </FeatureRouteShell>
  );
}
