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
