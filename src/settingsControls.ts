/** Cycle insight is phase-only — never gated by calendar sync. */
export function cycleInsightToggleState(showCycleInsight: boolean): {
  disabled: boolean;
  value: boolean;
} {
  return {
    disabled: false,
    value: showCycleInsight,
  };
}

/** Schedule insight needs calendar events — disable the toggle when sync is off. */
export function scheduleInsightToggleState(
  calendarSync: boolean,
  showScheduleInsight: boolean,
): { disabled: boolean; value: boolean } {
  return {
    disabled: !calendarSync,
    value: calendarSync && showScheduleInsight,
  };
}

/** Manual Sync is available only while Calendar sync is on. */
export function calendarSyncNowState(
  calendarSync: boolean,
  syncing: boolean,
): { visible: boolean; disabled: boolean } {
  return {
    visible: calendarSync,
    disabled: syncing,
  };
}

/** Native segmented control index for Free / Plus. */
export function planSegmentIndex(tier: 'free' | 'pro'): number {
  return tier === 'pro' ? 1 : 0;
}

/** Native segmented control index for Light / Dark. */
export function themeSegmentIndex(mode: 'light' | 'dark'): number {
  return mode === 'dark' ? 1 : 0;
}
