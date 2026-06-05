'use client';

import { cn } from '@/lib/utils';

export const WAVEFORM_BAR_HEIGHT_CLASSES = [
  'h-2',
  'h-4',
  'h-3',
  'h-5',
  'h-6',
  'h-8',
  'h-5',
  'h-7',
] as const;

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export type RecordingWaveformPlaceholderProps = {
  seed?: string;
  barCount?: number;
  className?: string;
};

export function RecordingWaveformPlaceholder({
  seed = 'default',
  barCount = 24,
  className,
}: RecordingWaveformPlaceholderProps) {
  const offset = hashSeed(seed) % WAVEFORM_BAR_HEIGHT_CLASSES.length;

  return (
    <div
      className={cn('flex h-8 items-end justify-center gap-0.5', className)}
      aria-hidden="true"
    >
      {Array.from({ length: barCount }, (_, index) => (
        <span
          key={index}
          className={cn(
            'w-1 rounded-full bg-primary-soft',
            WAVEFORM_BAR_HEIGHT_CLASSES[(index + offset) % WAVEFORM_BAR_HEIGHT_CLASSES.length],
          )}
        />
      ))}
    </div>
  );
}
