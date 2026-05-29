'use client';

import { useRouter } from 'next/navigation';

import { InlineErrorSurface } from '@/components/audiblytics/InlineErrorSurface';
import { usePruneOnMount } from '@/lib/hooks/use-prune-on-mount';

/**
 * Invokes rolling-retention prune once on app mount and surfaces IndexedDB failures inline (AR25).
 */
export function RetentionPruneOnMount() {
  const router = useRouter();
  const { storageError, retryPrune } = usePruneOnMount();

  if (!storageError) return null;

  return (
    <InlineErrorSurface
      variant="storage"
      error={storageError}
      onRetry={retryPrune}
      onOpenSettings={() => {
        router.push('/settings');
      }}
    />
  );
}
