const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function formatShortLocalDate(isoUtc: string): string {
  const date = new Date(isoUtc);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

/** Relative label for collection list "Last practiced" column. */
export function formatLastPracticedLabel(
  lastReviewedAt: string | null,
  ref: Date = new Date(),
): string {
  if (!lastReviewedAt) return 'Not yet';

  const practicedMs = startOfLocalDay(new Date(lastReviewedAt));
  const refMs = startOfLocalDay(ref);
  const diffDays = Math.round((refMs - practicedMs) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays >= 2 && diffDays <= 7) return `${diffDays} days ago`;
  return formatShortLocalDate(lastReviewedAt);
}
