'use client';

import { useCallback, useState } from 'react';

import { db, safeWrite, type StorageError } from '@/lib/storage/db';
import { ok, type Result } from '@/lib/result';
import { collectionWordSchema, type CollectionWord } from '@/lib/schemas/collection.schema';
import type { HardWord } from '@/lib/schemas/paragraph-cache.schema';

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
        // Idempotency: no-op if word already saved.
        const existing = await db.collection.where('word').equals(entry.word).first();
        if (existing) return ok(existing);

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
    [],
  );

  return { isSaving, error, saveWord };
}
