import { hardWordSchema, type HardWord } from '@/lib/schemas/paragraph-cache.schema';

import { normalizeWordKey } from '@/lib/today/hard-word-match';

export function plainWordRowId(token: string): string {
  return `plain:${normalizeWordKey(token)}`;
}

export function resolveWordRowId(token: string, hardWords: HardWord[]): string {
  const hardWord = hardWords.find((hw) => normalizeWordKey(hw.word) === normalizeWordKey(token));
  return hardWord ? `${hardWord.word}-${hardWord.ipa}` : plainWordRowId(token);
}

export function exampleSentenceForToken(token: string, paragraph: string): string {
  const trimmed = paragraph.trim();
  if (!trimmed) return token;
  const sentences = trimmed.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [trimmed];
  const key = normalizeWordKey(token);
  const match = sentences.find((sentence) => normalizeWordKey(sentence).includes(key));
  const sentence = (match ?? sentences[0] ?? trimmed).trim();
  return sentence.length > 240 ? `${sentence.slice(0, 237)}…` : sentence;
}

export function buildPlainWordEntry(token: string, paragraph: string): HardWord {
  const word = token.trim();
  return hardWordSchema.parse({
    word,
    ipa: '—',
    pronunciationGuide: word,
    meaning: 'Saved from today\'s paragraph',
    exampleSentence: exampleSentenceForToken(word, paragraph),
  });
}

export function resolveWordEntry(
  token: string,
  hardWords: HardWord[],
  paragraph: string,
): HardWord {
  return (
    hardWords.find((hw) => normalizeWordKey(hw.word) === normalizeWordKey(token)) ??
    buildPlainWordEntry(token, paragraph)
  );
}

export function isPlainWordEntry(entry: HardWord): boolean {
  return entry.ipa === '—';
}
