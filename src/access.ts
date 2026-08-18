export type AccessTier = 'free' | 'pro';

export type PreviewUnlockSource = 'off' | 'dev' | 'testflight';

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

function hasUnlockEnv(): boolean {
  return typeof process !== 'undefined' && process.env.EXPO_PUBLIC_UNLOCK_PRO === '1';
}

function isDevRuntime(): boolean {
  return (globalThis as { __DEV__?: boolean }).__DEV__ === true;
}

export function previewUnlockSource(): PreviewUnlockSource {
  if (isDevRuntime()) return 'dev';
  if (hasUnlockEnv()) return 'testflight';
  return 'off';
}

export function isPreviewUnlockEnabled(): boolean {
  return previewUnlockSource() !== 'off';
}

export function effectiveAccessTier(stored: AccessTier): AccessTier {
  return isPreviewUnlockEnabled() ? 'pro' : stored;
}

export function hasFeatureAccess(tier: AccessTier, feature: ProFeatureKey): boolean {
  const requiredTier = FEATURE_ACCESS[feature].tier;
  if (requiredTier === 'free') return true;
  return effectiveAccessTier(tier) === 'pro';
}
