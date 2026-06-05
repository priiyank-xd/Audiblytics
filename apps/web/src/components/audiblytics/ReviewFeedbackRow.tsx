'use client';

import type { ReviewFeedbackButton } from '@/lib/review/feedback-outcome';
import { cn } from '@/lib/utils';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2';

const BUTTONS: {
  id: ReviewFeedbackButton;
  label: string;
  hint: string;
  className: string;
}[] = [
  {
    id: 'easy',
    label: 'Easy',
    hint: 'I knew it well',
    className: 'border-primary bg-primary-soft text-primary hover:bg-primary-soft',
  },
  {
    id: 'medium',
    label: 'Medium',
    hint: 'I was unsure',
    className: 'border-divider bg-surface-elevated text-foreground hover:bg-surface-elevated',
  },
  {
    id: 'hard',
    label: 'Hard',
    hint: 'It was difficult',
    className: 'border-destructive/40 bg-surface-card text-destructive hover:bg-surface-elevated',
  },
  {
    id: 'again',
    label: 'Again',
    hint: "I didn't know it",
    className: 'border-destructive/40 bg-surface-card text-destructive hover:bg-surface-elevated',
  },
];

export type ReviewFeedbackRowProps = {
  disabled?: boolean;
  onSelect: (button: ReviewFeedbackButton) => void;
  className?: string;
};

export function ReviewFeedbackRow({ disabled, onSelect, className }: ReviewFeedbackRowProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <p className="text-center text-ui-sm text-secondary">How well did you know this word?</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {BUTTONS.map((btn, idx) => (
          <button
            key={btn.id}
            type="button"
            disabled={disabled}
            className={cn(
              'rounded-lg border px-4 py-3 text-left transition-colors disabled:opacity-50',
              focusRing,
              btn.className,
            )}
            onClick={() => onSelect(btn.id)}
            aria-keyshortcuts={`${idx + 1}`}
          >
            <span className="block text-ui font-semibold">{btn.label}</span>
            <span className="mt-0.5 block text-caption opacity-90">{btn.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
