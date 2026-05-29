import type { ActiveProvider } from '@/lib/schemas/provider-keys.schema';

/**
 * Default model id per provider. Architecture-mandated for `gemini`
 * (`gemini-2.5-flash` per AR5 epics line 166 / architecture line 393).
 * Other providers ship sensible Settings-overridable defaults — Story 1.9
 * adds a per-provider model field to the Settings UI; until then these
 * values are the source of truth.
 *
 * Sources: architecture.md lines 389–395 (defaults table);
 * AR5 (epics line 166).
 */
export const MODEL_BY_PROVIDER = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-latest',
  openrouter: 'openrouter/auto',
  ollama: 'llama3.1',
} as const satisfies Record<ActiveProvider, string>;
