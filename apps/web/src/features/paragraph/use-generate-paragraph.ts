'use client';

import { useCallback, useState } from 'react';

import { generateParagraphViaApi } from '@/lib/api/paragraphs';
import { fetchCollection } from '@/lib/api/collection';
import { isApiStorageBackend } from '@/lib/config/storage-backend';
import { generateParagraph } from '@/lib/llm/generate';
import {
  defaultLastLlmCallStatus,
  lastLlmCallStatusSchema,
} from '@/lib/schemas/last-llm-call-status.schema';
import type { ActiveProvider, ProviderKeys } from '@/lib/schemas/provider-keys.schema';
import type { Settings } from '@/lib/schemas/settings.schema';
import { db } from '@/lib/storage/db';
import { useLocalStorage } from '@/lib/storage/use-local-storage';

import { notifyParagraphDatesMutated } from '@/features/calendar/paragraph-dates-mutated';

import { persistParagraphToCache } from './persist-paragraph-cache';
import type { GenerateParagraphHookResult, ParagraphGeneratePayload } from './paragraph-generate-payload';
import { selectRecycleWords } from './select-recycle-words';

async function loadCollectionForRecycle(apiMode: boolean) {
  if (!apiMode) {
    return db.collection.toArray();
  }
  try {
    return await fetchCollection();
  } catch (e) {
    console.warn('[paragraph] collection load failed for recycle; cold-start', e);
    return [];
  }
}

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
  const apiMode = isApiStorageBackend();
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
      const collection = await loadCollectionForRecycle(apiMode);
      const recycle = selectRecycleWords(collection);
      const recycleWords = recycle.map((w) => w.word);

      if (apiMode) {
        const out = await generateParagraphViaApi({
          paragraphId: targetParagraphId,
          recycleWords,
        });
        if (out.ok) {
          notifyParagraphDatesMutated();
          setLastLlmCallStatus({
            ok: true,
            lastProvider: 'gemini',
            at: new Date().toISOString(),
          });
        } else {
          setLastLlmCallStatus({
            ok: false,
            lastProvider: 'gemini',
            lastErrorKind: out.error.kind,
            at: new Date().toISOString(),
          });
        }
        return out;
      }

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
      }
      setLastLlmCallStatus({
        ok: false,
        lastProvider: activeProvider,
        lastErrorKind: out.error.kind,
        at: new Date().toISOString(),
      });
      return out;
    } finally {
      setIsGenerating(false);
    }
  }, [
    activeProvider,
    apiMode,
    paragraphId,
    providerKeys,
    setLastLlmCallStatus,
    settings.length,
    settings.persona,
    settings.theme,
  ]);

  return { generate, isGenerating };
}
