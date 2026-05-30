/**
 * FR44: bundled tongue-twister phrases (classic playful style, not clinical copy).
 * Uniform pick via {@link pickRandomPhrase} — invoke once per warm-up mount/session.
 */
export const TONGUE_TWISTERS: readonly string[] = [
  'Red lorry, yellow lorry.',
  'Peter Piper picked a peck of pickled peppers.',
  'She sells seashells by the seashore.',
  'How much wood would a woodchuck chuck if a woodchuck could chuck wood?',
  'Six slippery snails slid slowly seaward.',
  'Fuzzy Wuzzy was a bear; Fuzzy Wuzzy had no hair.',
  'I scream, you scream, we all scream for ice cream.',
  'Betty Botter bought some butter, but the butter was bitter.',
  'Unique New York, unique New York, unique New York.',
  'Round the rugged rocks the ragged rascal ran.',
  'A proper copper coffee pot.',
] as const;

export function pickRandomPhrase(): string {
  const n = TONGUE_TWISTERS.length;
  if (n === 0) return '';
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const i = buf[0]! % n;
  return TONGUE_TWISTERS[i]!;
}
