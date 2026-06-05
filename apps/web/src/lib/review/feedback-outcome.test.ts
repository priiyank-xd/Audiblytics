import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mapFeedbackButtonToOutcome } from '@/lib/review/feedback-outcome';

test('mapFeedbackButtonToOutcome', () => {
  assert.equal(mapFeedbackButtonToOutcome('easy'), 'got-it');
  assert.equal(mapFeedbackButtonToOutcome('medium'), 'almost');
  assert.equal(mapFeedbackButtonToOutcome('hard'), 'forgot');
  assert.equal(mapFeedbackButtonToOutcome('again'), 'forgot');
});
