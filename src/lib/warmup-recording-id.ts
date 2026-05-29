/** Matches `recording.schema` warm-up `paragraphId` branch (djb2 32-bit hex). */
export const WARMUP_RECORDING_ID_RE = /^warmup-[0-9a-f]{8}-(pen|nop)$/;

export function isWarmupRecordingParagraphId(id: string): boolean {
  return WARMUP_RECORDING_ID_RE.test(id);
}

function djb2Hash32(normalizedPhrase: string): string {
  let h = 5381;
  for (let i = 0; i < normalizedPhrase.length; i++) {
    h = Math.imul(h, 33) ^ normalizedPhrase.charCodeAt(i);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function buildWarmupRecordingParagraphId(phrase: string, pass: 'pen' | 'nop'): string {
  const hex = djb2Hash32(phrase.trim().toLowerCase());
  return `warmup-${hex}-${pass}`;
}
