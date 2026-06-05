import type { HardWord } from '@/lib/schemas/paragraph-cache.schema';

export function normalizeWordKey(word: string): string {
  return word.trim().toLowerCase();
}

export function findHardWordForToken(
  token: string,
  hardWords: HardWord[],
): HardWord | undefined {
  const key = normalizeWordKey(token);
  return hardWords.find((hw) => normalizeWordKey(hw.word) === key);
}

export function splitParagraphTokens(paragraph: string): string[] {
  return paragraph.split(/(\b[\w'-]+\b)/g);
}

export function isWordToken(part: string): boolean {
  return /\b[\w'-]+\b/.test(part);
}

export function hardWordRowId(hw: HardWord): string {
  return `${hw.word}-${hw.ipa}`;
}
