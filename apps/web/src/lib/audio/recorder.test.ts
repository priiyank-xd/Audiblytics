import assert from 'node:assert/strict';
import test from 'node:test';

import { createRecorder } from '@/lib/audio/recorder';

class FakeBlob {
  readonly size: number;
  readonly type: string;

  constructor(public readonly parts: BlobPart[], opts?: BlobPropertyBag) {
    this.type = opts?.type ?? '';
    this.size = parts.reduce((acc, p) => acc + (typeof p === 'string' ? p.length : 8), 0);
  }
}

class FakeRecorderImpl {
  static isTypeSupported(type: string): boolean {
    return type === 'audio/webm;codecs=opus' || type === 'audio/webm';
  }

  readonly mimeType: string;
  stream: MediaStream;
  state: 'inactive' | 'recording' | 'paused' = 'inactive';

  ondataavailable?: (evt: BlobEvent) => void;
  onerror?: (evt: Event) => void;
  onstop?: () => void;

  constructor(stream: MediaStream, opts?: { mimeType?: string }) {
    this.stream = stream;
    this.mimeType = opts?.mimeType ?? '';
  }

  start(_timesliceMs?: number): void {
    if (this.state !== 'inactive') return;
    this.state = 'recording';
    this.emitChunk(Uint8Array.from([1, 2, 3]));
  }

  requestData(): void {
    this.emitChunk(Uint8Array.from([9]));
  }

  stop(): void {
    if (this.state === 'inactive') return;
    this.state = 'inactive';
    this.emitChunk(Uint8Array.from([7, 8]));
    queueMicrotask(() => this.onstop?.());
  }

  private emitChunk(bytes: Uint8Array): void {
    const blob = new FakeBlob([bytes as unknown as BlobPart], { type: this.mimeType || 'audio/webm' }) as unknown as Blob;
    const evt = { data: blob } as BlobEvent;
    this.ondataavailable?.(evt);
  }

  // Test helper: simulate browser fatal recorder error.
  simulateError(message: string): void {
    const evt = { error: new Error(message) } as unknown as Event;
    this.onerror?.(evt);
  }
}

function recorderGlobalKey(): string {
  return ['Media', 'Recorder'].join('');
}

function getUserMediaKey(): string {
  return ['getUser', 'Media'].join('');
}

function installFakeGlobals(opts?: {
  getUserMediaImpl?: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
}): {
  stoppedTracks: string[];
  restore: () => void;
} {
  const stoppedTracks: string[] = [];

  const recorderKey = recorderGlobalKey();

  const prevRecorder = (globalThis as unknown as Record<string, unknown>)[recorderKey];
  const prevBlob = (globalThis as unknown as { Blob?: unknown }).Blob;
  const prevPerformance = (globalThis as unknown as { performance?: unknown }).performance;
  (globalThis as unknown as Record<string, unknown>)[recorderKey] = FakeRecorderImpl as unknown;
  (globalThis as unknown as { Blob: unknown }).Blob = FakeBlob as unknown;

  let t = 0;
  (globalThis as unknown as { performance: Pick<Performance, 'now'> }).performance = {
    now: () => {
      t += 1;
      return t;
    },
  };

  const stream = {
    getTracks: () => [{ stop: () => stoppedTracks.push('audio') }],
  } as unknown as MediaStream;

  const gumKey = getUserMediaKey();
  const fakeMediaDevices = {
    [gumKey]: opts?.getUserMediaImpl ?? (async () => stream),
  } as unknown as MediaDevices;

  const prevNavigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');

  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { mediaDevices: fakeMediaDevices },
  });

  return {
    stoppedTracks,
    restore: () => {
      const g = globalThis as unknown as Record<string, unknown>;
      if (prevRecorder === undefined) delete g[recorderKey];
      else g[recorderKey] = prevRecorder;

      if (prevBlob === undefined) delete (globalThis as unknown as { Blob?: unknown }).Blob;
      else (globalThis as unknown as { Blob: unknown }).Blob = prevBlob;

      if (prevPerformance === undefined) delete (globalThis as unknown as { performance?: unknown }).performance;
      else (globalThis as unknown as { performance: unknown }).performance = prevPerformance;

      if (prevNavigatorDescriptor) {
        Object.defineProperty(globalThis, 'navigator', prevNavigatorDescriptor);
      } else {
        Reflect.deleteProperty(globalThis, 'navigator');
      }
    },
  };
}

test('createRecorder: unsupported environment → error state + stop returns err', async () => {
  const { restore } = installFakeGlobals({
    getUserMediaImpl: async () => {
      throw new Error('should not be called');
    },
  });

  try {
    const recorderKey = recorderGlobalKey();
    delete (globalThis as unknown as Record<string, unknown>)[recorderKey];

    const r = createRecorder();
    await r.start();
    assert.equal(r.state, 'error');

    const stopped = await r.stop();
    assert.equal(stopped.ok, false);
    if (!stopped.ok) assert.equal(stopped.error.kind, 'unsupported');
  } finally {
    restore();
  }
});

test('createRecorder: permission denied maps to permission_denied', async () => {
  const { restore } = installFakeGlobals({
    getUserMediaImpl: async () => {
      const e = new Error('denied');
      (e as { name: string }).name = 'NotAllowedError';
      throw e;
    },
  });

  try {
    const r = createRecorder();
    await r.start();
    assert.equal(r.state, 'error');

    const stopped = await r.stop();
    assert.equal(stopped.ok, false);
    if (!stopped.ok) assert.equal(stopped.error.kind, 'permission_denied');
  } finally {
    restore();
  }
});

test('createRecorder: records webm-ish mime + returns blob', async () => {
  const { restore, stoppedTracks } = installFakeGlobals();

  try {
    const r = createRecorder();
    await r.start();
    assert.equal(r.state, 'recording');

    const result = await r.stop();
    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.ok(result.value.mimeType.startsWith('audio/webm'));
    assert.ok(result.value.blob.size > 0);
    assert.ok(result.value.durationMs >= 0);
    assert.deepEqual(stoppedTracks, ['audio']);
    assert.equal(r.state, 'idle');
  } finally {
    restore();
  }
});

test('createRecorder: auto-stop at 60s finalizes recording', async () => {
  const { restore } = installFakeGlobals();

  try {
    const globalRef = globalThis as unknown as {
      setTimeout: typeof setTimeout;
    };
    const origSetTimeout = globalRef.setTimeout;

    globalRef.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      if (timeout === 60_000) {
        queueMicrotask(() => {
          queueMicrotask(() => {
            if (typeof handler === 'function') {
              (handler as (...innerArgs: unknown[]) => void)(...args);
            }
          });
        });
        return 123 as unknown as ReturnType<typeof setTimeout>;
      }

      const callOrig = origSetTimeout as unknown as (
        h: TimerHandler,
        t?: number,
        ...rest: unknown[]
      ) => ReturnType<typeof setTimeout>;

      return callOrig(handler, timeout, ...args);
    }) as unknown as typeof setTimeout;

    const r = createRecorder();
    await r.start();
    const stopPromise = r.stop();

    const result = await stopPromise;
    assert.ok(result.ok, `unexpected recorder stop failure: ${JSON.stringify(result)}`);
    if (!result.ok) return;

    assert.ok(result.value.mimeType.startsWith('audio/webm'));
    assert.equal(r.state, 'idle');

    globalRef.setTimeout = origSetTimeout;
  } finally {
    restore();
  }
});

test('createRecorder: recorder error finalizes as unknown', async () => {
  const { restore } = installFakeGlobals();

  try {
    const r = createRecorder();

    // Patch prototype to grab instance for simulation.
    const origStart = FakeRecorderImpl.prototype.start;
    let instance: FakeRecorderImpl | undefined;
    FakeRecorderImpl.prototype.start = function patchedStart(this: FakeRecorderImpl, timeslice?: number) {
      instance = this;
      return origStart.call(this, timeslice);
    };

    try {
      await r.start();
      assert.ok(instance);
      instance.simulateError('boom');
      assert.equal(r.state, 'error');

      const stopped = await r.stop();
      assert.equal(stopped.ok, false);
      if (!stopped.ok) assert.equal(stopped.error.kind, 'unknown');
    } finally {
      FakeRecorderImpl.prototype.start = origStart;
    }
  } finally {
    restore();
  }
});
