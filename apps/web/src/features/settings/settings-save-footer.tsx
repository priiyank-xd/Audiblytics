'use client';

import { Button } from '@/components/ui/button';
import { useSettingsHub } from '@/features/settings/settings-hub-context';

export type SettingsSaveFooterProps = {
  onSave: () => void | Promise<void>;
  saveLabel?: string;
};

export function SettingsSaveFooter({ onSave, saveLabel = 'Save' }: SettingsSaveFooterProps) {
  const { error } = useSettingsHub();

  return (
    <div className="space-y-4 pt-6">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="button" onClick={() => void onSave()}>
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
