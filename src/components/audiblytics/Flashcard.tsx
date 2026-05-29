'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react';

import { Pause, Play } from 'lucide-react';

import { InlineErrorSurface } from '@/components/audiblytics/InlineErrorSurface';
import { Button } from '@/components/ui/button';
import { useFlashcardState } from '@/features/review/use-flashcard-state';
import type { ReviewFeedbackOutcome } from '@/features/review/use-review-feedback';
import { useReviewWordTts } from '@/features/review/use-review-word-tts';
import type { CollectionWord } from '@/lib/schemas/collection.schema';
import type { StorageError } from '@/lib/storage/db';
import { cn } from '@/lib/utils';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-background';

function formatIpaSlashWrapped(ipa: string): string {
  const t = ipa.trim();
  if (t.startsWith('/') && t.endsWith('/')) {
    return t;
  }
  return `/${t}/`;
}

export type FlashcardProps = {
  word: CollectionWord;
  onFeedback: (outcome: ReviewFeedbackOutcome) => void | Promise<void>;
  feedbackError: StorageError | null;
  onOpenSettings: () => void;
};

export function Flashcard({ word, onFeedback, feedbackError, onOpenSettings }: FlashcardProps) {
  const { isFront, toggleFlip } = useFlashcardState(word.id);
  const { isSpeaking, togglePlayPause, stopPlayback } = useReviewWordTts({
    wordId: word.id,
    wordText: word.word,
    backFaceActive: !isFront,
  });
  const [pending, setPending] = useState(false);
  const onFeedbackRef = useRef(onFeedback);
  onFeedbackRef.current = onFeedback;

  const runFeedback = useCallback(async (outcome: ReviewFeedbackOutcome) => {
    if (pending) return;
    setPending(true);
    stopPlayback();
    try {
      await Promise.resolve(onFeedbackRef.current(outcome));
    } finally {
      setPending(false);
    }
  }, [pending, stopPlayback]);

  useEffect(() => {
    setPending(false);
  }, [word.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
      if (pending) return;
      if (e.key === '1') {
        e.preventDefault();
        void runFeedback('got-it');
      } else if (e.key === '2') {
        e.preventDefault();
        void runFeedback('almost');
      } else if (e.key === '3') {
        e.preventDefault();
        void runFeedback('forgot');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending, runFeedback]);

  const handlePlayPause = useCallback(
    (e: ReactMouseEvent) => {
      e.stopPropagation();
      togglePlayPause();
    },
    [togglePlayPause],
  );

  const handleCardKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === ' ') {
      e.preventDefault();
      toggleFlip();
    }
  };

  return (
    <div className="space-y-6">
      <div
        tabIndex={0}
        role="region"
        aria-label="Review flashcard"
        className={cn(
          'min-h-48 cursor-pointer rounded-md border border-divider bg-surface-elevated p-8 select-none',
          focusRing,
        )}
        onClick={toggleFlip}
        onKeyDown={handleCardKeyDown}
      >
        {isFront ? (
          <div className="flex min-h-32 flex-col items-center justify-center gap-4 text-center">
            <p className="font-serif text-3xl text-primary">{word.word}</p>
            <p className="text-caption text-secondary">Tap to flip</p>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <p className="font-mono text-data text-secondary">
              <span lang="en-fonipa">{formatIpaSlashWrapped(word.ipa)}</span>
            </p>
            <p className="text-body text-secondary">{word.meaning}</p>
            <p className="text-caption text-tertiary">&quot;{word.exampleSentence}&quot;</p>
            <div className="flex justify-center pt-2">
              <button
                type="button"
                aria-pressed={isSpeaking}
                aria-label={
                  isSpeaking ? 'Pause pronunciation' : `Play pronunciation of ${word.word}`
                }
                className={cn(
                  'inline-flex size-11 shrink-0 items-center justify-center rounded-md text-tertiary transition-colors hover:text-primary',
                  focusRing,
                )}
                onClick={handlePlayPause}
              >
                {isSpeaking ? (
                  <Pause className="size-6" strokeWidth={1.5} aria-hidden />
                ) : (
                  <Play className="size-6" strokeWidth={1.5} aria-hidden />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          type="button"
          variant="default"
          size="lg"
          disabled={pending}
          className={cn(focusRing)}
          onClick={() => void runFeedback('got-it')}
        >
          Got it
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={pending}
          className={cn(focusRing)}
          onClick={() => void runFeedback('almost')}
        >
          Almost
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={pending}
          className={cn(focusRing)}
          onClick={() => void runFeedback('forgot')}
        >
          Forgot
        </Button>
      </div>

      {feedbackError ? (
        <InlineErrorSurface variant="storage" error={feedbackError} onOpenSettings={onOpenSettings} />
      ) : null}
    </div>
  );
}
