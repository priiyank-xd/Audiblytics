import { Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';

export type VoiceJournalAiReflectionCardProps = {
  className?: string;
};

export function VoiceJournalAiReflectionCard({ className }: VoiceJournalAiReflectionCardProps) {
  return (
    <section
      className={cn(
        'rounded-lg border border-divider bg-surface-card px-5 py-5',
        className,
      )}
      aria-label="AI session reflection"
      aria-disabled="true"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-secondary" strokeWidth={1.6} aria-hidden />
        <h2 className="text-ui font-semibold text-foreground">AI session reflection</h2>
      </div>
      <p className="mt-3 text-caption text-secondary">
        Reflections on your session will appear here once this feature ships.
      </p>
    </section>
  );
}
