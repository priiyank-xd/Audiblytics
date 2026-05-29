import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPrompt } from '@/lib/llm/prompts/paragraph';

test('buildPrompt: omits recycle instructions when fewer than 2 recycle strings', () => {
  const cold = buildPrompt({
    theme: 'horror',
    persona: 'gre-aspirant',
    length: 120,
    recycleWords: [],
  });
  assert.match(cold, /cold-start paragraph/i);
  assert.doesNotMatch(cold, /previously saved vocabulary/i);

  const one = buildPrompt({
    theme: 'horror',
    persona: 'gre-aspirant',
    length: 120,
    recycleWords: ['soliloquy'],
  });
  assert.match(one, /cold-start paragraph/i);
});

test('buildPrompt: injects recycle clause for two or more words', () => {
  const p = buildPrompt({
    theme: 'mystery',
    persona: 'storyteller',
    length: 150,
    recycleWords: ['epoch', 'verdant'],
  });
  assert.match(p, /epoch,\s*verdant/);
  assert.match(p, /previously saved vocabulary/i);
  assert.match(p, /not as a glossary/i);
  assert.match(p, /morphological variants/i);
  assert.doesNotMatch(p, /cold-start paragraph/i);
});
