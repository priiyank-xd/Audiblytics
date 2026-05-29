import type { ReactNode } from 'react';

import { BackToHomeLink } from '@/components/audiblytics/BackToHomeLink';
import { cn } from '@/lib/utils';

export type FeatureRouteShellProps = {
  children: ReactNode;
  className?: string;
};

/** Standard wrapper for feature routes: back link then route content. */
export function FeatureRouteShell({ children, className }: FeatureRouteShellProps) {
  return (
    <div className={cn('min-w-0 space-y-8 pb-10 pt-8', className)}>
      <BackToHomeLink className="lg:hidden" />
      {children}
    </div>
  );
}
