import { z } from 'zod';

export const collectionWordSchema = z.object({
  id: z.string().uuid(),
  word: z.string().min(1),
  ipa: z.string().min(1),
  pronunciationGuide: z.string().min(1).default('Pronunciation unavailable'),
  meaning: z.string().min(1),
  exampleSentence: z.string().min(1),
  savedAt: z.string().datetime(),
  sourceParagraphId: z.string().uuid().nullable(),
  reviewCount: z.number().int().nonnegative().default(0),
  lastReviewedAt: z.string().datetime().nullable().default(null),
  difficultyRating: z.number().int().min(0).max(2).default(1),
});
export type CollectionWord = z.infer<typeof collectionWordSchema>;
