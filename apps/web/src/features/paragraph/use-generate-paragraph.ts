'use client';

import { useCallback, useState } from 'react';

import { notifyParagraphDatesMutated } from '@/features/calendar/paragraph-dates-mutated';
import { fetchCollection } from '@/lib/api/collection';
import { generateParagraphViaApi } from '@/lib/api/paragraphs';

import type { GenerateParagraphHookResult } from './paragraph-generate-payload';
import { selectRecycleWords } from './select-recycle-words';

export type UseGenerateParagraphArgs = {
  paragraphId: string;
};

async function loadCollectionForRecycle() {
  try {
    return await fetchCollection();
  } catch (e) {
    console.warn('[paragraph] collection load failed for recycle; cold-start', e);
    return [];
  }
}

export function useGenerateParagraph({ paragraphId }: UseGenerateParagraphArgs) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(
    async (opts?: { paragraphId?: string }): Promise<GenerateParagraphHookResult> => {
      setIsGenerating(true);
      try {
        const recycleWords = selectRecycleWords(await loadCollectionForRecycle()).map((w) => w.word);
        const out = await generateParagraphViaApi({
          paragraphId: opts?.paragraphId ?? paragraphId,
          recycleWords,
        });
        if (out.ok) notifyParagraphDatesMutated();
        return out;
      } finally {
        setIsGenerating(false);
      }
    },
    [paragraphId],
  );

  return { generate, isGenerating };
}
