import { z } from 'zod';

export const hardWordSchema = z.object({
  word: z.string().min(1),
  ipa: z.string().min(1),
  pronunciationGuide: z.string().min(1).default('Pronunciation unavailable'),
  meaning: z.string().min(1),
  exampleSentence: z.string().min(1),
});
export type HardWord = z.infer<typeof hardWordSchema>;

export const cachedParagraphSchema = z.object({
  id: z.string().uuid(),
  paragraph: z.string().min(1),
  hardWords: z.array(hardWordSchema).min(1).max(10),
  theme: z.string().min(1),
  persona: z.string().min(1),
  generatedAt: z.string().datetime(),
});
export type CachedParagraph = z.infer<typeof cachedParagraphSchema>;

/** UTC `YYYY-MM-DD` keys from `GET /paragraphs/dates` (BVR16). */
export const paragraphUtcDatesSchema = z.array(
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected UTC date YYYY-MM-DD'),
);
export type ParagraphUtcDates = z.infer<typeof paragraphUtcDatesSchema>;
