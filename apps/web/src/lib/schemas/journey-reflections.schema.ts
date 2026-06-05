import { z } from 'zod';

export const journeyReflectionsSchema = z.object({
  notesByUtcDate: z.record(z.string(), z.string()).default({}),
});

export type JourneyReflections = z.infer<typeof journeyReflectionsSchema>;
