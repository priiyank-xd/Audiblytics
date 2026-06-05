/** Local-hour bucket for home dashboard greeting (UX-V2-UI2). */
export function resolveTimeOfDayGreeting(hour: number): string {
  if (hour >= 5 && hour <= 11) {
    return 'Good morning';
  }

  if (hour >= 12 && hour <= 16) {
    return 'Good afternoon';
  }

  return 'Good evening';
}

export function formatHomeGreeting(
  timePhrase: string,
  displayName: string,
  loading: boolean,
): string {
  if (loading || displayName === '…') {
    return `${timePhrase}…`;
  }

  if (displayName === 'Personal use' || displayName === 'Account') {
    return `${timePhrase}.`;
  }

  return `${timePhrase}, ${displayName}`;
}
