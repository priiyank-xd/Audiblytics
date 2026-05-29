'use client';

import Link from 'next/link';

import {
  defaultLastLlmCallStatus,
  lastLlmCallStatusSchema,
} from '@/lib/schemas/last-llm-call-status.schema';
import { useLocalStorage } from '@/lib/storage/use-local-storage';
import { cn } from '@/lib/utils';

export function ProviderChip() {
  const [status] = useLocalStorage(
    'audiblytics.lastLlmCallStatus',
    defaultLastLlmCallStatus,
    lastLlmCallStatusSchema,
  );

  const dotOk = status.ok;
  const label = status.lastProvider;

  return (
    <Link
      href="/settings"
      aria-label="Open settings, current LLM provider"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm font-mono text-rail transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
      )}
    >
      <span
        className={cn('size-1.5 shrink-0 rounded-sm', dotOk ? 'bg-forest' : 'bg-brick')}
        aria-hidden
      />
      <span>{label}</span>
    </Link>
  );
}
