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

export function hasFeatureAccess(tier: AccessTier, feature: ProFeatureKey): boolean {
  const requiredTier = FEATURE_ACCESS[feature].tier;
  if (requiredTier === 'free') return true;
  return tier === 'pro';
}
