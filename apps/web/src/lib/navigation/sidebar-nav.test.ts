import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  isAnySidebarNavActive,
  isSidebarNavActive,
  resolveSidebarNavItems,
  SIDEBAR_NAV_ITEMS,
} from '@/lib/navigation/sidebar-nav';

test('isSidebarNavActive: home exact match only', () => {
  assert.equal(isSidebarNavActive('/', '/'), true);
  assert.equal(isSidebarNavActive('/review', '/'), false);
  assert.equal(isSidebarNavActive('/settings', '/'), false);
});

test('isSidebarNavActive: nested routes match prefix', () => {
  assert.equal(isSidebarNavActive('/review', '/review'), true);
  assert.equal(isSidebarNavActive('/collection/word', '/collection'), true);
  assert.equal(isSidebarNavActive('/settings/practice', '/review'), false);
});

test('isSidebarNavActive: stats route', () => {
  assert.equal(isSidebarNavActive('/stats', '/stats'), true);
  assert.equal(isSidebarNavActive('/stats/details', '/stats'), true);
  assert.equal(isSidebarNavActive('/journey', '/stats'), false);
});

test('resolveSidebarNavItems: home omits Journey', () => {
  const homeItems = resolveSidebarNavItems('/');
  assert.equal(
    homeItems.some((item) => item.href === '/journey'),
    false,
  );
  assert.equal(homeItems.length, SIDEBAR_NAV_ITEMS.length - 1);
  assert.equal(resolveSidebarNavItems('/journey').some((item) => item.href === '/journey'), true);
});

test('isAnySidebarNavActive: settings routes do not activate primary nav', () => {
  assert.equal(isAnySidebarNavActive('/settings/practice'), false);
  assert.equal(
    SIDEBAR_NAV_ITEMS.some((item) => isSidebarNavActive('/settings/practice', item.href)),
    false,
  );
});
