'use client';

import { useCallback, useMemo, useState } from 'react';

import type { CompositePlayerCompareSource } from '@/components/audiblytics/CompositePlayer';
import type { RecordingWithTheme } from '@/features/voice-journal/use-recordings';

export type CompareSources = {
  sourceA: CompositePlayerCompareSource;
  sourceB: CompositePlayerCompareSource;
};

export type UseCompareRecordingsResult = {
  isCompareMode: boolean;
  toggleCompareMode: () => void;
  toggleRowSelection: (recordingId: string) => void;
  /** First selected = source A, second = source B */
  selectedIdA: string | null;
  selectedIdB: string | null;
  canPlayComparison: boolean;
  compareSources: CompareSources | null;
};

function toSource(row: RecordingWithTheme): CompositePlayerCompareSource {
  return {
    recordingId: row.id,
    blob: row.blob,
    mimeType: row.mimeType,
    ttsFallbackWord: row.ttsFallbackWord,
  };
}

/**
 * Voice Journal compare mode: pick up to two recordings (third pick drops the oldest).
 */
export function useCompareRecordings(recordings: RecordingWithTheme[]): UseCompareRecordingsResult {
  const [isCompareMode, setCompareMode] = useState(false);
  const [pickOrder, setPickOrder] = useState<string[]>([]);

  const toggleCompareMode = useCallback(() => {
    setCompareMode((prev) => {
      if (prev) {
        setPickOrder([]);
        return false;
      }
      return true;
    });
  }, []);

  const toggleRowSelection = useCallback((recordingId: string) => {
    setPickOrder((prev) => {
      if (prev.includes(recordingId)) {
        return prev.filter((id) => id !== recordingId);
      }
      if (prev.length < 2) {
        return [...prev, recordingId];
      }
      return [prev[1], recordingId];
    });
  }, []);

  const selectedIdA = pickOrder[0] ?? null;
  const selectedIdB = pickOrder[1] ?? null;

  const compareSources = useMemo(() => {
    if (!selectedIdA || !selectedIdB) return null;
    const rowA = recordings.find((r) => r.id === selectedIdA);
    const rowB = recordings.find((r) => r.id === selectedIdB);
    if (!rowA || !rowB) return null;
    return { sourceA: toSource(rowA), sourceB: toSource(rowB) };
  }, [recordings, selectedIdA, selectedIdB]);

  return {
    isCompareMode,
    toggleCompareMode,
    toggleRowSelection,
    selectedIdA,
    selectedIdB,
    canPlayComparison: Boolean(selectedIdA && selectedIdB && compareSources),
    compareSources,
  };
}
