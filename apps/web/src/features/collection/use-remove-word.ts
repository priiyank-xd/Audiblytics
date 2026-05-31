'use client';

import { useCallback, useState } from 'react';

import { notifyCollectionMutated } from '@/features/collection/collection-mutated';
import { deleteCollectionWord } from '@/lib/api/collection';
import { isApiStorageBackend } from '@/lib/config/storage-backend';
import { err, ok, type Result } from '@/lib/result';
import { db, safeWrite, type StorageError } from '@/lib/storage/db';

export type UseRemoveWordResult = {
  isRemovingId: string | null;
  errorById: Record<string, StorageError | undefined>;
  removeWord: (id: string) => Promise<Result<void, StorageError>>;
};

export function useRemoveWord(): UseRemoveWordResult {
  const [isRemovingId, setIsRemovingId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, StorageError | undefined>>({});
  const apiMode = isApiStorageBackend();

  const removeWord = useCallback(
    async (id: string) => {
      setIsRemovingId(id);
      setErrorById((prev) => ({ ...prev, [id]: undefined }));
      try {
        if (apiMode) {
          const result = await deleteCollectionWord(id);
          if (!result.ok) {
            setErrorById((prev) => ({ ...prev, [id]: result.error }));
            return result;
          }
          notifyCollectionMutated();
          return ok(undefined);
        }

        const res = await safeWrite(async () => {
          await db.collection.delete(id);
          return;
        });
        if (!res.ok) {
          setErrorById((prev) => ({ ...prev, [id]: res.error }));
          return err(res.error);
        }
        return ok(undefined);
      } finally {
        setIsRemovingId(null);
      }
    },
    [apiMode],
  );

  return { isRemovingId, errorById, removeWord };
}
