import { z } from 'zod';
import {
  hardWordSchema,
  type HardWord,
} from '@/lib/schemas/paragraph-cache.schema';

/**
 * Zod schema for the structured LLM response. Used by:
 *   - `generate.ts` via `Output.object({ schema: paragraphSchema })`
 *   - `generate.ts` defensive second-pass `.safeParse(result.output)`
 *
 * `hardWordSchema` is owned by `lib/schemas/paragraph-cache.schema.ts`
 * (Story 1.4) so the persisted cache shape and the live LLM shape
 * cannot drift — any change to `hardWord` ripples both consumers.
 *
 * Sources: architecture.md lines 348–356; FR17 (prd line 734);
 * AR4 (epics line 165); AR16 (epics line 177).
 */
export const paragraphSchema = z.object({
  paragraph: z.string().min(1),
  hardWords: z.array(hardWordSchema).min(1).max(10),
});

/** Type-aliased name avoids confusion with `paragraph-cache.schema.ts`'s `CachedParagraph`. */
export type ParagraphResult = z.infer<typeof paragraphSchema>;

/**
 * Drops hard-word rows that are structurally incomplete at render time (FR17),
 * even when upstream validation should guarantee a full shape.
 */
export function filterValidHardWords(entries: ParagraphResult['hardWords']): HardWord[] {
  const out: HardWord[] = [];
  for (const entry of entries) {
    const parsed = hardWordSchema.safeParse(entry);
    if (parsed.success) {
      out.push(parsed.data);
    }
  }
  return out;
}
