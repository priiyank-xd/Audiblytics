import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { HardWord } from '@/lib/schemas/paragraph-cache.schema';

import {
  buildPlainWordEntry,
  exampleSentenceForToken,
  isPlainWordEntry,
  plainWordRowId,
  resolveWordEntry,
  resolveWordRowId,
} from '@/lib/today/plain-word-entry';

const hardWord: HardWord = {
  word: 'diligence',
  ipa: '/ˈdɪl.ɪ.dʒəns/',
  pronunciationGuide: 'DIL-ih-jens',
  meaning: 'noun · careful work',
  exampleSentence: 'Her diligence impressed the team.',
};

test('plainWordRowId normalizes case', () => {
  assert.equal(plainWordRowId('Hello'), 'plain:hello');
});

test('resolveWordRowId prefers hard word row id', () => {
  assert.equal(resolveWordRowId('diligence', [hardWord]), 'diligence-/ˈdɪl.ɪ.dʒəns/');
  assert.equal(resolveWordRowId('focus', [hardWord]), 'plain:focus');
});

test('exampleSentenceForToken finds containing sentence', () => {
  const paragraph = 'Morning light arrived. She showed diligence at work.';
  assert.match(exampleSentenceForToken('diligence', paragraph), /diligence at work/);
});

test('buildPlainWordEntry validates minimal shape', () => {
  const entry = buildPlainWordEntry('focus', 'Stay focus on the goal.');
  assert.equal(entry.word, 'focus');
  assert.equal(isPlainWordEntry(entry), true);
});

test('resolveWordEntry returns hard word metadata when present', () => {
  const entry = resolveWordEntry('diligence', [hardWord], 'ignored');
  assert.equal(entry.ipa, hardWord.ipa);
  assert.equal(isPlainWordEntry(entry), false);
});
