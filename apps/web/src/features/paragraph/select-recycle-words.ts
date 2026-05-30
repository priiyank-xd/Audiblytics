import type { CollectionWord } from '@/lib/schemas/collection.schema';

/**
 * Returns 0, 2, or 3 distinct saved words to weave into the next paragraph (FR15).
 * Cold-start: fewer than 2 saved words → empty array (FR16).
 */
export function selectRecycleWords(words: CollectionWord[]): CollectionWord[] {
  if (words.length < 2) {
    return [];
  }

  const pool = shuffleWords(words);

  if (words.length === 2) {
    return pool.slice(0, 2);
  }

  const wantThree = Math.random() < 0.5;
  const take = wantThree ? 3 : 2;
  return pool.slice(0, take);
}

function shuffleWords(words: CollectionWord[]): CollectionWord[] {
  const out = [...words];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
