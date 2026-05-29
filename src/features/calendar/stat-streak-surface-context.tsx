'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type StatStreakSurfaceValue = {
  hasParagraphForTodayOnScreen: boolean;
  setHasParagraphForTodayOnScreen: (value: boolean) => void;
};

const StatStreakSurfaceContext = createContext<StatStreakSurfaceValue | null>(null);

export function StatStreakSurfaceProvider({ children }: { children: ReactNode }) {
  const [hasParagraphForTodayOnScreen, setHasParagraphForTodayOnScreenState] = useState(false);

  const setHasParagraphForTodayOnScreen = useCallback((value: boolean) => {
    setHasParagraphForTodayOnScreenState(value);
  }, []);

  const value = useMemo(
    () => ({ hasParagraphForTodayOnScreen, setHasParagraphForTodayOnScreen }),
    [hasParagraphForTodayOnScreen, setHasParagraphForTodayOnScreen],
  );

  return <StatStreakSurfaceContext.Provider value={value}>{children}</StatStreakSurfaceContext.Provider>;
}

export function useStatStreakSurface(): StatStreakSurfaceValue {
  const ctx = useContext(StatStreakSurfaceContext);
  if (!ctx) {
    throw new Error('useStatStreakSurface must be used within StatStreakSurfaceProvider');
  }
  return ctx;
}
