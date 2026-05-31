/** Fallback when MediaRecorder / Blob omit a type (required for reliable decode in `<audio>`). */
export const DEFAULT_RECORDING_MIME = 'audio/webm';

export type RecordingBlobLike = Blob | ArrayBuffer | ArrayBufferView;

export function resolveRecordingMimeType(mimeType: string, blob?: Blob): string {
  const fromField = mimeType.trim();
  if (fromField) return fromField;
  const fromBlob = blob?.type?.trim() ?? '';
  if (fromBlob) return fromBlob;
  return DEFAULT_RECORDING_MIME;
}

/** Coerces IndexedDB / MediaRecorder payloads into a typed Blob browsers can decode. */
export function coerceRecordingBlob(data: RecordingBlobLike, mimeType: string): Blob {
  const type = resolveRecordingMimeType(mimeType, data instanceof Blob ? data : undefined);

  if (data instanceof Blob) {
    if (data.size === 0) {
      throw new Error('Recording clip is empty.');
    }
    if (data.type === type) {
      return data;
    }
    return new Blob([data], { type });
  }

  const bytes =
    data instanceof ArrayBuffer
      ? new Uint8Array(data)
      : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

  const blob = new Blob([bytes as BlobPart], { type });
  if (blob.size === 0) {
    throw new Error('Recording clip is empty.');
  }
  return blob;
}

/**
 * Attaches a recording to `<audio>`, waits for `canplay`, then starts playback.
 * Resolves with the object URL (caller must revoke when done).
 */
export function playRecordingOnAudio(
  audio: HTMLAudioElement,
  data: RecordingBlobLike,
  mimeType: string,
): Promise<string> {
  const blob = coerceRecordingBlob(data, mimeType);
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const fail = (err: unknown) => {
      cleanup();
      URL.revokeObjectURL(url);
      reject(err instanceof Error ? err : new Error(String(err)));
    };

    const cleanup = () => {
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
    };

    const onCanPlay = () => {
      cleanup();
      void audio.play().then(() => resolve(url)).catch(fail);
    };

    const onError = () => fail(new Error('Audio element failed to decode recording.'));

    audio.addEventListener('canplay', onCanPlay, { once: true });
    audio.addEventListener('error', onError, { once: true });
    audio.src = url;
    audio.load();
  });
}

export function isRecordingBlobPlayable(data: RecordingBlobLike): boolean {
  try {
    return coerceRecordingBlob(data, DEFAULT_RECORDING_MIME).size > 0;
  } catch {
    return false;
  }
}

export type RecordingPlaySource = {
  id: string;
  mimeType: string;
  blob?: Blob;
};

export type RecordingPlaybackHandle = {
  kind: 'blob' | 'remote';
  url: string;
};

/** Presigned GET URL — caller must not revoke. */
export function playRecordingFromUrl(audio: HTMLAudioElement, url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const fail = (err: unknown) => {
      cleanup();
      reject(err instanceof Error ? err : new Error(String(err)));
    };

    const cleanup = () => {
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
    };

    const onCanPlay = () => {
      cleanup();
      void audio.play().then(() => resolve()).catch(fail);
    };

    const onError = () => fail(new Error('Audio element failed to load recording URL.'));

    audio.addEventListener('canplay', onCanPlay, { once: true });
    audio.addEventListener('error', onError, { once: true });
    audio.src = url;
    audio.load();
  });
}

export async function playRecordingItem(
  audio: HTMLAudioElement,
  item: RecordingPlaySource,
  resolvePlaybackUrl: (id: string) => Promise<string>,
): Promise<RecordingPlaybackHandle> {
  if (item.blob && isRecordingBlobPlayable(item.blob)) {
    const url = await playRecordingOnAudio(audio, item.blob, item.mimeType);
    return { kind: 'blob', url };
  }
  const url = await resolvePlaybackUrl(item.id);
  await playRecordingFromUrl(audio, url);
  return { kind: 'remote', url };
}
