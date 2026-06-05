import type { ActiveProvider } from '@/lib/schemas/provider-keys.schema';
import type { Persona, RetentionPolicy, Theme } from '@/lib/schemas/settings.schema';

export const PROVIDER_OPTIONS: { value: ActiveProvider; label: string }[] = [
  { value: 'gemini', label: 'Gemini' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'ollama', label: 'Ollama' },
];

export const LENGTH_OPTIONS = [100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200] as const;

export const THEME_LABEL: Record<Theme, string> = {
  horror: 'Horror',
  comedy: 'Comedy',
  adventure: 'Adventure',
  'mythic-quest': 'Mythic quest',
  survival: 'Survival',
  travelogue: 'Travelogue',
  mystery: 'Mystery',
  'sci-fi': 'Sci-Fi',
  'slice-of-life': 'Slice of life',
};

export const PERSONA_LABEL: Record<Persona, string> = {
  'gre-aspirant': 'GRE aspirant',
  'business-english': 'Business English',
  storyteller: 'Storyteller',
  'campfire-narrator': 'Campfire narrator',
  'news-reader': 'News reader',
  'debate-coach': 'Debate coach',
  'casual-conversationalist': 'Casual conversationalist',
};

export const RETENTION_LABEL: Record<RetentionPolicy, string> = {
  '90-day-rolling': '90-day rolling (default)',
  indefinite: 'Indefinite',
};
