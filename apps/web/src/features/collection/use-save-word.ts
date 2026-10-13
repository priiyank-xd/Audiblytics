'use client';

import { useCallback, useState } from 'react';

import { notifyCollectionMutated } from '@/features/collection/collection-mutated';
import { saveCollectionWord } from '@/lib/api/collection';
import { collectionWordSchema, type CollectionWord } from '@/lib/schemas/collection.schema';
import type { HardWord } from '@/lib/schemas/paragraph-cache.schema';
import type { Result } from '@/lib/result';
import type { StorageError } from '@/lib/storage/types';

export type UseSaveWordResult = {
  isSaving: boolean;
  error: StorageError | null;
  saveWord: (args: { entry: HardWord; sourceParagraphId: string | null }) => Promise<Result<CollectionWord, StorageError>>;
};

export function useSaveWord(): UseSaveWordResult {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<StorageError | null>(null);

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

        const result = await saveCollectionWord(draft);
        if (!result.ok) {
          setError(result.error);
          return result;
        }
        notifyCollectionMutated();
        return result;
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  return { isSaving, error, saveWord };
}
