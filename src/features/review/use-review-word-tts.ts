'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { cancelSpeech, speak } from '@/lib/audio/tts';

export type UseReviewWordTtsArgs = {
  wordId: string;
  /** Surface string passed to `speak` (FR52). */
  wordText: string;
  /** True while the flashcard shows the back (IPA / controls). */
  backFaceActive: boolean;
};

/**
 * Review flashcard TTS: play/pause chrome, cancel on card/word/face changes, and
 * `onEnd` bookkeeping without touching `speechSynthesis` outside `tts.ts` (AR20).
 */
export function useReviewWordTts({ wordId, wordText, backFaceActive }: UseReviewWordTtsArgs) {
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
    if (!backFaceActive) {
      stopPlayback();
    }
  }, [backFaceActive, stopPlayback]);

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
