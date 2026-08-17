import { addDays, diffDays } from './dates';

export const DEFAULT_CYCLE_LENGTH = 28;
export const DEFAULT_PERIOD_LENGTH = 5;
export const DEFAULT_LUTEAL_LENGTH = 14;
export const MIN_CYCLE = 18;
export const MAX_CYCLE = 45;

export type Settings = {
  showForecast: boolean;
  periodLength: number;
  lutealLength: number;
};

export type StoredData = {
  periodStarts: string[];
  settings: Settings;
};

export type DayMark = 'period' | 'periodForecast' | 'ovulation' | 'fertile';

export type CycleStatus = {
  cycleDay: number | null;
  nextPeriod: string | null;
  cycleLength: number;
  inPeriod: boolean;
};

export function defaultSettings(): Settings {
  return {
    showForecast: false,
    periodLength: DEFAULT_PERIOD_LENGTH,
    lutealLength: DEFAULT_LUTEAL_LENGTH,
  };
}

export function sortedUnique(dates: string[]): string[] {
  return [...new Set(dates)].sort();
}

export function averageCycleLength(starts: string[]): number {
  const sorted = sortedUnique(starts);
  if (sorted.length < 2) return DEFAULT_CYCLE_LENGTH;
  const lengths: number[] = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const length = diffDays(sorted[i - 1], sorted[i]);
    if (length >= MIN_CYCLE && length <= MAX_CYCLE) lengths.push(length);
  }
  if (!lengths.length) return DEFAULT_CYCLE_LENGTH;
  const sum = lengths.reduce((total, value) => total + value, 0);
  return Math.round(sum / lengths.length);
}

export function loggedPeriodDays(starts: string[], periodLength: number): Set<string> {
  const days = new Set<string>();
  for (const start of starts) {
    for (let i = 0; i < periodLength; i += 1) {
      days.add(addDays(start, i));
    }
  }
  return days;
}

export function forecastStarts(starts: string[], cycleLength: number, until: string): string[] {
  const sorted = sortedUnique(starts);
  if (!sorted.length) return [];
  const last = sorted[sorted.length - 1];
  const result: string[] = [];
  let next = addDays(last, cycleLength);
  while (next <= until) {
    result.push(next);
    next = addDays(next, cycleLength);
  }
  return result;
}

export function cycleStatus(today: string, starts: string[], settings: Settings): CycleStatus {
  const sorted = sortedUnique(starts);
  const cycleLength = averageCycleLength(sorted);
  if (!sorted.length) {
    return { cycleDay: null, nextPeriod: null, cycleLength, inPeriod: false };
  }
  const last = sorted[sorted.length - 1];
  const cycleDay = diffDays(last, today) + 1;
  let nextPeriod = addDays(last, cycleLength);
  while (nextPeriod <= today) {
    nextPeriod = addDays(nextPeriod, cycleLength);
  }
  const inPeriod = cycleDay >= 1 && cycleDay <= settings.periodLength;
  return {
    cycleDay: cycleDay > 0 ? cycleDay : null,
    nextPeriod,
    cycleLength,
    inPeriod,
  };
}

export function marksForYear(
  year: number,
  starts: string[],
  settings: Settings,
): Map<string, DayMark> {
  const marks = new Map<string, DayMark>();
  const cycleLength = averageCycleLength(starts);
  const yearPrefix = `${year}-`;
  const inYear = (iso: string) => iso.startsWith(yearPrefix);

  if (settings.showForecast && starts.length > 0) {
    const forecasts = forecastStarts(starts, cycleLength, `${year}-12-31`);
    for (const start of forecasts) {
      for (let i = 0; i < settings.periodLength; i += 1) {
        const day = addDays(start, i);
        if (inYear(day)) marks.set(day, 'periodForecast');
      }
    }

    const anchors = [...sortedUnique(starts), ...forecasts];
    for (const start of anchors) {
      const ovulation = addDays(start, cycleLength - settings.lutealLength);
      if (ovulation <= start) continue;
      for (let offset = 5; offset >= 1; offset -= 1) {
        const fertile = addDays(ovulation, -offset);
        if (inYear(fertile) && !marks.has(fertile)) marks.set(fertile, 'fertile');
      }
      if (inYear(ovulation)) marks.set(ovulation, 'ovulation');
    }
  }

  for (const day of loggedPeriodDays(starts, settings.periodLength)) {
    if (inYear(day)) marks.set(day, 'period');
  }

  return marks;
}

export function togglePeriodStart(starts: string[], iso: string): string[] {
  const set = new Set(starts);
  if (set.has(iso)) set.delete(iso);
  else set.add(iso);
  return sortedUnique([...set]);
}
