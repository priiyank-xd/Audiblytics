/** First `maxWords` words; adds ellipsis when truncated on a word boundary. */
export function excerptParagraphWords(paragraph: string, maxWords: number): string {
  const words = paragraph.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length <= maxWords) {
    return words.join(' ');
  }
  return `${words.slice(0, maxWords).join(' ')}…`;
}
