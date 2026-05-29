'use client';

import { useEffect, useState } from 'react';

import { readPersistedSettingsVoiceUri } from '@/lib/storage/use-local-storage';

/**
 * Returns the current browser voice list and re-renders when Chrome completes async voice loading
 * (`voiceschanged`). Initially `[]` when no voices are available yet — supports a “Loading voices…” UI.
 */
export function useVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const synth = window.speechSynthesis;

    const refresh = () => {
      setVoices([...synth.getVoices()]);
    };

    refresh();
    synth.addEventListener('voiceschanged', refresh);
    return () => synth.removeEventListener('voiceschanged', refresh);
  }, []);

  return voices;
}

export type SpeakCallbacks = {
  /** Fired when playback finishes normally, is canceled, or errors (for UI teardown). */
  onEnd?: () => void;
};

/**
 * Stops any in-flight speech without starting a new utterance. Call before review
 * feedback, card changes, or whenever prior audio must not overlap the next `speak`
 * (Story 6.3). `speak` already cancels internally before enqueueing; use this for a
 * hard stop without starting playback.
 */
export function cancelSpeech(): void {
  getSpeechSynthesis()?.cancel();
}

/**
 * Speaks `text` and resolves when the utterance ends, errors, or speech is unavailable.
 * Cancels any in-flight utterance first (same as `speak`).
 */
export function speakAsync(text: string, voice?: SpeechSynthesisVoice): Promise<void> {
  return new Promise((resolve) => {
    speak(text, voice, { onEnd: resolve });
  });
}

/**
 * Speaks `text` immediately (no deliberate delays). Cancels any in-flight utterance first.
 * Voice resolution: explicit `voice` (if still installed) → persisted URI match → default English voice
 * → first available voice. If voices are not loaded yet, omits `utterance.voice` so the engine picks a default.
 *
 * When `speechSynthesis` is missing, `callbacks.onEnd` runs synchronously so callers can reset UI state.
 * Invoke synchronously from user gestures (NFR4); use {@link cancelSpeech} before feedback or card changes
 * when you must stop without starting a new utterance (Story 6.3).
 */
export function speak(text: string, voice?: SpeechSynthesisVoice, callbacks?: SpeakCallbacks): void {
  const synth = getSpeechSynthesis();
  if (!synth) {
    callbacks?.onEnd?.();
    return;
  }

  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const chosen = resolveVoiceForPlayback(voice);
  if (chosen) {
    utterance.voice = chosen;
  }

  const teardown = () => {
    callbacks?.onEnd?.();
  };
  utterance.onend = teardown;
  utterance.onerror = teardown;

  synth.speak(utterance);
}

/**
 * Looks up the voice matching persisted `audiblytics.settings.voiceURI` in the current `getVoices()` list.
 * Returns `null` when missing, invalid storage, or the URI is not offered by this browser.
 */
export function getPersistedVoice(): SpeechSynthesisVoice | null {
  const synth = getSpeechSynthesis();
  if (!synth) return null;

  const uri = readPersistedSettingsVoiceUri();
  if (!uri) return null;

  return synth.getVoices().find((v) => v.voiceURI === uri) ?? null;
}

function getSpeechSynthesis(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null;
  return window.speechSynthesis;
}

function resolveVoiceForPlayback(explicit?: SpeechSynthesisVoice): SpeechSynthesisVoice | null {
  const synth = getSpeechSynthesis();
  if (!synth) return null;

  const voices = synth.getVoices();

  if (explicit) {
    const fromList = voices.find((v) => v.voiceURI === explicit.voiceURI);
    if (fromList) return fromList;
  }

  const persisted = getPersistedVoice();
  if (persisted) return persisted;

  return pickDefaultEnglishVoice(voices);
}

function pickDefaultEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  const english =
    voices.find((v) => v.lang.toLowerCase().startsWith('en')) ?? voices.find((v) => v.default);

  return english ?? voices[0] ?? null;
}
