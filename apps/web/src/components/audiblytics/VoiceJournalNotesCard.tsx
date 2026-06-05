'use client';

import { voiceJournalNotesSchema } from '@/lib/schemas/voice-journal-notes.schema';
import { useLocalStorage } from '@/lib/storage/use-local-storage';
import { cn } from '@/lib/utils';

export type VoiceJournalNotesCardProps = {
  className?: string;
};

export function VoiceJournalNotesCard({ className }: VoiceJournalNotesCardProps) {
  const [stored, setStored] = useLocalStorage(
    'audiblytics.voiceJournalNotes',
    voiceJournalNotesSchema.parse({ notes: '' }),
    voiceJournalNotesSchema,
  );

  return (
    <section
      className={cn(
        'rounded-lg border border-divider bg-surface-card px-5 py-5',
        className,
      )}
      aria-label="Your notes"
    >
      <h2 className="text-ui font-semibold text-foreground">Your notes</h2>
      <p className="mt-1 text-caption text-secondary">Private reflections on your practice.</p>
      <textarea
        value={stored.notes}
        onChange={(e) => setStored({ notes: e.target.value })}
        rows={5}
        placeholder="Write your thoughts about this session..."
        className="mt-4 w-full resize-y rounded-lg border border-divider bg-surface px-3 py-3 text-ui-sm text-foreground placeholder:text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      />
      <p className="mt-2 text-caption text-tertiary">
        Notes are private and visible only to you.
      </p>
    </section>
  );
}
