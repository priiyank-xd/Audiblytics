import type { Theme } from '@/lib/schemas/settings.schema';

const THEME_LABEL: Record<Theme, string> = {
  horror: 'Horror',
  comedy: 'Comedy',
  adventure: 'Adventure',
  'mythic-quest': 'Mythic quest',
  survival: 'Survival',
  travelogue: 'Travelogue',
  mystery: 'Mystery',
  'sci-fi': 'Sci-Fi',
  'slice-of-life': 'Slice of life',
};

/** Maps persisted paragraph `theme` keys to display labels; unknown keys pass through. */
export function themeKeyToLabel(theme: string): string {
  if (Object.prototype.hasOwnProperty.call(THEME_LABEL, theme)) {
    return THEME_LABEL[theme as Theme];
  }
  return theme;
}
