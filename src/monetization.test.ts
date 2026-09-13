import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  EARLY_ACCESS_CAP,
  FOUNDER_YEARLY_PLN,
  STANDARD_YEARLY_PLN,
  assignPricingCohortAtInstall,
  earlyAccessAnnouncementDismissPatch,
  isInFreePlusCycle,
  isMonetizationEnabled,
  isSecondCycle,
  shouldShowEarlyAccessAnnouncement,
  shouldShowPaywall,
  yearlyPricePln,
  type MonetizationSettings,
} from './monetization';

function withEnv(vars: Record<string, string | undefined>, run: () => void) {
  const previous = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(vars)) {
    previous.set(key, process.env[key]);
    if (value == null) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    run();
  } finally {
    for (const [key, value] of previous) {
      if (value == null) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

const founderOpen: MonetizationSettings = {
  pricingCohort: 'founder',
  earlyAccessAnnouncementSeen: false,
  earlyAccessFreeCycleLimit: null,
};

const founderAfterAnnounce: MonetizationSettings = {
  pricingCohort: 'founder',
  earlyAccessAnnouncementSeen: true,
  earlyAccessFreeCycleLimit: 2,
};

const standard: MonetizationSettings = {
  pricingCohort: 'standard',
  earlyAccessAnnouncementSeen: false,
  earlyAccessFreeCycleLimit: null,
};

describe('monetization', () => {
  it('documents Early Access cap and PLN yearly prices', () => {
    assert.equal(EARLY_ACCESS_CAP, 50);
    assert.equal(FOUNDER_YEARLY_PLN, 29.99);
    assert.equal(STANDARD_YEARLY_PLN, 49.99);
    assert.equal(yearlyPricePln('founder'), 29.99);
    assert.equal(yearlyPricePln('standard'), 49.99);
  });

  it('keeps monetization off by default so Plus can be tested before FOP', () => {
    withEnv({ EXPO_PUBLIC_MONETIZATION: undefined }, () => {
      assert.equal(isMonetizationEnabled(), false);
      assert.equal(isInFreePlusCycle(['2026-01-01', '2026-02-01'], standard), true);
      assert.equal(shouldShowPaywall(['2026-01-01', '2026-02-01'], 'free', standard), false);
    });
  });

  it('assigns Founder cohort only while Early Access enrollment is open', () => {
    withEnv({ EXPO_PUBLIC_EARLY_ACCESS: '1' }, () => {
      assert.equal(assignPricingCohortAtInstall(), 'founder');
    });
    withEnv({ EXPO_PUBLIC_EARLY_ACCESS: undefined }, () => {
      assert.equal(assignPricingCohortAtInstall(), 'standard');
    });
  });

  it('treats two or more period starts as the second cycle', () => {
    assert.equal(isSecondCycle([]), false);
    assert.equal(isSecondCycle(['2026-01-01']), false);
    assert.equal(isSecondCycle(['2026-01-01', '2026-02-01']), true);
  });

  it('standard path: free through first cycle, paywall from second when monetization is on', () => {
    withEnv({ EXPO_PUBLIC_MONETIZATION: '1' }, () => {
      assert.equal(isInFreePlusCycle([], standard), true);
      assert.equal(isInFreePlusCycle(['2026-01-01'], standard), true);
      assert.equal(isInFreePlusCycle(['2026-01-01', '2026-02-01'], standard), false);
      assert.equal(shouldShowPaywall(['2026-01-01'], 'free', standard), false);
      assert.equal(shouldShowPaywall(['2026-01-01', '2026-02-01'], 'free', standard), true);
      assert.equal(shouldShowPaywall(['2026-01-01', '2026-02-01'], 'pro', standard), false);
    });
  });

  it('founder path: Early Access → announcement → one final free cycle → paywall', () => {
    withEnv({ EXPO_PUBLIC_MONETIZATION: '1' }, () => {
      assert.equal(shouldShowEarlyAccessAnnouncement('free', founderOpen), true);
      assert.equal(isInFreePlusCycle(['2026-01-01', '2026-02-01'], founderOpen), true);
      assert.equal(shouldShowPaywall(['2026-01-01', '2026-02-01'], 'free', founderOpen), false);

      assert.deepEqual(earlyAccessAnnouncementDismissPatch(['2026-01-01']), {
        earlyAccessAnnouncementSeen: true,
        earlyAccessFreeCycleLimit: 2,
      });

      assert.equal(shouldShowEarlyAccessAnnouncement('free', founderAfterAnnounce), false);
      assert.equal(isInFreePlusCycle(['2026-01-01'], founderAfterAnnounce), true);
      assert.equal(isInFreePlusCycle(['2026-01-01', '2026-02-01'], founderAfterAnnounce), true);
      assert.equal(
        isInFreePlusCycle(['2026-01-01', '2026-02-01', '2026-03-01'], founderAfterAnnounce),
        false,
      );
      assert.equal(
        shouldShowPaywall(['2026-01-01', '2026-02-01', '2026-03-01'], 'free', founderAfterAnnounce),
        true,
      );
    });
  });
});
