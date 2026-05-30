'use client';

import type { ReactNode } from 'react';

import { AuthGate } from '@/components/audiblytics/AuthGate';
import { ProviderKeysGate } from '@/components/audiblytics/ProviderKeysGate';
import { isApiStorageBackend } from '@/lib/config/storage-backend';

export type AppGateProps = {
  children: ReactNode;
};

/** Routes to AuthGate (api backend) or ProviderKeysGate (local backend). */
export function AppGate({ children }: AppGateProps) {
  if (isApiStorageBackend()) {
    return <AuthGate>{children}</AuthGate>;
  }
  return <ProviderKeysGate>{children}</ProviderKeysGate>;
}
