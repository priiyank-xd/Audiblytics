import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { HardWord } from '@/lib/schemas/paragraph-cache.schema';

import {
  findHardWordForToken,
  hardWordRowId,
  isWordToken,
  normalizeWordKey,
  splitParagraphTokens,
} from '@/lib/today/hard-word-match';
import { parseWordMeaning } from '@/lib/today/word-meaning';

const sampleHardWord: HardWord = {
  word: 'Miasma',
  ipa: '/ˈmaɪ.əzmə/',
  pronunciationGuide: 'my-AZ-muh',
  meaning: 'noun · unpleasant atmosphere',
  exampleSentence: 'The marshlands were known for the thick miasma.',
};

test('normalizeWordKey trims and lowercases', () => {
  assert.equal(normalizeWordKey(' MiAsMa '), 'miasma');
});

test('findHardWordForToken matches case-insensitively', () => {
  assert.equal(findHardWordForToken('miasma', [sampleHardWord])?.word, 'Miasma');
  assert.equal(findHardWordForToken('unknown', [sampleHardWord]), undefined);
});

test('splitParagraphTokens preserves words and punctuation', () => {
  const parts = splitParagraphTokens('Hello, world.');
  assert.ok(parts.includes('Hello'));
  assert.ok(parts.some((p) => p.includes(',')));
  assert.ok(parts.includes('world'));
});

test('isWordToken detects word tokens', () => {
  assert.equal(isWordToken('hello'), true);
  assert.equal(isWordToken(','), false);
});

test('hardWordRowId combines word and ipa', () => {
  assert.equal(hardWordRowId(sampleHardWord), 'Miasma-/ˈmaɪ.əzmə/');
});

test('parseWordMeaning splits part of speech and gloss', () => {
  assert.deepEqual(parseWordMeaning('noun · fog'), {
    partOfSpeech: 'noun',
    gloss: 'fog',
  });
  assert.deepEqual(parseWordMeaning('plain gloss'), {
    partOfSpeech: null,
    gloss: 'plain gloss',
  });
});
