'use client';

import { MoreVertical, Pause, Play, Trash2 } from 'lucide-react';

import { InlineErrorSurface } from '@/components/audiblytics/InlineErrorSurface';
import type { CollectionWord } from '@/lib/schemas/collection.schema';
import type { StorageError } from '@/lib/storage/db';
import { formatIpaDisplay } from '@/lib/collection/format-ipa-display';
import { formatLastPracticedLabel } from '@/lib/collection/format-last-practiced';
import { cn } from '@/lib/utils';

const iconBtn =
  'inline-flex size-8 shrink-0 items-center justify-center rounded-md text-tertiary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:opacity-60';

export type CollectionListRowProps = {
  entry: CollectionWord;
  isSelected: boolean;
  isSpeaking: boolean;
  isRemoving: boolean;
  removeError?: StorageError;
  onSelect: () => void;
  onSpeak: () => void;
  onRemove: () => void;
};

export function CollectionListRow({
  entry,
  isSelected,
  isSpeaking,
  isRemoving,
  removeError,
  onSelect,
  onSpeak,
  onRemove,
}: CollectionListRowProps) {
  return (
    <div className="space-y-2">
    <div
      className={cn(
        'grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)_minmax(0,6rem)_auto] items-center gap-3 rounded-lg border border-transparent px-3 py-3 transition-colors',
        isSelected && 'border-divider bg-primary-soft',
        !isSelected && 'hover:bg-surface-elevated',
      )}
    >
      <button
        type="button"
        className="min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        onClick={onSelect}
        aria-current={isSelected ? 'true' : undefined}
      >
        <p className="font-serif text-ui font-semibold text-primary">{entry.word}</p>
        <p lang="en-fonipa" className="text-caption text-tertiary">
          {formatIpaDisplay(entry.ipa)}
        </p>
      </button>

      <button
        type="button"
        className="min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        onClick={onSelect}
      >
        <p className="line-clamp-1 text-ui-sm text-secondary">{entry.meaning}</p>
      </button>

      <p className="text-caption text-tertiary">{formatLastPracticedLabel(entry.lastReviewedAt)}</p>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          className={cn(
            iconBtn,
            'size-9 rounded-full bg-primary text-on-primary hover:text-on-primary',
          )}
          aria-label={isSpeaking ? `Stop ${entry.word}` : `Play ${entry.word}`}
          onClick={(e) => {
            e.stopPropagation();
            onSpeak();
          }}
        >
          {isSpeaking ? (
            <Pause className="size-4" strokeWidth={1.6} aria-hidden />
          ) : (
            <Play className="ml-0.5 size-4" strokeWidth={1.6} aria-hidden />
          )}
        </button>
        <button
          type="button"
          className={iconBtn}
          aria-label={`Remove ${entry.word} from collection`}
          disabled={isRemoving}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Trash2 className="size-4" strokeWidth={1.5} aria-hidden />
        </button>
        <span className="inline-flex size-8 items-center justify-center text-tertiary" aria-hidden>
          <MoreVertical className="size-4" strokeWidth={1.5} />
        </span>
      </div>
    </div>
    {removeError ? (
      <InlineErrorSurface
        variant="storage"
        error={removeError}
        onOpenSettings={() => {
          window.location.href = '/settings/advanced';
        }}
      />
    ) : null}
    </div>
  );
}
