'use client';

import type { ReactNode } from 'react';

import { AuthGate } from '@/components/audiblytics/AuthGate';

export type AppGateProps = {
  children: ReactNode;
};

export function AppGate({ children }: AppGateProps) {
  return <AuthGate>{children}</AuthGate>;
}
