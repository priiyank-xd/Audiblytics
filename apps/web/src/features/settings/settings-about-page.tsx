'use client';

import type { MouseEvent } from 'react';
import Link from 'next/link';
import { ExternalLink, LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SettingsCardRow } from '@/features/settings/settings-card-row';
import { useAuth } from '@/features/auth/auth-context';
import { isApiStorageBackend } from '@/lib/config/storage-backend';

const APP_VERSION = '0.1.0';

export function SettingsAboutPage() {
  const apiMode = isApiStorageBackend();
  const { user, logout } = useAuth();

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-divider bg-surface-card p-6 space-y-2">
        <h2 className="text-headline-3 text-primary">Audiblytics</h2>
        <p className="text-body text-secondary">Personal English practice — n=1 browser app.</p>
        <p className="text-caption text-secondary">Version {APP_VERSION}</p>
      </div>

      <SettingsCardRow
        icon={ExternalLink}
        title="Documentation"
        description="Product and architecture notes."
      >
        <Link
          href="#"
          aria-disabled
          className="text-ui-sm text-secondary pointer-events-none"
          onClick={(e: MouseEvent<HTMLAnchorElement>) => e.preventDefault()}
        >
          Coming soon
        </Link>
      </SettingsCardRow>

      <SettingsCardRow
        icon={ExternalLink}
        title="Source"
        description="Project repository."
      >
        <Link
          href="#"
          aria-disabled
          className="text-ui-sm text-secondary pointer-events-none"
          onClick={(e: MouseEvent<HTMLAnchorElement>) => e.preventDefault()}
        >
          Coming soon
        </Link>
      </SettingsCardRow>

      {apiMode && user ? (
        <SettingsCardRow
          icon={LogOut}
          title="Log out"
          description="End your signed-in session on this device."
        >
          <Button
            type="button"
            variant="outline"
            className="font-sans"
            onClick={() => {
              void logout();
            }}
          >
            Log out
          </Button>
        </SettingsCardRow>
      ) : null}
    </div>
  );
}
