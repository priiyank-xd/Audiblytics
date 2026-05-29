'use client';

import { useLiveQuery } from 'dexie-react-hooks';

import { HardWordRow } from '@/components/audiblytics/HardWordRow';
import { InlineErrorSurface } from '@/components/audiblytics/InlineErrorSurface';
import { useSaveWord } from '@/features/collection/use-save-word';
import { db } from '@/lib/storage/db';
import { LIVE_QUERY_EMPTY_DEPS } from '@/lib/hooks/live-query-empty-deps';
import type { HardWord } from '@/lib/schemas/paragraph-cache.schema';
import { cn } from '@/lib/utils';

export type HardWordsListProps = {
  entries: HardWord[];
  activeWordId: string | null;
  onToggleWord: (rowId: string, word: string) => void;
  sourceParagraphId: string | null;
  /** Lowercase-trimmed spellings selected for this paragraph's recycle pass (matches hardWords.word). */
  recycledWordKeys?: ReadonlySet<string>;
  /** `rail` drops the top border when words sit in the Today side column. */
  variant?: 'default' | 'rail' | 'compact';
};

function normalizeWordKey(word: string): string {
  return word.trim().toLowerCase();
}

export function HardWordsList({
  entries,
  activeWordId,
  onToggleWord,
  sourceParagraphId,
  recycledWordKeys,
  variant = 'default',
}: HardWordsListProps) {
  const savedWords = useLiveQuery(async () => {
    const rows = await db.collection.toArray();
    return new Set(rows.map((r) => r.word));
  }, LIVE_QUERY_EMPTY_DEPS);

  const { isSaving, error, saveWord } = useSaveWord();

  if (entries.length === 0) return null;

  if (variant === 'compact') {
    return (
      <ul className="flex flex-wrap gap-2">
        {entries.map((hw) => {
          const rowId = `${hw.word}-${hw.ipa}`;
          return (
            <li key={rowId}>
              <button
                type="button"
                className={cn(
                  'inline-flex min-h-9 items-center gap-2 rounded-lg border border-divider px-3 text-caption transition-colors',
                  activeWordId === rowId
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface text-foreground hover:bg-surface-elevated',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
                )}
                onClick={() => onToggleWord(rowId, hw.word)}
              >
                <span>{hw.word}</span>
                <span className="sr-only">Listen</span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <dl
      className={cn(
        'space-y-4',
        variant === 'default' && 'mt-8 border-divider border-t pt-6',
        variant === 'rail' &&
          'rounded-lg border border-divider bg-surface-elevated px-4 py-5',
      )}
    >
      {entries.map((hw) => {
        const rowId = `${hw.word}-${hw.ipa}`;
        const isSaved = savedWords?.has(hw.word) ?? false;
        const isRecycled =
          recycledWordKeys !== undefined && recycledWordKeys.has(normalizeWordKey(hw.word));
        return (
          <div key={rowId}>
            <HardWordRow
              entry={hw}
              rowId={rowId}
              isSpeaking={activeWordId === rowId}
              onToggleSpeak={() => onToggleWord(rowId, hw.word)}
              isSaved={isSaved}
              isSaving={isSaving}
              onSave={() => {
                void saveWord({ entry: hw, sourceParagraphId });
              }}
              isRecycled={isRecycled}
            />
            {!isSaved && error ? (
              <InlineErrorSurface
                variant="storage"
                error={error}
                onOpenSettings={() => {
                  window.location.href = '/settings?focus=provider';
                }}
              />
            ) : null}
          </div>
        );
      })}
    </dl>
  );
}
