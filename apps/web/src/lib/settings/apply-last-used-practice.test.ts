import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  applyLastUsedPractice,
  shouldApplyLastUsedOverlay,
} from '@/lib/settings/apply-last-used-practice';
import { practicePrefsSchema } from '@/lib/schemas/practice-prefs.schema';
import { settingsSchema } from '@/lib/schemas/settings.schema';

const baseSettings = settingsSchema.parse({});

test('applyLastUsedPractice: returns settings when remember off', () => {
  const prefs = practicePrefsSchema.parse({ rememberLastUsed: false, lastUsed: null });
  assert.deepEqual(applyLastUsedPractice(baseSettings, prefs), baseSettings);
});

test('applyLastUsedPractice: overlays when remember on', () => {
  const prefs = practicePrefsSchema.parse({
    rememberLastUsed: true,
    lastUsed: { theme: 'horror', persona: 'debate-coach', length: 120 },
  });
  const merged = applyLastUsedPractice(baseSettings, prefs);
  assert.equal(merged.theme, 'horror');
  assert.equal(merged.persona, 'debate-coach');
  assert.equal(merged.length, 120);
});

test('shouldApplyLastUsedOverlay: true when values differ', () => {
  const prefs = practicePrefsSchema.parse({
    rememberLastUsed: true,
    lastUsed: { theme: 'horror', persona: 'debate-coach', length: 120 },
  });
  assert.equal(shouldApplyLastUsedOverlay(baseSettings, prefs), true);
});
