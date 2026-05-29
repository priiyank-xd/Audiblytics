import { z } from 'zod';

/** UTC ISO date string in 'YYYY-MM-DD' form. */
export const utcDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be UTC ISO date YYYY-MM-DD');
export type UtcDate = z.infer<typeof utcDateSchema>;

export const daysOfUseSchema = z.array(utcDateSchema);
export type DaysOfUse = z.infer<typeof daysOfUseSchema>;
