import { generateText, Output } from 'ai';

import { err, ok, type Result } from '@/lib/result';
import { parseLlmError } from './errors';
import { buildPrompt } from './prompts/paragraph';
import { paragraphSchema, type ParagraphResult } from './schemas/paragraph.schema';
import type { GenerateParagraphOpts, LlmError } from './types';
import { withRetry } from './with-retry';

type GenerateTextResult = Awaited<ReturnType<typeof generateText>>;

function readStructuredOutput(result: GenerateTextResult): unknown {
  if ('output' in result && result.output !== undefined) {
    return result.output;
  }
  if ('experimental_output' in result && result.experimental_output !== undefined) {
    return result.experimental_output;
  }
  return undefined;
}

/**
 * Public seam for paragraph generation. Composes:
 *   1. `buildPrompt` — deterministic prompt construction
 *   2. `generateText` + `Output.object({ schema: paragraphSchema })` — Vercel AI SDK 6 call
 *   3. `paragraphSchema.safeParse` — defensive second-pass schema validation
 *   4. `parseLlmError` — provider-vocabulary normalization on SDK throw
 *   5. `withRetry` — ≤2 retries with `[1s, 3s]` backoff for retryable errors
 *
 * Returns `Result.ok(ParagraphResult)` on success or `Result.err(LlmError)` on
 * exhausted retry path. Never throws app-flow errors (programmer errors only).
 *
 * Sources: architecture.md lines 342–411; AR4 (epics line 165); AR6, AR8, AR9
 * (epics lines 167–170); FR12, FR13, FR17 (prd lines 726–734).
 */
export async function generateParagraph(
  opts: GenerateParagraphOpts,
): Promise<Result<ParagraphResult, LlmError>> {
  const prompt = buildPrompt({
    theme: opts.theme,
    persona: opts.persona,
    length: opts.length,
    recycleWords: opts.recycleWords,
  });

  return withRetry(() => callOnce(opts, prompt));
}

async function callOnce(
  opts: GenerateParagraphOpts,
  prompt: string,
): Promise<Result<ParagraphResult, LlmError>> {
  let result: GenerateTextResult;
  try {
    result = await generateText({
      model: opts.model,
      prompt,
      output: Output.object({ schema: paragraphSchema }),
    });
  } catch (e) {
    return err(parseLlmError(opts.provider, e));
  }

  const validated = paragraphSchema.safeParse(readStructuredOutput(result));
  if (!validated.success) {
    return err<LlmError>({
      kind: 'malformed_response',
      providerCode: 'zod_validation_failed',
      message: validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      retryable: true,
    });
  }
  return ok(validated.data);
}
