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

/** Voice journal row — local rows always have blob; API rows fetch playback URL on demand. */
export const recordingListItemSchema = recordingSchema
  .omit({ blob: true })
  .extend({ blob: z.instanceof(Blob).optional() });
export type RecordingListItem = z.infer<typeof recordingListItemSchema>;

/** Mirrors FastAPI `RecordingResponse` JSON (no blob). */
export const apiRecordingResponseSchema = recordingSchema.omit({ blob: true }).extend({
  storageKey: z.string().nullable().optional(),
});
export type ApiRecordingResponse = z.infer<typeof apiRecordingResponseSchema>;
