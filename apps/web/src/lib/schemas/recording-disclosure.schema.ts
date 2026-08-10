import { z } from 'zod';

/** Story 16.2 — whether the voice-data disclosure has been shown and acknowledged (NFR31). */
export const recordingDisclosureSchema = z.object({
  acknowledged: z.boolean().default(false),
});

export type RecordingDisclosure = z.infer<typeof recordingDisclosureSchema>;

export const RECORDING_DISCLOSURE_STORAGE_KEY = 'audiblytics.recordingDisclosure' as const;
