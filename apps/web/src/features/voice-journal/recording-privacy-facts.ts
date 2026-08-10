import type { RetentionPolicy } from '@/lib/schemas/settings.schema';

/** Where audio actually lands, which differs by storage backend (ADR 0003). */
export type RecordingStorageLocation = 'browser' | 'account';

export type RecordingPrivacyFacts = {
  storage: string;
  retention: string;
  deletion: string;
};

/**
 * Story 16.2 — the three things a user is owed before they press record:
 * where the audio goes, how long it is kept, and that they can delete it.
 * Shared by the pre-record disclosure and the Settings copy so the two cannot drift.
 */
export function recordingPrivacyFacts(
  location: RecordingStorageLocation,
  retention: RetentionPolicy,
): RecordingPrivacyFacts {
  return {
    storage:
      location === 'account'
        ? 'Audio is uploaded to private storage under your account. No other account can reach it.'
        : 'Audio stays in this browser (IndexedDB). It is never uploaded anywhere.',
    retention:
      retention === '90-day-rolling'
        ? 'Recordings older than 90 days are deleted automatically.'
        : 'Recordings are kept until you delete them — nothing expires on its own.',
    deletion: 'You can delete a recording, or everything at once, from Settings → Data & Storage.',
  };
}
