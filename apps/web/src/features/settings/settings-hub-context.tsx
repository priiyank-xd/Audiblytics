'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useLiveQuery } from 'dexie-react-hooks';

import { useAuth } from '@/features/auth/auth-context';
import {
  normalizeProviderKeys,
  patchProviderKey,
  readProviderKey,
} from '@/features/settings/settings-provider-utils';
import { PROVIDER_OPTIONS } from '@/features/settings/settings-constants';
import { fetchApiSettings, patchApiSettings } from '@/lib/api/settings';
import { isApiStorageBackend } from '@/lib/config/storage-backend';
import { LIVE_QUERY_EMPTY_DEPS } from '@/lib/hooks/live-query-empty-deps';
import {
  activeProviderSchema,
  type ActiveProvider,
  type ProviderKeys,
  providerKeysSchema,
} from '@/lib/schemas/provider-keys.schema';
import {
  practicePrefsSchema,
  type PracticePrefs,
} from '@/lib/schemas/practice-prefs.schema';
import {
  settingsSchema,
  type Persona,
  type RetentionPolicy,
  type Settings,
  type Theme,
} from '@/lib/schemas/settings.schema';
import { snapshotLastUsedFromSettings } from '@/lib/settings/apply-last-used-practice';
import { db, type StorageError } from '@/lib/storage/db';
import { useLocalStorage } from '@/lib/storage/use-local-storage';
import { loadOfflinePackFromPublic } from '@/features/offline-pack/pack-loader';

type SettingsHubContextValue = {
  apiMode: boolean;
  apiSettingsLoading: boolean;
  error: string | null;
  setError: (message: string | null) => void;
  themeDraft: Theme;
  setThemeDraft: (v: Theme) => void;
  personaDraft: Persona;
  setPersonaDraft: (v: Persona) => void;
  lengthDraft: number;
  setLengthDraft: (v: number) => void;
  rememberLastUsed: boolean;
  setRememberLastUsed: (v: boolean) => void;
  retentionDraft: RetentionPolicy;
  setRetentionDraft: (v: RetentionPolicy) => void;
  voiceUriDraft: string | null;
  setVoiceUriDraft: (v: string | null) => void;
  draftProvider: ActiveProvider;
  setDraftProvider: (v: ActiveProvider) => void;
  keysDraft: ProviderKeys;
  setKeysDraft: React.Dispatch<React.SetStateAction<ProviderKeys>>;
  geminiKeyDraft: string;
  setGeminiKeyDraft: (v: string) => void;
  hasGeminiApiKey: boolean;
  needsApiKey: boolean;
  apiKeyValue: string;
  offlinePackCount: number | undefined;
  isLoadingPack: boolean;
  packError: StorageError | null;
  savePractice: () => Promise<void>;
  saveAdvanced: () => Promise<void>;
  saveAudio: () => Promise<void>;
  saveData: () => Promise<void>;
  resetPracticeDefaults: () => void;
  handleDownloadPack: () => void;
  patchProviderKeyForDraft: (raw: string) => void;
};

const SettingsHubContext = createContext<SettingsHubContextValue | null>(null);

export function useSettingsHub(): SettingsHubContextValue {
  const ctx = useContext(SettingsHubContext);
  if (!ctx) {
    throw new Error('useSettingsHub must be used within SettingsHubProvider');
  }
  return ctx;
}

export function SettingsHubProvider({ children }: { children: ReactNode }) {
  const apiMode = isApiStorageBackend();
  const { user } = useAuth();

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
  const [practicePrefs, setPracticePrefs] = useLocalStorage(
    'audiblytics.practicePrefs',
    practicePrefsSchema.parse({}),
    practicePrefsSchema,
  );

  const offlinePackCount = useLiveQuery(
    () => db.offlinePack.count(),
    LIVE_QUERY_EMPTY_DEPS,
    undefined,
  );

  const [isLoadingPack, setIsLoadingPack] = useState(false);
  const [packError, setPackError] = useState<StorageError | null>(null);

  const [themeDraft, setThemeDraft] = useState<Theme>(() => settings.theme);
  const [personaDraft, setPersonaDraft] = useState<Persona>(() => settings.persona);
  const [lengthDraft, setLengthDraft] = useState<number>(() => settings.length);
  const [rememberLastUsed, setRememberLastUsed] = useState(
    () => practicePrefs.rememberLastUsed,
  );
  const [retentionDraft, setRetentionDraft] = useState<RetentionPolicy>(() => settings.retention);
  const [voiceUriDraft, setVoiceUriDraft] = useState<string | null>(() => settings.voiceURI);
  const [draftProvider, setDraftProvider] = useState<ActiveProvider>(() => activeProvider);
  const [keysDraft, setKeysDraft] = useState<ProviderKeys>(() =>
    providerKeysSchema.parse(providerKeys),
  );
  const [geminiKeyDraft, setGeminiKeyDraft] = useState('');
  const [hasGeminiApiKey, setHasGeminiApiKey] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [apiSettingsLoading, setApiSettingsLoading] = useState(apiMode);
  const apiDraftHydratedRef = useRef(false);

  useEffect(() => {
    if (!apiMode || !user) {
      queueMicrotask(() => setApiSettingsLoading(false));
      return;
    }
    void (async () => {
      setApiSettingsLoading(true);
      setError(null);
      try {
        const remote = await fetchApiSettings();
        if (!apiDraftHydratedRef.current) {
          apiDraftHydratedRef.current = true;
          setThemeDraft(remote.theme);
          setPersonaDraft(remote.persona);
          setLengthDraft(remote.length);
          setRetentionDraft(remote.retention);
          setVoiceUriDraft(remote.voiceURI);
          setDraftProvider(remote.activeProvider);
          setHasGeminiApiKey(remote.hasGeminiApiKey);
          setGeminiKeyDraft('');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load settings from the API.');
      } finally {
        setApiSettingsLoading(false);
      }
    })();
  }, [apiMode, user]);

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
    queueMicrotask(() => {
      setRememberLastUsed(practicePrefs.rememberLastUsed);
    });
  }, [practicePrefs.rememberLastUsed]);

  const needsApiKey = draftProvider !== 'ollama';
  const apiKeyValue = readProviderKey(keysDraft, draftProvider);

  const patchProviderKeyForDraft = useCallback(
    (raw: string) => {
      setKeysDraft((prev) => patchProviderKey(prev, draftProvider, raw));
      setError(null);
    },
    [draftProvider],
  );

  const persistPracticePrefs = useCallback(
    (nextRemember: boolean, savedSettings: Pick<Settings, 'theme' | 'persona' | 'length'>) => {
      const nextPrefs: PracticePrefs = practicePrefsSchema.parse({
        rememberLastUsed: nextRemember,
        lastUsed:
          nextRemember ? snapshotLastUsedFromSettings(savedSettings as Settings) : practicePrefs.lastUsed,
      });
      setPracticePrefs(nextPrefs);
    },
    [practicePrefs.lastUsed, setPracticePrefs],
  );

  const savePractice = useCallback(async () => {
    setError(null);

    if (apiMode) {
      try {
        const next = await patchApiSettings({
          theme: themeDraft,
          persona: personaDraft,
          length: lengthDraft,
        });
        setThemeDraft(next.theme);
        setPersonaDraft(next.persona);
        setLengthDraft(next.length);
        persistPracticePrefs(rememberLastUsed, next);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save practice settings.');
      }
      return;
    }

    const nextSettings: Settings = settingsSchema.parse({
      ...settings,
      theme: themeDraft,
      persona: personaDraft,
      length: lengthDraft,
    });
    setSettings(nextSettings);
    persistPracticePrefs(rememberLastUsed, nextSettings);
  }, [
    apiMode,
    lengthDraft,
    personaDraft,
    persistPracticePrefs,
    rememberLastUsed,
    setSettings,
    settings,
    themeDraft,
  ]);

  const saveAdvanced = useCallback(async () => {
    setError(null);

    if (apiMode) {
      if (!geminiKeyDraft.trim() && !hasGeminiApiKey) {
        setError('Add your Gemini API key to generate paragraphs.');
        return;
      }
      try {
        const patch: Parameters<typeof patchApiSettings>[0] = {};
        if (geminiKeyDraft.trim()) {
          patch.geminiApiKey = geminiKeyDraft.trim();
        }
        const next = await patchApiSettings(patch);
        setHasGeminiApiKey(next.hasGeminiApiKey);
        setGeminiKeyDraft('');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save API key.');
      }
      return;
    }

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

    setProviderKeys(normalizedKeys);
    setActiveProvider(draftProvider);
    setKeysDraft(normalizedKeys);
  }, [
    apiMode,
    draftProvider,
    geminiKeyDraft,
    hasGeminiApiKey,
    keysDraft,
    needsApiKey,
    setActiveProvider,
    setProviderKeys,
  ]);

  const saveAudio = useCallback(async () => {
    setError(null);

    if (apiMode) {
      try {
        const next = await patchApiSettings({ voiceURI: voiceUriDraft });
        setVoiceUriDraft(next.voiceURI);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save audio settings.');
      }
      return;
    }

    setSettings(
      settingsSchema.parse({
        ...settings,
        voiceURI: voiceUriDraft,
      }),
    );
  }, [apiMode, setSettings, settings, voiceUriDraft]);

  const saveData = useCallback(async () => {
    setError(null);

    if (apiMode) {
      try {
        const next = await patchApiSettings({ retention: retentionDraft });
        setRetentionDraft(next.retention);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save data settings.');
      }
      return;
    }

    setSettings(
      settingsSchema.parse({
        ...settings,
        retention: retentionDraft,
      }),
    );
  }, [apiMode, retentionDraft, setSettings, settings]);

  const resetPracticeDefaults = useCallback(() => {
    const defaults = settingsSchema.parse({});
    setThemeDraft(defaults.theme);
    setPersonaDraft(defaults.persona);
    setLengthDraft(defaults.length);
    setError(null);
  }, []);

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
  }, []);

  const value = useMemo(
    () => ({
      apiMode,
      apiSettingsLoading,
      error,
      setError,
      themeDraft,
      setThemeDraft,
      personaDraft,
      setPersonaDraft,
      lengthDraft,
      setLengthDraft,
      rememberLastUsed,
      setRememberLastUsed,
      retentionDraft,
      setRetentionDraft,
      voiceUriDraft,
      setVoiceUriDraft,
      draftProvider,
      setDraftProvider,
      keysDraft,
      setKeysDraft,
      geminiKeyDraft,
      setGeminiKeyDraft,
      hasGeminiApiKey,
      needsApiKey,
      apiKeyValue,
      offlinePackCount,
      isLoadingPack,
      packError,
      savePractice,
      saveAdvanced,
      saveAudio,
      saveData,
      resetPracticeDefaults,
      handleDownloadPack,
      patchProviderKeyForDraft,
    }),
    [
      apiMode,
      apiSettingsLoading,
      error,
      themeDraft,
      personaDraft,
      lengthDraft,
      rememberLastUsed,
      retentionDraft,
      voiceUriDraft,
      draftProvider,
      keysDraft,
      geminiKeyDraft,
      hasGeminiApiKey,
      needsApiKey,
      apiKeyValue,
      offlinePackCount,
      isLoadingPack,
      packError,
      savePractice,
      saveAdvanced,
      saveAudio,
      saveData,
      resetPracticeDefaults,
      handleDownloadPack,
      patchProviderKeyForDraft,
    ],
  );

  return (
    <SettingsHubContext.Provider value={value}>{children}</SettingsHubContext.Provider>
  );
}
