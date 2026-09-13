import { isTestFlightRuntime } from './testflight';
import { isFirstCycleTrialActive } from './firstCycleTrial';
import { isInFreePlusCycle, isMonetizationEnabled, type MonetizationSettings } from './monetization';

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

/**
 * Plus unlocks when tier is pro, monetization is off (pre-FOP testing),
 * or the user is still inside a free cycle. Calendar sync stays free.
 */
export function hasFeatureAccess(
  tier: AccessTier,
  feature: ProFeatureKey,
  periodStarts: string[] = [],
  monetization: Pick<
    MonetizationSettings,
    'pricingCohort' | 'earlyAccessAnnouncementSeen' | 'earlyAccessFreeCycleLimit'
  > | null = null,
): boolean {
  const requiredTier = FEATURE_ACCESS[feature].tier;
  if (requiredTier === 'free') return true;
  if (effectiveAccessTier(tier) === 'pro') return true;
  if (!isMonetizationEnabled()) return true;
  if (monetization) return isInFreePlusCycle(periodStarts, monetization);
  return periodStarts.length <= 1 || isFirstCycleTrialActive(periodStarts);
}
