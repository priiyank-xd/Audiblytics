'use client';

import { useCallback, useState } from 'react';

import { generateParagraph } from '@/lib/llm/generate';
import {
  defaultLastLlmCallStatus,
  lastLlmCallStatusSchema,
} from '@/lib/schemas/last-llm-call-status.schema';
import type { ActiveProvider, ProviderKeys } from '@/lib/schemas/provider-keys.schema';
import type { Settings } from '@/lib/schemas/settings.schema';
import { db } from '@/lib/storage/db';
import { useLocalStorage } from '@/lib/storage/use-local-storage';

import { persistParagraphToCache } from './persist-paragraph-cache';
import type { GenerateParagraphHookResult, ParagraphGeneratePayload } from './paragraph-generate-payload';
import { selectRecycleWords } from './select-recycle-words';

export type UseGenerateParagraphArgs = {
  activeProvider: ActiveProvider;
  providerKeys: ProviderKeys;
  settings: Settings;
  paragraphId: string;
};

export function useGenerateParagraph({
  activeProvider,
  providerKeys,
  settings,
  paragraphId,
}: UseGenerateParagraphArgs) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [, setLastLlmCallStatus] = useLocalStorage(
    'audiblytics.lastLlmCallStatus',
    defaultLastLlmCallStatus,
    lastLlmCallStatusSchema,
  );

  const generate = useCallback(async (opts?: { paragraphId?: string }): Promise<GenerateParagraphHookResult> => {
    const targetParagraphId = opts?.paragraphId ?? paragraphId;
    setIsGenerating(true);
    try {
      const collection = await db.collection.toArray();
      const recycle = selectRecycleWords(collection);
      const recycleWords = recycle.map((w) => w.word);

      const { getProvider } = await import('@/lib/llm/client');
      const model = getProvider({ activeProvider, providerKeys });
      const out = await generateParagraph({
        provider: activeProvider,
        model,
        theme: settings.theme,
        persona: settings.persona,
        length: settings.length,
        recycleWords,
      });
      if (out.ok) {
        const generatedAt = new Date().toISOString();
        const cachePersist = await persistParagraphToCache({
          id: targetParagraphId,
          theme: settings.theme,
          persona: settings.persona,
          generatedAt,
          result: out.value,
        });

        const payload: ParagraphGeneratePayload = {
          result: out.value,
          recycleWordTexts: recycleWords,
          cachePersist,
        };

        setLastLlmCallStatus({
          ok: true,
          lastProvider: activeProvider,
          at: generatedAt,
        });
        return { ok: true, value: payload };
      } else {
        setLastLlmCallStatus({
          ok: false,
          lastProvider: activeProvider,
          lastErrorKind: out.error.kind,
          at: new Date().toISOString(),
        });
      }
      return out;
    } finally {
      setIsGenerating(false);
    }
  }, [
    activeProvider,
    paragraphId,
    providerKeys,
    setLastLlmCallStatus,
    settings.length,
    settings.persona,
    settings.theme,
  ]);

  return { generate, isGenerating };
}
