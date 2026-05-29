import { DEFAULT_RECORDING_MIME } from '@/lib/audio/play-recording';
import type { Result } from '@/lib/result';
import { err, ok } from '@/lib/result';

export type RecorderState = 'idle' | 'requesting-permission' | 'recording' | 'error';

export type RecorderError = {
  kind: 'permission_denied' | 'unsupported' | 'aborted' | 'unknown';
  message: string;
};

export type Recorder = {
  readonly state: RecorderState;
  start(): Promise<void>;
  stop(): Promise<Result<{ blob: Blob; mimeType: string; durationMs: number }, RecorderError>>;
};

const CAP_MS = 60_000;

function nowMs(): number {
  // Avoid referencing `performance` at module scope (SSR bundling); it's only used at runtime inside APIs.
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

function getBrowserRecorderCtor(): typeof MediaRecorder | null {
  if (typeof MediaRecorder === 'undefined') return null;
  return MediaRecorder;
}

function getMediaDevices(): MediaDevices | null {
  if (typeof navigator === 'undefined') return null;
  const devices = navigator.mediaDevices;
  if (!devices || typeof devices.getUserMedia !== 'function') return null;
  return devices;
}

function pickMimeType(): string {
  const Recorder = getBrowserRecorderCtor();
  if (!Recorder || typeof Recorder.isTypeSupported !== 'function') return '';

  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'] as const;
  for (const candidate of candidates) {
    if (Recorder.isTypeSupported(candidate)) return candidate;
  }

  return '';
}

function mapGetUserMediaError(e: unknown): RecorderError {
  const name =
    typeof e === 'object' && e !== null && 'name' in e && typeof (e as { name?: unknown }).name === 'string'
      ? (e as { name: string }).name
      : 'UnknownError';

  const message =
    typeof e === 'object' && e !== null && 'message' in e && typeof (e as { message?: unknown }).message === 'string'
      ? (e as { message: string }).message
      : 'Microphone permission was denied.';

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return { kind: 'permission_denied', message };
  }

  if (name === 'AbortError') {
    return { kind: 'aborted', message };
  }

  return { kind: 'unknown', message };
}

function stopAllTracks(stream: MediaStream): void {
  for (const track of stream.getTracks()) {
    try {
      track.stop();
    } catch {
      // ignore
    }
  }
}

function resolveRecorderMimeType(mediaRecorder: MediaRecorder, requestedMimeType: string): string {
  const fromRecorder = mediaRecorder.mimeType?.trim();
  if (fromRecorder) return fromRecorder;
  if (requestedMimeType.trim()) return requestedMimeType;
  return '';
}

function resolveBlobMimeType(blob: Blob, recorderMimeType: string, requestedMimeType: string): string {
  const fromBlob = blob.type?.trim();
  if (fromBlob) return fromBlob;
  const fromRecorder = recorderMimeType.trim();
  if (fromRecorder) return fromRecorder;
  const requested = requestedMimeType.trim();
  if (requested) return requested;
  return DEFAULT_RECORDING_MIME;
}

export function createRecorder(): Recorder {
  let state: RecorderState = 'idle';
  let stream: MediaStream | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  let recorderError: RecorderError | null = null;

  let stopAfterPermission = false;

  let chunks: BlobPart[] = [];
  let stopPromiseHandlers: Array<(result: Result<{ blob: Blob; mimeType: string; durationMs: number }, RecorderError>) => void> =
    [];

  let capTimer: ReturnType<typeof setTimeout> | null = null;
  let recordedMimeType = '';

  let recordingStartedAtMs: number | null = null;

  const notifyStopWaiters = (result: Result<{ blob: Blob; mimeType: string; durationMs: number }, RecorderError>) => {
    const waiters = stopPromiseHandlers;
    stopPromiseHandlers = [];
    for (const resolve of waiters) resolve(result);
  };

  const clearCapTimer = () => {
    if (!capTimer) return;
    clearTimeout(capTimer);
    capTimer = null;
  };

  const finalizeError = (error: RecorderError) => {
    clearCapTimer();

    recorderError = error;
    state = 'error';

    if (stream) {
      stopAllTracks(stream);
      stream = null;
    }

    mediaRecorder = null;
    chunks = [];
    recordedMimeType = '';
    recordingStartedAtMs = null;
    stopAfterPermission = false;

    notifyStopWaiters(err(error));
  };

  const finalizeSuccess = (blob: Blob, mimeType: string) => {
    clearCapTimer();

    const durationMs =
      recordingStartedAtMs === null ? 0 : Math.max(0, Math.round(nowMs() - recordingStartedAtMs));

    // Release mic immediately after finalize (matches expected UX + avoids leaked tracks).
    if (stream) {
      stopAllTracks(stream);
      stream = null;
    }

    mediaRecorder = null;
    chunks = [];
    recordedMimeType = '';
    recordingStartedAtMs = null;
    stopAfterPermission = false;

    state = 'idle';
    notifyStopWaiters(ok({ blob, mimeType, durationMs }));
  };

  const recorder: Recorder = {
    get state(): RecorderState {
      return state;
    },

    async start(): Promise<void> {
      if (state === 'recording' || state === 'requesting-permission') return;

      // Reset prior terminal error unless we're actively holding resources (shouldn't happen).
      recorderError = null;
      stopAfterPermission = false;

      const devices = getMediaDevices();
      const RecorderCtor = getBrowserRecorderCtor();

      if (!devices || !RecorderCtor) {
        finalizeError({
          kind: 'unsupported',
          message: 'Recording is not supported in this browser.',
        });
        return;
      }

      state = 'requesting-permission';

      try {
        stream = await devices.getUserMedia({ audio: true });
      } catch (e) {
        finalizeError(mapGetUserMediaError(e));
        return;
      }

      if (stopAfterPermission) {
        stopAfterPermission = false;
        stopAllTracks(stream);
        stream = null;
        finalizeError({ kind: 'aborted', message: 'Recording was canceled before it started.' });
        return;
      }

      const requestedMimeType = pickMimeType();

      try {
        mediaRecorder = requestedMimeType ? new RecorderCtor(stream, { mimeType: requestedMimeType }) : new RecorderCtor(stream);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to start recorder.';
        stopAllTracks(stream);
        stream = null;
        finalizeError({ kind: 'unsupported', message });
        return;
      }

      chunks = [];
      recordedMimeType = resolveRecorderMimeType(mediaRecorder, requestedMimeType);

      mediaRecorder.ondataavailable = (evt: BlobEvent) => {
        if (evt.data && evt.data.size > 0) {
          chunks.push(evt.data);
        }
      };

      mediaRecorder.onerror = (evt: Event) => {
        const message =
          'error' in evt && evt.error instanceof Error
            ? evt.error.message
            : 'Recording failed unexpectedly.';
        finalizeError({ kind: 'unknown', message });
      };

      mediaRecorder.onstop = () => {
        try {
          const blob = new Blob(chunks, { type: recordedMimeType || undefined });
          const mimeType = resolveBlobMimeType(blob, recordedMimeType, requestedMimeType);
          finalizeSuccess(blob, mimeType);
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Failed to finalize recording.';
          finalizeError({ kind: 'unknown', message });
        }
      };

      recordingStartedAtMs = nowMs();
      state = 'recording';

      try {
        // Use a timeslice so `dataavailable` fires during longer recordings.
        mediaRecorder.start(250);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to start recorder.';
        finalizeError({ kind: 'unsupported', message });
        return;
      }

      clearCapTimer();
      capTimer = setTimeout(() => {
        void recorder.stop().catch(() => {
          // Swallow: stop() resolves a Result; errors should not throw for expected flows.
        });
      }, CAP_MS);
    },

    async stop(): Promise<Result<{ blob: Blob; mimeType: string; durationMs: number }, RecorderError>> {
      if (state === 'idle') {
        return err({ kind: 'unknown', message: 'stop() called while idle.' });
      }

      if (state === 'error') {
        return recorderError ? err(recorderError) : err({ kind: 'unknown', message: 'Recorder is in an error state.' });
      }

      if (state === 'requesting-permission') {
        stopAfterPermission = true;
        return err({ kind: 'aborted', message: 'Recording was canceled during microphone permission.' });
      }

      // recording
      if (!mediaRecorder) {
        return err({ kind: 'unknown', message: 'Recorder internal state is inconsistent.' });
      }

      const activeRecorder = mediaRecorder;

      return await new Promise((resolve) => {
        stopPromiseHandlers.push(resolve);

        try {
          if (activeRecorder.state === 'inactive') {
            // Some browsers flip to `inactive` slightly before `onstop` fires; treat as a normal stop path.
            activeRecorder.stop();
            return;
          }

          activeRecorder.requestData?.();
          activeRecorder.stop();
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Failed to stop recorder.';
          finalizeError({ kind: 'unknown', message });
        }
      });
    },
  };

  return recorder;
}
