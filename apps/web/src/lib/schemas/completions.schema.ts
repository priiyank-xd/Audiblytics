import { z } from 'zod';

import { utcDateSchema } from './days-of-use.schema';

export const dayCompletionSchema = z.object({
  hasReadIt: z.boolean().default(false),
  hasRecording: z.boolean().default(false),
  usedOfflinePack: z.boolean().default(false),
});
export type DayCompletion = z.infer<typeof dayCompletionSchema>;

export const completionsSchema = z.record(utcDateSchema, dayCompletionSchema);
export type Completions = z.infer<typeof completionsSchema>;
