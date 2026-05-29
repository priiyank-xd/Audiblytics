'use client';

import { Pause, Play, Star } from 'lucide-react';
import { useId } from 'react';

import type { HardWord } from '@/lib/schemas/paragraph-cache.schema';
import { cn } from '@/lib/utils';

const ttsIconBtn =
  'inline-flex size-8 shrink-0 items-center justify-center rounded-md text-tertiary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2';

export type HardWordRowProps = {
  entry: HardWord;
  rowId: string;
  isSpeaking: boolean;
  onToggleSpeak: () => void;
  isSaved: boolean;
  isSaving: boolean;
  onSave: () => void;
  isRecycled?: boolean;
};

export function HardWordRow({
  entry,
  rowId,
  isSpeaking,
  onToggleSpeak,
  isSaved,
  isSaving,
  onSave,
  isRecycled = false,
}: HardWordRowProps) {
  const reactId = useId();
  const domSafeId = `hard-word-${rowId.replace(/[^a-zA-Z0-9_-]/g, '-')}-${reactId.replace(/:/g, '')}`;

  return (
    <div id={domSafeId} className="space-y-0">
      <div className="flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-ui-sm font-semibold text-primary uppercase tracking-wide">
            {entry.word}
            {isRecycled ? (
              <span className="ml-1 text-caption font-normal text-tertiary" title="Recycled from your collection">
                ♺
              </span>
            ) : null}
          </span>
          <span className="text-data text-secondary">
            {entry.pronunciationGuide || entry.word}
          </span>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            className={cn(ttsIconBtn)}
            aria-label={isSpeaking ? `Stop playback for ${entry.word}` : `Speak ${entry.word}`}
            onClick={onToggleSpeak}
          >
            {isSpeaking ? <Pause className="size-4" strokeWidth={1.5} aria-hidden /> : <Play className="size-4" strokeWidth={1.5} aria-hidden />}
          </button>
          <button
            type="button"
            className={cn(ttsIconBtn)}
            aria-label={`Save ${entry.word} to collection`}
            aria-pressed={isSaved}
            disabled={isSaving}
            onClick={onSave}
          >
            <Star
              className={cn('size-4', isSaved ? 'fill-primary text-primary' : 'text-tertiary')}
              strokeWidth={1.5}
              aria-hidden
            />
          </button>
        </div>
      </div>
      <p className="mt-0.5 text-caption text-secondary">{entry.meaning}</p>
      <p className="mt-0.5 text-caption text-tertiary">
        ex: &quot;{entry.exampleSentence}&quot;
      </p>
    </div>
  );
}
