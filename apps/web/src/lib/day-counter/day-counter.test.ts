import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';

import {
  appendServerDaysOfUseCache,
  getCachedServerDaysOfUse,
  invalidateServerDaysOfUseCache,
} from '@/lib/day-counter/days-of-use-server-cache';
import {
  currentStreak,
  dayOfUseAtRecordingSave,
  distinctDaysOfUse,
  recordDayOfUse,
} from '@/lib/day-counter/index';
import { readDaysOfUse, writeDaysOfUse } from '@/lib/storage/use-local-storage';

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
  restoreGlobals = undefined;
});

test('recordDayOfUse: idempotent same UTC day', () => {
  const now = new Date('2026-05-04T12:00:00.000Z');
  recordDayOfUse(now);
  recordDayOfUse(now);
  assert.deepEqual(readDaysOfUse(), ['2026-05-04']);
});

test('recordDayOfUse: appends new UTC day', () => {
  recordDayOfUse(new Date('2026-05-01T00:00:00.000Z'));
  recordDayOfUse(new Date('2026-05-02T00:00:00.000Z'));
  assert.deepEqual(readDaysOfUse(), ['2026-05-01', '2026-05-02']);
});

test('currentStreak: resets on gap (FR57 completion walk)', () => {
  const isComplete = (d: string) => d === '2026-05-04';
  assert.equal(currentStreak(new Date('2026-05-04T12:00:00.000Z'), isComplete), 1);
});

test('currentStreak: counts consecutive complete UTC days including anchor', () => {
  const complete = new Set(['2026-05-02', '2026-05-03', '2026-05-04']);
  const isComplete = (d: string) => complete.has(d);
  assert.equal(currentStreak(new Date('2026-05-04T12:00:00.000Z'), isComplete), 3);
});

test('currentStreak: zero when anchor day not complete', () => {
  const isComplete = (d: string) => d === '2026-05-03';
  assert.equal(currentStreak(new Date('2026-05-04T12:00:00.000Z'), isComplete), 0);
});

test('currentStreak: AC3 gap then today only is 1 day', () => {
  const isComplete = (d: string) => d === '2026-05-09';
  assert.equal(currentStreak(new Date('2026-05-09T12:00:00.000Z'), isComplete), 1);
});

test('dayOfUseAtRecordingSave: first-ever recording is day 1', () => {
  assert.equal(dayOfUseAtRecordingSave(new Date('2026-05-15T12:00:00.000Z')), 1);
});

test('dayOfUseAtRecordingSave: same UTC day reuses current day index', () => {
  recordDayOfUse(new Date('2026-05-15T12:00:00.000Z'));
  assert.equal(dayOfUseAtRecordingSave(new Date('2026-05-15T18:00:00.000Z')), 1);
});

test('dayOfUseAtRecordingSave: new UTC day increments', () => {
  recordDayOfUse(new Date('2026-05-14T12:00:00.000Z'));
  assert.equal(dayOfUseAtRecordingSave(new Date('2026-05-15T12:00:00.000Z')), 2);
});

test('distinctDaysOfUse: counts unique stored dates', () => {
  writeDaysOfUse([
    '2026-01-01',
    '2026-01-02',
    '2026-01-03',
    '2026-01-04',
    '2026-01-05',
    '2026-01-06',
    '2026-01-07',
    '2026-01-08',
    '2026-01-09',
    '2026-01-10',
    '2026-01-11',
    '2026-01-12',
    '2026-01-13',
    '2026-01-14',
  ]);
  assert.equal(distinctDaysOfUse(), 14);
});

test('distinctDaysOfUse: merges local and server cache in api mode', () => {
  const prevBackend = process.env.NEXT_PUBLIC_STORAGE_BACKEND;
  process.env.NEXT_PUBLIC_STORAGE_BACKEND = 'api';
  invalidateServerDaysOfUseCache();

  try {
    appendServerDaysOfUseCache('2026-05-01');
    writeDaysOfUse(['2026-05-02']);
    assert.equal(distinctDaysOfUse(), 2);
  } finally {
    process.env.NEXT_PUBLIC_STORAGE_BACKEND = prevBackend;
    invalidateServerDaysOfUseCache();
  }
});

test('recordDayOfUse: stamps server and updates cache in api mode', async () => {
  const prevBackend = process.env.NEXT_PUBLIC_STORAGE_BACKEND;
  process.env.NEXT_PUBLIC_STORAGE_BACKEND = 'api';
  invalidateServerDaysOfUseCache();

  let postCount = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    if (init?.method === 'POST' && String(input).includes('/days-of-use')) {
      postCount += 1;
      return new Response(JSON.stringify({ utcDate: '2026-05-04' }), { status: 201 });
    }
    return new Response(JSON.stringify([]), { status: 200 });
  };

  try {
    recordDayOfUse(new Date('2026-05-04T12:00:00.000Z'));
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
    assert.equal(postCount, 1);
    assert.deepEqual(readDaysOfUse(), ['2026-05-04']);
    assert.ok(getCachedServerDaysOfUse().includes('2026-05-04'));
    assert.equal(distinctDaysOfUse(), 1);
  } finally {
    globalThis.fetch = originalFetch;
    process.env.NEXT_PUBLIC_STORAGE_BACKEND = prevBackend;
    invalidateServerDaysOfUseCache();
  }
});
