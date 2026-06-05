'use client';

import { Archive, Download, Trash2 } from 'lucide-react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InlineErrorSurface } from '@/components/audiblytics/InlineErrorSurface';
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
    offlinePackCount,
    isLoadingPack,
    packError,
    handleDownloadPack,
    saveData,
  } = useSettingsHub();

  return (
    <div className="space-y-4">
      <SettingsCardRow
        icon={Archive}
        title="Voice journal retention"
        description="How long recordings are kept locally."
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
            Recordings older than 90 days are deleted when you open the app (UTC clock). This keeps
            local storage within budget.
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
        title="Offline pack"
        description="Pre-generated paragraphs for offline use."
      >
        <div className="flex flex-col items-end gap-3">
          <p className="text-body text-secondary" aria-live="polite">
            {offlinePackCount !== undefined && offlinePackCount > 0
              ? `Loaded — ${offlinePackCount} paragraphs`
              : 'Not loaded'}
          </p>
          <Button
            type="button"
            onClick={handleDownloadPack}
            disabled={isLoadingPack}
            aria-disabled={isLoadingPack}
          >
            {isLoadingPack ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Loading pack…
              </>
            ) : (
              'Download Pack'
            )}
          </Button>
        </div>
      </SettingsCardRow>

      {packError ? (
        <InlineErrorSurface
          variant="storage"
          error={packError}
          onOpenSettings={() => {}}
          onRetry={handleDownloadPack}
          isRetrying={isLoadingPack}
        />
      ) : null}

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
