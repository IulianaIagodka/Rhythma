import { sortedUnique } from './cycle';

/** First 50 installs during the Early Access window get Founder pricing. */
export const EARLY_ACCESS_CAP = 50;

/** Founder yearly list price (PLN) for Early Access cohort. */
export const FOUNDER_YEARLY_PLN = 29.99;

/** Standard yearly list price (PLN) after Early Access. */
export const STANDARD_YEARLY_PLN = 49.99;

export type PricingCohort = 'founder' | 'standard';

export type MonetizationSettings = {
  pricingCohort: PricingCohort;
  /** User saw the Early Access → paid launch announcement. */
  earlyAccessAnnouncementSeen: boolean;
  /**
   * After the announcement, founder users get one final free cycle.
   * Free while `periodStarts.length <= earlyAccessFreeCycleLimit`.
   * `null` until the announcement is dismissed.
   */
  earlyAccessFreeCycleLimit: number | null;
};

export function defaultMonetizationSettings(): MonetizationSettings {
  return {
    pricingCohort: assignPricingCohortAtInstall(),
    earlyAccessAnnouncementSeen: false,
    earlyAccessFreeCycleLimit: null,
  };
}

/** QA override from Settings (TestFlight / plan-switch builds). `null` = follow env. */
let qaMonetizationOverride: boolean | null = null;

/** Used by App when `canSwitchPlan()` so QA can flip monetization without a rebuild. */
export function setQaMonetizationOverride(enabled: boolean | null): void {
  qaMonetizationOverride = enabled;
}

export function getQaMonetizationOverride(): boolean | null {
  return qaMonetizationOverride;
}

/** Master switch. Off until FOP / paid launch — Plus stays open for testing. */
export function isMonetizationEnabled(): boolean {
  if (qaMonetizationOverride != null) return qaMonetizationOverride;
  return typeof process !== 'undefined' && process.env.EXPO_PUBLIC_MONETIZATION === '1';
}

/**
 * While this is on, new installs are stamped as Founder (first-50 window).
 * Turn off after ~50 users so later installs get standard pricing.
 * QA can also force Founder via Settings without this env.
 */
export function isEarlyAccessEnrollmentOpen(): boolean {
  return typeof process !== 'undefined' && process.env.EXPO_PUBLIC_EARLY_ACCESS === '1';
}

export function assignPricingCohortAtInstall(): PricingCohort {
  return isEarlyAccessEnrollmentOpen() ? 'founder' : 'standard';
}

export function isSecondCycle(periodStarts: string[]): boolean {
  return sortedUnique(periodStarts).length >= 2;
}

export function yearlyPricePln(cohort: PricingCohort): number {
  return cohort === 'founder' ? FOUNDER_YEARLY_PLN : STANDARD_YEARLY_PLN;
}

/** True while the user is still inside a free Plus cycle under current rules. */
export function isInFreePlusCycle(
  periodStarts: string[],
  settings: Pick<
    MonetizationSettings,
    'pricingCohort' | 'earlyAccessAnnouncementSeen' | 'earlyAccessFreeCycleLimit'
  >,
): boolean {
  if (!isMonetizationEnabled()) return true;

  const starts = sortedUnique(periodStarts).length;

  if (settings.pricingCohort === 'founder') {
    // Before the launch announcement: still Early Access (free).
    if (!settings.earlyAccessAnnouncementSeen) return true;
    const limit = settings.earlyAccessFreeCycleLimit;
    if (limit == null) return true;
    return starts <= limit;
  }

  // Standard: Install → 1 free cycle (0 or 1 logged starts).
  return starts <= 1;
}

/**
 * Paywall = monetization on + free cycle(s) over.
 * Standard: secondCycle && monetizationEnabled.
 * Founder: one final free cycle after the announcement, then paywall.
 */
export function shouldShowPaywall(
  periodStarts: string[],
  accessTier: 'free' | 'pro',
  settings: Pick<
    MonetizationSettings,
    'pricingCohort' | 'earlyAccessAnnouncementSeen' | 'earlyAccessFreeCycleLimit'
  >,
  previewUnlock: 'off' | 'dev' | 'plus' = 'off',
): boolean {
  if (!isMonetizationEnabled()) return false;
  if (accessTier === 'pro' || previewUnlock !== 'off') return false;
  return !isInFreePlusCycle(periodStarts, settings);
}

/** Show the Early Access → paid launch announcement once monetization flips on. */
export function shouldShowEarlyAccessAnnouncement(
  accessTier: 'free' | 'pro',
  settings: Pick<MonetizationSettings, 'pricingCohort' | 'earlyAccessAnnouncementSeen'>,
  previewUnlock: 'off' | 'dev' | 'plus' = 'off',
): boolean {
  if (!isMonetizationEnabled()) return false;
  if (accessTier === 'pro' || previewUnlock !== 'off') return false;
  return settings.pricingCohort === 'founder' && !settings.earlyAccessAnnouncementSeen;
}

/** Call when the user dismisses the Early Access announcement. */
export function earlyAccessAnnouncementDismissPatch(
  periodStarts: string[],
): Pick<MonetizationSettings, 'earlyAccessAnnouncementSeen' | 'earlyAccessFreeCycleLimit'> {
  const starts = sortedUnique(periodStarts).length;
  return {
    earlyAccessAnnouncementSeen: true,
    // One final free cycle from “now”.
    earlyAccessFreeCycleLimit: starts + 1,
  };
}
