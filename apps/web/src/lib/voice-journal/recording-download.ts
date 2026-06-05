import type { RecordingWithTheme } from '@/features/voice-journal/use-recordings';

function downloadExtension(mimeType: string): 'webm' | 'mp4' {
  const m = mimeType.toLowerCase();
  if (m.includes('mp4')) return 'mp4';
  return 'webm';
}

function localHhmm(isoUtc: string): string {
  const d = new Date(isoUtc);
  const h = d.getHours();
  const min = d.getMinutes();
  return `${String(h).padStart(2, '0')}${String(min).padStart(2, '0')}`;
}

export function triggerRecordingDownload(row: RecordingWithTheme): void {
  if (!row.blob) return;
  const ext = downloadExtension(row.mimeType);
  const hhmm = localHhmm(row.recordingDate);
  const filename = `audiblytics-day-${row.dayOfUse}-${hhmm}.${ext}`;
  const url = URL.createObjectURL(new Blob([row.blob], { type: row.mimeType }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
