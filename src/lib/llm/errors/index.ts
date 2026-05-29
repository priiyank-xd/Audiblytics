import type { ActiveProvider } from '@/lib/schemas/provider-keys.schema';
import type { LlmError } from '../types';
import { parseAnthropicError } from './anthropic';
import { parseGeminiError } from './gemini';
import { parseOllamaError } from './ollama';
import { parseOpenAiError } from './openai';
import { parseOpenRouterError } from './openrouter';

export type { LlmError } from '../types';

/**
 * Single-entry-point error normalizer. Dispatches on the active
 * provider to its native-vocabulary parser. Caller (`generate.ts`)
 * receives a uniform `LlmError` regardless of provider.
 *
 * Sources: architecture.md lines 376–385, 397–409; AR7 (epics line 168);
 * FR11 (prd line 725).
 */
export function parseLlmError(provider: ActiveProvider, raw: unknown): LlmError {
  switch (provider) {
    case 'gemini':
      return parseGeminiError(raw);
    case 'openai':
      return parseOpenAiError(raw);
    case 'anthropic':
      return parseAnthropicError(raw);
    case 'openrouter':
      return parseOpenRouterError(raw);
    case 'ollama':
      return parseOllamaError(raw);
    default: {
      const exhaustive: never = provider;
      return {
        kind: 'unknown',
        providerCode: 'unknown_provider',
        message: `Unknown provider '${exhaustive as string}'`,
        retryable: false,
      };
    }
  }
}
