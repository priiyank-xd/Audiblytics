'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { useLiveQuery } from 'dexie-react-hooks';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SettingsPillTabs,
  type SettingsSectionId,
} from '@/components/audiblytics/SettingsPillTabs';
import { useVoices } from '@/lib/audio/tts';
import {
  activeProviderSchema,
  type ActiveProvider,
  type ProviderKeys,
  providerKeysSchema,
} from '@/lib/schemas/provider-keys.schema';
import {
  personaSchema,
  retentionPolicySchema,
  settingsSchema,
  type Persona,
  type RetentionPolicy,
  type Settings,
  type Theme,
  themeSchema,
} from '@/lib/schemas/settings.schema';
import { useLocalStorage } from '@/lib/storage/use-local-storage';
import { db, type StorageError } from '@/lib/storage/db';
import { LIVE_QUERY_EMPTY_DEPS } from '@/lib/hooks/live-query-empty-deps';
import { cn } from '@/lib/utils';
import { InlineErrorSurface } from '@/components/audiblytics/InlineErrorSurface';
import { loadOfflinePackFromPublic } from '@/features/offline-pack/pack-loader';

const PROVIDER_OPTIONS: { value: ActiveProvider; label: string }[] = [
  { value: 'gemini', label: 'Gemini' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'ollama', label: 'Ollama' },
];

const LENGTH_OPTIONS = [100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200] as const;

const THEME_LABEL: Record<Theme, string> = {
  horror: 'Horror',
  comedy: 'Comedy',
  adventure: 'Adventure',
  'mythic-quest': 'Mythic quest',
  survival: 'Survival',
  travelogue: 'Travelogue',
  mystery: 'Mystery',
  'sci-fi': 'Sci-Fi',
  'slice-of-life': 'Slice of life',
};

const PERSONA_LABEL: Record<Persona, string> = {
  'gre-aspirant': 'GRE aspirant',
  'business-english': 'Business English',
  storyteller: 'Storyteller',
  'campfire-narrator': 'Campfire narrator',
  'news-reader': 'News reader',
  'debate-coach': 'Debate coach',
  'casual-conversationalist': 'Casual conversationalist',
};

const RETENTION_LABEL: Record<RetentionPolicy, string> = {
  '90-day-rolling': '90-day rolling (default)',
  indefinite: 'Indefinite',
};

function readProviderKey(keys: ProviderKeys, p: ActiveProvider): string {
  if (p === 'ollama') return '';
  const v = keys[p];
  return typeof v === 'string' ? v : '';
}

function patchProviderKey(keys: ProviderKeys, p: ActiveProvider, raw: string): ProviderKeys {
  if (p === 'ollama') {
    return providerKeysSchema.parse({ ...keys, ollama: null });
  }
  const trimmed = raw.trim();
  const next: ProviderKeys = { ...keys, ollama: null };
  switch (p) {
    case 'gemini':
      next.gemini = trimmed ? trimmed : undefined;
      break;
    case 'openai':
      next.openai = trimmed ? trimmed : undefined;
      break;
    case 'anthropic':
      next.anthropic = trimmed ? trimmed : undefined;
      break;
    case 'openrouter':
      next.openrouter = trimmed ? trimmed : undefined;
      break;
    default:
      break;
  }
  return next;
}

function normalizeProviderKeys(keys: ProviderKeys): ProviderKeys {
  return providerKeysSchema.parse({
    gemini: keys.gemini?.trim() || undefined,
    openai: keys.openai?.trim() || undefined,
    anthropic: keys.anthropic?.trim() || undefined,
    openrouter: keys.openrouter?.trim() || undefined,
    ollama: null,
  });
}

export function SettingsForm() {
  const searchParams = useSearchParams();
  const [providerKeys, setProviderKeys] = useLocalStorage(
    'audiblytics.providerKeys',
    providerKeysSchema.parse({}),
    providerKeysSchema,
  );
  const [activeProvider, setActiveProvider] = useLocalStorage(
    'audiblytics.activeProvider',
    'gemini',
    activeProviderSchema,
  );
  const [settings, setSettings] = useLocalStorage(
    'audiblytics.settings',
    settingsSchema.parse({}),
    settingsSchema,
  );

  const voices = useVoices();

  const offlinePackCount = useLiveQuery(() => db.offlinePack.count(), LIVE_QUERY_EMPTY_DEPS, undefined);

  const [isLoadingPack, setIsLoadingPack] = useState(false);
  const [packError, setPackError] = useState<StorageError | null>(null);

  const [section, setSection] = useState<SettingsSectionId>('provider');
  const [draftProvider, setDraftProvider] = useState<ActiveProvider>(() => activeProvider);
  const [keysDraft, setKeysDraft] = useState<ProviderKeys>(() => providerKeysSchema.parse(providerKeys));
  const [themeDraft, setThemeDraft] = useState<Theme>(() => settings.theme);
  const [personaDraft, setPersonaDraft] = useState<Persona>(() => settings.persona);
  const [lengthDraft, setLengthDraft] = useState<number>(() => settings.length);
  const [retentionDraft, setRetentionDraft] = useState<RetentionPolicy>(() => settings.retention);
  const [voiceUriDraft, setVoiceUriDraft] = useState<string | null>(() => settings.voiceURI);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setKeysDraft(providerKeysSchema.parse(providerKeys));
    });
  }, [providerKeys]);

  useEffect(() => {
    queueMicrotask(() => {
      setDraftProvider(
        activeProviderSchema.safeParse(activeProvider).success ? activeProvider : 'gemini',
      );
    });
  }, [activeProvider]);

  useEffect(() => {
    queueMicrotask(() => {
      setThemeDraft(settings.theme);
      setPersonaDraft(settings.persona);
      setLengthDraft(settings.length);
      setRetentionDraft(settings.retention);
      setVoiceUriDraft(settings.voiceURI);
    });
  }, [settings]);

  useEffect(() => {
    if (searchParams.get('focus') !== 'provider') return;
    queueMicrotask(() => setSection('provider'));
    const outer = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById('settings-provider')?.focus();
      });
    });
    return () => cancelAnimationFrame(outer);
  }, [searchParams]);

  const apiKeyValue = readProviderKey(keysDraft, draftProvider);
  const needsApiKey = draftProvider !== 'ollama';

  const handleProviderSelect = useCallback((v: string | null) => {
    if (v === null) return;
    const next = v as ActiveProvider;
    setDraftProvider(next);
    setError(null);
  }, [setDraftProvider, setError]);

  const handleSave = useCallback(() => {
    void (async () => {
      setError(null);
      const normalizedKeys = normalizeProviderKeys(keysDraft);
      if (needsApiKey) {
        const key = readProviderKey(normalizedKeys, draftProvider);
        if (!key) {
          setError(
            `Add an API key for ${PROVIDER_OPTIONS.find((p) => p.value === draftProvider)?.label ?? draftProvider}.`,
          );
          return;
        }
      }

      try {
        const { getProvider } = await import('@/lib/llm/client');
        getProvider({ activeProvider: draftProvider, providerKeys: normalizedKeys });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not initialize the selected provider.');
        return;
      }

      const nextSettings: Settings = settingsSchema.parse({
        ...settings,
        theme: themeDraft,
        persona: personaDraft,
        length: lengthDraft,
        retention: retentionDraft,
        voiceURI: voiceUriDraft,
      });

      setProviderKeys(normalizedKeys);
      setActiveProvider(draftProvider);
      setSettings(nextSettings);
      setKeysDraft(normalizedKeys);
    })();
  }, [
    draftProvider,
    keysDraft,
    lengthDraft,
    needsApiKey,
    personaDraft,
    retentionDraft,
    setActiveProvider,
    setProviderKeys,
    setSettings,
    settings,
    themeDraft,
    voiceUriDraft,
  ]);

  const handleDownloadPack = useCallback(() => {
    void (async () => {
      setPackError(null);
      setIsLoadingPack(true);
      const out = await loadOfflinePackFromPublic();
      if (!out.ok) {
        setPackError(out.error);
      }
      setIsLoadingPack(false);
    })();
  }, [setIsLoadingPack, setPackError]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-headline-2 text-primary">Settings</h1>
        <p className="text-body text-primary">
          Changes apply on your next paragraph generation.
        </p>
      </header>

      <div className="flex flex-col gap-8 pt-2">
        <SettingsPillTabs value={section} onValueChange={setSection} />

        <div
          role="tabpanel"
          id={`settings-panel-${section}`}
          aria-labelledby={`settings-tab-${section}`}
          className="min-h-[12rem] space-y-6"
        >
            {section === 'provider' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="settings-provider">Provider</Label>
                  <Select value={draftProvider} onValueChange={handleProviderSelect}>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="settings-api-key">API key</Label>
                  <Input
                    id="settings-api-key"
                    type="password"
                    name="apiKey"
                    autoComplete="off"
                    disabled={!needsApiKey}
                    value={apiKeyValue}
                    onChange={(e) => {
                      setKeysDraft((prev) => patchProviderKey(prev, draftProvider, e.target.value));
                      setError(null);
                    }}
                    className={cn(!needsApiKey && 'opacity-60')}
                    placeholder={needsApiKey ? 'Paste your API key' : undefined}
                  />
                  {!needsApiKey ? (
                    <p className="text-caption text-secondary">No key required for Ollama.</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {section === 'offline-pack' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-body text-secondary" aria-live="polite">
                    {offlinePackCount !== undefined && offlinePackCount > 0
                      ? `Offline pack loaded — ${offlinePackCount} paragraphs`
                      : 'Offline pack not loaded'}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3">
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

                {packError ? (
                  <InlineErrorSurface
                    variant="storage"
                    error={packError}
                    onOpenSettings={() => {}}
                    onRetry={handleDownloadPack}
                    isRetrying={isLoadingPack}
                  />
                ) : null}
              </div>
            ) : null}

            {section === 'defaults' ? (
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="settings-theme">Theme</Label>
                  <Select
                    value={themeDraft}
                    onValueChange={(v) => {
                      if (v === null) return;
                      setThemeDraft(v as Theme);
                    }}
                  >
                    <SelectTrigger id="settings-theme" className="w-full min-w-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {themeSchema.options.map((t) => (
                        <SelectItem key={t} value={t}>
                          {THEME_LABEL[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="settings-persona">Persona</Label>
                  <Select
                    value={personaDraft}
                    onValueChange={(v) => {
                      if (v === null) return;
                      setPersonaDraft(v as Persona);
                    }}
                  >
                    <SelectTrigger id="settings-persona" className="w-full min-w-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {personaSchema.options.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PERSONA_LABEL[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="settings-length">Paragraph length</Label>
                  <Select
                    value={String(lengthDraft)}
                    onValueChange={(v) => {
                      if (v === null) return;
                      setLengthDraft(Number(v));
                    }}
                  >
                    <SelectTrigger id="settings-length" className="w-full min-w-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LENGTH_OPTIONS.map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} words
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}

            {section === 'voice' ? (
              <div className="space-y-2">
                <Label htmlFor="settings-voice">Text-to-speech voice</Label>
                {voices.length === 0 ? (
                  <p className="text-body text-secondary">Loading voices…</p>
                ) : null}
                <Select
                  value={
                    voices.length > 0 &&
                    voiceUriDraft != null &&
                    voices.some((v) => v.voiceURI === voiceUriDraft)
                      ? voiceUriDraft
                      : '__default__'
                  }
                  onValueChange={(v) => {
                    if (v === null) return;
                    setVoiceUriDraft(v === '__default__' ? null : v);
                  }}
                  disabled={voices.length === 0}
                >
                  <SelectTrigger id="settings-voice" className="w-full min-w-0">
                    <SelectValue placeholder="Choose a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__default__">Browser default</SelectItem>
                    {voices.map((v) => (
                      <SelectItem key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {section === 'retention' ? (
              <div className="space-y-2">
                <Label htmlFor="settings-retention">Voice journal retention</Label>
                <Select
                  value={retentionDraft}
                  onValueChange={(v) => {
                    if (v === null) return;
                    const parsed = retentionPolicySchema.safeParse(v);
                    if (parsed.success) setRetentionDraft(parsed.data);
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
                <div className="space-y-2 text-caption text-secondary">
                  {retentionDraft === '90-day-rolling' ? (
                    <p>
                      Recordings older than 90 days are deleted when you open the app (UTC clock). This keeps local
                      storage within budget.
                    </p>
                  ) : (
                    <p>Nothing is removed automatically while this option is selected.</p>
                  )}
                  <p>
                    If you switch to Indefinite, recordings already removed by rolling retention are not restored.
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end pt-10">
            <Button type="button" onClick={handleSave}>
              Save
            </Button>
          </div>
      </div>
    </div>
  );
}
