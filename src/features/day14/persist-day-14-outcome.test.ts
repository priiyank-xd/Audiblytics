import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';

import { persistDay14Outcome } from '@/features/day14/persist-day-14-outcome';
import { DAY14_STATE_STORAGE_KEY, readDay14State } from '@/lib/storage/use-local-storage';

function installBrowserGlobals(): () => void {
  const storage = new Map<string, string>();

  const prevWindow = (globalThis as { window?: unknown }).window;
  const prevLocalStorage = (globalThis as { localStorage?: unknown }).localStorage;
  const prevDispatch = (globalThis as { dispatchEvent?: unknown }).dispatchEvent;

  const ls = {
    getItem: (k: string) => (storage.has(k) ? storage.get(k)! : null),
    setItem: (k: string, v: string) => {
      storage.set(k, v);
    },
    removeItem: (k: string) => {
      storage.delete(k);
    },
    clear: () => {
      storage.clear();
    },
    key: () => null,
    get length() {
      return storage.size;
    },
  } as Storage;

  (globalThis as { window: typeof globalThis; localStorage: Storage }).window = globalThis as typeof globalThis;
  (globalThis as { localStorage: Storage }).localStorage = ls;
  (globalThis as { dispatchEvent: (e: Event) => boolean }).dispatchEvent = () => true;

  return () => {
    if (prevWindow === undefined) Reflect.deleteProperty(globalThis, 'window');
    else (globalThis as { window: unknown }).window = prevWindow;

    if (prevLocalStorage === undefined) Reflect.deleteProperty(globalThis, 'localStorage');
    else (globalThis as { localStorage: unknown }).localStorage = prevLocalStorage;

    if (prevDispatch === undefined) Reflect.deleteProperty(globalThis, 'dispatchEvent');
    else (globalThis as { dispatchEvent: unknown }).dispatchEvent = prevDispatch;
  };
}

let restoreGlobals: (() => void) | undefined;

beforeEach(() => {
  restoreGlobals = installBrowserGlobals();
});

afterEach(() => {
  restoreGlobals?.();
});

test('persistDay14Outcome: writes fired yes to audiblytics.day14State', () => {
  persistDay14Outcome('yes');
  assert.deepEqual(readDay14State(), { fired: true, result: 'yes' });
  const raw = window.localStorage.getItem(DAY14_STATE_STORAGE_KEY);
  assert(raw?.includes('"fired":true'));
});

test('persistDay14Outcome: writes fired no', () => {
  persistDay14Outcome('no');
  assert.deepEqual(readDay14State(), { fired: true, result: 'no' });
});
