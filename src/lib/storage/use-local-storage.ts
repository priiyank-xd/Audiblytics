'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ZodType } from 'zod';

import { completionsSchema, type Completions } from '@/lib/schemas/completions.schema';
import { day14StateSchema, type Day14State } from '@/lib/schemas/day14-state.schema';
import { daysOfUseSchema, type DaysOfUse } from '@/lib/schemas/days-of-use.schema';
import { settingsSchema, type RetentionPolicy } from '@/lib/schemas/settings.schema';

export const AUDIBLYTICS_STORAGE_SYNC = 'audiblytics-storage-sync' as const;

const DAYS_OF_USE_STORAGE_KEY = 'audiblytics.daysOfUse' as const;
const COMPLETIONS_STORAGE_KEY = 'audiblytics.completions' as const;
export const DAY14_STATE_STORAGE_KEY = 'audiblytics.day14State' as const;

export const PROVIDER_KEYS_STORAGE_KEY = 'audiblytics.providerKeys' as const;

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
          window.dispatchEvent(
            new CustomEvent(AUDIBLYTICS_STORAGE_SYNC, { detail: { key } }),
          );
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

/** Whether `audiblytics.providerKeys` has ever been written (Story 1.8 first-run gate). */
export function isProviderKeysStoragePresent(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(PROVIDER_KEYS_STORAGE_KEY) !== null;
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

/** Synchronous read of `audiblytics.settings.retention` for non-React callers (e.g. prune-on-mount). SSR-safe. */
export function readPersistedSettingsRetention(): RetentionPolicy {
  if (typeof window === 'undefined') return '90-day-rolling';
  return readKey(SETTINGS_STORAGE_KEY, defaultSettings, settingsSchema).retention;
}

const defaultDaysOfUse = daysOfUseSchema.parse([]);
const defaultCompletions = completionsSchema.parse({});
const defaultDay14State = day14StateSchema.parse({});

/** Synchronous read of `audiblytics.daysOfUse` for non-React callers (e.g. `lib/day-counter`). SSR-safe. */
export function readDaysOfUse(): DaysOfUse {
  if (typeof window === 'undefined') return defaultDaysOfUse;
  return readKey(DAYS_OF_USE_STORAGE_KEY, defaultDaysOfUse, daysOfUseSchema);
}

/** Persists `audiblytics.daysOfUse` and notifies `useLocalStorage` subscribers (same-tab). */
export function writeDaysOfUse(next: DaysOfUse): void {
  if (typeof window === 'undefined') return;
  const parsed = daysOfUseSchema.safeParse(next);
  if (!parsed.success) {
    console.warn(`[storage] refused invalid daysOfUse write:`, parsed.error.issues);
    return;
  }
  try {
    window.localStorage.setItem(DAYS_OF_USE_STORAGE_KEY, JSON.stringify(parsed.data));
    window.dispatchEvent(new CustomEvent(AUDIBLYTICS_STORAGE_SYNC, { detail: { key: DAYS_OF_USE_STORAGE_KEY } }));
  } catch (e) {
    console.error(`[storage] localStorage write failed for '${DAYS_OF_USE_STORAGE_KEY}':`, e);
  }
}

/** Synchronous read of `audiblytics.completions` for non-React callers (e.g. `lib/day-counter`). SSR-safe. */
export function readCompletions(): Completions {
  if (typeof window === 'undefined') return defaultCompletions;
  return readKey(COMPLETIONS_STORAGE_KEY, defaultCompletions, completionsSchema);
}

/** Synchronous read of `audiblytics.day14State` for non-React callers. SSR-safe. */
export function readDay14State(): Day14State {
  if (typeof window === 'undefined') return defaultDay14State;
  return readKey(DAY14_STATE_STORAGE_KEY, defaultDay14State, day14StateSchema);
}

/** Persists `audiblytics.day14State` and notifies `useLocalStorage` subscribers (same-tab). */
export function writeDay14State(next: Day14State): void {
  if (typeof window === 'undefined') return;
  const parsed = day14StateSchema.safeParse(next);
  if (!parsed.success) {
    console.warn(`[storage] refused invalid day14State write:`, parsed.error.issues);
    return;
  }
  try {
    window.localStorage.setItem(DAY14_STATE_STORAGE_KEY, JSON.stringify(parsed.data));
    window.dispatchEvent(
      new CustomEvent(AUDIBLYTICS_STORAGE_SYNC, { detail: { key: DAY14_STATE_STORAGE_KEY } }),
    );
  } catch (e) {
    console.error(`[storage] localStorage write failed for '${DAY14_STATE_STORAGE_KEY}':`, e);
  }
}

/** Persists `audiblytics.completions` and notifies `useLocalStorage` subscribers (same-tab). */
export function writeCompletions(next: Completions): void {
  if (typeof window === 'undefined') return;
  const parsed = completionsSchema.safeParse(next);
  if (!parsed.success) {
    console.warn(`[storage] refused invalid completions write:`, parsed.error.issues);
    return;
  }
  try {
    window.localStorage.setItem(COMPLETIONS_STORAGE_KEY, JSON.stringify(parsed.data));
    window.dispatchEvent(new CustomEvent(AUDIBLYTICS_STORAGE_SYNC, { detail: { key: COMPLETIONS_STORAGE_KEY } }));
  } catch (e) {
    console.error(`[storage] localStorage write failed for '${COMPLETIONS_STORAGE_KEY}':`, e);
  }
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
