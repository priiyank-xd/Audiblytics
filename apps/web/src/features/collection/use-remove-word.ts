'use client';

import { useCallback, useState } from 'react';

import type { Result } from '@/lib/result';
import { err, ok } from '@/lib/result';
import { db, safeWrite, type StorageError } from '@/lib/storage/db';

export type UseRemoveWordResult = {
  isRemovingId: string | null;
  errorById: Record<string, StorageError | undefined>;
  removeWord: (id: string) => Promise<Result<void, StorageError>>;
};

export function useRemoveWord(): UseRemoveWordResult {
  const [isRemovingId, setIsRemovingId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, StorageError | undefined>>({});

  const removeWord = useCallback(async (id: string) => {
    setIsRemovingId(id);
    setErrorById((prev) => ({ ...prev, [id]: undefined }));
    try {
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
  }, []);

  return { isRemovingId, errorById, removeWord };
}

