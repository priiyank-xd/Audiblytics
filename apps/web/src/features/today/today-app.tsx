'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Sparkles } from 'lucide-react';

import { BackToHomeLink } from '@/components/audiblytics/BackToHomeLink';
import { HardWordsList } from '@/components/audiblytics/HardWordsList';
import { InlineErrorSurface } from '@/components/audiblytics/InlineErrorSurface';
import { TodayParagraphControls } from '@/components/audiblytics/TodayParagraphControls';
import { TodayLiveFeedbackStretch } from '@/components/audiblytics/TodayLiveFeedbackStretch';
import { TodayWordDetailCard } from '@/components/audiblytics/TodayWordDetailCard';
import {
  RecordPanel,
  type RecordingAnalysis,
} from '@/components/audiblytics/RecordPanel';
import { Button } from '@/components/ui/button';
import type { ParagraphGeneratePayload } from '@/features/paragraph/paragraph-generate-payload';
import { useGenerateParagraph } from '@/features/paragraph/use-generate-paragraph';
import { useParagraphOfTheDay } from '@/features/paragraph/use-paragraph-of-the-day';
import { useStatStreakSurface } from '@/features/calendar/stat-streak-surface-context';
import { useCollection } from '@/features/collection/use-collection';
import { useSaveWord } from '@/features/collection/use-save-word';
import { useMarkReadIt } from '@/features/calendar/use-mark-read-it';
import {
  filterValidHardWords,
  type ParagraphResult,
} from '@/lib/llm/schemas/paragraph.schema';
import { speak } from '@/lib/audio/tts';
import type { LlmError } from '@/lib/llm/types';
import { fetchApiSettings, patchApiSettings, type ApiSettings } from '@/lib/api/settings';
import { isStretchUiEnabled } from '@/lib/config/stretch-ui';
import { useDistinctDayOfUse } from '@/lib/day-counter/use-distinct-day-of-use';
import {
  settingsSchema,
  type Persona,
  type Settings,
  type Theme,
} from '@/lib/schemas/settings.schema';
import { practicePrefsSchema } from '@/lib/schemas/practice-prefs.schema';
import {
  applyLastUsedPractice,
  shouldApplyLastUsedOverlay,
} from '@/lib/settings/apply-last-used-practice';
import type { StorageError } from '@/lib/storage/types';
import {
  findHardWordForToken,
  hardWordRowId,
  isWordToken,
  normalizeWordKey,
  splitParagraphTokens,
} from '@/lib/today/hard-word-match';
import {
  isPlainWordEntry,
  resolveWordEntry,
  resolveWordRowId,
} from '@/lib/today/plain-word-entry';
import { useLocalStorage } from '@/lib/storage/use-local-storage';
import { cn } from '@/lib/utils';

const WarmUpDrill = dynamic(
  () => import('@/components/audiblytics/WarmUpDrill').then((m) => ({ default: m.WarmUpDrill })),
  { ssr: false },
);

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

function recycleTextsToKeySet(texts: string[]): ReadonlySet<string> {
  return new Set(texts.map((t) => t.trim().toLowerCase()));
}

function ParagraphZoneSkeleton() {
  return (
    <div
      className="rounded-lg border border-divider bg-surface px-8 py-8"
      aria-busy="true"
    >
      <div className="space-y-3">
        <div className="h-7 rounded-sm bg-cream-dim" />
        <div className="h-7 rounded-sm bg-cream-dim" />
        <div className="h-7 w-4/5 rounded-sm bg-cream-dim" />
        <div className="h-7 w-3/5 rounded-sm bg-cream-dim" />
      </div>
    </div>
  );
}

type TodayProps = {
  dayNumber: number;
  settings: Settings;
  onSettingsChange: (next: Settings) => void;
  paragraph: ParagraphResult | null;
  recycledWordKeys: ReadonlySet<string>;
  cachePersistError: StorageError | null;
  applyParagraphGenerateSuccess: (payload: ParagraphGeneratePayload) => void;
  paragraphId: string;
  onParagraphIdChange: (id: string) => void;
  paragraphCacheLoading: boolean;
};

function TodayRouteBody({
  dayNumber,
  settings,
  onSettingsChange,
  paragraph,
  recycledWordKeys,
  cachePersistError,
  applyParagraphGenerateSuccess,
  paragraphId,
  onParagraphIdChange,
  paragraphCacheLoading,
}: TodayProps) {
  const router = useRouter();
  const [llmError, setLlmError] = useState<LlmError | null>(null);
  const [warmUpOpen, setWarmUpOpen] = useState(false);
  const [paragraphSpeaking, setParagraphSpeaking] = useState(false);
  const [activeWordId, setActiveWordId] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [showTips, setShowTips] = useState(false);
  const collection = useCollection();
  const savedWords = collection ? new Set(collection.map((r) => r.word)) : undefined;
  const { isSaving: isSavingWord, error: saveWordError, saveWord } = useSaveWord();
  const hardWords = paragraph ? filterValidHardWords(paragraph.hardWords) : [];
  const [recordingAnalysis, setRecordingAnalysis] = useState<RecordingAnalysis | null>(null);
  const warmUpLauncherRef = useRef<HTMLButtonElement>(null);

  const exitWarmUpToToday = useCallback(() => {
    setWarmUpOpen(false);
    requestAnimationFrame(() => {
      warmUpLauncherRef.current?.focus();
    });
  }, []);
  const { generate, isGenerating } = useGenerateParagraph({ paragraphId });

  const { markReadIt, hasReadIt } = useMarkReadIt({
    paragraphOnScreen: paragraph !== null,
  });

  const toggleParagraphListen = useCallback(() => {
    if (typeof window === 'undefined' || paragraph === null) return;
    if (paragraphSpeaking) {
      window.speechSynthesis.cancel();
      setParagraphSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    setParagraphSpeaking(true);
    speak(paragraph.paragraph, undefined, {
      onEnd: () => {
        setParagraphSpeaking(false);
      },
    });
  }, [paragraph, paragraphSpeaking]);

  const toggleWordTts = useCallback((rowId: string, word: string) => {
    if (typeof window === 'undefined') return;
    if (activeWordId === rowId) {
      window.speechSynthesis.cancel();
      setActiveWordId(null);
      return;
    }
    window.speechSynthesis.cancel();
    setActiveWordId(rowId);
    speak(word, undefined, {
      onEnd: () => {
        setActiveWordId((current) => (current === rowId ? null : current));
      },
    });
  }, [activeWordId]);

  const handleSelectWord = useCallback(
    (token: string) => {
      const rowId = resolveWordRowId(token, hardWords);
      setSelectedToken(token);
      setSelectedWordId(rowId);
      toggleWordTts(rowId, findHardWordForToken(token, hardWords)?.word ?? token);
    },
    [hardWords, toggleWordTts],
  );

  const handleSelectHardWord = useCallback(
    (_rowId: string, word: string) => {
      handleSelectWord(word);
    },
    [handleSelectWord],
  );

  const handleCloseWordDetail = useCallback(() => {
    if (activeWordId === selectedWordId && typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
      setActiveWordId(null);
    }
    setSelectedToken(null);
    setSelectedWordId(null);
  }, [activeWordId, selectedWordId]);

  const handleGenerate = useCallback(
    (opts?: { nextParagraph?: boolean }) => {
      if (isGenerating) return;
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
      }
      setParagraphSpeaking(false);
      setLlmError(null);
      const targetId = opts?.nextParagraph ? crypto.randomUUID() : paragraphId;
      if (opts?.nextParagraph) {
        onParagraphIdChange(targetId);
      }
      void (async () => {
        const result = await generate({ paragraphId: targetId });
        if (result.ok) {
          applyParagraphGenerateSuccess(result.value);
          return;
        }
        setLlmError(result.error);
      })();
    },
    [applyParagraphGenerateSuccess, generate, isGenerating, onParagraphIdChange, paragraphId],
  );

  const themeLabel = THEME_LABEL[settings.theme];
  const personaLabel = PERSONA_LABEL[settings.persona];
  const showParagraphSkeleton =
    llmError === null &&
    ((paragraphCacheLoading && paragraph === null) || isGenerating);
  const canGenerate = llmError === null && !paragraphCacheLoading;
  const showParagraphControls = canGenerate;
  const selectedWord =
    selectedToken && paragraph
      ? resolveWordEntry(selectedToken, hardWords, paragraph.paragraph)
      : null;
  const paragraphParts = paragraph ? splitParagraphTokens(paragraph.paragraph) : [];

  return (
    <div className="py-4">
      <BackToHomeLink className="text-ui-sm text-foreground" />

      <div className="mt-8 grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <section className="min-w-0 space-y-6" aria-label="Today reading workspace">
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-primary px-5 py-4 text-on-primary shadow-sm"
            role="region"
            aria-label="Today's session"
          >
            <p className="text-ui font-medium">
              Day {dayNumber} of 30 <span aria-hidden>·</span> {themeLabel}{' '}
              <span aria-hidden>·</span> {personaLabel}
            </p>
            <Button
              ref={warmUpLauncherRef}
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0 border-divider bg-surface text-primary hover:bg-surface-elevated"
              aria-label="Warm-Up"
              onClick={() => setWarmUpOpen(true)}
            >
              Warm-Up
            </Button>
          </div>

          {warmUpOpen ? (
            <WarmUpDrill
              onExitToToday={exitWarmUpToToday}
              onOpenSettings={() => router.push('/settings')}
            />
          ) : null}

          {showParagraphControls ? (
            <TodayParagraphControls
              settings={settings}
              onSettingsChange={onSettingsChange}
              mode={paragraph !== null ? 'next' : 'initial'}
              isGenerating={isGenerating}
              disabled={!canGenerate}
              onGenerate={() =>
                void handleGenerate(paragraph !== null ? { nextParagraph: true } : undefined)
              }
              showListen={paragraph !== null}
              isListening={paragraphSpeaking}
              onToggleListen={toggleParagraphListen}
              className="rounded-lg border border-divider bg-surface px-4 py-4"
            />
          ) : null}

          <div className="min-h-48 space-y-6">
        {llmError ? (
          <InlineErrorSurface
            error={llmError}
            isRetrying={isGenerating}
            onRetry={() => void handleGenerate()}
            onOpenSettings={() => router.push('/settings/advanced')}
          />
        ) : null}

        {showParagraphSkeleton ? <ParagraphZoneSkeleton /> : null}

        {!showParagraphSkeleton && paragraph ? (
          <>
            {cachePersistError ? (
              <InlineErrorSurface
                variant="storage"
                error={cachePersistError}
                onOpenSettings={() => router.push('/settings')}
              />
            ) : null}
            <article
              className="rounded-lg border border-divider bg-surface px-6 py-7 md:px-8"
              aria-label={`Today's paragraph, theme: ${themeLabel}`}
            >
              <p className="text-paragraph-hero text-foreground">
                {paragraphParts.map((part, index) => {
                  if (!isWordToken(part)) {
                    return <span key={`${part}-${index}`}>{part}</span>;
                  }
                  const hardWord = findHardWordForToken(part, hardWords);
                  const isSelected =
                    selectedToken !== null &&
                    normalizeWordKey(selectedToken) === normalizeWordKey(part);
                  return (
                    <button
                      key={`${part}-${index}`}
                      type="button"
                      className={cn(
                        'rounded-sm px-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
                        isSelected
                          ? 'bg-primary-soft text-primary'
                          : hardWord
                            ? 'bg-surface-elevated text-primary hover:bg-primary-soft'
                            : 'text-foreground underline decoration-transparent decoration-1 underline-offset-4 hover:bg-surface-elevated hover:decoration-divider',
                      )}
                      onClick={() => handleSelectWord(part)}
                      aria-pressed={isSelected}
                      aria-label={`${part}${hardWord ? ', difficult word' : ''}`}
                    >
                      {part}
                    </button>
                  );
                })}
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-divider pt-4 text-caption text-secondary">
                <div className="inline-flex items-center gap-2">
                  <ChevronRight className="size-4 rotate-180" strokeWidth={1.6} />
                  <span>Current paragraph</span>
                </div>
                <span className="inline-flex items-center gap-2">
                  <span className="size-2 rounded-full bg-primary" aria-hidden />
                  {hardWords.length} difficult {hardWords.length === 1 ? 'word' : 'words'}
                </span>
              </div>
            </article>

            {selectedWord ? (
              <TodayWordDetailCard
                word={selectedWord}
                isPlainWord={isPlainWordEntry(selectedWord)}
                isSpeaking={activeWordId === selectedWordId}
                onSpeak={() => handleSelectHardWord(selectedWordId ?? '', selectedWord.word)}
                onClose={handleCloseWordDetail}
                onSaveToCollection={() => {
                  void saveWord({ entry: selectedWord, sourceParagraphId: paragraphId });
                }}
                isSaving={isSavingWord}
                isSaved={
                  savedWords
                    ? [...savedWords].some(
                        (w) => normalizeWordKey(w) === normalizeWordKey(selectedWord.word),
                      )
                    : false
                }
                saveError={saveWordError}
                onOpenSettings={() => router.push('/settings')}
              />
            ) : null}

            {!hasReadIt ? (
              <div className="flex justify-center border-divider border-t pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-caption text-tertiary"
                  onClick={markReadIt}
                >
                  I read it →
                </Button>
              </div>
            ) : null}
          </>
        ) : null}

        {!showParagraphSkeleton && !paragraph && !llmError && !showParagraphControls ? (
          <p className="py-6 text-body text-secondary">
            Generate today&apos;s paragraph when you&apos;re ready. Nothing runs until you tap the button.
          </p>
        ) : null}
          </div>
        </section>

        <aside className="min-w-0 space-y-5 xl:sticky xl:top-6 xl:self-start" aria-label="Today studio">
          <section
            id="record-panel-region"
            tabIndex={-1}
            className="scroll-mt-4 rounded-lg border border-divider bg-surface outline-none"
            aria-label="Recording studio"
          >
            <div className="flex items-center justify-between gap-3 border-b border-divider px-5 py-4">
              <h2 className="text-ui font-semibold text-foreground">Recording Studio</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                aria-expanded={showTips}
                onClick={() => setShowTips((current) => !current)}
              >
                <Sparkles className="size-4" strokeWidth={1.6} />
                Tips
              </Button>
            </div>
            <div className="px-5 py-5">
              {showTips ? (
                <div className="mb-4 rounded-lg border border-divider bg-surface-elevated px-4 py-3">
                  <p className="text-caption font-semibold text-foreground">Before you record</p>
                  <ul className="mt-2 space-y-1 text-caption text-secondary">
                    <li>Sit close to the mic.</li>
                    <li>Read slower than normal.</li>
                    <li>Pause at punctuation.</li>
                    <li>Keep one clean take per paragraph.</li>
                  </ul>
                </div>
              ) : null}
              <div className="mb-4 flex items-center justify-between text-caption text-secondary">
                <span className="inline-flex items-center gap-2">
                  <span className="size-2 rounded-full bg-primary" aria-hidden />
                  Ready to record
                </span>
                <span>0:00</span>
              </div>
              <RecordPanel
                paragraphId={paragraphId}
                onOpenSettings={() => router.push('/settings')}
                paragraphText={paragraph?.paragraph}
                onAnalysis={setRecordingAnalysis}
                layout="studio"
                className="max-w-none"
              />
            </div>
          </section>

            {isStretchUiEnabled() ? (
              <TodayLiveFeedbackStretch />
            ) : (
              <section
                className="rounded-lg border border-divider bg-surface px-5 py-5"
                aria-label="Reading analysis"
              >
                <h2 className="text-ui font-semibold text-foreground">Reading analysis</h2>
                {recordingAnalysis?.status === 'ready' ? (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-divider px-3 py-3">
                      <p className="text-caption text-secondary">Pace</p>
                      <p className="mt-2 text-ui-sm font-semibold text-primary">
                        {recordingAnalysis.paceWpm} WPM
                      </p>
                    </div>
                    <div className="rounded-lg border border-divider px-3 py-3">
                      <p className="text-caption text-secondary">Accuracy</p>
                      <p className="mt-2 text-ui-sm font-semibold text-primary">
                        {recordingAnalysis.accuracyPercent}%
                      </p>
                    </div>
                    <div className="rounded-lg border border-divider px-3 py-3">
                      <p className="text-caption text-secondary">Missed</p>
                      <p className="mt-2 text-ui-sm font-semibold text-primary">
                        {recordingAnalysis.missedWords.length}
                      </p>
                    </div>
                    {recordingAnalysis.missedWords.length > 0 ? (
                      <p className="col-span-3 text-caption text-secondary">
                        Review: {recordingAnalysis.missedWords.join(', ')}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-3 text-caption text-secondary">
                    {recordingAnalysis?.status === 'unsupported'
                      ? recordingAnalysis.message
                      : 'Record a take to see transcript-based pace and accuracy.'}
                  </p>
                )}
              </section>
            )}

          {paragraph && hardWords.length > 0 ? (
            <section className="rounded-lg border border-divider bg-surface px-5 py-5" aria-label="Difficult Words">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-ui font-semibold text-foreground">
                  Difficult Words{' '}
                  <span className="ml-1 rounded-full bg-surface-elevated px-2 py-0.5 text-caption text-secondary">
                    {hardWords.length}
                  </span>
                </h2>
                <Link
                  href="/collection"
                  className="inline-flex items-center gap-1 text-caption text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                >
                  Collection
                  <ChevronRight className="size-4" strokeWidth={1.6} />
                </Link>
              </div>
              <HardWordsList
                entries={hardWords}
                activeWordId={activeWordId}
                selectedWordId={selectedWordId}
                onToggleWord={handleSelectHardWord}
                sourceParagraphId={paragraphId}
                recycledWordKeys={recycledWordKeys}
                variant="compact"
              />
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

export function TodayApp() {
  const [practicePrefs] = useLocalStorage(
    'audiblytics.practicePrefs',
    practicePrefsSchema.parse({}),
    practicePrefsSchema,
  );
  const [apiSettings, setApiSettings] = useState<ApiSettings | null>(null);
  const [settingsReady, setSettingsReady] = useState(false);
  const lastUsedAppliedRef = useRef(false);
  const [practiceOverlay, setPracticeOverlay] = useState<Pick<
    Settings,
    'theme' | 'persona' | 'length'
  > | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const remote = await fetchApiSettings();
        setApiSettings(remote);
      } catch (e) {
        console.warn('[today] failed to load API settings', e);
      } finally {
        setSettingsReady(true);
      }
    })();
  }, []);

  const baseSettings = apiSettings ?? settingsSchema.parse({});
  const settings =
    practiceOverlay !== null ? { ...baseSettings, ...practiceOverlay } : baseSettings;

  const handleSettingsChange = useCallback((next: Settings) => {
    setPracticeOverlay({
      theme: next.theme,
      persona: next.persona,
      length: next.length,
    });
    void (async () => {
      try {
        const patched = await patchApiSettings(next);
        setApiSettings(patched);
      } catch (e) {
        console.warn('[today] failed to save API settings', e);
      }
    })();
  }, []);

  useEffect(() => {
    if (!settingsReady || lastUsedAppliedRef.current) return;
    lastUsedAppliedRef.current = true;
    if (!shouldApplyLastUsedOverlay(baseSettings, practicePrefs)) return;
    const merged = applyLastUsedPractice(baseSettings, practicePrefs);
    setPracticeOverlay({
      theme: merged.theme,
      persona: merged.persona,
      length: merged.length,
    });
  }, [settingsReady, baseSettings, practicePrefs]);
  const distinctDays = useDistinctDayOfUse();
  const paragraphOfTheDay = useParagraphOfTheDay();
  const cacheHit = paragraphOfTheDay.status === 'hit';

  const [paragraph, setParagraph] = useState<ParagraphResult | null>(null);
  const [paragraphId, setParagraphId] = useState<string>(() => crypto.randomUUID());
  const [recycledWordKeys, setRecycledWordKeys] = useState<ReadonlySet<string>>(new Set());
  const [cachePersistError, setCachePersistError] = useState<StorageError | null>(null);
  const applyParagraphGenerateSuccess = useCallback((payload: ParagraphGeneratePayload) => {
    setParagraph(payload.result);
    setRecycledWordKeys(recycleTextsToKeySet(payload.recycleWordTexts));
    setCachePersistError(payload.cachePersist.ok ? null : payload.cachePersist.error);
  }, []);

  const dayNumber = Math.max(1, distinctDays);

  const displayParagraph = paragraph ?? (cacheHit ? paragraphOfTheDay.result : null);
  const displayParagraphId =
    paragraph !== null ? paragraphId : cacheHit ? paragraphOfTheDay.cached.id : paragraphId;
  const displayRecycleKeys = !cacheHit ? recycledWordKeys : recycleTextsToKeySet([]);
  const paragraphCacheLoading =
    !settingsReady || paragraphOfTheDay.status === 'loading';

  const { setHasParagraphForTodayOnScreen } = useStatStreakSurface();
  useEffect(() => {
    setHasParagraphForTodayOnScreen(displayParagraph !== null);
    return () => setHasParagraphForTodayOnScreen(false);
  }, [displayParagraph, setHasParagraphForTodayOnScreen]);

  if (!settingsReady) {
    return <ParagraphZoneSkeleton />;
  }

  return (
    <TodayRouteBody
      dayNumber={dayNumber}
      settings={settings}
      onSettingsChange={handleSettingsChange}
      paragraph={displayParagraph}
      recycledWordKeys={displayRecycleKeys}
      cachePersistError={cacheHit ? null : cachePersistError}
      applyParagraphGenerateSuccess={applyParagraphGenerateSuccess}
      paragraphId={displayParagraphId}
      onParagraphIdChange={setParagraphId}
      paragraphCacheLoading={paragraphCacheLoading}
    />
  );
}
