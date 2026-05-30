'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { WarmUpPhase } from '@/features/warm-up/use-warm-up-state-machine';
import { saveRecording } from '@/features/voice-journal/use-save-recording';
import { createRecorder, type RecorderError } from '@/lib/audio/recorder';
import type { StorageError } from '@/lib/storage/db';
import { buildWarmupRecordingParagraphId } from '@/lib/warmup-recording-id';

type PendingSave = {
  blob: Blob;
  mimeType: string;
  durationMs: number;
  paragraphId: string;
  rowId: string;
};

export type UseWarmUpRecordingArgs = {
  phase: WarmUpPhase;
  phrase: string;
};

export function useWarmUpRecording({ phase, phrase }: UseWarmUpRecordingArgs) {
  const [recorder] = useState(() => createRecorder());

  const paragraphIdPen = buildWarmupRecordingParagraphId(phrase, 'pen');
  const paragraphIdNop = buildWarmupRecordingParagraphId(phrase, 'nop');

  const [recState, setRecState] = useState(recorder.state);
  const activeParagraphIdRef = useRef<string | null>(null);
  const prevPhaseRef = useRef<WarmUpPhase>(phase);

  const [micError, setMicError] = useState<RecorderError | null>(null);
  const [storageError, setStorageError] = useState<StorageError | null>(null);
  const [pendingSave, setPendingSave] = useState<PendingSave | null>(null);
  const [saveRetrying, setSaveRetrying] = useState(false);

  const syncRecorder = useCallback(() => {
    setRecState(recorder.state);
  }, [recorder]);

  const persistStopped = useCallback(
    async (blob: Blob, mimeType: string, durationMs: number, paragraphId: string): Promise<boolean> => {
      const rowId = pendingSave?.rowId ?? crypto.randomUUID();
      const saveResult = await saveRecording({
        rowId,
        blob,
        mimeType,
        durationMs,
        paragraphId,
      });

      if (!saveResult.ok) {
        setStorageError(saveResult.error);
        setPendingSave({
          blob,
          mimeType,
          durationMs,
          paragraphId,
          rowId,
        });
        return false;
      }

      setPendingSave(null);
      setStorageError(null);
      return true;
    },
    [pendingSave?.rowId],
  );

  const stopRecordingAndSave = useCallback(async (): Promise<void> => {
    if (recorder.state !== 'recording') return;

    const paragraphId = activeParagraphIdRef.current;
    const result = await recorder.stop();
    syncRecorder();
    activeParagraphIdRef.current = null;

    if (!result.ok) {
      if (result.error.kind !== 'aborted') {
        setMicError(result.error);
      }
      return;
    }

    if (!paragraphId) {
      return;
    }

    await persistStopped(result.value.blob, result.value.mimeType, result.value.durationMs, paragraphId);
  }, [persistStopped, recorder, syncRecorder]);

  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    if (prev === 'with_pen' && phase !== 'with_pen' && recState === 'recording') {
      if (activeParagraphIdRef.current === paragraphIdPen) {
        void stopRecordingAndSave();
      }
    }
  }, [phase, paragraphIdPen, recState, stopRecordingAndSave]);

  const flushIfNeeded = useCallback(async () => {
    if (recorder.state === 'recording') {
      await stopRecordingAndSave();
    }
  }, [recorder.state, stopRecordingAndSave]);

  const handleRetrySave = useCallback(async () => {
    if (!pendingSave) return;
    if (saveRetrying) return;
    setSaveRetrying(true);
    setStorageError(null);
    const result = await saveRecording({
      rowId: pendingSave.rowId,
      blob: pendingSave.blob,
      mimeType: pendingSave.mimeType,
      durationMs: pendingSave.durationMs,
      paragraphId: pendingSave.paragraphId,
    });
    setSaveRetrying(false);
    if (!result.ok) {
      setStorageError(result.error);
      return;
    }
    setPendingSave(null);
  }, [pendingSave, saveRetrying]);

  const toggleRecordThisPass = useCallback(async () => {
    setMicError(null);
    setStorageError(null);

    if (recState === 'recording') {
      await stopRecordingAndSave();
      return;
    }

    if (phase === 'transition') return;
    if (recState === 'requesting-permission') return;

    const paragraphId = phase === 'with_pen' ? paragraphIdPen : paragraphIdNop;

    await recorder.start();
    syncRecorder();

    if (recorder.state === 'error') {
      const res = await recorder.stop();
      activeParagraphIdRef.current = null;
      if (!res.ok) {
        setMicError(res.error);
      }
      return;
    }

    activeParagraphIdRef.current = paragraphId;
  }, [paragraphIdNop, paragraphIdPen, phase, recState, recorder, stopRecordingAndSave, syncRecorder]);

  const handleTryMicAgain = useCallback(() => {
    setMicError(null);
    void toggleRecordThisPass();
  }, [toggleRecordThisPass]);

  const isRecording = recState === 'recording';
  const isRequesting = recState === 'requesting-permission';
  const recordDisabled =
    phase === 'transition' || isRequesting || (!!pendingSave && !!storageError);

  return {
    flushIfNeeded,
    micError,
    storageError,
    pendingSave,
    saveRetrying,
    handleRetrySave,
    handleTryMicAgain,
    isRecording,
    isRequesting,
    toggleRecordThisPass,
    recordDisabled,
  };
}
