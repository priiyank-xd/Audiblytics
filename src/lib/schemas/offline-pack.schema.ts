import { z } from 'zod';

import { hardWordSchema } from './paragraph-cache.schema';

export const offlinePackEntrySchema = z.object({
  id: z.string().uuid(),
  paragraph: z.string().min(1),
  hardWords: z.array(hardWordSchema).min(1).max(10),
  theme: z.string().min(1),
  persona: z.string().min(1),
  lastSurfacedAt: z.string().datetime().nullable().default(null),
});
export type OfflinePackEntry = z.infer<typeof offlinePackEntrySchema>;
