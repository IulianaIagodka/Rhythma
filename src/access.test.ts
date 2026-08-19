import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  canSwitchPlan,
  effectiveAccessTier,
  hasFeatureAccess,
  isIapPlusEnabled,
  isPreviewUnlockEnabled,
  previewUnlockSource,
} from './access';
import { defaultSettings } from './cycle';
import { setTestFlightOverrideForTests } from './testflight';

describe('access', () => {
  it('defaults new users to the free tier', () => {
    assert.equal(defaultSettings().accessTier, 'free');
  });

  it('keeps event advice and phase lists behind pro; calendar sync is free', () => {
    assert.equal(previewUnlockSource(), 'off');
    assert.equal(isPreviewUnlockEnabled(), false);
    assert.equal(canSwitchPlan(), false);
    assert.equal(hasFeatureAccess('free', 'calendarSync'), true);
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

  it('lets a preview build keep Free until Plus is selected', () => {
    const previousSwitch = process.env.EXPO_PUBLIC_PLAN_SWITCH;
    const previousUnlock = process.env.EXPO_PUBLIC_UNLOCK_PRO;
    process.env.EXPO_PUBLIC_PLAN_SWITCH = '1';
    process.env.EXPO_PUBLIC_UNLOCK_PRO = '1';
    try {
      assert.equal(canSwitchPlan(), true);
      assert.equal(previewUnlockSource(), 'off');
      assert.equal(isPreviewUnlockEnabled(), false);
      assert.equal(effectiveAccessTier('free'), 'free');
      assert.equal(hasFeatureAccess('free', 'calendarSync'), true);
      assert.equal(hasFeatureAccess('pro', 'calendarSync'), true);
    } finally {
      if (previousSwitch == null) delete process.env.EXPO_PUBLIC_PLAN_SWITCH;
      else process.env.EXPO_PUBLIC_PLAN_SWITCH = previousSwitch;
      if (previousUnlock == null) delete process.env.EXPO_PUBLIC_UNLOCK_PRO;
      else process.env.EXPO_PUBLIC_UNLOCK_PRO = previousUnlock;
    }
  });

  it('enables plan switch on TestFlight builds', () => {
    setTestFlightOverrideForTests(true);
    try {
      assert.equal(canSwitchPlan(), true);
      assert.equal(previewUnlockSource(), 'off');
      assert.equal(isPreviewUnlockEnabled(), false);
      assert.equal(effectiveAccessTier('free'), 'free');
      assert.equal(hasFeatureAccess('free', 'calendarSync'), true);
      assert.equal(hasFeatureAccess('pro', 'calendarSync'), true);
    } finally {
      setTestFlightOverrideForTests(null);
    }
  });

  it('enables Plus purchase UI when the IAP feature flag is on', () => {
    const previous = process.env.EXPO_PUBLIC_IAP_PLUS;
    process.env.EXPO_PUBLIC_IAP_PLUS = '1';
    try {
      assert.equal(isIapPlusEnabled(), true);
    } finally {
      if (previous == null) delete process.env.EXPO_PUBLIC_IAP_PLUS;
      else process.env.EXPO_PUBLIC_IAP_PLUS = previous;
    }
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
