import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type SettingsCardRowProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function SettingsCardRow({
  icon: Icon,
  title,
  description,
  children,
  className,
}: SettingsCardRowProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-divider bg-surface-card p-5',
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Icon className="size-5" strokeWidth={1.7} aria-hidden />
          </span>
          <div className="min-w-0 space-y-1">
            <h3 className="text-ui-sm font-medium text-foreground">{title}</h3>
            {description ? (
              <p className="text-caption text-secondary">{description}</p>
            ) : null}
          </div>
        </div>
        <div className="min-w-0 shrink-0 sm:max-w-xs sm:w-full">{children}</div>
      </div>
    </div>
  );
}
