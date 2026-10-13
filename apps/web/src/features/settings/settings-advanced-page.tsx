'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { KeyRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SettingsCardRow } from '@/features/settings/settings-card-row';
import { useSettingsHub } from '@/features/settings/settings-hub-context';
import { SettingsSaveFooter } from '@/features/settings/settings-save-footer';

export function SettingsAdvancedPage() {
  const searchParams = useSearchParams();
  const {
    geminiKeyDraft,
    setGeminiKeyDraft,
    hasGeminiApiKey,
    setError,
    saveAdvanced,
  } = useSettingsHub();

  useEffect(() => {
    if (searchParams.get('focus') !== 'provider') return;
    const id = 'settings-gemini-api-key';
    const outer = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(id)?.focus();
      });
    });
    return () => cancelAnimationFrame(outer);
  }, [searchParams]);

  return (
      <div className="space-y-4">
        <p className="text-body text-secondary">
          Paragraphs are generated on the server with your Gemini key (not stored in the
          browser). Keys are saved to your account in Postgres.
        </p>

        <SettingsCardRow
          icon={KeyRound}
          title="Gemini API key"
          description="Required for server-side paragraph generation."
        >
          <Input
            id="settings-gemini-api-key"
            type="password"
            name="geminiApiKey"
            autoComplete="off"
            value={geminiKeyDraft}
            onChange={(e) => {
              setGeminiKeyDraft(e.target.value);
              setError(null);
            }}
            placeholder={
              hasGeminiApiKey ? 'Key saved — paste only to replace' : 'Paste your Gemini API key'
            }
          />
        </SettingsCardRow>

        {hasGeminiApiKey && !geminiKeyDraft ? (
          <p className="text-caption text-secondary">A Gemini key is already saved.</p>
        ) : null}

        <div className="space-y-2">
          <Button type="button" variant="outline" disabled>
            Test Connection
          </Button>
          <p className="text-caption text-secondary">Connection test not available yet.</p>
        </div>

        <SettingsSaveFooter onSave={saveAdvanced} />
      </div>
    );
}
