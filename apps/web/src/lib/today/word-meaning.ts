export function parseWordMeaning(meaning: string): {
  partOfSpeech: string | null;
  gloss: string;
} {
  const [maybePartOfSpeech, ...rest] = meaning.split('·').map((part) => part.trim());
  if (rest.length === 0) {
    return { partOfSpeech: null, gloss: meaning };
  }
  return { partOfSpeech: maybePartOfSpeech, gloss: rest.join(' · ') };
}
