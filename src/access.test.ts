import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  effectiveAccessTier,
  hasFeatureAccess,
  isPreviewUnlockEnabled,
  previewUnlockSource,
} from './access';
import { defaultSettings } from './cycle';

describe('access', () => {
  it('defaults new users to the free tier', () => {
    assert.equal(defaultSettings().accessTier, 'free');
  });

  it('keeps calendar sync, event advice, and phase lists behind pro', () => {
    assert.equal(previewUnlockSource(), 'off');
    assert.equal(isPreviewUnlockEnabled(), false);
    assert.equal(hasFeatureAccess('free', 'calendarSync'), false);
    assert.equal(hasFeatureAccess('free', 'eventLoadAdvice'), false);
    assert.equal(hasFeatureAccess('free', 'phaseTitle'), true);
    assert.equal(hasFeatureAccess('free', 'phasePlanningLists'), false);
    assert.equal(hasFeatureAccess('free', 'cycleRhythm'), false);
    assert.equal(hasFeatureAccess('pro', 'calendarSync'), true);
    assert.equal(hasFeatureAccess('pro', 'eventLoadAdvice'), true);
    assert.equal(hasFeatureAccess('pro', 'phaseTitle'), true);
    assert.equal(hasFeatureAccess('pro', 'phasePlanningLists'), true);
    assert.equal(hasFeatureAccess('pro', 'cycleRhythm'), true);
  });

  it('unlocks Plus features in the Plus preview build', () => {
    const previous = process.env.EXPO_PUBLIC_UNLOCK_PRO;
    process.env.EXPO_PUBLIC_UNLOCK_PRO = '1';
    try {
      assert.equal(previewUnlockSource(), 'plus');
      assert.equal(isPreviewUnlockEnabled(), true);
      assert.equal(effectiveAccessTier('free'), 'pro');
      assert.equal(hasFeatureAccess('free', 'calendarSync'), true);
      assert.equal(hasFeatureAccess('free', 'eventLoadAdvice'), true);
      assert.equal(hasFeatureAccess('free', 'phaseTitle'), true);
      assert.equal(hasFeatureAccess('free', 'phasePlanningLists'), true);
      assert.equal(hasFeatureAccess('free', 'cycleRhythm'), true);
    } finally {
      if (previous == null) delete process.env.EXPO_PUBLIC_UNLOCK_PRO;
      else process.env.EXPO_PUBLIC_UNLOCK_PRO = previous;
    }
  });
});
