'use client';

import { Archive, Download, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SettingsCardRow } from '@/features/settings/settings-card-row';
import { RETENTION_LABEL } from '@/features/settings/settings-constants';
import { useSettingsHub } from '@/features/settings/settings-hub-context';
import { SettingsSaveFooter } from '@/features/settings/settings-save-footer';
import { retentionPolicySchema } from '@/lib/schemas/settings.schema';

export function SettingsDataPage() {
  const {
    retentionDraft,
    setRetentionDraft,
    setError,
    saveData,
  } = useSettingsHub();

  return (
    <div className="space-y-4">
      <SettingsCardRow
        icon={Archive}
        title="Voice journal retention"
        description="How long recordings are kept on the server."
      >
        <Select
          value={retentionDraft}
          onValueChange={(v) => {
            if (v === null) return;
            const parsed = retentionPolicySchema.safeParse(v);
            if (parsed.success) {
              setRetentionDraft(parsed.data);
              setError(null);
            }
          }}
        >
          <SelectTrigger id="settings-retention" className="w-full min-w-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {retentionPolicySchema.options.map((r) => (
              <SelectItem key={r} value={r}>
                {RETENTION_LABEL[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingsCardRow>

      <div className="space-y-2 text-caption text-secondary">
        {retentionDraft === '90-day-rolling' ? (
          <p>
            Recordings older than 90 days are deleted by the server when you sign in (UTC clock).
          </p>
        ) : (
          <p>Nothing is removed automatically while this option is selected.</p>
        )}
        <p>
          If you switch to Indefinite, recordings already removed by rolling retention are not
          restored.
        </p>
      </div>

      <SettingsCardRow
        icon={Download}
        title="Export data"
        description="Not available in this build."
      >
        <Button type="button" variant="outline" disabled>
          Export
        </Button>
      </SettingsCardRow>

      <SettingsCardRow
        icon={Trash2}
        title="Delete all data"
        description="Not available in this build."
      >
        <Button type="button" variant="outline" disabled>
          Delete all
        </Button>
      </SettingsCardRow>

      <SettingsSaveFooter onSave={saveData} saveLabel="Save retention" />
    </div>
  );
}
