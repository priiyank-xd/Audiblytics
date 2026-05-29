'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { FeatureRouteShell } from '@/components/audiblytics/FeatureRouteShell';
import { Flashcard } from '@/components/audiblytics/Flashcard';
import { applyReviewFeedback, type ReviewFeedbackOutcome } from '@/features/review/use-review-feedback';
import { useReviewQueue } from '@/features/review/use-review-queue';
import { cancelSpeech } from '@/lib/audio/tts';
import type { CollectionWord } from '@/lib/schemas/collection.schema';
import type { StorageError } from '@/lib/storage/db';

export default function ReviewPage() {
  const router = useRouter();
  const { queue, isLoading, collectionCount } = useReviewQueue();
  const sessionRef = useRef<CollectionWord[] | null>(null);

  if (!isLoading && collectionCount > 0 && sessionRef.current === null && queue.length > 0) {
    sessionRef.current = [...queue];
  }

  const sessionQueue = sessionRef.current ?? [];
  const [index, setIndex] = useState(0);
  const [feedbackError, setFeedbackError] = useState<StorageError | null>(null);

  const handleFeedback = useCallback(
    async (outcome: ReviewFeedbackOutcome) => {
      cancelSpeech();
      const current = sessionQueue[index];
      if (!current) return;
      const r = await applyReviewFeedback(current.id, outcome);
      if (!r.ok) {
        setFeedbackError(r.error);
        return;
      }
      setFeedbackError(null);
      setIndex((i) => i + 1);
    },
    [sessionQueue, index],
  );

  return (
    <FeatureRouteShell>
      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          <div className="h-5 max-w-[12rem] rounded-sm bg-cream-dim" />
          <div className="h-5 max-w-[20rem] rounded-sm bg-cream-dim" />
          <p className="text-caption text-primary">Loading…</p>
        </div>
      ) : collectionCount === 0 ? (
        <p className="font-serif text-body text-primary italic">
          No words to review yet. Save some hard words from today&apos;s paragraph.
        </p>
      ) : sessionQueue.length > 0 && index >= sessionQueue.length ? (
        <p className="font-serif text-body text-primary italic">Done for today.</p>
      ) : !sessionQueue[index] ? (
        <div className="space-y-3" aria-busy="true">
          <p className="text-caption text-primary">Loading…</p>
        </div>
      ) : (
        <section className="space-y-6">
          <header className="space-y-1 border-divider border-b pb-4">
            <h1 className="text-headline-2 text-primary">Review</h1>
            <p className="text-caption text-secondary">
              Card {index + 1} of {sessionQueue.length}.
            </p>
            <p className="sr-only">
              When the flashcard has keyboard focus, press Space to flip. Press 1 for Got it, 2 for
              Almost, 3 for Forgot.
            </p>
          </header>

          <div className="mx-auto w-full max-w-2xl">
            <Flashcard
              word={sessionQueue[index]}
              onFeedback={handleFeedback}
              feedbackError={feedbackError}
              onOpenSettings={() => router.push('/settings')}
            />
          </div>
        </section>
      )}
    </FeatureRouteShell>
  );
}
