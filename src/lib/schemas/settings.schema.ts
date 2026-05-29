import { z } from 'zod';

export const themeSchema = z.enum([
  'horror',
  'comedy',
  'adventure',
  'mythic-quest',
  'survival',
  'travelogue',
  'mystery',
  'sci-fi',
  'slice-of-life',
]);
export type Theme = z.infer<typeof themeSchema>;

export const personaSchema = z.enum([
  'gre-aspirant',
  'business-english',
  'storyteller',
  'campfire-narrator',
  'news-reader',
  'debate-coach',
  'casual-conversationalist',
]);
export type Persona = z.infer<typeof personaSchema>;

export const retentionPolicySchema = z.enum(['90-day-rolling', 'indefinite']);
export type RetentionPolicy = z.infer<typeof retentionPolicySchema>;

export const settingsSchema = z.object({
  theme: themeSchema.default('adventure'),
  persona: personaSchema.default('storyteller'),
  length: z.number().int().min(100).max(200).default(150),
  retention: retentionPolicySchema.default('90-day-rolling'),
  voiceURI: z.string().nullable().default(null),
});
export type Settings = z.infer<typeof settingsSchema>;
