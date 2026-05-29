import type { ParagraphResult } from '@/lib/llm/schemas/paragraph.schema';
import type { LlmError } from '@/lib/llm/types';
import type { Result } from '@/lib/result';
import type { StorageError } from '@/lib/storage/db';

/** Successful LLM generation plus recycle hints for HardWordRow and paragraph-cache persist outcome (FR21). */
export type ParagraphGeneratePayload = {
  result: ParagraphResult;
  recycleWordTexts: string[];
  cachePersist: Result<void, StorageError>;
};

export type GenerateParagraphHookResult = Result<ParagraphGeneratePayload, LlmError>;
