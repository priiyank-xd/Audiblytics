import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  formatHomeGreeting,
  resolveTimeOfDayGreeting,
} from '@/lib/navigation/home-greeting';

test('resolveTimeOfDayGreeting: morning, afternoon, evening buckets', () => {
  assert.equal(resolveTimeOfDayGreeting(9), 'Good morning');
  assert.equal(resolveTimeOfDayGreeting(14), 'Good afternoon');
  assert.equal(resolveTimeOfDayGreeting(20), 'Good evening');
  assert.equal(resolveTimeOfDayGreeting(4), 'Good evening');
});

test('formatHomeGreeting: named user', () => {
  assert.equal(formatHomeGreeting('Good morning', 'priyank', false), 'Good morning, priyank');
});

test('formatHomeGreeting: loading', () => {
  assert.equal(formatHomeGreeting('Good morning', '…', true), 'Good morning…');
  assert.equal(formatHomeGreeting('Good morning', 'priyank', true), 'Good morning…');
});

test('formatHomeGreeting: personal use without fake name', () => {
  assert.equal(formatHomeGreeting('Good morning', 'Personal use', false), 'Good morning.');
});
