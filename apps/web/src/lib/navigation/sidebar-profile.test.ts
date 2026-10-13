import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  formatEmailLocalAsDisplayName,
  resolveSidebarProfileInitial,
  resolveSidebarProfileLabel,
} from '@/lib/navigation/sidebar-profile';

test('formatEmailLocalAsDisplayName: strips digits and capitalizes', () => {
  assert.equal(formatEmailLocalAsDisplayName('admin'), 'Admin');
  assert.equal(formatEmailLocalAsDisplayName('neal.smith'), 'Neal');
  assert.equal(formatEmailLocalAsDisplayName('priyankpatel'), 'Priyank');
});

test('resolveSidebarProfileLabel: api mode email', () => {
  assert.equal(
    resolveSidebarProfileLabel({
      userEmail: 'a@b.com',
      loading: false,
    }),
    'A',
  );
  assert.equal(
    resolveSidebarProfileLabel({
      userEmail: 'priyank@example.com',
      loading: false,
    }),
    'Priyank',
  );
});

test('resolveSidebarProfileLabel: api loading and missing user', () => {
  assert.equal(
    resolveSidebarProfileLabel({ userEmail: null, loading: true }),
    '…',
  );
  assert.equal(
    resolveSidebarProfileLabel({ userEmail: null, loading: false }),
    'Account',
  );
});

test('resolveSidebarProfileInitial: first character uppercased', () => {
  assert.equal(resolveSidebarProfileInitial('Personal use'), 'P');
  assert.equal(resolveSidebarProfileInitial('priyank'), 'P');
  assert.equal(resolveSidebarProfileInitial('…'), '?');
});
