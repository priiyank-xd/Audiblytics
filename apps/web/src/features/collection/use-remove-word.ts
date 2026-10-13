'use client';

import { useCallback, useState } from 'react';

import { notifyCollectionMutated } from '@/features/collection/collection-mutated';
import { deleteCollectionWord } from '@/lib/api/collection';
import { ok, type Result } from '@/lib/result';
import type { StorageError } from '@/lib/storage/types';

export type UseRemoveWordResult = {
  isRemovingId: string | null;
  errorById: Record<string, StorageError | undefined>;
  removeWord: (id: string) => Promise<Result<void, StorageError>>;
};

export function useRemoveWord(): UseRemoveWordResult {
  const [isRemovingId, setIsRemovingId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, StorageError | undefined>>({});

  const removeWord = useCallback(
    async (id: string) => {
      setIsRemovingId(id);
      setErrorById((prev) => ({ ...prev, [id]: undefined }));
      try {
        const result = await deleteCollectionWord(id);
        if (!result.ok) {
          setErrorById((prev) => ({ ...prev, [id]: result.error }));
          return result;
        }
        notifyCollectionMutated();
        return ok(undefined);
      } finally {
        setIsRemovingId(null);
      }
    },
    [],
  );

  return { isRemovingId, errorById, removeWord };
}
