import { z } from 'zod';

import { personaSchema, themeSchema } from '@/lib/schemas/settings.schema';

export const lastUsedPracticeSchema = z.object({
  theme: themeSchema,
  persona: personaSchema,
  length: z.number().int().min(100).max(200),
});

export type LastUsedPractice = z.infer<typeof lastUsedPracticeSchema>;

export const practicePrefsSchema = z.object({
  rememberLastUsed: z.boolean().default(true),
  lastUsed: lastUsedPracticeSchema.nullable().default(null),
});

export type PracticePrefs = z.infer<typeof practicePrefsSchema>;
