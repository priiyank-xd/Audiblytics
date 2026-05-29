'use client';

import { useCallback, useState } from 'react';
import { ExternalLink, KeyRound, Loader2, Sun } from 'lucide-react';

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
import { persistParagraphToCache } from '@/features/paragraph/persist-paragraph-cache';
import type { ParagraphGeneratePayload } from '@/features/paragraph/paragraph-generate-payload';
import { selectRecycleWords } from '@/features/paragraph/select-recycle-words';
import { generateParagraph } from '@/lib/llm/generate';
import type { LlmError } from '@/lib/llm/types';
import {
  activeProviderSchema,
  type ActiveProvider,
  type ProviderKeys,
  providerKeysSchema,
} from '@/lib/schemas/provider-keys.schema';
import {
  defaultLastLlmCallStatus,
  lastLlmCallStatusSchema,
} from '@/lib/schemas/last-llm-call-status.schema';
import {
  personaSchema,
  settingsSchema,
  themeSchema,
  type Persona,
  type Settings,
  type Theme,
} from '@/lib/schemas/settings.schema';
import { db } from '@/lib/storage/db';
import { useLocalStorage } from '@/lib/storage/use-local-storage';
import { cn } from '@/lib/utils';

const PROVIDER_SIGNUP_URL: Record<ActiveProvider, string> = {
  gemini: 'https://aistudio.google.com/apikey',
  openai: 'https://platform.openai.com/api-keys',
  anthropic: 'https://console.anthropic.com/settings/keys',
  openrouter: 'https://openrouter.ai/keys',
  ollama: 'https://ollama.com/download',
};

const PROVIDER_OPTIONS: { value: ActiveProvider; label: string }[] = [
  { value: 'gemini', label: 'Google Gemini (Free)' },
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

export type OnboardingShellProps = {
  paragraphId: string;
  initialActiveProvider: ActiveProvider;
  providerKeys: ProviderKeys;
  setProviderKeys: (value: ProviderKeys | ((prev: ProviderKeys) => ProviderKeys)) => void;
  setActiveProvider: (value: ActiveProvider | ((prev: ActiveProvider) => ActiveProvider)) => void;
  settings: Settings;
  setSettings: (value: Settings | ((prev: Settings) => Settings)) => void;
  onGenerateSuccess: (payload: ParagraphGeneratePayload) => void;
};

function formatLlmError(err: LlmError): string {
  return err.message;
}

export function OnboardingShell({
  paragraphId,
  initialActiveProvider,
  providerKeys,
  setProviderKeys,
  setActiveProvider,
  settings,
  setSettings,
  onGenerateSuccess,
}: OnboardingShellProps) {
  const [provider, setProvider] = useState<ActiveProvider>(() =>
    activeProviderSchema.safeParse(initialActiveProvider).success ? initialActiveProvider : 'gemini',
  );
  const [apiKey, setApiKey] = useState('');
  const [theme, setTheme] = useState<Theme>(() => settings.theme);
  const [persona, setPersona] = useState<Persona>(() => settings.persona);
  const [length, setLength] = useState<number>(() => settings.length);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLastLlmCallStatus] = useLocalStorage(
    'audiblytics.lastLlmCallStatus',
    defaultLastLlmCallStatus,
    lastLlmCallStatusSchema,
  );

  const needsApiKey = provider !== 'ollama';
  const canSubmit = !needsApiKey || apiKey.trim().length > 0;

  const handleGenerate = useCallback(async () => {
    if (!canSubmit || isGenerating) return;
    setError(null);
    setIsGenerating(true);
    try {
      const mergedKeys = providerKeysSchema.parse({
        ...providerKeys,
        ...(provider === 'ollama'
          ? { ollama: null }
          : { [provider]: apiKey.trim() }),
      });

      const { getProvider } = await import('@/lib/llm/client');
      const model = getProvider({ activeProvider: provider, providerKeys: mergedKeys });

      const collection = await db.collection.toArray();
      const recycle = selectRecycleWords(collection);
      const recycleWords = recycle.map((w) => w.word);

      const result = await generateParagraph({
        provider,
        model,
        theme,
        persona,
        length,
        recycleWords,
      });

      if (!result.ok) {
        setLastLlmCallStatus({
          ok: false,
          lastProvider: provider,
          lastErrorKind: result.error.kind,
          at: new Date().toISOString(),
        });
        setError(formatLlmError(result.error));
        return;
      }

      const generatedAt = new Date().toISOString();
      const cachePersist = await persistParagraphToCache({
        id: paragraphId,
        theme,
        persona,
        generatedAt,
        result: result.value,
      });

      setLastLlmCallStatus({
        ok: true,
        lastProvider: provider,
        at: generatedAt,
      });

      setProviderKeys(mergedKeys);
      setActiveProvider(provider);
      setSettings((prev) =>
        settingsSchema.parse({
          ...prev,
          theme,
          persona,
          length,
        }),
      );
      const payload: ParagraphGeneratePayload = {
        result: result.value,
        recycleWordTexts: recycleWords,
        cachePersist,
      };
      onGenerateSuccess(payload);
    } finally {
      setIsGenerating(false);
    }
  }, [
    apiKey,
    canSubmit,
    isGenerating,
    length,
    onGenerateSuccess,
    persona,
    paragraphId,
    provider,
    providerKeys,
    setActiveProvider,
    setLastLlmCallStatus,
    setProviderKeys,
    setSettings,
    theme,
  ]);

  const signupUrl = PROVIDER_SIGNUP_URL[provider];

  return (
    <div className="min-w-0 pb-8">
      <div className="flex items-center gap-3 text-ui-sm text-foreground">
        <Sun className="size-4" strokeWidth={1.6} />
        <span>Good morning, Neal.</span>
      </div>

      <section className="mt-12 max-w-3xl space-y-4" aria-labelledby="onboard-heading">
        <h1 id="onboard-heading" className="text-headline-1 text-foreground">
          Set up your daily
          <br />
          reading practice.
        </h1>
        <p className="text-body text-secondary">
          Add your private key once. Audiblytics keeps it on this browser only.
        </p>
      </section>

      <section className="mt-8 border-divider border-t pt-6" aria-label="First session setup">
        <div className="max-w-3xl rounded-lg border border-divider bg-surface p-6">
          <div className="mb-6 flex items-center gap-3 text-micro-label text-secondary">
            <KeyRound className="size-5" strokeWidth={1.5} />
            First session setup
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="onboard-provider">Provider</Label>
              <Select
                value={provider}
                onValueChange={(v) => {
                  if (v === null) return;
                  setProvider(v as ActiveProvider);
                  setError(null);
                }}
              >
                <SelectTrigger id="onboard-provider" size="default" className="w-full min-w-0">
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
              <p className="text-caption text-muted-foreground">Free tier — no payment required.</p>
              <p>
                <a
                  href={signupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-ui-sm text-primary underline-offset-4 hover:underline"
                >
                  Get a free key
                  <ExternalLink className="size-4" strokeWidth={1.6} />
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="onboard-api-key">API key</Label>
              <Input
                id="onboard-api-key"
                type="password"
                name="apiKey"
                autoComplete="off"
                autoFocus={needsApiKey}
                disabled={!needsApiKey}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setError(null);
                }}
                className={cn(!needsApiKey && 'opacity-60')}
                placeholder={needsApiKey ? 'Paste your API key' : 'Not required for Ollama'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="onboard-theme">Theme</Label>
              <Select
                value={theme}
                onValueChange={(v) => {
                  if (v === null) return;
                  setTheme(v as Theme);
                }}
              >
                <SelectTrigger id="onboard-theme" className="w-full min-w-0">
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
              <Label htmlFor="onboard-persona">Persona</Label>
              <Select
                value={persona}
                onValueChange={(v) => {
                  if (v === null) return;
                  setPersona(v as Persona);
                }}
              >
                <SelectTrigger id="onboard-persona" className="w-full min-w-0">
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
              <Label htmlFor="onboard-length">Paragraph length</Label>
              <Select
                value={String(length)}
                onValueChange={(v) => {
                  if (v === null) return;
                  setLength(Number(v));
                }}
              >
                <SelectTrigger id="onboard-length" className="w-full min-w-0">
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

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            type="button"
            size="lg"
            className="mt-6 h-12 w-full rounded-lg text-ui-sm text-on-primary hover:text-on-primary sm:w-auto"
            disabled={!canSubmit || isGenerating}
            onClick={() => void handleGenerate()}
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Generating…
              </>
            ) : (
              'Generate'
            )}
          </Button>
        </div>
      </section>
    </div>
  );
}
