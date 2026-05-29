'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Bookmark,
  FileText,
  Home,
  Mic,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type SidebarNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/review', label: 'Review', icon: FileText },
  { href: '/collection', label: 'Collection', icon: Bookmark },
  { href: '/voice-journal', label: 'Voice Journal', icon: Mic },
  { href: '/calendar', label: 'Stats', icon: BarChart3 },
];

export function AppSidebar() {
  const pathname = usePathname() ?? '';
  const isHome = pathname === '/';
  const [isPinnedOpen, setIsPinnedOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const isExpanded = isHome || isPinnedOpen || isHovering;

  return (
    <aside
      className={cn(
        'hidden min-h-screen shrink-0 flex-col border-r border-divider bg-surface py-10 transition-all duration-200 lg:flex',
        isExpanded ? 'w-56 px-7' : 'w-20 px-4',
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          aria-label="Audiblytics home"
          className={cn(
            'inline-flex min-w-0 items-center gap-3 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
            !isExpanded && 'mx-auto',
          )}
        >
          <BookOpen className="size-7 shrink-0" strokeWidth={1.7} />
          <span
            className={cn(
              'truncate text-headline-3 text-foreground transition-opacity',
              isExpanded ? 'opacity-100' : 'sr-only opacity-0',
            )}
          >
            Audiblytics
          </span>
        </Link>
        {!isHome ? (
          <button
            type="button"
            aria-label={isPinnedOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-pressed={isPinnedOpen}
            className={cn(
              'hidden shrink-0 rounded-sm text-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
              isExpanded && 'inline-flex',
            )}
            onClick={() => setIsPinnedOpen((current) => !current)}
          >
            {isPinnedOpen ? (
              <PanelLeftClose className="size-4" strokeWidth={1.7} />
            ) : (
              <PanelLeftOpen className="size-4" strokeWidth={1.7} />
            )}
          </button>
        ) : null}
      </div>

      <nav aria-label="Primary navigation" className="mt-14 flex flex-col gap-3">
        {SIDEBAR_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              title={isExpanded ? undefined : item.label}
              className={cn(
                'flex min-h-12 items-center gap-3 rounded-lg text-ui-sm text-foreground transition-colors',
                'hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
                isExpanded ? 'px-4' : 'justify-center px-0',
                isActive && 'bg-surface-elevated text-primary',
              )}
            >
              <Icon className="size-4 shrink-0" strokeWidth={1.7} />
              <span className={cn(isExpanded ? 'inline' : 'sr-only')}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={cn('mt-auto space-y-8', !isExpanded && 'hidden')}>
        <p className="border-l border-primary pl-4 text-caption leading-relaxed text-secondary">
          Small steps
          <br />
          today, confident
          <br />
          voice tomorrow.
        </p>

        <div className="border-t border-divider pt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-divider text-caption text-secondary">
                N
              </span>
              <span className="truncate text-ui-sm text-foreground">Neal</span>
            </div>
            <button
              type="button"
              aria-label="Account options"
              className="rounded-sm text-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            >
              <MoreHorizontal className="size-4" strokeWidth={1.7} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
