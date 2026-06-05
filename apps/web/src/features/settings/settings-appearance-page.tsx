'use client';

import { Moon, Palette, Sun, Type } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SettingsCardRow } from '@/features/settings/settings-card-row';

export function SettingsAppearancePage() {
  return (
    <div className="space-y-4">
      <SettingsCardRow
        icon={Sun}
        title="Color mode"
        description="Light uses the cream and forest palette."
      >
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" className="pointer-events-none">
            Light
          </Button>
          <Button type="button" size="sm" variant="outline" disabled>
            Dark
          </Button>
          <Button type="button" size="sm" variant="outline" disabled>
            System
          </Button>
        </div>
      </SettingsCardRow>

      <p className="text-caption text-secondary">Dark mode coming later.</p>

      <SettingsCardRow
        icon={Palette}
        title="Accent"
        description="Forest green is the default accent."
      >
        <Button type="button" size="sm" variant="outline" disabled>
          Forest (active)
        </Button>
      </SettingsCardRow>

      <SettingsCardRow
        icon={Type}
        title="Text size"
        description="Adjust reading comfort."
      >
        <Button type="button" size="sm" variant="outline" disabled>
          Default
        </Button>
      </SettingsCardRow>

      <SettingsCardRow icon={Moon} title="Reduced motion" description="Coming soon.">
        <p className="text-caption text-secondary">Coming soon</p>
      </SettingsCardRow>
    </div>
  );
}
