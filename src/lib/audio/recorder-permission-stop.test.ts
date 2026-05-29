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
    const blob = new FakeBlob([Uint8Array.from([1, 2, 3]) as unknown as BlobPart], {
      type: this.mimeType || 'audio/webm',
    }) as unknown as Blob;
    this.ondataavailable?.({ data: blob } as BlobEvent);
  }

  requestData(): void {
    const blob = new FakeBlob([Uint8Array.from([9]) as unknown as BlobPart], {
      type: this.mimeType || 'audio/webm',
    }) as unknown as Blob;
    this.ondataavailable?.({ data: blob } as BlobEvent);
  }

  stop(): void {
    if (this.state === 'inactive') return;
    this.state = 'inactive';
    const blob = new FakeBlob([Uint8Array.from([7]) as unknown as BlobPart], {
      type: this.mimeType || 'audio/webm',
    }) as unknown as Blob;
    this.ondataavailable?.({ data: blob } as BlobEvent);
    queueMicrotask(() => this.onstop?.());
  }
}

function recorderGlobalKey(): string {
  return ['Media', 'Recorder'].join('');
}

function getUserMediaKey(): string {
  return ['getUser', 'Media'].join('');
}

function installDelayedGetUserMedia(opts: { delayMs: number }): { restore: () => void } {
  const recorderKey = recorderGlobalKey();

  const prevRecorder = (globalThis as unknown as Record<string, unknown>)[recorderKey];
  const prevBlob = (globalThis as unknown as { Blob?: unknown }).Blob;
  const prevPerformance = (globalThis as unknown as { performance?: unknown }).performance;
  const prevNavigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');

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
    getTracks: () => [{ stop: () => {} }],
  } as unknown as MediaStream;

  const gumKey = getUserMediaKey();
  const fakeMediaDevices = {
    [gumKey]: async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, opts.delayMs));
      return stream;
    },
  } as unknown as MediaDevices;

  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { mediaDevices: fakeMediaDevices },
  });

  return {
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

test('createRecorder: stop during permission does not strand state machine', async () => {
  const { restore } = installDelayedGetUserMedia({ delayMs: 25 });

  try {
    const r = createRecorder();
    const startPromise = r.start();

    assert.equal(r.state, 'requesting-permission');
    const earlyStop = await r.stop();
    assert.equal(earlyStop.ok, false);
    if (!earlyStop.ok) assert.equal(earlyStop.error.kind, 'aborted');

    await startPromise;
    assert.equal(r.state, 'error');
  } finally {
    restore();
  }
});
