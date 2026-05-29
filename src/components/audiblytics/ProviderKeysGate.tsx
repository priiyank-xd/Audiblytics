'use client';

import {
  type ReactNode,
  useCallback,
  useState,
  useSyncExternalStore,
} from 'react';

import { OnboardingShell } from '@/components/audiblytics/OnboardingShell';
import type { ParagraphGeneratePayload } from '@/features/paragraph/paragraph-generate-payload';
import {
  activeProviderSchema,
  providerKeysSchema,
} from '@/lib/schemas/provider-keys.schema';
import { settingsSchema } from '@/lib/schemas/settings.schema';
import { isProviderKeysStoragePresent, useLocalStorage } from '@/lib/storage/use-local-storage';

function BootstrapSkeleton() {
  return (
    <div className="flex min-h-[min(70vh,32rem)] flex-col justify-center gap-3 py-8">
      <div className="h-8 max-w-sm rounded-md bg-muted" />
      <div className="h-24 w-full rounded-xl bg-muted" />
      <div className="h-8 w-2/3 rounded-md bg-muted" />
    </div>
  );
}

export type ProviderKeysGateProps = {
  children: ReactNode;
};

export function ProviderKeysGate({ children }: ProviderKeysGateProps) {
  const [providerKeys, setProviderKeys] = useLocalStorage(
    'audiblytics.providerKeys',
    providerKeysSchema.parse({}),
    providerKeysSchema,
  );
  const [activeProvider, setActiveProvider] = useLocalStorage(
    'audiblytics.activeProvider',
    'gemini',
    activeProviderSchema,
  );
  const [settings, setSettings] = useLocalStorage(
    'audiblytics.settings',
    settingsSchema.parse({}),
    settingsSchema,
  );

  const [onboardingParagraphId] = useState(() => crypto.randomUUID());

  const hasMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  /** Onboarding persists the paragraph cache; descendants load via Dexie. */
  const handleOnboardingParagraphSuccess = useCallback(
    (_payload: ParagraphGeneratePayload): void => {
      void _payload;
    },
    [],
  );

  if (!hasMounted) {
    return <BootstrapSkeleton />;
  }

  if (!isProviderKeysStoragePresent()) {
    return (
      <OnboardingShell
        paragraphId={onboardingParagraphId}
        initialActiveProvider={activeProvider}
        providerKeys={providerKeys}
        setProviderKeys={setProviderKeys}
        setActiveProvider={setActiveProvider}
        settings={settings}
        setSettings={setSettings}
        onGenerateSuccess={handleOnboardingParagraphSuccess}
      />
    );
  }

  return children;
}
