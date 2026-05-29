import assert from 'node:assert/strict';
import test from 'node:test';

import { evaluateDay14Trigger } from '@/features/day14/evaluate-day-14-trigger';

test('evaluateDay14Trigger: 13 days → false (premature)', () => {
  assert.equal(evaluateDay14Trigger(13, false, true), false);
});

test('evaluateDay14Trigger: 14 days + fired → false (exact-once)', () => {
  assert.equal(evaluateDay14Trigger(14, true, true), false);
});

test('evaluateDay14Trigger: 14 days + !fired + no day-1 row → no-recording', () => {
  assert.equal(evaluateDay14Trigger(14, false, false), 'no-recording');
});

test('evaluateDay14Trigger: 14 days + !fired + day-1 row → true', () => {
  assert.equal(evaluateDay14Trigger(14, false, true), true);
});

test('evaluateDay14Trigger: 15 days → false (missed window)', () => {
  assert.equal(evaluateDay14Trigger(15, false, true), false);
});

test('evaluateDay14Trigger: loading (null) → false', () => {
  assert.equal(evaluateDay14Trigger(14, false, null), false);
});
