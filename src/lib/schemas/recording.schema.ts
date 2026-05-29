import { z } from 'zod';

import { WARMUP_RECORDING_ID_RE } from '@/lib/warmup-recording-id';

export const recordingSchema = z.object({
  id: z.string().uuid(),
  recordingDate: z.string().datetime(),
  paragraphId: z.union([z.string().uuid(), z.string().regex(WARMUP_RECORDING_ID_RE)]),
  durationMs: z.number().int().min(0).max(60_000),
  mimeType: z.string().min(1),
  blob: z.instanceof(Blob),
  dayOfUse: z.number().int().positive(),
});
export type VoiceRecording = z.infer<typeof recordingSchema>;
