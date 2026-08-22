import type { DayMark } from './cycle';
import type { Theme } from './theme';

export type WeekDayBarKind = 'period' | 'periodForecast' | 'ovulatory' | 'event';

/** Indicator bars for a week day — never includes empty gray placeholders. */
export function weekDayBars(opts: {
  mark: DayMark | null | undefined;
  showOvulation: boolean;
  /** Physical load units for the day (from activityLoad), not raw event count. */
  loadUnits: number;
  showCalendarLoad: boolean;
}): WeekDayBarKind[] {
  const bars: WeekDayBarKind[] = [];
  const { mark, showOvulation, loadUnits, showCalendarLoad } = opts;
  if (mark === 'period' || mark === 'periodForecast') {
    bars.push(mark);
  }
  if (showOvulation && mark === 'ovulatory') {
    bars.push('ovulatory');
  }
  if (showCalendarLoad) {
    const n = Math.min(4, Math.max(0, Math.round(loadUnits)));
    for (let i = 0; i < n; i += 1) {
      bars.push('event');
    }
  }
  return bars;
}

/** Selected day: soft pink tint, no neon outline. Today (unselected): soft cyan tint. */
export function weekDayCellColors(
  isSelected: boolean,
  isToday: boolean,
  theme: Theme,
): { backgroundColor: string; dateColor: string } {
  if (isSelected) {
    return { backgroundColor: theme.accentSoft, dateColor: theme.accent };
  }
  if (isToday) {
    return { backgroundColor: theme.tealSoft, dateColor: theme.teal };
  }
  return { backgroundColor: 'transparent', dateColor: theme.ink };
}
