import assert from 'node:assert/strict';
import test from 'node:test';

import { recordingPrivacyFacts } from '@/features/voice-journal/recording-privacy-facts';

test('recordingPrivacyFacts: browser storage says audio is never uploaded', () => {
  const facts = recordingPrivacyFacts('browser', '90-day-rolling');
  assert.match(facts.storage, /this browser/i);
  assert.match(facts.storage, /never uploaded/i);
});

test('recordingPrivacyFacts: account storage says audio is uploaded and account-scoped', () => {
  const facts = recordingPrivacyFacts('account', '90-day-rolling');
  assert.match(facts.storage, /uploaded/i);
  assert.match(facts.storage, /no other account/i);
});

test('recordingPrivacyFacts: rolling retention states the 90-day window', () => {
  assert.match(recordingPrivacyFacts('browser', '90-day-rolling').retention, /90 days/);
});

test('recordingPrivacyFacts: indefinite retention says nothing expires on its own', () => {
  const facts = recordingPrivacyFacts('browser', 'indefinite');
  assert.match(facts.retention, /until you delete them/i);
  assert.doesNotMatch(facts.retention, /90 days/);
});

test('recordingPrivacyFacts: deletion is always disclosed', () => {
  for (const location of ['browser', 'account'] as const) {
    for (const retention of ['90-day-rolling', 'indefinite'] as const) {
      assert.match(recordingPrivacyFacts(location, retention).deletion, /delete/i);
    }
  }
});
