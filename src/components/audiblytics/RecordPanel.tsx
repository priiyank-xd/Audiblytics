'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Mic, Pause, Play, Square } from 'lucide-react';

import { CompositePlayer } from '@/components/audiblytics/CompositePlayer';
import { InlineErrorSurface } from '@/components/audiblytics/InlineErrorSurface';
import { Button } from '@/components/ui/button';
import { saveRecording } from '@/features/voice-journal/use-save-recording';
import { playRecordingOnAudio } from '@/lib/audio/play-recording';
import { createRecorder, type RecorderError } from '@/lib/audio/recorder';
import type { VoiceRecording } from '@/lib/schemas/recording.schema';
import type { StorageError } from '@/lib/storage/db';
import { db } from '@/lib/storage/db';
import { cn } from '@/lib/utils';

const MIC_DENIED_COPY =
  'Microphone access is required to record. Click the lock icon in your address bar, then try again.';

const CAP_MS = 60_000;
const WAVEFORM_BAR_CLASSES = ['h-2', 'h-4', 'h-3', 'h-5', 'h-6', 'h-8', 'h-5', 'h-7'];

export type RecordingAnalysis =
  | {
      status: 'unsupported';
      message: string;
    }
  | {
      status: 'ready';
      transcript: string;
      paceWpm: number;
      accuracyPercent: number;
      missedWords: string[];
    };

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function formatTimer(ms: number): string {
  const clamped = Math.min(Math.max(0, ms), CAP_MS);
  const totalSec = Math.floor(clamped / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDurationLabel(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function isSameLocalCalendarDay(isoUtc: string, ref: Date = new Date()): boolean {
  const d = new Date(isoUtc);
  return (
    d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate()
  );
}

function formatLocalTime(isoUtc: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(isoUtc));
}

export type RecordPanelProps = {
  paragraphId: string;
  onOpenSettings: () => void;
  paragraphText?: string;
  onAnalysis?: (analysis: RecordingAnalysis) => void;
  className?: string;
  /** `rail` puts the record button left of today's recordings (Today side column). */
  layout?: 'default' | 'rail' | 'studio';
};

type PendingSave = {
  blob: Blob;
  mimeType: string;
  durationMs: number;
  paragraphId: string;
  rowId: string;
};

export function RecordPanel({
  paragraphId,
  onOpenSettings,
  paragraphText,
  onAnalysis,
  className,
  layout = 'default',
}: RecordPanelProps) {
  const [recorder] = useState(() => createRecorder());

  const [recState, setRecState] = useState(recorder.state);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [announceText, setAnnounceText] = useState('');
  const lastAnnouncedSecRef = useRef(-1);
  const recordingStartedAtRef = useRef<number | null>(null);

  const [micError, setMicError] = useState<RecorderError | null>(null);
  const [storageError, setStorageError] = useState<StorageError | null>(null);
  const [pendingSave, setPendingSave] = useState<PendingSave | null>(null);
  const [saveRetrying, setSaveRetrying] = useState(false);

  const [playingId, setPlayingId] = useState<string | null>(null);
  const [replacement, setReplacement] = useState<PendingSave | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef('');

  const syncRecorder = useCallback(() => {
    setRecState(recorder.state);
  }, [recorder]);

  const todaysRecordings = useLiveQuery(
    async () => {
      const rows = await db.recordings.where('paragraphId').equals(paragraphId).toArray();
      const todayRows = rows.filter((r) => isSameLocalCalendarDay(r.recordingDate));
      todayRows.sort((a, b) => new Date(b.recordingDate).getTime() - new Date(a.recordingDate).getTime());
      return todayRows;
    },
    [paragraphId],
    [],
  );

  useEffect(() => {
    if (recState !== 'recording') return;
    const id = window.setInterval(() => {
      syncRecorder();
      if (recordingStartedAtRef.current === null) return;
      setElapsedMs(Math.min(CAP_MS, Date.now() - recordingStartedAtRef.current));
    }, 200);
    return () => window.clearInterval(id);
  }, [recState, recorder, syncRecorder]);

  useEffect(() => {
    if (recState !== 'recording') {
      lastAnnouncedSecRef.current = -1;
      return;
    }
    const sec = Math.floor(elapsedMs / 1000);
    if (sec !== lastAnnouncedSecRef.current && sec > 0) {
      lastAnnouncedSecRef.current = sec;
      setAnnounceText(`Recording, ${sec} second${sec === 1 ? '' : 's'} elapsed`);
    }
  }, [elapsedMs, recState]);

  const stopPlayback = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.removeAttribute('src');
      a.load();
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPlayingId(null);
  }, []);

  useEffect(() => () => stopPlayback(), [stopPlayback]);

  const handleToggleRecord = useCallback(async () => {
    setMicError(null);
    setStorageError(null);

    if (recState === 'recording') {
      const result = await recorder.stop();
      syncRecorder();
      recordingStartedAtRef.current = null;
      setElapsedMs(0);
      if (!result.ok) {
        if (result.error.kind !== 'aborted') {
          setMicError(result.error);
        }
        return;
      }

      const rowId = pendingSave?.rowId ?? crypto.randomUUID();
      const candidate = {
        blob: result.value.blob,
        mimeType: result.value.mimeType,
        durationMs: result.value.durationMs,
        paragraphId,
        rowId,
      };
      recognitionRef.current?.stop();
      recognitionRef.current = null;

      if (paragraphText && onAnalysis) {
        onAnalysis(analyzeTranscript({
          paragraphText,
          transcript: transcriptRef.current,
          durationMs: result.value.durationMs,
        }));
      }

      const existingRows = await db.recordings.where('paragraphId').equals(paragraphId).toArray();
      if (existingRows.length > 0 && pendingSave === null) {
        setReplacement(candidate);
        return;
      }

      const saveResult = await saveRecording({
        rowId,
        blob: result.value.blob,
        mimeType: result.value.mimeType,
        durationMs: result.value.durationMs,
        paragraphId,
      });

      if (!saveResult.ok) {
        setStorageError(saveResult.error);
        setPendingSave({
          blob: result.value.blob,
          mimeType: result.value.mimeType,
          durationMs: result.value.durationMs,
          paragraphId,
          rowId,
        });
        return;
      }

      setPendingSave(null);
      return;
    }

    if (recState === 'requesting-permission') return;

    transcriptRef.current = '';
    const recognition = createSpeechRecognition();
    if (recognition) {
      recognitionRef.current = recognition;
      recognition.onresult = (event) => {
        const chunks: string[] = [];
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          chunks.push(event.results[i][0].transcript);
        }
        transcriptRef.current = `${transcriptRef.current} ${chunks.join(' ')}`.trim();
      };
      recognition.onerror = () => {
        recognitionRef.current = null;
      };
      try {
        recognition.start();
      } catch {
        recognitionRef.current = null;
        if (onAnalysis) {
          onAnalysis({
            status: 'unsupported',
            message: 'Speech analysis could not start in this browser.',
          });
        }
      }
    } else if (onAnalysis) {
      onAnalysis({
        status: 'unsupported',
        message: 'Speech analysis is not available in this browser.',
      });
    }

    await recorder.start();
    syncRecorder();

    if (recorder.state === 'error') {
      const res = await recorder.stop();
      recordingStartedAtRef.current = null;
      setElapsedMs(0);
      if (!res.ok) {
        setMicError(res.error);
      }
      return;
    }

    recordingStartedAtRef.current = Date.now();
    setElapsedMs(0);
  }, [onAnalysis, paragraphId, paragraphText, pendingSave, recState, recorder, syncRecorder]);

  const handleKeepPrevious = useCallback(() => {
    setReplacement(null);
  }, []);

  const handleReplacePrevious = useCallback(async () => {
    if (!replacement) return;
    setStorageError(null);
    const deleteResult = await safeDeleteParagraphRecordings(paragraphId);
    if (!deleteResult.ok) {
      setStorageError(deleteResult.error);
      return;
    }
    const saveResult = await saveRecording({
      rowId: replacement.rowId,
      blob: replacement.blob,
      mimeType: replacement.mimeType,
      durationMs: replacement.durationMs,
      paragraphId: replacement.paragraphId,
    });
    if (!saveResult.ok) {
      setStorageError(saveResult.error);
      setPendingSave(replacement);
      return;
    }
    setReplacement(null);
  }, [paragraphId, replacement]);

  const handleRetrySave = useCallback(async () => {
    if (!pendingSave) return;
    if (saveRetrying) return;
    setSaveRetrying(true);
    setStorageError(null);
    const result = await saveRecording({
      rowId: pendingSave.rowId,
      blob: pendingSave.blob,
      mimeType: pendingSave.mimeType,
      durationMs: pendingSave.durationMs,
      paragraphId: pendingSave.paragraphId,
    });
    setSaveRetrying(false);
    if (!result.ok) {
      setStorageError(result.error);
      return;
    }
    setPendingSave(null);
  }, [pendingSave, saveRetrying]);

  const handleTryMicAgain = useCallback(() => {
    setMicError(null);
    void handleToggleRecord();
  }, [handleToggleRecord]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== 'r' && e.key !== 'R') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.preventDefault();
      void handleToggleRecord();
    },
    [handleToggleRecord],
  );

  const toggleRowPlayback = useCallback(
    (row: VoiceRecording) => {
      if (playingId === row.id) {
        stopPlayback();
        return;
      }
      stopPlayback();
      const a = audioRef.current;
      if (!a) return;
      void (async () => {
        try {
          const url = await playRecordingOnAudio(a, row.blob, row.mimeType);
          objectUrlRef.current = url;
          setPlayingId(row.id);
        } catch (e) {
          console.warn('[RecordPanel] playback failed', e);
          stopPlayback();
        }
      })();
    },
    [playingId, stopPlayback],
  );

  const isRecording = recState === 'recording';
  const isRequesting = recState === 'requesting-permission';
  const showStop = isRecording;
  const disabled = isRequesting || (!!pendingSave && !!storageError);

  const isRail = layout === 'rail';
  const isStudio = layout === 'studio';
  const timerLabel = useMemo(
    () => (isRail ? formatTimer(elapsedMs) : `${formatTimer(elapsedMs)} / 1:00`),
    [elapsedMs, isRail],
  );

  const recordButton = (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={showStop}
      aria-label={showStop ? 'Stop recording' : 'Start recording'}
      onClick={() => void handleToggleRecord()}
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-full text-primary-foreground transition-colors',
        isStudio ? 'size-20 ring-8 ring-primary-soft' : 'size-14',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
        showStop
          ? 'bg-danger hover:bg-danger-hover animate-pulse motion-reduce:animate-none motion-reduce:bg-danger-hover'
          : 'bg-primary hover:bg-primary-hover',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      {showStop ? (
        <Square className="size-6 fill-current" strokeWidth={0} aria-hidden />
      ) : isStudio ? (
        <Mic className="size-8" strokeWidth={1.8} aria-hidden />
      ) : (
        <span className="block size-5 rounded-full bg-primary-foreground" aria-hidden />
      )}
    </button>
  );

  const recordControls = (
    <div className={cn('flex flex-col gap-2', isRail ? 'shrink-0 items-center' : 'items-center')}>
      {recordButton}
      <p className={cn('text-center font-mono text-caption text-primary', isStudio && 'sr-only')}>
        Tap to record this read
      </p>
      <p className="font-mono text-body text-primary" aria-live="off">
        {timerLabel}
      </p>
      <p className="sr-only" aria-live="polite">
        {announceText}
      </p>
    </div>
  );

  const recordingsList =
    todaysRecordings.length > 0 && !isStudio ? (
      <ul
        className={cn(
          'space-y-1',
          isRail ? 'min-w-0 flex-1' : 'mt-8 w-full space-y-2 border-divider border-t pt-4',
        )}
        aria-label="Recordings from today"
      >
        {todaysRecordings.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              className={cn(
                'flex items-center gap-2 rounded-md text-left font-mono text-caption text-primary transition-colors hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
                isRail ? 'w-full py-1.5' : 'w-full px-2 py-2',
              )}
              onClick={() => toggleRowPlayback(row)}
            >
              {playingId === row.id ? (
                <Pause className="size-4 shrink-0 text-tertiary" aria-hidden />
              ) : (
                <Play className="size-4 shrink-0 text-tertiary" aria-hidden />
              )}
              <span>
                {formatDurationLabel(row.durationMs)}
                <span className="text-tertiary" aria-hidden>
                  {' '}
                  ·{' '}
                </span>
                <time dateTime={row.recordingDate} title={`Recorded at ${formatLocalTime(row.recordingDate)}`}>
                  {formatLocalTime(row.recordingDate)}
                </time>
              </span>
            </button>
          </li>
        ))}
      </ul>
    ) : null;

  const comparisonPlayer =
    todaysRecordings.length >= 2 ? (
      <CompositePlayer
        mode="compare"
        sourceA={{
          recordingId: todaysRecordings[1].id,
          blob: todaysRecordings[1].blob,
          mimeType: todaysRecordings[1].mimeType,
          ttsFallbackWord: null,
        }}
        sourceB={{
          recordingId: todaysRecordings[0].id,
          blob: todaysRecordings[0].blob,
          mimeType: todaysRecordings[0].mimeType,
          ttsFallbackWord: null,
        }}
        playLabel="Compare last two"
        className={cn(isRail ? 'mt-3 p-3' : 'mt-4')}
        onComparisonSequenceStart={stopPlayback}
      />
    ) : null;

  return (
    <section
      className={cn(
        'mx-auto w-full max-w-[640px] outline-none',
        isRail || isStudio ? 'mt-0' : 'mt-8',
        className,
      )}
      tabIndex={0}
      role="group"
      aria-label="Record your read"
      onKeyDown={handleKeyDown}
    >
      <audio ref={audioRef} className="hidden" onEnded={() => stopPlayback()} />

      {isStudio ? (
        <div className="space-y-5">
          <div className="flex items-center justify-center gap-10">
            {recordControls}
            <button
              type="button"
              disabled={!showStop}
              aria-label="Stop recording"
              onClick={() => void handleToggleRecord()}
              className={cn(
                'flex size-14 items-center justify-center rounded-full border border-divider text-secondary transition-colors',
                'hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
                !showStop && 'cursor-not-allowed opacity-60',
              )}
            >
              <Square className="size-4 fill-current" strokeWidth={0} aria-hidden />
            </button>
          </div>
          <div className="flex h-12 items-center justify-center gap-1 text-primary-soft" aria-hidden="true">
            {Array.from({ length: 34 }, (_, index) => (
              <span
                key={index}
                className={cn('w-1 rounded-full bg-primary-soft', WAVEFORM_BAR_CLASSES[index % WAVEFORM_BAR_CLASSES.length])}
              />
            ))}
          </div>
          {recordingsList}
          {comparisonPlayer}
        </div>
      ) : isRail ? (
        <div className="flex items-start gap-4">
          {recordControls}
          <div className="min-w-0 flex-1">
            {recordingsList}
            {comparisonPlayer}
          </div>
        </div>
      ) : (
        <>
          {recordControls}
          {recordingsList}
          {comparisonPlayer}
        </>
      )}

      {micError && micError.kind === 'permission_denied' ? (
        <div className={cn('space-y-3', isRail ? 'mt-4' : 'mt-6 text-center')} role="status">
          <p className="text-body text-secondary">{MIC_DENIED_COPY}</p>
          <Button type="button" variant="outline" onClick={handleTryMicAgain}>
            Try Again
          </Button>
        </div>
      ) : micError ? (
        <div className={cn('space-y-3', isRail ? 'mt-4' : 'mt-6 text-center')} role="status">
          <p className="text-body text-secondary">{micError.message}</p>
          <Button type="button" variant="outline" onClick={handleTryMicAgain}>
            Try Again
          </Button>
        </div>
      ) : null}

      {storageError && pendingSave ? (
        <div className={isRail ? 'mt-4' : 'mt-6'}>
          <InlineErrorSurface
            variant="storage"
            error={storageError}
            isRetrying={saveRetrying}
            onRetry={() => void handleRetrySave()}
            onOpenSettings={onOpenSettings}
          />
        </div>
      ) : null}

      {replacement ? (
        <div className="mt-4 rounded-lg border border-divider bg-surface-elevated px-4 py-3" role="status">
          <p className="text-caption text-secondary">
            This paragraph already has a recording. Keep the previous take or replace it with this one?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleKeepPrevious}>
              Keep previous
            </Button>
            <Button type="button" size="sm" onClick={() => void handleReplacePrevious()}>
              Replace with this one
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function createSpeechRecognition(): SpeechRecognitionLike | null {
  if (typeof window === 'undefined') return null;
  const win = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  const Ctor = win.SpeechRecognition ?? win.webkitSpeechRecognition;
  if (!Ctor) return null;
  const recognition = new Ctor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  return recognition;
}

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z'\s-]/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

function analyzeTranscript(input: {
  paragraphText: string;
  transcript: string;
  durationMs: number;
}): RecordingAnalysis {
  const spoken = normalizeWords(input.transcript);
  if (spoken.length === 0) {
    return {
      status: 'unsupported',
      message: 'No transcript was captured. Try Chrome or Edge for browser speech analysis.',
    };
  }
  const expected = normalizeWords(input.paragraphText);
  const spokenSet = new Set(spoken);
  const missedWords = expected.filter((word) => !spokenSet.has(word)).slice(0, 8);
  const matchedCount = expected.filter((word) => spokenSet.has(word)).length;
  const accuracyPercent = expected.length > 0 ? Math.round((matchedCount / expected.length) * 100) : 0;
  const minutes = Math.max(input.durationMs / 60_000, 1 / 60);

  return {
    status: 'ready',
    transcript: input.transcript,
    paceWpm: Math.round(spoken.length / minutes),
    accuracyPercent,
    missedWords,
  };
}

async function safeDeleteParagraphRecordings(paragraphId: string) {
  try {
    await db.recordings.where('paragraphId').equals(paragraphId).delete();
    return { ok: true, value: undefined } as const;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: { kind: 'unknown', message } } as const;
  }
}
