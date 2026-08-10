import { Button } from '@/components/ui/button';
import {
  recordingPrivacyFacts,
  type RecordingStorageLocation,
} from '@/features/voice-journal/recording-privacy-facts';
import type { RetentionPolicy } from '@/lib/schemas/settings.schema';
import { cn } from '@/lib/utils';

export type RecordingPrivacyNoticeProps = {
  location: RecordingStorageLocation;
  retention: RetentionPolicy;
  /** Omit to render as reference copy (Settings) instead of a dismissible disclosure. */
  onAcknowledge?: () => void;
  className?: string;
};

/** Story 16.2 — inline disclosure, never a modal, toast or alert (NFR31). */
export function RecordingPrivacyNotice({
  location,
  retention,
  onAcknowledge,
  className,
}: RecordingPrivacyNoticeProps) {
  const facts = recordingPrivacyFacts(location, retention);

  return (
    <section
      role="status"
      aria-label="What happens to your recordings"
      className={cn('rounded-lg border border-divider bg-surface-elevated px-4 py-3', className)}
    >
      <p className="text-caption font-semibold text-foreground">
        Before you record — what happens to your voice
      </p>
      <ul className="mt-2 space-y-1 text-caption text-secondary">
        <li>{facts.storage}</li>
        <li>{facts.retention}</li>
        <li>{facts.deletion}</li>
      </ul>
      {onAcknowledge ? (
        <Button type="button" variant="outline" className="mt-3" onClick={onAcknowledge}>
          Got it
        </Button>
      ) : null}
    </section>
  );
}
