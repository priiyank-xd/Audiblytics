import {
  Database,
  Info,
  KeyRound,
  Palette,
  SlidersHorizontal,
  Volume2,
  type LucideIcon,
} from 'lucide-react';

export type SettingsNavId =
  | 'practice'
  | 'audio'
  | 'data'
  | 'advanced'
  | 'appearance'
  | 'about';

export type SettingsNavItem = {
  id: SettingsNavId;
  href: `/settings/${SettingsNavId}`;
  label: string;
  icon: LucideIcon;
};

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  { id: 'practice', href: '/settings/practice', label: 'Practice', icon: SlidersHorizontal },
  { id: 'audio', href: '/settings/audio', label: 'Audio', icon: Volume2 },
  { id: 'data', href: '/settings/data', label: 'Data & Storage', icon: Database },
  { id: 'advanced', href: '/settings/advanced', label: 'Advanced', icon: KeyRound },
  { id: 'appearance', href: '/settings/appearance', label: 'Appearance', icon: Palette },
  { id: 'about', href: '/settings/about', label: 'About', icon: Info },
];

export function isSettingsNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
