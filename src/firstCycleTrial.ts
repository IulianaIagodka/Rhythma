import { sortedUnique } from './cycle';

/** Soft reminder when the forecast next period is this many days away (inclusive). */
export const FIRST_CYCLE_ENDING_SOON_DAYS = 3;

/** First-cycle Plus trial: from the first logged period start until the next one. */
export function isFirstCycleTrialActive(periodStarts: string[]): boolean {
  return sortedUnique(periodStarts).length === 1;
}

export function isFirstCycleTrialEndingSoon(
  periodStarts: string[],
  daysUntilNextPeriod: number | null,
): boolean {
  if (!isFirstCycleTrialActive(periodStarts)) return false;
  if (daysUntilNextPeriod == null) return false;
  return daysUntilNextPeriod <= FIRST_CYCLE_ENDING_SOON_DAYS;
}

/** True when adding the first logged period start (0 → 1). */
export function firstCycleTrialJustStarted(
  previousStarts: string[],
  nextStarts: string[],
): boolean {
  return sortedUnique(previousStarts).length === 0 && sortedUnique(nextStarts).length === 1;
}

/** True when adding/removing a period start ends the first-cycle trial (1 → 2 starts). */
export function firstCycleTrialJustEnded(
  previousStarts: string[],
  nextStarts: string[],
): boolean {
  return sortedUnique(previousStarts).length === 1 && sortedUnique(nextStarts).length >= 2;
}

/** Ending-soon title variant for the Today trial card. */
export function firstCycleTrialEndingTitleKind(
  daysLeft: number | null | undefined,
): 'today' | 'one' | 'days' | 'soon' {
  if (daysLeft == null) return 'soon';
  if (daysLeft <= 0) return 'today';
  if (daysLeft === 1) return 'one';
  return 'days';
}
