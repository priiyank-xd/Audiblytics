'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react';

import { BackToHomeLink } from '@/components/audiblytics/BackToHomeLink';
import { HardWordsList } from '@/components/audiblytics/HardWordsList';
import { InlineErrorSurface } from '@/components/audiblytics/InlineErrorSurface';
import { TodayParagraphControls } from '@/components/audiblytics/TodayParagraphControls';
import {
  RecordPanel,
  type RecordingAnalysis,
} from '@/components/audiblytics/RecordPanel';
import { Button } from '@/components/ui/button';
import {
  selectFromOfflinePack,
  type OfflinePackError,
} from '@/features/offline-pack/select-from-offline-pack';
import { resolveTodayDisplayParagraph } from '@/features/offline-pack/resolve-today-display-paragraph';
import type { ParagraphGeneratePayload } from '@/features/paragraph/paragraph-generate-payload';
import { useGenerateParagraph } from '@/features/paragraph/use-generate-paragraph';
import { useParagraphOfTheDay } from '@/features/paragraph/use-paragraph-of-the-day';
import { useDay14Trigger } from '@/features/day14/use-day-14-trigger';
import { useStatStreakSurface } from '@/features/calendar/stat-streak-surface-context';
import { useMarkReadIt } from '@/features/calendar/use-mark-read-it';
import {
  filterValidHardWords,
  type ParagraphResult,
} from '@/lib/llm/schemas/paragraph.schema';
import { speak } from '@/lib/audio/tts';
import type { LlmError } from '@/lib/llm/types';
import { ok, type Result } from '@/lib/result';
import { fetchApiSettings, patchApiSettings, type ApiSettings } from '@/lib/api/settings';
import { isApiStorageBackend } from '@/lib/config/storage-backend';
import { useDistinctDayOfUse } from '@/lib/day-counter/use-distinct-day-of-use';
import {
  activeProviderSchema,
  providerKeysSchema,
  type ActiveProvider,
  type ProviderKeys,
} from '@/lib/schemas/provider-keys.schema';
import {
  settingsSchema,
  type Persona,
  type Settings,
  type Theme,
} from '@/lib/schemas/settings.schema';
import { collectionWordSchema } from '@/lib/schemas/collection.schema';
import type { HardWord } from '@/lib/schemas/paragraph-cache.schema';
import { LIVE_QUERY_EMPTY_DEPS } from '@/lib/hooks/live-query-empty-deps';
import { db, safeWrite, type StorageError } from '@/lib/storage/db';
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

function buildPronunciationGuide(word: string): string {
  return word
    .trim()
    .split(/(?=[aeiouy])/i)
    .filter(Boolean)
    .join('-')
    .toUpperCase();
}

function makeAdHocHardWord(word: string, paragraph: string): HardWord {
  return {
    word,
    ipa: word,
    pronunciationGuide: buildPronunciationGuide(word),
    meaning: 'Meaning not generated yet.',
    exampleSentence: paragraph,
  };
}

function getMeaningParts(meaning: string): { partOfSpeech: string | null; gloss: string } {
  const [maybePartOfSpeech, ...rest] = meaning.split('·').map((part) => part.trim());
  if (rest.length === 0) {
    return { partOfSpeech: null, gloss: meaning };
  }
  return { partOfSpeech: maybePartOfSpeech, gloss: rest.join(' · ') };
}

type TodayProps = {
  dayNumber: number;
  settings: Settings;
  onSettingsChange: (next: Settings) => void;
  paragraph: ParagraphResult | null;
  recycledWordKeys: ReadonlySet<string>;
  cachePersistError: StorageError | null;
  applyParagraphGenerateSuccess: (payload: ParagraphGeneratePayload) => void;
  applyOfflinePackParagraph: () => Promise<Result<void, OfflinePackError>>;
  paragraphId: string;
  onParagraphIdChange: (id: string) => void;
  activeProvider: ActiveProvider;
  providerKeys: ProviderKeys;
  paragraphCacheLoading: boolean;
  usedOfflinePackThisSession: boolean;
};

function TodayRouteBody({
  dayNumber,
  settings,
  onSettingsChange,
  paragraph,
  recycledWordKeys,
  cachePersistError,
  applyParagraphGenerateSuccess,
  applyOfflinePackParagraph,
  paragraphId,
  onParagraphIdChange,
  activeProvider,
  providerKeys,
  paragraphCacheLoading,
  usedOfflinePackThisSession,
}: TodayProps) {
  const router = useRouter();
  const day14Trigger = useDay14Trigger();
  const recordPanelAnchorRef = useRef<HTMLDivElement>(null);
  const [llmError, setLlmError] = useState<LlmError | null>(null);
  const [offlinePackError, setOfflinePackError] = useState<OfflinePackError | null>(null);
  const [isApplyingOfflinePack, setIsApplyingOfflinePack] = useState(false);
  const [warmUpOpen, setWarmUpOpen] = useState(false);
  const [paragraphSpeaking, setParagraphSpeaking] = useState(false);
  const [activeWordId, setActiveWordId] = useState<string | null>(null);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [focusWords, setFocusWords] = useState<HardWord[]>([]);
  const [collectionSaveError, setCollectionSaveError] = useState<StorageError | null>(null);
  const [showTips, setShowTips] = useState(false);
  const [recordingAnalysis, setRecordingAnalysis] = useState<RecordingAnalysis | null>(null);
  const warmUpLauncherRef = useRef<HTMLButtonElement>(null);
  const offlinePackCount = useLiveQuery(() => db.offlinePack.count(), LIVE_QUERY_EMPTY_DEPS, undefined);
  const hasOfflinePack = (offlinePackCount ?? 0) > 0;

  const exitWarmUpToToday = useCallback(() => {
    setWarmUpOpen(false);
    requestAnimationFrame(() => {
      warmUpLauncherRef.current?.focus();
    });
  }, []);
  const { generate, isGenerating } = useGenerateParagraph({
    activeProvider,
    providerKeys,
    settings,
    paragraphId,
  });

  const { markReadIt, hasReadIt } = useMarkReadIt({
    paragraphOnScreen: paragraph !== null,
    usedOfflinePackThisSession,
  });

  const handleApplyOfflinePack = useCallback(async () => {
    if (isApplyingOfflinePack || isGenerating) return;
    setOfflinePackError(null);
    setIsApplyingOfflinePack(true);
    const result = await applyOfflinePackParagraph();
    setIsApplyingOfflinePack(false);
    if (!result.ok) {
      setOfflinePackError(result.error);
      return;
    }
    setLlmError(null);
  }, [applyOfflinePackParagraph, isApplyingOfflinePack, isGenerating]);

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

  const handleAddFocusWord = useCallback((word: HardWord) => {
    setFocusWords((current) => {
      if (current.some((entry) => entry.word.toLowerCase() === word.word.toLowerCase())) {
        return current;
      }
      return [...current, word];
    });
  }, []);

  const handleSaveSelectedWord = useCallback(async (word: HardWord) => {
    setCollectionSaveError(null);
    const existing = await db.collection.where('word').equals(word.word).first();
    if (existing) return;

    const draft = collectionWordSchema.parse({
      id: crypto.randomUUID(),
      word: word.word,
      ipa: word.ipa,
      pronunciationGuide: word.pronunciationGuide || word.word,
      meaning: word.meaning,
      exampleSentence: word.exampleSentence,
      savedAt: new Date().toISOString(),
      sourceParagraphId: null,
      reviewCount: 0,
      lastReviewedAt: null,
      difficultyRating: 1,
    });
    const write = await safeWrite(async () => {
      await db.collection.add(draft);
      return draft;
    });
    if (!write.ok) {
      setCollectionSaveError(write.error);
    }
  }, []);

  const handleGenerate = useCallback(
    (opts?: { nextParagraph?: boolean }) => {
      if (isGenerating) return;
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
      }
      setParagraphSpeaking(false);
      setLlmError(null);
      setOfflinePackError(null);
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
    offlinePackError === null &&
    ((paragraphCacheLoading && paragraph === null) || isGenerating);
  const canGenerate =
    llmError === null && offlinePackError === null && !paragraphCacheLoading;
  const showParagraphControls = canGenerate;
  const generatedHardWords = paragraph ? filterValidHardWords(paragraph.hardWords) : [];
  const hardWords = [
    ...generatedHardWords,
    ...focusWords.filter(
      (focusWord) =>
        !generatedHardWords.some(
          (generatedWord) => generatedWord.word.toLowerCase() === focusWord.word.toLowerCase(),
        ),
    ),
  ];
  const selectedWord =
    hardWords.find((word) => `${word.word}-${word.ipa}` === selectedWordId) ??
    (selectedWordId && paragraph
      ? makeAdHocHardWord(selectedWordId, paragraph.paragraph)
      : hardWords[0] ?? null);
  const focusWordKeys = new Set(hardWords.map((word) => word.word.toLowerCase()));
  const paragraphParts = paragraph ? paragraph.paragraph.split(/(\b[\w'-]+\b)/g) : [];
  const selectedMeaning = selectedWord ? getMeaningParts(selectedWord.meaning) : null;

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
            activeProvider={activeProvider}
            isRetrying={isGenerating}
            isUsingOfflinePack={isApplyingOfflinePack}
            hasOfflinePack={hasOfflinePack}
            onRetry={() => void handleGenerate()}
            onOpenSettings={() =>
              router.push(isApiStorageBackend() ? '/settings' : '/settings?focus=provider')
            }
            onUseOfflinePack={() => void handleApplyOfflinePack()}
          />
        ) : null}

        {offlinePackError ? (
          <p className="text-body text-brick" role="alert">
            {offlinePackError.message}
          </p>
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
            {paragraph && day14Trigger === 'no-recording' ? (
              <div
                className="mb-6 rounded-lg border border-divider px-4 py-3"
                role="region"
                aria-label="Day 14 recording reminder"
              >
                <p className="text-body text-secondary italic">
                  You haven&apos;t recorded yet. Try a recording today — your future self wants to hear
                  it.
                </p>
                <Button
                  type="button"
                  variant="link"
                  className="mt-2 h-auto p-0 text-body underline underline-offset-4"
                  onClick={() => {
                    recordPanelAnchorRef.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                    recordPanelAnchorRef.current?.focus();
                  }}
                >
                  Show me how
                </Button>
              </div>
            ) : null}
            <article
              className="rounded-lg border border-divider bg-surface px-6 py-7 md:px-8"
              aria-label={`Today's paragraph, theme: ${themeLabel}`}
            >
              <p className="text-paragraph-hero text-foreground">
                {paragraphParts.map((part, index) => {
                  const isWord = /\b[\w'-]+\b/.test(part);
                  if (!isWord) {
                    return <span key={`${part}-${index}`}>{part}</span>;
                  }
                  const hardWord = hardWords.find(
                    (word) => word.word.toLowerCase() === part.toLowerCase(),
                  );
                  const rowId = hardWord ? `${hardWord.word}-${hardWord.ipa}` : part;
                  const isFocusWord = focusWordKeys.has(part.toLowerCase());
                  return (
                    <button
                      key={`${part}-${index}`}
                      type="button"
                      className={cn(
                        'rounded-sm px-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
                        isFocusWord
                          ? 'bg-surface-elevated text-primary hover:bg-primary-soft'
                          : 'text-foreground hover:bg-surface-elevated hover:text-primary',
                      )}
                      onClick={() => {
                        setSelectedWordId(rowId);
                        if (hardWord) {
                          toggleWordTts(rowId, hardWord.word);
                        }
                      }}
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
                  {hardWords.length} focus words
                </span>
              </div>
            </article>

            {selectedWord && selectedMeaning ? (
              <section
                className="rounded-lg border border-divider bg-surface px-5 py-4"
                aria-label="Selected word"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-caption text-primary">Selected word</p>
                    <h2 className="mt-2 text-headline-3 text-primary">{selectedWord.word}</h2>
                    <p className="mt-1 text-ui-sm text-secondary">
                      Pronounce &quot;{selectedWord.word}&quot; as{' '}
                      <span className="font-semibold text-foreground">
                        {selectedWord.pronunciationGuide || buildPronunciationGuide(selectedWord.word)}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Close selected word"
                    className="rounded-sm text-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                    onClick={() => setSelectedWordId(null)}
                  >
                    <X className="size-5" strokeWidth={1.6} />
                  </button>
                </div>
                <div className="mt-5 space-y-4 text-caption text-secondary">
                  <div>
                    <p className="text-micro-label text-tertiary">Meaning</p>
                    <p className="mt-1 text-ui-sm text-foreground">
                      {selectedMeaning.partOfSpeech ? (
                        <span className="text-secondary">{selectedMeaning.partOfSpeech} · </span>
                      ) : null}
                      {selectedMeaning.gloss}
                    </p>
                  </div>
                  <div>
                    <p className="text-micro-label text-tertiary">Use in a sentence</p>
                    <p className="mt-1 text-ui-sm text-foreground">
                      &quot;{selectedWord.exampleSentence}&quot;
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button type="button" size="sm" onClick={() => handleAddFocusWord(selectedWord)}>
                      Add to Focus Words
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleSaveSelectedWord(selectedWord)}
                    >
                      Save to Collection
                    </Button>
                  </div>
                  {collectionSaveError ? (
                    <InlineErrorSurface
                      variant="storage"
                      error={collectionSaveError}
                      onOpenSettings={() => router.push('/settings')}
                    />
                  ) : null}
                </div>
              </section>
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

        {!showParagraphSkeleton && !paragraph && !llmError && !offlinePackError && !showParagraphControls ? (
          <p className="py-6 text-body text-secondary">
            Generate today&apos;s paragraph when you&apos;re ready. Nothing runs until you tap the button.
          </p>
        ) : null}
          </div>
        </section>

        <aside className="min-w-0 space-y-5 xl:sticky xl:top-6 xl:self-start" aria-label="Today studio">
          <section
            ref={recordPanelAnchorRef}
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
                <span>0:00 / 1:00</span>
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

          <section className="rounded-lg border border-divider bg-surface px-5 py-5" aria-label="Live feedback">
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

          {paragraph && hardWords.length > 0 ? (
            <section className="rounded-lg border border-divider bg-surface px-5 py-5" aria-label="Focus Words">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-ui font-semibold text-foreground">
                  Focus Words{' '}
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
                onToggleWord={(rowId, word) => {
                  setSelectedWordId(rowId);
                  toggleWordTts(rowId, word);
                }}
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
  const apiMode = isApiStorageBackend();
  const [providerKeys] = useLocalStorage(
    'audiblytics.providerKeys',
    providerKeysSchema.parse({}),
    providerKeysSchema,
  );
  const [localActiveProvider] = useLocalStorage(
    'audiblytics.activeProvider',
    'gemini',
    activeProviderSchema,
  );
  const [localSettings, setLocalSettings] = useLocalStorage(
    'audiblytics.settings',
    settingsSchema.parse({}),
    settingsSchema,
  );
  const [apiSettings, setApiSettings] = useState<ApiSettings | null>(null);
  const [settingsReady, setSettingsReady] = useState(!apiMode);

  useEffect(() => {
    if (!apiMode) return;
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
  }, [apiMode]);

  const settings = apiMode ? (apiSettings ?? settingsSchema.parse({})) : localSettings;
  const activeProvider = apiMode ? (apiSettings?.activeProvider ?? 'gemini') : localActiveProvider;

  const handleSettingsChange = useCallback(
    (next: Settings) => {
      if (!apiMode) {
        setLocalSettings(next);
        return;
      }
      void (async () => {
        try {
          const patched = await patchApiSettings(next);
          setApiSettings(patched);
        } catch (e) {
          console.warn('[today] failed to save API settings', e);
        }
      })();
    },
    [apiMode, setLocalSettings],
  );
  const distinctDays = useDistinctDayOfUse();
  const paragraphOfTheDay = useParagraphOfTheDay();
  const cacheHit = paragraphOfTheDay.status === 'hit';

  const [paragraph, setParagraph] = useState<ParagraphResult | null>(null);
  const [paragraphId, setParagraphId] = useState<string>(() => crypto.randomUUID());
  const [offlinePackParagraphId, setOfflinePackParagraphId] = useState<string | null>(null);
  const [usedOfflinePackThisSession, setUsedOfflinePackThisSession] = useState(false);
  const [recycledWordKeys, setRecycledWordKeys] = useState<ReadonlySet<string>>(new Set());
  const [cachePersistError, setCachePersistError] = useState<StorageError | null>(null);
  const applyParagraphGenerateSuccess = useCallback((payload: ParagraphGeneratePayload) => {
    setParagraph(payload.result);
    setRecycledWordKeys(recycleTextsToKeySet(payload.recycleWordTexts));
    setCachePersistError(payload.cachePersist.ok ? null : payload.cachePersist.error);
    setUsedOfflinePackThisSession(false);
    setOfflinePackParagraphId(null);
  }, []);

  const applyOfflinePackParagraph = useCallback(async (): Promise<Result<void, OfflinePackError>> => {
    const result = await selectFromOfflinePack();
    if (!result.ok) {
      return result;
    }
    setParagraph(result.value.paragraph);
    setOfflinePackParagraphId(result.value.id);
    setRecycledWordKeys(new Set());
    setCachePersistError(null);
    setUsedOfflinePackThisSession(true);
    return ok(undefined);
  }, []);

  const dayNumber = Math.max(1, distinctDays);

  const displayParagraph = resolveTodayDisplayParagraph({
    usedOfflinePackThisSession,
    sessionParagraph: paragraph,
    cacheHit,
    cachedParagraph: cacheHit ? paragraphOfTheDay.result : null,
  });
  const displayParagraphId =
    usedOfflinePackThisSession && offlinePackParagraphId !== null
      ? offlinePackParagraphId
      : paragraph !== null
        ? paragraphId
        : cacheHit
          ? paragraphOfTheDay.cached.id
          : paragraphId;
  const displayRecycleKeys = usedOfflinePackThisSession || !cacheHit ? recycledWordKeys : recycleTextsToKeySet([]);
  const paragraphCacheLoading =
    !settingsReady || paragraphOfTheDay.status === 'loading';

  const { setHasParagraphForTodayOnScreen } = useStatStreakSurface();
  useEffect(() => {
    setHasParagraphForTodayOnScreen(displayParagraph !== null);
    return () => setHasParagraphForTodayOnScreen(false);
  }, [displayParagraph, setHasParagraphForTodayOnScreen]);

  if (apiMode && !settingsReady) {
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
      applyOfflinePackParagraph={applyOfflinePackParagraph}
      paragraphId={displayParagraphId}
      onParagraphIdChange={setParagraphId}
      activeProvider={activeProvider}
      providerKeys={providerKeys}
      paragraphCacheLoading={paragraphCacheLoading}
      usedOfflinePackThisSession={usedOfflinePackThisSession}
    />
  );
}
