import type { CollectionWord } from '@/lib/schemas/collection.schema';
import { difficultyDotClass } from '@/lib/review/review-session';
import { cn } from '@/lib/utils';

export type ReviewUpNextListProps = {
  words: CollectionWord[];
  startIndex: number;
  className?: string;
};

export function ReviewUpNextList({ words, startIndex, className }: ReviewUpNextListProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-divider bg-surface-card px-5 py-4',
        className,
      )}
    >
      <p className="text-micro-label text-tertiary">Up next</p>
      {words.length === 0 ? (
        <p className="mt-3 text-caption text-secondary">No more words in this batch.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {words.map((w, i) => (
            <li key={w.id} className="flex items-center gap-3">
              <span
                className={cn('size-2 shrink-0 rounded-full', difficultyDotClass(w.difficultyRating))}
                aria-hidden
              />
              <span className="min-w-0 flex-1 font-serif text-ui-sm text-primary">{w.word}</span>
              <span className="text-caption text-tertiary">{startIndex + i + 2}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
