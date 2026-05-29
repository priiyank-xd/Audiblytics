'use client';

import { Trash2, Volume2 } from 'lucide-react';
import { useState } from 'react';

import { InlineErrorSurface } from '@/components/audiblytics/InlineErrorSurface';
import type { CollectionWord } from '@/lib/schemas/collection.schema';
import { speak } from '@/lib/audio/tts';
import type { StorageError } from '@/lib/storage/db';
import { cn } from '@/lib/utils';

const iconBtn =
  'inline-flex size-8 shrink-0 items-center justify-center rounded-md text-tertiary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:opacity-60';

export type CollectionRowProps = {
  entry: CollectionWord;
  isRemoving: boolean;
  removeError?: StorageError;
  onRemove: () => void;
};

export function CollectionRow({ entry, isRemoving, removeError, onRemove }: CollectionRowProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex min-w-0 items-start gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-ui-sm font-semibold text-primary">{entry.word}</span>
            <span lang="en-fonipa" className="text-data text-tertiary">
              /{entry.ipa.replaceAll('/', '').trim()}/
            </span>
          </div>
          <p className="text-body text-secondary">{entry.meaning}</p>
          <p className="text-caption text-tertiary">ex: &quot;{entry.exampleSentence}&quot;</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className={cn(iconBtn)}
            aria-label={`Pronounce ${entry.word}`}
            onClick={() => {
              setIsSpeaking(true);
              speak(entry.word, undefined, { onEnd: () => setIsSpeaking(false) });
            }}
          >
            <Volume2 className="size-4" strokeWidth={1.5} aria-hidden />
          </button>
          <button
            type="button"
            className={cn(iconBtn)}
            aria-label={`Remove ${entry.word} from collection`}
            disabled={isRemoving}
            onClick={onRemove}
          >
            <Trash2 className="size-4" strokeWidth={1.5} aria-hidden />
          </button>
        </div>
      </div>

      {removeError ? (
        <InlineErrorSurface
          variant="storage"
          error={removeError}
          onOpenSettings={() => {
            window.location.href = '/settings?focus=provider';
          }}
        />
      ) : null}
    </div>
  );
}

