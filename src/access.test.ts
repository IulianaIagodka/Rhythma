import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { hasFeatureAccess } from './access';
import { defaultSettings } from './cycle';

describe('access', () => {
  it('defaults new users to the free tier', () => {
    assert.equal(defaultSettings().accessTier, 'free');
  });

  it('keeps calendar sync, event advice, and phase extras behind pro', () => {
    assert.equal(hasFeatureAccess('free', 'calendarSync'), false);
    assert.equal(hasFeatureAccess('free', 'eventLoadAdvice'), false);
    assert.equal(hasFeatureAccess('free', 'phaseTitle'), false);
    assert.equal(hasFeatureAccess('free', 'phasePlanningLists'), false);
    assert.equal(hasFeatureAccess('pro', 'calendarSync'), true);
    assert.equal(hasFeatureAccess('pro', 'eventLoadAdvice'), true);
    assert.equal(hasFeatureAccess('pro', 'phaseTitle'), true);
    assert.equal(hasFeatureAccess('pro', 'phasePlanningLists'), true);
  });
});
