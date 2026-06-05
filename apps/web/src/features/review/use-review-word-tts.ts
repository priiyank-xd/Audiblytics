'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { cancelSpeech, speak } from '@/lib/audio/tts';

export type UseReviewWordTtsArgs = {
  wordId: string;
  /** Surface string passed to `speak` (FR52). */
  wordText: string;
  /** When false, playback stops (e.g. card not revealed or word changed). */
  allowPlayback: boolean;
};

/**
 * Review flashcard TTS: play/pause chrome, cancel on card/word changes, and
 * `onEnd` bookkeeping without touching `speechSynthesis` outside `tts.ts` (AR20).
 */
export function useReviewWordTts({ wordId, wordText, allowPlayback }: UseReviewWordTtsArgs) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const genRef = useRef(0);

  const stopPlayback = useCallback(() => {
    genRef.current += 1;
    cancelSpeech();
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    stopPlayback();
  }, [wordId, stopPlayback]);

  useEffect(() => {
    if (!allowPlayback) {
      stopPlayback();
    }
  }, [allowPlayback, stopPlayback]);

  const togglePlayPause = useCallback(() => {
    if (isSpeaking) {
      stopPlayback();
      return;
    }
    const gen = ++genRef.current;
    setIsSpeaking(true);
    speak(wordText, undefined, {
      onEnd: () => {
        if (genRef.current === gen) {
          setIsSpeaking(false);
        }
      },
    });
  }, [isSpeaking, stopPlayback, wordText]);

  return { isSpeaking, togglePlayPause, stopPlayback };
}
