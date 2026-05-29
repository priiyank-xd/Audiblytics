import { z } from 'zod';

export const day14StateSchema = z.object({
  fired: z.boolean().default(false),
  result: z.enum(['yes', 'no']).nullable().default(null),
});
export type Day14State = z.infer<typeof day14StateSchema>;
