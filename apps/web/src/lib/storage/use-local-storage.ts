'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ZodType } from 'zod';

import { settingsSchema } from '@/lib/schemas/settings.schema';

export const AUDIBLYTICS_STORAGE_SYNC = 'audiblytics-storage-sync' as const;

const SETTINGS_STORAGE_KEY = 'audiblytics.settings' as const;

const defaultSettings = settingsSchema.parse({});

/**
 * Reactive, Zod-validated, cross-tab-synced localStorage hook.
 * Single allowed accessor of `window.localStorage` per AR12.
 *
 * @param key - Must be prefixed `audiblytics.` (per AR11). Throws otherwise.
 * @param defaultValue - Returned when the key is empty OR the stored value fails Zod validation.
 * @param schema - Zod schema used to validate reads. Validation failures log via console.warn.
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  schema: ZodType<T>,
): readonly [T, (value: T | ((prev: T) => T)) => void] {
  if (!key.startsWith('audiblytics.')) {
    throw new Error(
      `useLocalStorage: key '${key}' must be prefixed 'audiblytics.' — see architecture.md § Naming Patterns lines 612–625`,
    );
  }

  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    const pull = () => setValue(readKey(key, defaultValue, schema));
    pull();
    const onCrossTab = (e: StorageEvent) => {
      if (e.key !== key) return;
      pull();
    };
    const onSameTab = (e: Event) => {
      const ce = e as CustomEvent<{ key: string }>;
      if (ce.detail?.key !== key) return;
      pull();
    };
    window.addEventListener('storage', onCrossTab);
    window.addEventListener(AUDIBLYTICS_STORAGE_SYNC, onSameTab);
    return () => {
      window.removeEventListener('storage', onCrossTab);
      window.removeEventListener(AUDIBLYTICS_STORAGE_SYNC, onSameTab);
    };
    // defaultValue + schema are stable references in real usage
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-read only when key changes
  }, [key]);

  const setter = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
          // Defer so same-tab listeners do not setState while another tree is rendering.
          queueMicrotask(() => {
            window.dispatchEvent(
              new CustomEvent(AUDIBLYTICS_STORAGE_SYNC, { detail: { key } }),
            );
          });
        } catch (e) {
          console.error(`[storage] localStorage write failed for '${key}':`, e);
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, setter] as const;
}

/**
 * Synchronous read of persisted `voiceURI` from `audiblytics.settings`.
 * For use outside React (e.g. `getPersistedVoice()` in `lib/audio/tts`).
 * SSR-safe: returns null when `window` is undefined.
 */
export function readPersistedSettingsVoiceUri(): string | null {
  if (typeof window === 'undefined') return null;
  const settings = readKey(SETTINGS_STORAGE_KEY, defaultSettings, settingsSchema);
  return settings.voiceURI;
}

function readKey<T>(key: string, defaultValue: T, schema: ZodType<T>): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return defaultValue;
    const parsed: unknown = JSON.parse(raw);
    const result = schema.safeParse(parsed);
    if (result.success) return result.data;
    console.warn(`[storage] validation failed for '${key}':`, result.error.issues);
    return defaultValue;
  } catch (e) {
    console.warn(`[storage] read failed for '${key}':`, e);
    return defaultValue;
  }
}
