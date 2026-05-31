'use client';

import { useCallback, useState } from 'react';

import { notifyCollectionMutated } from '@/features/collection/collection-mutated';
import { saveCollectionWord } from '@/lib/api/collection';
import { isApiStorageBackend } from '@/lib/config/storage-backend';
import { collectionWordSchema, type CollectionWord } from '@/lib/schemas/collection.schema';
import type { HardWord } from '@/lib/schemas/paragraph-cache.schema';
import { ok, type Result } from '@/lib/result';
import { db, safeWrite, type StorageError } from '@/lib/storage/db';

export type UseSaveWordResult = {
  isSaving: boolean;
  error: StorageError | null;
  saveWord: (args: { entry: HardWord; sourceParagraphId: string | null }) => Promise<Result<CollectionWord, StorageError>>;
};

export function useSaveWord(): UseSaveWordResult {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<StorageError | null>(null);
  const apiMode = isApiStorageBackend();

  const saveWord = useCallback(
    async ({
      entry,
      sourceParagraphId,
    }: {
      entry: HardWord;
      sourceParagraphId: string | null;
    }): Promise<Result<CollectionWord, StorageError>> => {
      setError(null);
      setIsSaving(true);
      try {
        const draft = collectionWordSchema.parse({
          id: globalThis.crypto?.randomUUID?.() ?? crypto.randomUUID(),
          word: entry.word,
          ipa: entry.ipa,
          pronunciationGuide: entry.pronunciationGuide || entry.word,
          meaning: entry.meaning,
          exampleSentence: entry.exampleSentence,
          savedAt: new Date().toISOString(),
          sourceParagraphId,
          reviewCount: 0,
          lastReviewedAt: null,
          difficultyRating: 1,
        });

        if (apiMode) {
          const result = await saveCollectionWord(draft);
          if (!result.ok) {
            setError(result.error);
            return result;
          }
          notifyCollectionMutated();
          return result;
        }

        const existing = await db.collection.where('word').equals(entry.word).first();
        if (existing) return ok(existing);

        const write = await safeWrite(async () => {
          await db.collection.add(draft);
          return draft;
        });
        if (!write.ok) setError(write.error);
        return write;
      } finally {
        setIsSaving(false);
      }
    },
    [apiMode],
  );

  return { isSaving, error, saveWord };
}
