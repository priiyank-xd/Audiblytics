import assert from 'node:assert/strict';
import { test } from 'node:test';

import { excerptParagraphWords } from '@/features/calendar/excerpt-paragraph-words';

test('excerptParagraphWords: short text unchanged', () => {
  assert.equal(excerptParagraphWords('hello world', 30), 'hello world');
});

test('excerptParagraphWords: truncates with ellipsis', () => {
  const s = excerptParagraphWords('one two three four five six', 5);
  assert.equal(s, 'one two three four five…');
});
