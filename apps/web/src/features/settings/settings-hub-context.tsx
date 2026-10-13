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

import { useAuth } from '@/features/auth/auth-context';
import { fetchApiSettings, patchApiSettings } from '@/lib/api/settings';
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
import { useLocalStorage } from '@/lib/storage/use-local-storage';

type SettingsHubContextValue = {
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
  geminiKeyDraft: string;
  setGeminiKeyDraft: (v: string) => void;
  hasGeminiApiKey: boolean;
  savePractice: () => Promise<void>;
  saveAdvanced: () => Promise<void>;
  saveAudio: () => Promise<void>;
  saveData: () => Promise<void>;
  resetPracticeDefaults: () => void;
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
  const { user } = useAuth();

  const [practicePrefs, setPracticePrefs] = useLocalStorage(
    'audiblytics.practicePrefs',
    practicePrefsSchema.parse({}),
    practicePrefsSchema,
  );

  const defaults = settingsSchema.parse({});
  const [themeDraft, setThemeDraft] = useState<Theme>(defaults.theme);
  const [personaDraft, setPersonaDraft] = useState<Persona>(defaults.persona);
  const [lengthDraft, setLengthDraft] = useState<number>(defaults.length);
  const [rememberLastUsed, setRememberLastUsed] = useState(
    () => practicePrefs.rememberLastUsed,
  );
  const [retentionDraft, setRetentionDraft] = useState<RetentionPolicy>(defaults.retention);
  const [voiceUriDraft, setVoiceUriDraft] = useState<string | null>(defaults.voiceURI);
  const [geminiKeyDraft, setGeminiKeyDraft] = useState('');
  const [hasGeminiApiKey, setHasGeminiApiKey] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [apiSettingsLoading, setApiSettingsLoading] = useState(true);
  const apiDraftHydratedRef = useRef(false);

  useEffect(() => {
    if (!user) {
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
          setHasGeminiApiKey(remote.hasGeminiApiKey);
          setGeminiKeyDraft('');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load settings from the API.');
      } finally {
        setApiSettingsLoading(false);
      }
    })();
  }, [user]);

  useEffect(() => {
    queueMicrotask(() => {
      setRememberLastUsed(practicePrefs.rememberLastUsed);
    });
  }, [practicePrefs.rememberLastUsed]);

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
  }, [lengthDraft, personaDraft, persistPracticePrefs, rememberLastUsed, themeDraft]);

  const saveAdvanced = useCallback(async () => {
    setError(null);

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
  }, [geminiKeyDraft, hasGeminiApiKey]);

  const saveAudio = useCallback(async () => {
    setError(null);

    try {
      const next = await patchApiSettings({ voiceURI: voiceUriDraft });
      setVoiceUriDraft(next.voiceURI);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save audio settings.');
    }
  }, [voiceUriDraft]);

  const saveData = useCallback(async () => {
    setError(null);

    try {
      const next = await patchApiSettings({ retention: retentionDraft });
      setRetentionDraft(next.retention);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save data settings.');
    }
  }, [retentionDraft]);

  const resetPracticeDefaults = useCallback(() => {
    const defaults = settingsSchema.parse({});
    setThemeDraft(defaults.theme);
    setPersonaDraft(defaults.persona);
    setLengthDraft(defaults.length);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
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
      geminiKeyDraft,
      setGeminiKeyDraft,
      hasGeminiApiKey,
      savePractice,
      saveAdvanced,
      saveAudio,
      saveData,
      resetPracticeDefaults,
    }),
    [
      apiSettingsLoading,
      error,
      themeDraft,
      personaDraft,
      lengthDraft,
      rememberLastUsed,
      retentionDraft,
      voiceUriDraft,
      geminiKeyDraft,
      hasGeminiApiKey,
      savePractice,
      saveAdvanced,
      saveAudio,
      saveData,
      resetPracticeDefaults,
    ],
  );

  return (
    <SettingsHubContext.Provider value={value}>{children}</SettingsHubContext.Provider>
  );
}
