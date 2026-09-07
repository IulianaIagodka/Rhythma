import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { PLUS_PRODUCT_TYPE, PLUS_SKU } from './iapPlus';

describe('iapPlus', () => {
  it('uses the App Store monthly subscription product id', () => {
    assert.equal(PLUS_SKU, 'app.rhythma.cycle.plus.monthly');
  });

  it('purchases Plus as an auto-renewable subscription', () => {
    assert.equal(PLUS_PRODUCT_TYPE, 'subs');
  });
});
