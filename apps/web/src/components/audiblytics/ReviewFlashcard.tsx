'use client';

import { Eye, Pause, Play } from 'lucide-react';
import { useCallback, useEffect, useRef, type KeyboardEvent } from 'react';

import { InlineErrorSurface } from '@/components/audiblytics/InlineErrorSurface';
import { Button } from '@/components/ui/button';
import { useReviewWordTts } from '@/features/review/use-review-word-tts';
import { formatIpaDisplay } from '@/lib/collection/format-ipa-display';
import { parseWordMeaning } from '@/lib/today/word-meaning';
import type { CollectionWord } from '@/lib/schemas/collection.schema';
import type { StorageError } from '@/lib/storage/db';
import { cn } from '@/lib/utils';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2';

export type ReviewFlashcardProps = {
  word: CollectionWord;
  wordIndex: number;
  queueLength: number;
  isRevealed: boolean;
  onReveal: () => void;
  feedbackError: StorageError | null;
  onOpenSettings: () => void;
};

export function ReviewFlashcard({
  word,
  wordIndex,
  queueLength,
  isRevealed,
  onReveal,
  feedbackError,
  onOpenSettings,
}: ReviewFlashcardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const meaning = parseWordMeaning(word.meaning);
  const { isSpeaking, togglePlayPause } = useReviewWordTts({
    wordId: word.id,
    wordText: word.word,
    allowPlayback: true,
  });

  const handleCardKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === ' ' && !isRevealed) {
        e.preventDefault();
        onReveal();
      }
    },
    [isRevealed, onReveal],
  );

  useEffect(() => {
    cardRef.current?.focus();
  }, [word.id]);

  return (
    <div className="space-y-6">
      <section
        className="rounded-lg border border-divider bg-surface-card px-6 py-8"
        aria-label={`Review card for ${word.word}`}
      >
        <div className="flex items-center justify-between gap-2 text-caption text-tertiary">
          <span>
            Word {wordIndex + 1} of {queueLength}
          </span>
        </div>

        <div
          ref={cardRef}
          tabIndex={0}
          role="region"
          className={cn('mt-6 space-y-4 outline-none', focusRing)}
          onKeyDown={handleCardKeyDown}
        >
          <div className="text-center">
            <h2 className="font-serif text-headline-2 text-primary">{word.word}</h2>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <span lang="en-fonipa" className="text-ui-sm text-secondary">
                {formatIpaDisplay(word.ipa)}
              </span>
              <button
                type="button"
                className={cn(
                  'inline-flex size-9 items-center justify-center rounded-md text-tertiary hover:text-primary',
                  focusRing,
                )}
                aria-label={isSpeaking ? `Stop ${word.word}` : `Speak ${word.word}`}
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
              >
                {isSpeaking ? (
                  <Pause className="size-4" strokeWidth={1.5} aria-hidden />
                ) : (
                  <Play className="ml-0.5 size-4" strokeWidth={1.5} aria-hidden />
                )}
              </button>
            </div>
          </div>

          {!isRevealed ? (
            <div className="space-y-4 pt-4 text-center">
              <p className="text-caption text-secondary">
                Try to recall the meaning before revealing
              </p>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={onReveal}
              >
                <Eye className="size-4" strokeWidth={1.5} aria-hidden />
                Reveal meaning
              </Button>
            </div>
          ) : (
            <div className="mt-6 space-y-4 border-divider border-t pt-6">
              <div>
                <p className="text-micro-label text-tertiary">Meaning</p>
                <p className="mt-1 text-ui-sm text-foreground">
                  {meaning.partOfSpeech ? (
                    <span className="text-secondary">{meaning.partOfSpeech} · </span>
                  ) : null}
                  {meaning.gloss}
                </p>
              </div>
              <div>
                <p className="text-micro-label text-tertiary">Example</p>
                <p className="mt-1 text-ui-sm text-foreground italic">
                  &quot;{word.exampleSentence}&quot;
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {feedbackError ? (
        <InlineErrorSurface
          variant="storage"
          error={feedbackError}
          onOpenSettings={onOpenSettings}
        />
      ) : null}
    </div>
  );
}
