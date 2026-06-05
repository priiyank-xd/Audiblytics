'use client';

import { Pause, Play, X } from 'lucide-react';

import { InlineErrorSurface } from '@/components/audiblytics/InlineErrorSurface';
import { Button } from '@/components/ui/button';
import { parseWordMeaning } from '@/lib/today/word-meaning';
import type { HardWord } from '@/lib/schemas/paragraph-cache.schema';
import type { StorageError } from '@/lib/storage/db';
import { cn } from '@/lib/utils';

export type TodayWordDetailCardProps = {
  word: HardWord;
  isPlainWord?: boolean;
  isSpeaking: boolean;
  onSpeak: () => void;
  onClose: () => void;
  onSaveToCollection: () => void;
  isSaving: boolean;
  isSaved: boolean;
  saveError: StorageError | null;
  onOpenSettings: () => void;
  className?: string;
};

export function TodayWordDetailCard({
  word,
  isPlainWord = false,
  isSpeaking,
  onSpeak,
  onClose,
  onSaveToCollection,
  isSaving,
  isSaved,
  saveError,
  onOpenSettings,
  className,
}: TodayWordDetailCardProps) {
  const meaning = parseWordMeaning(word.meaning);

  return (
    <section
      className={cn(
        'rounded-lg border border-divider bg-surface-card px-5 py-4',
        className,
      )}
      aria-label={`Details for ${word.word}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-headline-3 text-primary">{word.word}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {!isPlainWord ? (
              <span className="text-ui-sm text-secondary">{word.ipa}</span>
            ) : (
              <span className="text-ui-sm text-tertiary">Tap listen, then add to collection</span>
            )}
            <button
              type="button"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-tertiary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
              aria-label={isSpeaking ? `Stop playback for ${word.word}` : `Speak ${word.word}`}
              onClick={onSpeak}
            >
              {isSpeaking ? (
                <Pause className="size-4" strokeWidth={1.5} aria-hidden />
              ) : (
                <Play className="size-4" strokeWidth={1.5} aria-hidden />
              )}
            </button>
          </div>
        </div>
        <button
          type="button"
          aria-label="Close word details"
          className="rounded-sm text-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          onClick={onClose}
        >
          <X className="size-5" strokeWidth={1.6} />
        </button>
      </div>

      <div className="mt-5 space-y-4 text-caption text-secondary">
        <div>
          <p className="text-micro-label text-tertiary">{isPlainWord ? 'Context' : 'Meaning'}</p>
          <p className="mt-1 text-ui-sm text-foreground">
            {!isPlainWord && meaning.partOfSpeech ? (
              <span className="text-secondary">{meaning.partOfSpeech} · </span>
            ) : null}
            {isPlainWord ? word.meaning : meaning.gloss}
          </p>
        </div>
        <div>
          <p className="text-micro-label text-tertiary">Example</p>
          <p className="mt-1 text-ui-sm text-foreground">&quot;{word.exampleSentence}&quot;</p>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            disabled={isSaving || isSaved}
            onClick={onSaveToCollection}
          >
            {isSaved ? 'In collection' : 'Add to collection'}
          </Button>
        </div>
        {!isSaved && saveError ? (
          <InlineErrorSurface
            variant="storage"
            error={saveError}
            onOpenSettings={onOpenSettings}
          />
        ) : null}
      </div>
    </section>
  );
}
