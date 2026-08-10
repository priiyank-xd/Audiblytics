'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

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
import { RecordingPrivacyNotice } from '@/components/audiblytics/RecordingPrivacyNotice';
import { SettingsCardRow } from '@/features/settings/settings-card-row';
import { RETENTION_LABEL } from '@/features/settings/settings-constants';
import { useSettingsHub } from '@/features/settings/settings-hub-context';
import { SettingsSaveFooter } from '@/features/settings/settings-save-footer';
import { deleteAccount, fetchAccountExport } from '@/lib/api/account';
import { isApiStorageBackend } from '@/lib/config/storage-backend';
import { retentionPolicySchema } from '@/lib/schemas/settings.schema';

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.length > 0 ? error.message : fallback;
}

export function SettingsDataPage() {
  const {
    apiMode,
    retentionDraft,
    setRetentionDraft,
    setError,
    offlinePackCount,
    isLoadingPack,
    packError,
    handleDownloadPack,
    saveData,
  } = useSettingsHub();

  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [orphanedKeys, setOrphanedKeys] = useState<string[]>([]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      const { filename, blob } = await fetchAccountExport();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportError(errorMessage(e, 'Export failed. Try again.'));
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteAccount();
      if (result.orphanedObjectKeys.length > 0) {
        // Surfaced rather than swallowed: the rows are gone but these audio objects remain.
        setOrphanedKeys(result.orphanedObjectKeys);
        setIsDeleting(false);
        return;
      }
      router.replace('/login');
    } catch (e) {
      setDeleteError(errorMessage(e, 'Deletion failed. Try again.'));
      setIsDeleting(false);
    }
  }, [router]);

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

      <RecordingPrivacyNotice
        location={isApiStorageBackend() ? 'account' : 'browser'}
        retention={retentionDraft}
      />

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
        description={
          apiMode
            ? 'A ZIP with your recordings and a manifest of words, paragraphs and completions.'
            : 'Available in API mode only.'
        }
      >
        <Button
          type="button"
          variant="outline"
          onClick={handleExport}
          disabled={!apiMode || isExporting}
          aria-disabled={!apiMode || isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              Preparing…
            </>
          ) : (
            'Export'
          )}
        </Button>
      </SettingsCardRow>

      {exportError ? (
        <p className="text-caption text-brick" role="alert">
          {exportError}
        </p>
      ) : null}

      <SettingsCardRow
        icon={Trash2}
        title="Delete account and all data"
        description={
          apiMode
            ? 'Permanently removes your recordings, words, paragraphs and settings. This cannot be undone.'
            : 'Available in API mode only.'
        }
      >
        {confirmingDelete ? (
          <div className="flex flex-col items-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleDeleteAccount()}
              disabled={isDeleting}
              aria-disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  Deleting…
                </>
              ) : (
                'Yes, delete everything'
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmingDelete(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmingDelete(true)}
            disabled={!apiMode}
            aria-disabled={!apiMode}
          >
            Delete all
          </Button>
        )}
      </SettingsCardRow>

      {confirmingDelete && !isDeleting && orphanedKeys.length === 0 ? (
        <p className="text-caption text-secondary" role="status">
          Export your data first if you want to keep a copy — deletion cannot be undone.
        </p>
      ) : null}

      {deleteError ? (
        <p className="text-caption text-brick" role="alert">
          {deleteError}
        </p>
      ) : null}

      {orphanedKeys.length > 0 ? (
        <div className="rounded-lg border border-divider bg-surface-elevated px-4 py-3" role="alert">
          <p className="text-caption text-brick">
            Your account and all rows were deleted, but {orphanedKeys.length} audio file
            {orphanedKeys.length === 1 ? '' : 's'} could not be removed from storage. Report these
            keys so they can be cleaned up:
          </p>
          <ul className="mt-2 space-y-1 font-mono text-caption text-secondary">
            {orphanedKeys.map((key) => (
              <li key={key}>{key}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <SettingsSaveFooter onSave={saveData} saveLabel="Save retention" />
    </div>
  );
}
