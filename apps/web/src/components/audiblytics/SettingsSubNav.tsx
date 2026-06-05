'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  isSettingsNavActive,
  SETTINGS_NAV_ITEMS,
} from '@/lib/navigation/settings-nav';
import { cn } from '@/lib/utils';

export type SettingsSubNavProps = {
  /** When true, show labels (sidebar / expanded). When false, icons only with sr-only labels. */
  showLabels?: boolean;
  className?: string;
  onNavigate?: () => void;
};

export function SettingsSubNav({
  showLabels = true,
  className,
  onNavigate,
}: SettingsSubNavProps) {
  const pathname = usePathname() ?? '';

  return (
    <nav aria-label="Settings sections" className={cn('flex flex-col gap-1', className)}>
      {SETTINGS_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = isSettingsNavActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            onClick={onNavigate}
            className={cn(
              'flex min-h-10 items-center gap-3 rounded-lg text-ui-sm text-foreground transition-colors',
              'hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
              showLabels ? 'px-3 py-2' : 'justify-center px-2 py-2',
              isActive && 'bg-primary-soft text-primary',
            )}
          >
            <Icon className="size-4 shrink-0" strokeWidth={1.7} />
            <span className={cn(showLabels ? 'inline' : 'sr-only')}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
