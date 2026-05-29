import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import type { LanguageModel } from 'ai';
import { createOllama } from 'ollama-ai-provider-v2';

import type { ActiveProvider, ProviderKeys } from '@/lib/schemas/provider-keys.schema';
import { MODEL_BY_PROVIDER } from './models';

/**
 * Asserts that the LLM client module is being executed in a browser-only
 * context (n=1 personal-use scope per NFR14, AR15). Throws if
 * `typeof window === 'undefined'` — i.e. if the module is accidentally
 * imported by a server component, API route, middleware, or any other
 * Next.js path that runs in the Node.js runtime.
 *
 * The guard exists because:
 *  - API keys live in browser `localStorage` (NFR14 — n=1 acceptable boundary).
 *  - Server-side LLM calls would expose key contents in server logs.
 *  - Vercel server logs are persistent and indexed — leaking once is leaking forever.
 *
 * The runtime guard is one of three structural enforcement points; the
 * build-time guard lives in `next.config.ts` and the documentation guards
 * live in `README.md` + `app/layout.tsx`. Removing the boundary requires
 * editing all three files (architecture.md § Authentication & Security).
 *
 * Sources: architecture.md lines 324–330, 327; epics.md AR15 (line 176);
 * Story 1.6 AC5–AC8 + AC11.
 */
export function assertClientOnlySafeContext(): void {
  if (typeof window === 'undefined') {
    throw new Error(
      'Audiblytics LLM client cannot run server-side — see architecture.md NFR14',
    );
  }
}

// Run at module load — any accidental server-side import fails immediately
// with the clear error above rather than constructing a provider client in
// a context where localStorage is unavailable and key contents could end up
// in server logs (AR15 part 2).
assertClientOnlySafeContext();

/** Settings projection sufficient for client construction. */
export type ClientSettings = {
  activeProvider: ActiveProvider;
  providerKeys: ProviderKeys;
};

/**
 * Construct a Vercel AI SDK `LanguageModel` for the active provider.
 * Branches on `settings.activeProvider`; reads the corresponding API
 * key (or uses none for `ollama`) and the default model id from
 * `MODEL_BY_PROVIDER`.
 *
 * Throws synchronously if the required key is missing — programmer
 * error per architecture line 737 (caller must validate keys via the
 * onboarding/settings UI before invoking).
 */
export function getProvider(settings: ClientSettings): LanguageModel {
  const { activeProvider, providerKeys } = settings;
  const modelId = MODEL_BY_PROVIDER[activeProvider];

  switch (activeProvider) {
    case 'gemini': {
      const key = requireKey(providerKeys.gemini, 'gemini');
      return createGoogleGenerativeAI({ apiKey: key }).chat(modelId);
    }
    case 'openai': {
      const key = requireKey(providerKeys.openai, 'openai');
      return createOpenAI({ apiKey: key }).chat(modelId);
    }
    case 'anthropic': {
      const key = requireKey(providerKeys.anthropic, 'anthropic');
      return createAnthropic({ apiKey: key }).chat(modelId);
    }
    case 'openrouter': {
      const key = requireKey(providerKeys.openrouter, 'openrouter');
      return createOpenRouter({ apiKey: key }).chat(modelId);
    }
    case 'ollama': {
      return createOllama()(modelId);
    }
    default: {
      const exhaustive: never = activeProvider;
      throw new Error(`getProvider: unknown provider '${exhaustive as string}'`);
    }
  }
}

function requireKey(key: string | undefined, providerName: string): string {
  if (!key) {
    throw new Error(
      `getProvider: '${providerName}' API key not configured. ` +
        `Open Settings and paste the key, then retry. ` +
        `(programmer-error path — UI must gate Generate on key presence.)`,
    );
  }
  return key;
}
