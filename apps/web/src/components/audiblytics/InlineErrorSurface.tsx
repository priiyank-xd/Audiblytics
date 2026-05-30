'use client';

import { AlertCircle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { StorageError } from '@/lib/storage/db';
import type { ActiveProvider } from '@/lib/schemas/provider-keys.schema';
import type { LlmError } from '@/lib/llm/types';
import { cn } from '@/lib/utils';

const PROVIDER_LABEL: Record<ActiveProvider, string> = {
  gemini: 'Gemini',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  openrouter: 'OpenRouter',
  ollama: 'Ollama',
};

function failureSummary(err: LlmError): string {
  switch (err.kind) {
    case 'rate_limit':
      return 'Rate limited';
    case 'quota_exceeded':
      return 'Quota exceeded';
    case 'auth':
      return 'Could not authenticate';
    case 'network':
      return 'Network error';
    case 'malformed_response':
      return 'Unexpected response';
    case 'unknown':
      return 'Request failed';
    default: {
      const _exhaustive: never = err;
      return _exhaustive;
    }
  }
}

export type InlineErrorSurfaceProps = {
  className?: string;
} & (
  | {
      variant?: 'llm';
      error: LlmError;
      activeProvider: ActiveProvider;
      isRetrying: boolean;
      isUsingOfflinePack?: boolean;
      hasOfflinePack?: boolean;
      onRetry: () => void;
      onOpenSettings: () => void;
      onUseOfflinePack?: () => void | Promise<void>;
    }
  | {
      variant: 'storage';
      error: StorageError;
      onOpenSettings: () => void;
      onRetry?: () => void;
      isRetrying?: boolean;
    }
);

export function InlineErrorSurface({
  variant,
  error,
  onOpenSettings,
  className,
  ...rest
}: InlineErrorSurfaceProps) {
  if (variant === 'storage') {
    const storageError = error as StorageError;
    const { onRetry, isRetrying } = rest as { onRetry?: () => void; isRetrying?: boolean };
    const headline = "Storage · Couldn’t save";
    const detail = storageError.kind === 'quota_exceeded' ? 'Storage quota exceeded.' : 'Storage write failed.';

    return (
      <div
        role="alert"
        aria-live="assertive"
        className={cn('mx-auto w-full max-w-[640px] space-y-4 py-4', className)}
      >
        <div className="flex justify-center gap-3">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-brick" strokeWidth={1.5} aria-hidden />
          <div className="space-y-2 text-center">
            <p className="text-headline-3 text-brick">{headline}</p>
            <p className="text-body text-ink-soft">
              {detail} {storageError.message}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {onRetry ? (
            <Button type="button" variant="outline" size="default" disabled={isRetrying} onClick={onRetry}>
              {isRetrying ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Trying again…
                </>
              ) : (
                'Try Again'
              )}
            </Button>
          ) : null}
          <Button type="button" variant="outline" size="default" disabled={isRetrying} onClick={onOpenSettings}>
            Open Settings
          </Button>
        </div>
      </div>
    );
  }

  const llm = error as LlmError;
  const {
    activeProvider,
    isRetrying,
    isUsingOfflinePack = false,
    hasOfflinePack = false,
    onRetry,
    onUseOfflinePack,
  } = rest as {
    activeProvider: ActiveProvider;
    isRetrying: boolean;
    isUsingOfflinePack?: boolean;
    hasOfflinePack?: boolean;
    onRetry: () => void;
    onUseOfflinePack?: () => void | Promise<void>;
  };
  const providerName = PROVIDER_LABEL[activeProvider];
  const headline = `${providerName} · ${failureSummary(llm)}`;
  const codePart = llm.providerCode ? ` Code: ${llm.providerCode}.` : '';
  const showUseOfflinePack = hasOfflinePack && onUseOfflinePack !== undefined;
  const actionsLocked = isRetrying || isUsingOfflinePack;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn('mx-auto w-full max-w-[640px] space-y-4 py-8', className)}
    >
      <div className="flex justify-center gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-brick" strokeWidth={1.5} aria-hidden />
        <div className="space-y-2 text-center">
          <p className="text-headline-3 text-brick">{headline}</p>
          <p className="text-body text-ink-soft">
            {llm.message}
            {codePart}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="default"
          disabled={actionsLocked}
          onClick={onRetry}
        >
          {isRetrying ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Retrying…
            </>
          ) : (
            'Retry'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="default"
          disabled={actionsLocked}
          onClick={onOpenSettings}
        >
          Open Settings
        </Button>
        {showUseOfflinePack ? (
          <Button
            type="button"
            variant="outline"
            size="default"
            disabled={actionsLocked}
            onClick={() => void onUseOfflinePack()}
          >
            {isUsingOfflinePack ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Loading pack…
              </>
            ) : (
              'Use Offline Pack'
            )}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
