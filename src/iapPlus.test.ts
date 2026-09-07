import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  isPlusSku,
  PLUS_PLAN_SKUS,
  PLUS_PRODUCT_TYPE,
  PLUS_SKU_MONTHLY,
  PLUS_SKU_YEARLY,
  PLUS_SKUS,
  plusPlanForSku,
} from './iapPlus';

describe('iapPlus', () => {
  it('defines monthly and yearly subscription product ids', () => {
    assert.equal(PLUS_SKU_MONTHLY, 'app.rhythma.cycle.plus.monthly');
    assert.equal(PLUS_SKU_YEARLY, 'app.rhythma.cycle.plus.yearly');
    assert.deepEqual([...PLUS_SKUS], [PLUS_SKU_MONTHLY, PLUS_SKU_YEARLY]);
    assert.equal(PLUS_PLAN_SKUS.monthly, PLUS_SKU_MONTHLY);
    assert.equal(PLUS_PLAN_SKUS.yearly, PLUS_SKU_YEARLY);
  });

  it('purchases Plus as an auto-renewable subscription', () => {
    assert.equal(PLUS_PRODUCT_TYPE, 'subs');
  });

  it('maps product ids to plans', () => {
    assert.equal(plusPlanForSku(PLUS_SKU_MONTHLY), 'monthly');
    assert.equal(plusPlanForSku(PLUS_SKU_YEARLY), 'yearly');
    assert.equal(plusPlanForSku('unknown'), null);
    assert.equal(isPlusSku(PLUS_SKU_MONTHLY), true);
    assert.equal(isPlusSku(PLUS_SKU_YEARLY), true);
    assert.equal(isPlusSku('app.rhythma.cycle.plus'), false);
  });
});
