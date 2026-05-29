import { z } from 'zod';

import { activeProviderSchema } from '@/lib/schemas/provider-keys.schema';

export const llmErrorKindSchema = z.enum([
  'rate_limit',
  'quota_exceeded',
  'auth',
  'network',
  'malformed_response',
  'unknown',
]);

export const lastLlmCallStatusSchema = z.object({
  ok: z.boolean(),
  lastProvider: activeProviderSchema,
  lastErrorKind: llmErrorKindSchema.optional(),
  at: z.string().datetime({ offset: true }),
});

export type LastLlmCallStatus = z.infer<typeof lastLlmCallStatusSchema>;

export const defaultLastLlmCallStatus: LastLlmCallStatus = lastLlmCallStatusSchema.parse({
  ok: true,
  lastProvider: 'gemini',
  at: '1970-01-01T00:00:00.000Z',
});
