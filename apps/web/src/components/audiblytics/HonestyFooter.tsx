'use client';

import { usePathname } from 'next/navigation';

import { ProviderChip } from '@/components/audiblytics/ProviderChip';
import { cn } from '@/lib/utils';

const APP_VERSION = "v0.1.0";

export function HonestyFooter() {
  const pathname = usePathname() ?? '';
  if (pathname === '/') return null;

  return (
    <footer
      role="contentinfo"
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-divider bg-surface px-4 py-4 lg:hidden",
        "text-rail text-ink-faint",
      )}
    >
      <span>~5 min daily</span>
      <span aria-hidden="true">·</span>
      <span>$0 today</span>
      <span aria-hidden="true">·</span>
      <ProviderChip />
      <span aria-hidden="true">·</span>
      <span>{APP_VERSION}</span>
    </footer>
  );
}
