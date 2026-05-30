import { getApiBaseUrl } from '@/lib/api/client';
import { mapApiDetailToLlmError } from '@/lib/api/map-llm-error';
import { paragraphSchema, type ParagraphResult } from '@/lib/llm/schemas/paragraph.schema';
import type { LlmError } from '@/lib/llm/types';
import { err, ok, type Result } from '@/lib/result';
import {
  cachedParagraphSchema,
  type CachedParagraph,
} from '@/lib/schemas/paragraph-cache.schema';
import type { ParagraphGeneratePayload } from '@/features/paragraph/paragraph-generate-payload';

export async function fetchParagraphToday(): Promise<CachedParagraph | null> {
  const base = getApiBaseUrl();
  const response = await fetch(`${base}/api/v1/paragraphs/today`, {
    credentials: 'include',
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      if (body.error?.message) message = body.error.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  const raw = (await response.json()) as Record<string, unknown>;
  return cachedParagraphSchema.parse({
    id: raw.id,
    paragraph: raw.paragraph,
    hardWords: raw.hardWords,
    theme: raw.theme,
    persona: raw.persona,
    generatedAt: raw.generatedAt,
  });
}

export async function generateParagraphViaApi(input: {
  paragraphId: string;
  recycleWords: string[];
}): Promise<Result<ParagraphGeneratePayload, LlmError>> {
  const base = getApiBaseUrl();
  const response = await fetch(`${base}/api/v1/paragraphs/generate`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paragraphId: input.paragraphId,
      recycleWords: input.recycleWords,
    }),
  });

  if (!response.ok) {
    try {
      const body = (await response.json()) as {
        detail?: { error?: { kind?: string; message?: string; providerCode?: string; retryable?: boolean } };
        error?: { kind?: string; message?: string; providerCode?: string; retryable?: boolean };
      };
      const detail = body.detail?.error ?? body.error;
      if (detail?.kind && detail.message) {
        return err(
          mapApiDetailToLlmError(
            {
              kind: detail.kind,
              message: detail.message,
              providerCode: detail.providerCode,
              retryable: detail.retryable,
            },
            response.status,
          ),
        );
      }
    } catch {
      // ignore parse errors
    }
    return err({
      kind: 'unknown',
      providerCode: String(response.status),
      message: response.statusText || 'Paragraph generation failed.',
      retryable: false,
    });
  }

  const raw = (await response.json()) as Record<string, unknown>;
  const parsed = paragraphSchema.safeParse({
    paragraph: raw.paragraph,
    hardWords: raw.hardWords,
  });
  if (!parsed.success) {
    return err({
      kind: 'malformed_response',
      providerCode: 'api_validation',
      message: parsed.error.issues.map((i) => i.message).join('; '),
      retryable: true,
    });
  }

  const recycleWordTexts = Array.isArray(raw.recycleWordTexts)
    ? raw.recycleWordTexts.filter((w): w is string => typeof w === 'string')
    : input.recycleWords;

  return ok({
    result: parsed.data as ParagraphResult,
    recycleWordTexts,
    cachePersist: { ok: true, value: undefined },
  });
}
