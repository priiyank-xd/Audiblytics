import {
  type ActiveProvider,
  type ProviderKeys,
  providerKeysSchema,
} from '@/lib/schemas/provider-keys.schema';

export function readProviderKey(keys: ProviderKeys, p: ActiveProvider): string {
  if (p === 'ollama') return '';
  const v = keys[p];
  return typeof v === 'string' ? v : '';
}

export function patchProviderKey(
  keys: ProviderKeys,
  p: ActiveProvider,
  raw: string,
): ProviderKeys {
  if (p === 'ollama') {
    return providerKeysSchema.parse({ ...keys, ollama: null });
  }
  const trimmed = raw.trim();
  const next: ProviderKeys = { ...keys, ollama: null };
  switch (p) {
    case 'gemini':
      next.gemini = trimmed ? trimmed : undefined;
      break;
    case 'openai':
      next.openai = trimmed ? trimmed : undefined;
      break;
    case 'anthropic':
      next.anthropic = trimmed ? trimmed : undefined;
      break;
    case 'openrouter':
      next.openrouter = trimmed ? trimmed : undefined;
      break;
    default:
      break;
  }
  return next;
}

export function normalizeProviderKeys(keys: ProviderKeys): ProviderKeys {
  return providerKeysSchema.parse({
    gemini: keys.gemini?.trim() || undefined,
    openai: keys.openai?.trim() || undefined,
    anthropic: keys.anthropic?.trim() || undefined,
    openrouter: keys.openrouter?.trim() || undefined,
    ollama: null,
  });
}
