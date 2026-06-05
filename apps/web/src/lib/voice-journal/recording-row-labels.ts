/**
 * Heuristic row labels from duration only — placeholders until real analytics exist.
 * Do not imply ML scoring or transcript analysis.
 */
export type RecordingRowLabels = {
  clarity: string;
  pace: string;
  pauses: string;
};

export function deriveRecordingRowLabels(durationMs: number): RecordingRowLabels {
  const clarity =
    durationMs >= 45_000 ? 'Steady' : durationMs >= 20_000 ? 'Good' : 'Brief';

  const pace =
    durationMs >= 50_000 ? 'Slow' : durationMs <= 25_000 ? 'Quick' : 'Balanced';

  const pauseCount = Math.round(durationMs / 15_000);
  const pauses = durationMs < 15_000 ? '—' : `${pauseCount} ${pauseCount === 1 ? 'pause' : 'pauses'}`;

  return { clarity, pace, pauses };
}
