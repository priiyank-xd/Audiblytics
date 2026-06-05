import { formatUtcDate } from '@/lib/day-counter/format-utc-date';
import type { RecordingListItem } from '@/lib/schemas/recording.schema';

/** Recordings whose `recordingDate` falls on the given UTC calendar day. */
export function filterRecordingsForUtcDate(
  rows: RecordingListItem[],
  utcDate: string,
): RecordingListItem[] {
  return rows
    .filter((row) => formatUtcDate(new Date(row.recordingDate)) === utcDate)
    .sort(
      (a, b) => new Date(b.recordingDate).getTime() - new Date(a.recordingDate).getTime(),
    );
}
