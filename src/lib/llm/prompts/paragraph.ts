/**
 * Build the LLM prompt for daily paragraph generation. Produces a
 * deterministic English-language prompt that:
 *   - Names the chosen theme + persona descriptively (not enum literals)
 *   - Targets the requested approximate word length (100–200 per FR5)
 *   - Seeds the paragraph with `recycleWords` only when at least two are
 *     supplied; otherwise uses the cold-start clause (FR16)
 *   - Instructs 2–3 NEW advanced words appropriate to the persona band (FR15)
 *   - Requests `camelCase` JSON field names (matches Zod schema; AR16)
 *
 * Note: `Output.object({ schema })` already constrains structure; this
 * prompt's role is to nudge the LLM toward content quality (theme fit,
 * persona band, recycle integration) — not to enforce shape.
 *
 * Sources: architecture.md lines 376, 1085; FR15 (prd line 732);
 * FR16 (prd line 733).
 */
export type BuildPromptArgs = {
  theme: string;
  persona: string;
  length: number;
  recycleWords: string[];
};

export function buildPrompt(args: BuildPromptArgs): string {
  const { theme, persona, length, recycleWords } = args;

  const themeDesc = describeTheme(theme);
  const personaDesc = describePersona(persona);
  const recycleClause =
    recycleWords.length >= 2
      ? `Work these previously saved vocabulary items into the prose naturally (not as a glossary or numbered list): ${recycleWords.join(', ')}. ` +
        `Each must appear at least once in the paragraph body; prefer the exact spellings given, but close morphological variants are acceptable if grammar demands it.`
      : `This is a cold-start paragraph — do not reference any prior vocabulary list or pretend the reader saved words earlier.`;

  return [
    `Write ${themeDesc}, approximately ${length} words long, with ${personaDesc}.`,
    recycleClause,
    `In addition, introduce 2 to 3 NEW advanced words appropriate to the persona's vocabulary band.`,
    `Return JSON with camelCase field names matching this shape:`,
    `{ "paragraph": string, "hardWords": [{ "word": string, "ipa": string, "pronunciationGuide": string, "meaning": string, "exampleSentence": string }] }`,
    `For each entry in hardWords, include the word's IPA phonetic transcription and a plain-English pronunciationGuide such as "SKWIR-uhl" or "es-CHOO". For meaning, use a short part-of-speech label, an interpunct (·), then the gloss (e.g. "noun · a whispering or rustling sound"); and a one-sentence example using the word in context.`,
    `Drop any hardWords entry you cannot fully fill — never emit partial rows.`,
  ].join(' ');
}

function describeTheme(theme: string): string {
  switch (theme) {
    case 'horror':
      return 'a horror-themed paragraph';
    case 'comedy':
      return 'a comedic paragraph';
    case 'adventure':
      return 'an adventure-themed paragraph';
    case 'mythic-quest':
      return 'a mythic quest paragraph with legendary stakes';
    case 'survival':
      return 'a wilderness survival paragraph';
    case 'travelogue':
      return 'a travelogue-style paragraph with vivid place details';
    case 'mystery':
      return 'a mystery-themed paragraph';
    case 'sci-fi':
      return 'a science-fiction paragraph';
    case 'slice-of-life':
      return 'a slice-of-life paragraph';
    default:
      return `a paragraph in the '${theme}' style`;
  }
}

function describePersona(persona: string): string {
  switch (persona) {
    case 'gre-aspirant':
      return 'vocabulary appropriate for a GRE aspirant';
    case 'business-english':
      return 'business-English diction';
    case 'storyteller':
      return 'a storyteller voice';
    case 'campfire-narrator':
      return 'a warm campfire narrator voice';
    case 'news-reader':
      return 'clear broadcast-news diction';
    case 'debate-coach':
      return 'precise debate-coach diction';
    case 'casual-conversationalist':
      return 'casual conversational diction';
    default:
      return `vocabulary appropriate to a '${persona}' speaker`;
  }
}
