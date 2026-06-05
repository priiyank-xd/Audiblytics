import { z } from 'zod';

export const voiceJournalNotesSchema = z.object({
  notes: z.string().max(10_000),
});
export type VoiceJournalNotes = z.infer<typeof voiceJournalNotesSchema>;
