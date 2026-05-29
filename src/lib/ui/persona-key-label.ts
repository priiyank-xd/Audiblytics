import type { Persona } from '@/lib/schemas/settings.schema';

const PERSONA_LABEL: Record<Persona, string> = {
  'gre-aspirant': 'GRE aspirant',
  'business-english': 'Business English',
  storyteller: 'Storyteller',
  'campfire-narrator': 'Campfire narrator',
  'news-reader': 'News reader',
  'debate-coach': 'Debate coach',
  'casual-conversationalist': 'Casual conversationalist',
};

/** Maps persisted paragraph `persona` keys to display labels; unknown keys pass through. */
export function personaKeyToLabel(persona: string): string {
  if (Object.prototype.hasOwnProperty.call(PERSONA_LABEL, persona)) {
    return PERSONA_LABEL[persona as Persona];
  }
  return persona;
}
