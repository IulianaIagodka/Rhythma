export type AccessTier = 'free' | 'pro';

export type ProFeatureKey =
  | 'calendarSync'
  | 'eventLoadAdvice'
  | 'phaseTitle'
  | 'phasePlanningLists';

type FeatureConfig = {
  tier: AccessTier;
};

export const FEATURE_ACCESS: Record<ProFeatureKey, FeatureConfig> = {
  calendarSync: { tier: 'pro' },
  eventLoadAdvice: { tier: 'pro' },
  phaseTitle: { tier: 'pro' },
  phasePlanningLists: { tier: 'pro' },
};

export function isDevUnlockEnabled(): boolean {
  if (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_UNLOCK_PRO === '1') {
    return true;
  }
  return (globalThis as { __DEV__?: boolean }).__DEV__ === true;
}

export function effectiveAccessTier(stored: AccessTier): AccessTier {
  return isDevUnlockEnabled() ? 'pro' : stored;
}

export function hasFeatureAccess(tier: AccessTier, feature: ProFeatureKey): boolean {
  const requiredTier = FEATURE_ACCESS[feature].tier;
  if (requiredTier === 'free') return true;
  return effectiveAccessTier(tier) === 'pro';
}
