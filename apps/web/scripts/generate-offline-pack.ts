/**
 * Standalone Offline Pack Generator (Story 8.1)
 *
 * Usage:
 *   pnpm tsx scripts/generate-offline-pack.ts
 *   pnpm tsx scripts/generate-offline-pack.ts --dry --limit=3
 *
 * Requirements:
 *   - Loads OFFLINE_PACK_PROVIDER_KEY from .env.local at repo root.
 *   - Generates ~1000 paragraphs across theme × persona combinations.
 *   - Uses Gemini model literal `gemini-2.5-flash-lite`.
 *   - Rate-limits to ≤10 requests/min by enforcing ≥6s spacing between submit starts.
 *   - Writes JSON to public/offline-pack.json as a top-level array compatible with
 *     src/lib/schemas/offline-pack.schema.ts.
 *
 * Notes:
 *   - Full run is ~70 minutes at 10 RPM for ~1000 calls (epics target).
 *   - API keys are never logged.
 */

import { generateText, Output } from 'ai';
import type { LanguageModel } from 'ai';
import { createGoogleGenerativeAI as google } from '@ai-sdk/google';
import { z } from 'zod';
import { mkdirSync, existsSync, promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import { paragraphSchema, type ParagraphResult } from '@/lib/llm/schemas/paragraph.schema';
import { buildPrompt } from '@/lib/llm/prompts/paragraph';

import { offlinePackEntrySchema } from '@/lib/schemas/offline-pack.schema';

type Theme = 'horror' | 'comedy' | 'adventure' | 'mystery' | 'sci-fi' | 'slice-of-life';
type Persona =
  | 'gre-aspirant'
  | 'business-english'
  | 'storyteller'
  | 'casual-conversationalist';

const THEMES: readonly Theme[] = [
  'horror',
  'comedy',
  'adventure',
  'mystery',
  'sci-fi',
  'slice-of-life',
];

const PERSONAS: readonly Persona[] = [
  'gre-aspirant',
  'business-english',
  'storyteller',
  'casual-conversationalist',
];

const MODEL_LITERAL = 'gemini-2.5-flash-lite' as const;
const MIN_SPACING_MS = 6_000; // ≥10 RPM => ≥6s spacing.
const LENGTH_WORDS = 150;
const RECYCLE_WORDS: string[] = [];

type Args = {
  dry: boolean;
  limit: number | null;
};

function parseArgs(argv: string[]): Args {
  const dry = argv.includes('--dry');
  const limitArg = argv.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1] ?? '') : null;
  return { dry, limit: limit !== null && Number.isFinite(limit) ? limit : null };
}

function parseEnvFile(envText: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of envText.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (!key) continue;
    // Strip surrounding quotes if present.
    out[key] = value.replace(/^['"]|['"]$/g, '');
  }
  return out;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractStructuredOutput(result: unknown): unknown {
  if (result && typeof result === 'object') {
    const r = result as { output?: unknown; experimental_output?: unknown };
    if (r.output !== undefined) return r.output;
    if (r.experimental_output !== undefined) return r.experimental_output;
  }
  return undefined;
}

function computeEta(totalCalls: number, completedCalls: number, elapsedMs: number): string {
  if (completedCalls <= 0) return '~?';
  const perCallMs = elapsedMs / completedCalls;
  const remainingMs = perCallMs * (totalCalls - completedCalls);
  const remainingMin = Math.max(0, Math.round(remainingMs / 60_000));
  return `~${remainingMin}m`;
}

async function generateOneParagraph(opts: {
  theme: Theme;
  persona: Persona;
  variantLabel: string;
  indexInCombo: number;
  model: LanguageModel;
}): Promise<ParagraphResult | null> {
  const prompt = buildPrompt({
    theme: opts.theme,
    persona: opts.persona,
    length: LENGTH_WORDS,
    recycleWords: RECYCLE_WORDS,
  });

  const promptWithVariant = `${prompt} Variant label: ${opts.variantLabel}.`;

  try {
    const result = await generateText({
      // The model must be the literal string literal `gemini-2.5-flash-lite`.
      model: opts.model,
      prompt: promptWithVariant,
      output: Output.object({ schema: paragraphSchema }),
    });

    const structured = extractStructuredOutput(result);
    const validated = paragraphSchema.safeParse(structured);
    if (!validated.success) {
      // AC5: log Zod failures and skip.
      console.warn('[offline-pack] Zod validation failed', {
        theme: opts.theme,
        persona: opts.persona,
        indexInCombo: opts.indexInCombo,
        variantLabel: opts.variantLabel,
        issues: validated.error.issues,
      });
      return null;
    }

    return validated.data;
  } catch (e) {
    console.warn('[offline-pack] generateText failed', {
      theme: opts.theme,
      persona: opts.persona,
      indexInCombo: opts.indexInCombo,
      variantLabel: opts.variantLabel,
      message: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const projectRoot = path.resolve(__dirname, '..');
  const envPath = path.join(projectRoot, '.env.local');

  if (!existsSync(envPath)) {
    throw new Error(`Missing ${path.relative(projectRoot, envPath)}. Define OFFLINE_PACK_PROVIDER_KEY.`);
  }

  const envText = await fs.readFile(envPath, 'utf8');
  const env = parseEnvFile(envText);

  const apiKey = env['OFFLINE_PACK_PROVIDER_KEY'];

  const outPath = path.join(projectRoot, 'public', 'offline-pack.json');
  if (!existsSync(path.dirname(outPath))) {
    mkdirSync(path.dirname(outPath), { recursive: true });
  }

  const totalCombinations = THEMES.length * PERSONAS.length;
  const targetPerCombo = 42;
  const totalTargetEntries = totalCombinations * targetPerCombo;
  const totalCalls = args.limit ?? totalTargetEntries;

  if (args.dry) {
    console.log('[offline-pack] --dry: no LLM calls; writing empty pack.');
    await fs.writeFile(outPath, JSON.stringify([], null, 2), 'utf8');
    return;
  }

  if (!apiKey) {
    throw new Error(`OFFLINE_PACK_PROVIDER_KEY not found in ${path.relative(projectRoot, envPath)}.`);
  }

  const model = google({ apiKey })(MODEL_LITERAL);

  type OfflinePackJsonRow = z.infer<typeof offlinePackEntrySchema> & { generatedAt: string };
  const out: OfflinePackJsonRow[] = [];
  let attempts = 0;
  let completed = 0;
  const start = Date.now();
  let lastStartAt = 0;

  for (const theme of THEMES) {
    for (const persona of PERSONAS) {
      for (let i = 0; i < targetPerCombo; i++) {
        attempts += 1;
        if (attempts > totalCalls) break;

        const elapsed = Date.now() - start;
        const eta = computeEta(totalCalls, completed, elapsed);
        console.log(
          `[offline-pack] ${theme}/${persona} (${i + 1}/${targetPerCombo}) attempts=${attempts}/${totalCalls} completed=${completed} elapsed=${Math.round(
            elapsed / 1000,
          )}s eta=${eta}`,
        );

        const now = Date.now();
        const wait = lastStartAt === 0 ? 0 : MIN_SPACING_MS - (now - lastStartAt);
        if (wait > 0) await sleep(wait);

        lastStartAt = Date.now();

        const indexInCombo = i + 1;
        const variantLabel = `${theme}-${persona}-${indexInCombo}`;
        const paragraph = await generateOneParagraph({
          theme,
          persona,
          indexInCombo,
          variantLabel,
          model,
        });

        if (!paragraph) continue;

        const generatedAt = new Date().toISOString();
        const packRowBase = {
          id: randomUUID(),
          theme,
          persona,
          lastSurfacedAt: null,
          paragraph: paragraph.paragraph,
          hardWords: paragraph.hardWords,
        } satisfies z.input<typeof offlinePackEntrySchema>;

        const validatedPack = offlinePackEntrySchema.safeParse(packRowBase);
        if (!validatedPack.success) {
          console.warn('[offline-pack] offlinePackEntrySchema failed', {
            theme,
            persona,
            variantLabel,
            issues: validatedPack.error.issues,
          });
          continue;
        }

        // AC8: output JSON must include generatedAt, even if the Zod schema
        // strips unknown keys.
        out.push({ ...validatedPack.data, generatedAt });
        completed += 1;
      }

      if (attempts >= totalCalls) break;
    }
    if (attempts >= totalCalls) break;
  }

  await fs.writeFile(outPath, JSON.stringify(out, null, 2), 'utf8');

  const totalElapsedMin = Math.round((Date.now() - start) / 60_000);
  console.log(`[offline-pack] done. Entries=${out.length} elapsed=${totalElapsedMin}m. Wrote: ${outPath}`);
}

void main();

