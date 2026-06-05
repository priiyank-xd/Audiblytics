'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { KeyRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SettingsCardRow } from '@/features/settings/settings-card-row';
import { PROVIDER_OPTIONS } from '@/features/settings/settings-constants';
import { useSettingsHub } from '@/features/settings/settings-hub-context';
import { SettingsSaveFooter } from '@/features/settings/settings-save-footer';
import type { ActiveProvider } from '@/lib/schemas/provider-keys.schema';
import { cn } from '@/lib/utils';

export function SettingsAdvancedPage() {
  const searchParams = useSearchParams();
  const {
    apiMode,
    draftProvider,
    setDraftProvider,
    apiKeyValue,
    needsApiKey,
    patchProviderKeyForDraft,
    geminiKeyDraft,
    setGeminiKeyDraft,
    hasGeminiApiKey,
    setError,
    saveAdvanced,
  } = useSettingsHub();

  useEffect(() => {
    if (searchParams.get('focus') !== 'provider') return;
    const id = apiMode ? 'settings-gemini-api-key' : 'settings-provider';
    const outer = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(id)?.focus();
      });
    });
    return () => cancelAnimationFrame(outer);
  }, [apiMode, searchParams]);

  if (apiMode) {
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

  return (
    <div className="space-y-4">
      <SettingsCardRow
        icon={KeyRound}
        title="Provider"
        description="LLM used for paragraph generation."
      >
        <Select
          value={draftProvider}
          onValueChange={(v) => {
            if (v === null) return;
            setDraftProvider(v as ActiveProvider);
            setError(null);
          }}
        >
          <SelectTrigger id="settings-provider" className="w-full min-w-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROVIDER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingsCardRow>

      <SettingsCardRow
        icon={KeyRound}
        title="API key"
        description={
          needsApiKey ? 'Stored locally in your browser.' : 'No key required for Ollama.'
        }
      >
        <Input
          id="settings-api-key"
          type="password"
          name="apiKey"
          autoComplete="off"
          disabled={!needsApiKey}
          value={apiKeyValue}
          onChange={(e) => patchProviderKeyForDraft(e.target.value)}
          className={cn(!needsApiKey && 'opacity-60')}
          placeholder={needsApiKey ? 'Paste your API key' : undefined}
        />
      </SettingsCardRow>

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
