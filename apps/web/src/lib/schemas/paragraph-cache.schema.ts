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
