import type { ParagraphResult } from '@/lib/llm/schemas/paragraph.schema';
import { err, type Result } from '@/lib/result';
import { cachedParagraphSchema } from '@/lib/schemas/paragraph-cache.schema';
import { db, safeWrite, type StorageError } from '@/lib/storage/db';

export async function persistParagraphToCache(input: {
  id: string;
  theme: string;
  persona: string;
  generatedAt: string;
  result: ParagraphResult;
}): Promise<Result<void, StorageError>> {
  const parsed = cachedParagraphSchema.safeParse({
    id: input.id,
    paragraph: input.result.paragraph,
    hardWords: input.result.hardWords,
    theme: input.theme,
    persona: input.persona,
    generatedAt: input.generatedAt,
  });

  if (!parsed.success) {
    return err({
      kind: 'unknown',
      message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    });
  }

  return safeWrite(async () => {
    await db.paragraphCache.put(parsed.data);
  });
}
