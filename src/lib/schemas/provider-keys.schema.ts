import { z } from 'zod';

export const providerKeysSchema = z.object({
  gemini: z.string().min(1).optional(),
  openai: z.string().min(1).optional(),
  anthropic: z.string().min(1).optional(),
  openrouter: z.string().min(1).optional(),
  ollama: z.null().default(null),
});
export type ProviderKeys = z.infer<typeof providerKeysSchema>;

export const activeProviderSchema = z.enum([
  'gemini',
  'openai',
  'anthropic',
  'openrouter',
  'ollama',
]);
export type ActiveProvider = z.infer<typeof activeProviderSchema>;
