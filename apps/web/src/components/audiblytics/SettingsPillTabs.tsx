'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type SettingsSectionId = 'provider' | 'defaults' | 'voice' | 'retention' | 'offline-pack';

const ALL_SECTIONS: { id: SettingsSectionId; label: string }[] = [
  { id: 'provider', label: 'Provider' },
  { id: 'defaults', label: 'Defaults' },
  { id: 'voice', label: 'Voice' },
  { id: 'retention', label: 'Retention' },
  { id: 'offline-pack', label: 'Offline Pack' },
];

export function settingsSectionsForBackend(apiMode: boolean): typeof ALL_SECTIONS {
  if (!apiMode) return ALL_SECTIONS;
  return ALL_SECTIONS.filter((s) => s.id !== 'provider');
}

export type SettingsPillTabsProps = {
  value: SettingsSectionId;
  onValueChange: (id: SettingsSectionId) => void;
  /** Omit provider tab when API mode hides the client key vault (BV4). */
  apiMode?: boolean;
};

export function SettingsPillTabs({ value, onValueChange, apiMode = false }: SettingsPillTabsProps) {
  const sections = settingsSectionsForBackend(apiMode);

  return (
    <div
      role="tablist"
      aria-label="Settings sections"
      className="flex flex-wrap gap-2 pb-2"
    >
      {sections.map((s) => {
        const selected = value === s.id;
        return (
          <Button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={selected}
            id={`settings-tab-${s.id}`}
            aria-controls={`settings-panel-${s.id}`}
            variant={selected ? 'default' : 'outline'}
            size="sm"
            className={cn('rounded-full px-4', !selected && 'border-divider')}
            onClick={() => onValueChange(s.id)}
          >
            {s.label}
          </Button>
        );
      })}
    </div>
  );
}
