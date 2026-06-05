const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

function formatTime12h(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  hours %= 12;
  if (hours === 0) hours = 12;
  return `${hours}:${String(minutes).padStart(2, '0')} ${period}`;
}

/** Local calendar date + time for voice journal rows (e.g. "May 27, 2026 · 2:14 PM"). */
export function formatRecordingDateTime(isoUtc: string, ref: Date = new Date()): string {
  const date = new Date(isoUtc);
  const month = MONTHS[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  void ref;
  return `${month} ${day}, ${year} · ${formatTime12h(date)}`;
}

export function formatDurationLabel(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
