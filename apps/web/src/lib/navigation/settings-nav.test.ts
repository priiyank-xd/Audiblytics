import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  isSettingsNavActive,
  SETTINGS_NAV_ITEMS,
} from '@/lib/navigation/settings-nav';

test('isSettingsNavActive: exact and nested paths', () => {
  assert.equal(isSettingsNavActive('/settings/practice', '/settings/practice'), true);
  assert.equal(isSettingsNavActive('/settings/practice/extra', '/settings/practice'), true);
  assert.equal(isSettingsNavActive('/settings/audio', '/settings/practice'), false);
  assert.equal(isSettingsNavActive('/settings', '/settings/practice'), false);
});

test('SETTINGS_NAV_ITEMS: six hub sections', () => {
  assert.equal(SETTINGS_NAV_ITEMS.length, 6);
  assert.equal(SETTINGS_NAV_ITEMS[0]?.id, 'practice');
  assert.equal(SETTINGS_NAV_ITEMS[SETTINGS_NAV_ITEMS.length - 1]?.id, 'about');
});
