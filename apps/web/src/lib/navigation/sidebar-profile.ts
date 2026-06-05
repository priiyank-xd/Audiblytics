export type SidebarProfileInput = {
  apiMode: boolean;
  userEmail: string | null | undefined;
  loading: boolean;
};

const MAX_LABEL_LENGTH = 24;
const MAX_FRIENDLY_NAME_LENGTH = 16;

/** Common concatenated surnames in email local-parts (e.g. priyankpatel → priyank). */
const COMMON_NAME_SUFFIXES = [
  'patel',
  'kumar',
  'shah',
  'singh',
  'gupta',
  'sharma',
  'verma',
  'khan',
  'reddy',
  'naidu',
  'joshi',
  'mehta',
  'agarwal',
  'iyer',
  'nair',
] as const;

function stripCommonConcatenatedSurname(lower: string): string {
  for (const suffix of COMMON_NAME_SUFFIXES) {
    if (lower.length > suffix.length + 2 && lower.endsWith(suffix)) {
      return lower.slice(0, -suffix.length);
    }
  }
  return lower;
}

/** Turn an email local-part into a short display name (mockup-style, not raw login). */
export function formatEmailLocalAsDisplayName(localPart: string): string {
  const withoutTrailingDigits = localPart.replace(/\d+$/u, '');
  const segment = (withoutTrailingDigits.split(/[._-]/u)[0] ?? withoutTrailingDigits).trim();
  const lower = (segment.length > 0 ? segment : localPart).toLowerCase();
  const withoutSurname = stripCommonConcatenatedSurname(lower);
  const capped =
    withoutSurname.length <= MAX_FRIENDLY_NAME_LENGTH
      ? withoutSurname
      : `${withoutSurname.slice(0, MAX_FRIENDLY_NAME_LENGTH)}…`;
  const display =
    capped.length <= MAX_LABEL_LENGTH ? capped : `${capped.slice(0, MAX_LABEL_LENGTH)}…`;
  return display.charAt(0).toUpperCase() + display.slice(1);
}

export function resolveSidebarProfileLabel(input: SidebarProfileInput): string {
  if (!input.apiMode) {
    return 'Personal use';
  }

  if (input.loading) {
    return '…';
  }

  if (!input.userEmail) {
    return 'Account';
  }

  const localPart = input.userEmail.split('@')[0] ?? input.userEmail;
  return formatEmailLocalAsDisplayName(localPart);
}

export function resolveSidebarProfileInitial(label: string): string {
  const trimmed = label.trim();
  if (!trimmed || trimmed === '…') {
    return '?';
  }

  return trimmed.charAt(0).toUpperCase();
}
