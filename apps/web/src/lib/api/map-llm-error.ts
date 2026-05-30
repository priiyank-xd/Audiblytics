import type { ApiErrorBody } from '@/lib/api/client';
import type { LlmError } from '@/lib/llm/types';

type ApiLlmErrorDetail = ApiErrorBody['error'] & {
  providerCode?: string;
  retryable?: boolean;
};

export function mapApiDetailToLlmError(detail: ApiLlmErrorDetail, status: number): LlmError {
  const providerCode = detail.providerCode ?? String(status);
  const message = detail.message || 'Paragraph generation failed.';
  const retryable = detail.retryable ?? status >= 500;

  if (detail.kind === 'rate_limit') {
    return { kind: 'rate_limit', providerCode, message, retryable: true };
  }
  if (detail.kind === 'quota_exceeded') {
    return { kind: 'quota_exceeded', providerCode, message, retryable: false };
  }
  if (detail.kind === 'auth' || detail.kind === 'unauthorized') {
    return {
      kind: 'auth',
      providerCode,
      message:
        detail.kind === 'unauthorized'
          ? message || 'Sign in again, then retry.'
          : message,
      retryable: false,
    };
  }
  if (detail.kind === 'network') {
    return { kind: 'network', providerCode, message, retryable: true };
  }
  if (detail.kind === 'malformed_response') {
    return { kind: 'malformed_response', providerCode, message, retryable: true };
  }
  return { kind: 'unknown', providerCode, message, retryable: false };
}
