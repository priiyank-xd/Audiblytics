'use client';

import { Pause, Play, Trash2, Turtle, X } from 'lucide-react';
import Link from 'next/link';

import { InlineErrorSurface } from '@/components/audiblytics/InlineErrorSurface';
import { Button, buttonVariants } from '@/components/ui/button';
import { formatIpaDisplay } from '@/lib/collection/format-ipa-display';
import { parseWordMeaning } from '@/lib/today/word-meaning';
import type { CollectionWord } from '@/lib/schemas/collection.schema';
import type { StorageError } from '@/lib/storage/db';
import { cn } from '@/lib/utils';

export type CollectionWordDetailPanelProps = {
  entry: CollectionWord;
  sourceLabel: string;
  isSpeaking: boolean;
  isSpeakingSlow: boolean;
  onSpeak: () => void;
  onSpeakSlow: () => void;
  onClose: () => void;
  onRemove: () => void;
  isRemoving: boolean;
  removeError?: StorageError;
  className?: string;
};

const PRONUNCIATION_UNAVAILABLE = 'Pronunciation unavailable';

function pronunciationGuideLines(guide: string): string[] {
  if (guide.trim() === PRONUNCIATION_UNAVAILABLE) return [];
  return guide
    .split(/\n|•/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line !== PRONUNCIATION_UNAVAILABLE);
}

export function CollectionWordDetailPanel({
  entry,
  sourceLabel,
  isSpeaking,
  isSpeakingSlow,
  onSpeak,
  onSpeakSlow,
  onClose,
  onRemove,
  isRemoving,
  removeError,
  className,
}: CollectionWordDetailPanelProps) {
  const meaning = parseWordMeaning(entry.meaning);
  const guideLines = pronunciationGuideLines(entry.pronunciationGuide);

  return (
    <section
      className={cn(
        'rounded-lg border border-divider bg-surface-card px-5 py-4',
        className,
      )}
      aria-label={`Details for ${entry.word}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-headline-3 text-primary">{entry.word}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span lang="en-fonipa" className="text-ui-sm text-secondary">
              {formatIpaDisplay(entry.ipa)}
            </span>
            <button
              type="button"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-tertiary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
              aria-label={isSpeaking ? `Stop playback for ${entry.word}` : `Speak ${entry.word}`}
              onClick={onSpeak}
            >
              {isSpeaking ? (
                <Pause className="size-4" strokeWidth={1.5} aria-hidden />
              ) : (
                <Play className="size-4" strokeWidth={1.5} aria-hidden />
              )}
            </button>
          </div>
          {meaning.partOfSpeech ? (
            <span className="mt-3 inline-block rounded-md bg-surface-elevated px-2 py-0.5 text-caption text-secondary">
              {meaning.partOfSpeech}
            </span>
          ) : null}
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

      <div className="mt-5 space-y-4">
        <div>
          <p className="text-micro-label text-tertiary">Meaning</p>
          <p className="mt-1 text-ui-sm text-foreground">{meaning.gloss}</p>
        </div>
        <div>
          <p className="text-micro-label text-tertiary">Example</p>
          <p className="mt-1 text-ui-sm text-foreground italic">
            &quot;{entry.exampleSentence}&quot;
          </p>
        </div>
        <div>
          <p className="text-micro-label text-tertiary">Saved from</p>
          <p className="mt-1 text-ui-sm text-foreground">{sourceLabel}</p>
        </div>

        {guideLines.length > 0 ? (
          <div className="rounded-lg bg-surface-elevated px-4 py-3">
            <p className="text-micro-label text-tertiary">How to pronounce</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-ui-sm text-secondary">
              {guideLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onSpeakSlow}>
          <Turtle className="size-4" strokeWidth={1.5} aria-hidden />
          {isSpeakingSlow ? 'Playing…' : 'Play slow'}
        </Button>
        <Link href="/review" className={buttonVariants({ size: 'sm' })}>
          Practice now
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isRemoving}
          onClick={onRemove}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="size-4" strokeWidth={1.5} aria-hidden />
          Remove
        </Button>
      </div>

      {removeError ? (
        <div className="mt-3">
          <InlineErrorSurface
            variant="storage"
            error={removeError}
            onOpenSettings={() => {
              window.location.href = '/settings/advanced';
            }}
          />
        </div>
      ) : null}
    </section>
  );
}
