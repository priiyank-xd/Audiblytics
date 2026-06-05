'use client';

import { useCallback, useEffect, useState } from 'react';

import type { CollectionWord } from '@/lib/schemas/collection.schema';

export type UseReviewSessionResult = {
  currentIndex: number;
  currentWord: CollectionWord | null;
  isRevealed: boolean;
  setRevealed: (revealed: boolean) => void;
  toggleRevealed: () => void;
  reviewedCount: number;
  isComplete: boolean;
  advance: () => void;
};

export function useReviewSession(sessionQueue: CollectionWord[]): UseReviewSessionResult {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  const currentWord = sessionQueue[currentIndex] ?? null;
  const isComplete = sessionQueue.length > 0 && currentIndex >= sessionQueue.length;

  useEffect(() => {
    setIsRevealed(false);
  }, [currentWord?.id]);

  const setRevealed = useCallback((revealed: boolean) => {
    setIsRevealed(revealed);
  }, []);

  const toggleRevealed = useCallback(() => {
    setIsRevealed((r) => !r);
  }, []);

  const advance = useCallback(() => {
    setReviewedCount((c) => c + 1);
    setCurrentIndex((i) => i + 1);
    setIsRevealed(false);
  }, []);

  return {
    currentIndex,
    currentWord,
    isRevealed,
    setRevealed,
    toggleRevealed,
    reviewedCount,
    isComplete,
    advance,
  };
}
