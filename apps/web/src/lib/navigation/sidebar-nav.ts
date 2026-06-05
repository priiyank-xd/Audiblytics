import {
  BarChart3,
  Bookmark,
  FileText,
  Home,
  Map,
  Mic,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type SidebarNavLabel =
  | 'Home'
  | 'Review'
  | 'Collection'
  | 'Voice Journal'
  | 'Journey'
  | 'Stats';

export type SidebarNavItem = {
  href: string;
  label: SidebarNavLabel;
  icon: LucideIcon;
};

export const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/review', label: 'Review', icon: FileText },
  { href: '/collection', label: 'Collection', icon: Bookmark },
  { href: '/voice-journal', label: 'Voice Journal', icon: Mic },
  { href: '/journey', label: 'Journey', icon: Map },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
];

/** True when `href` is the active primary nav target for `pathname`. */
export function isSidebarNavActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Whether any primary sidebar nav item is active (excludes Settings footer link). */
export function isAnySidebarNavActive(pathname: string): boolean {
  return resolveSidebarNavItems(pathname).some((item) =>
    isSidebarNavActive(pathname, item.href),
  );
}

/** Primary nav for current route (home omits Journey to match UX-V2 mockup). */
export function resolveSidebarNavItems(pathname: string): SidebarNavItem[] {
  if (pathname === '/') {
    return SIDEBAR_NAV_ITEMS.filter((item) => item.href !== '/journey');
  }
  return SIDEBAR_NAV_ITEMS;
}
