import { isTestFlightRuntime } from './testflight';

export type AccessTier = 'free' | 'pro';

export type PreviewUnlockSource = 'off' | 'dev' | 'plus';

export type ProFeatureKey =
  | 'calendarSync'
  | 'eventLoadAdvice'
  | 'phaseTitle'
  | 'phasePlanningLists'
  | 'cycleRhythm';

type FeatureConfig = {
  tier: AccessTier;
};

export const FEATURE_ACCESS: Record<ProFeatureKey, FeatureConfig> = {
  calendarSync: { tier: 'free' },
  eventLoadAdvice: { tier: 'pro' },
  phaseTitle: { tier: 'free' },
  phasePlanningLists: { tier: 'pro' },
  cycleRhythm: { tier: 'pro' },
};

function hasPlanSwitchEnv(): boolean {
  return typeof process !== 'undefined' && process.env.EXPO_PUBLIC_PLAN_SWITCH === '1';
}

function hasUnlockEnv(): boolean {
  return typeof process !== 'undefined' && process.env.EXPO_PUBLIC_UNLOCK_PRO === '1';
}

function hasIapPlusEnv(): boolean {
  return typeof process !== 'undefined' && process.env.EXPO_PUBLIC_IAP_PLUS === '1';
}

function isDevRuntime(): boolean {
  return (globalThis as { __DEV__?: boolean }).__DEV__ === true;
}

export function canSwitchPlan(): boolean {
  return hasPlanSwitchEnv() || isDevRuntime() || isTestFlightRuntime();
}

export function previewUnlockSource(): PreviewUnlockSource {
  if (canSwitchPlan()) return 'off';
  if (hasUnlockEnv()) return 'plus';
  return 'off';
}

export function isPreviewUnlockEnabled(): boolean {
  return previewUnlockSource() !== 'off';
}

export function isIapPlusEnabled(): boolean {
  return hasIapPlusEnv();
}

export function effectiveAccessTier(stored: AccessTier): AccessTier {
  return isPreviewUnlockEnabled() ? 'pro' : stored;
}

export function hasFeatureAccess(tier: AccessTier, feature: ProFeatureKey): boolean {
  const requiredTier = FEATURE_ACCESS[feature].tier;
  if (requiredTier === 'free') return true;
  return effectiveAccessTier(tier) === 'pro';
}
