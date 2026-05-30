'use client';

import { useCallback, useEffect, useState } from 'react';

export type CardFace = 'front' | 'back';

/**
 * Flip state for a single review card; resets to front when `wordId` changes.
 */
export function useFlashcardState(wordId: string) {
  const [face, setFace] = useState<CardFace>('front');

  useEffect(() => {
    setFace('front');
  }, [wordId]);

  const toggleFlip = useCallback(() => {
    setFace((f) => (f === 'front' ? 'back' : 'front'));
  }, []);

  return {
    face,
    isFront: face === 'front',
    toggleFlip,
  };
}
