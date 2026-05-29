'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { isRecordingBlobPlayable, playRecordingOnAudio } from '@/lib/audio/play-recording';
import { cancelSpeech, getPersistedVoice, speakAsync } from '@/lib/audio/tts';
import { cn } from '@/lib/utils';

const SILENCE_MS = 1000;

export type CompareModePhase = 'idle' | 'playing_a' | 'gap' | 'playing_b';

export type CompositePlayerCompareSource = {
  recordingId: string;
  blob: Blob;
  mimeType: string;
  ttsFallbackWord: string | null;
};

export type CompositePlayerProps = {
  mode: 'compare';
  sourceA: CompositePlayerCompareSource;
  sourceB: CompositePlayerCompareSource;
  className?: string;
  /** Primary CTA label (default: "Play comparison"). */
  playLabel?: ReactNode;
  onPhaseChange?: (phase: CompareModePhase) => void;
  onClipUnavailable?: (recordingId: string) => void;
  /** Fires at the start of each comparison run (before source A). */
  onComparisonSequenceStart?: () => void;
  onPlaybackComplete?: () => void;
};

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const t = window.setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      window.clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

export function CompositePlayer({
  mode,
  sourceA,
  sourceB,
  className,
  playLabel = 'Play comparison',
  onPhaseChange,
  onClipUnavailable,
  onComparisonSequenceStart,
  onPlaybackComplete,
}: CompositePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const runGenerationRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const [isPlayingComparison, setIsPlayingComparison] = useState(false);

  const setPhase = useCallback(
    (p: CompareModePhase) => {
      onPhaseChange?.(p);
    },
    [onPhaseChange],
  );

  const cleanupAudio = useCallback(() => {
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
  }, []);

  const playBlobToEnd = useCallback(
    (blob: Blob, mimeType: string, signal: AbortSignal): Promise<boolean> => {
      if (!isRecordingBlobPlayable(blob)) return Promise.resolve(false);
      const audio = audioRef.current;
      if (!audio) return Promise.resolve(false);

      if (signal.aborted) return Promise.resolve(false);

      return playRecordingOnAudio(audio, blob, mimeType)
        .then((url) => {
          if (signal.aborted) {
            URL.revokeObjectURL(url);
            cleanupAudio();
            return false;
          }
          objectUrlRef.current = url;

          return new Promise<boolean>((resolve) => {
            const finish = (ok: boolean) => {
              audio.removeEventListener('ended', onEnded);
              audio.removeEventListener('error', onErr);
              signal.removeEventListener('abort', onAbort);
              cleanupAudio();
              resolve(ok);
            };

            const onEnded = () => finish(true);
            const onErr = () => finish(false);
            const onAbort = () => {
              audio.pause();
              finish(false);
            };

            audio.addEventListener('ended', onEnded);
            audio.addEventListener('error', onErr);
            signal.addEventListener('abort', onAbort);
          });
        })
        .catch(() => {
          cleanupAudio();
          return false;
        });
    },
    [cleanupAudio],
  );

  const runOneClip = useCallback(
    async (src: CompositePlayerCompareSource, signal: AbortSignal): Promise<void> => {
      let played = false;
      if (isRecordingBlobPlayable(src.blob)) {
        played = await playBlobToEnd(src.blob, src.mimeType, signal);
      }
      if (played) return;
      if (signal.aborted) return;

      onClipUnavailable?.(src.recordingId);

      const word = src.ttsFallbackWord?.trim();
      if (word) {
        await speakAsync(word, getPersistedVoice() ?? undefined);
      }
    },
    [onClipUnavailable, playBlobToEnd],
  );

  const handlePlayComparison = useCallback(() => {
    if (mode !== 'compare') return;
    runGenerationRef.current += 1;
    const gen = runGenerationRef.current;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    const signal = ac.signal;

    setIsPlayingComparison(true);
    onComparisonSequenceStart?.();
    setPhase('playing_a');

    void (async () => {
      try {
        await runOneClip(sourceA, signal);
        if (signal.aborted || gen !== runGenerationRef.current) return;

        setPhase('gap');
        await delay(SILENCE_MS, signal);
        if (signal.aborted || gen !== runGenerationRef.current) return;

        setPhase('playing_b');
        await runOneClip(sourceB, signal);
      } catch {
        /* aborted gap */
      } finally {
        cancelSpeech();
        cleanupAudio();
        if (isMountedRef.current && gen === runGenerationRef.current) {
          setIsPlayingComparison(false);
          setPhase('idle');
          if (!signal.aborted) {
            onPlaybackComplete?.();
          }
        }
      }
    })();
  }, [
    mode,
    sourceA,
    sourceB,
    runOneClip,
    setPhase,
    cleanupAudio,
    onPlaybackComplete,
    onComparisonSequenceStart,
  ]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      runGenerationRef.current += 1;
      abortRef.current?.abort();
      cancelSpeech();
      cleanupAudio();
    };
  }, [cleanupAudio]);

  if (mode !== 'compare') {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="recording comparison player"
      className={cn('rounded-md border border-divider bg-surface p-4', className)}
    >
      <audio ref={audioRef} className="hidden" />
      <Button type="button" disabled={isPlayingComparison} onClick={handlePlayComparison}>
        {playLabel}
      </Button>
    </div>
  );
}
