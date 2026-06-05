import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { isStretchUiEnabled } from '@/lib/config/stretch-ui';

const ENV_KEY = 'NEXT_PUBLIC_AUDIBLYTICS_STRETCH_UI';

const original = process.env[ENV_KEY];

afterEach(() => {
  if (original === undefined) {
    delete process.env[ENV_KEY];
  } else {
    process.env[ENV_KEY] = original;
  }
});

test('isStretchUiEnabled: true when env is "true"', () => {
  process.env[ENV_KEY] = 'true';
  assert.equal(isStretchUiEnabled(), true);
});

test('isStretchUiEnabled: false when env is "false"', () => {
  process.env[ENV_KEY] = 'false';
  assert.equal(isStretchUiEnabled(), false);
});

test('isStretchUiEnabled: false when env is unset', () => {
  delete process.env[ENV_KEY];
  assert.equal(isStretchUiEnabled(), false);
});
