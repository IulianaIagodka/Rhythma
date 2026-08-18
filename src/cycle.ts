import { addDays, diffDays } from './dates';
import type { AccessTier } from './access';

export const DEFAULT_CYCLE_LENGTH = 28;
export const DEFAULT_PERIOD_LENGTH = 5;
export const DEFAULT_LUTEAL_LENGTH = 14;
export const MIN_CYCLE = 18;
export const MAX_CYCLE = 45;

export type PhaseId = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

export type Settings = {
  showForecast: boolean;
  showOvulation: boolean;
  showEventAdvice: boolean;
  showPhaseLists: boolean;
  phaseListsExpanded: boolean;
  showCycleRhythm: boolean;
  periodLength: number;
  lutealLength: number;
  themeMode: 'light' | 'dark';
  calendarSync: boolean;
  accessTier: AccessTier;
};

export type StoredData = {
  periodStarts: string[];
  settings: Settings;
};

export type DayMark =
  | 'period'
  | 'periodForecast'
  | 'follicular'
  | 'ovulatory'
  | 'luteal';

export type CycleStatus = {
  cycleDay: number | null;
  nextPeriod: string | null;
  cycleLength: number;
  inPeriod: boolean;
  phase: PhaseId | null;
};

export function defaultSettings(): Settings {
  return {
    showForecast: true,
    showOvulation: false,
    showEventAdvice: true,
    showPhaseLists: true,
    phaseListsExpanded: false,
    showCycleRhythm: true,
    periodLength: DEFAULT_PERIOD_LENGTH,
    lutealLength: DEFAULT_LUTEAL_LENGTH,
    themeMode: 'dark',
    calendarSync: false,
    accessTier: 'free',
  };
}

export function markForDate(
  iso: string,
  starts: string[],
  settings: Settings,
): DayMark | null {
  const year = Number(iso.slice(0, 4));
  return marksForYear(year, starts, settings).get(iso) ?? null;
}

export function daysUntilNextPeriod(today: string, nextPeriod: string | null): number | null {
  if (!nextPeriod) return null;
  const days = diffDays(today, nextPeriod);
  return days >= 0 ? days : null;
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
    return { cycleDay: null, nextPeriod: null, cycleLength, inPeriod: false, phase: null };
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
    phase: cycleDay > 0 ? phaseIdForCycleDay(cycleDay, cycleLength, settings) : null,
  };
}

export function ovulationDayForCycle(cycleLength: number, settings: Settings): number {
  return Math.max(settings.periodLength + 2, cycleLength - settings.lutealLength);
}

export function wrappedCycleDay(cycleDay: number, cycleLength: number): number {
  if (cycleLength < 1) return 1;
  if (cycleDay < 1) return 1;
  return ((cycleDay - 1) % cycleLength) + 1;
}

export type PhaseWindow = {
  phase: PhaseId;
  startDay: number;
  endDay: number;
};

export function phaseWindows(cycleLength: number, settings: Settings): PhaseWindow[] {
  const windows: PhaseWindow[] = [];
  for (let day = 1; day <= cycleLength; day += 1) {
    const phase = phaseIdForCycleDay(day, cycleLength, settings);
    const last = windows[windows.length - 1];
    if (last && last.phase === phase) last.endDay = day;
    else windows.push({ phase, startDay: day, endDay: day });
  }
  return windows;
}

export type RhythmMarker = {
  kind: 'phase' | 'period';
  phase: PhaseId;
  days: number;
};

export function nextRhythmMarker(
  cycleDay: number,
  cycleLength: number,
  settings: Settings,
): RhythmMarker | null {
  if (cycleLength < 1 || cycleDay < 1) return null;
  const day = wrappedCycleDay(cycleDay, cycleLength);
  const windows = phaseWindows(cycleLength, settings);
  const index = windows.findIndex((window) => day >= window.startDay && day <= window.endDay);
  if (index < 0) return null;
  const next = windows[index + 1];
  if (next) {
    return { kind: 'phase', phase: next.phase, days: next.startDay - day };
  }
  return { kind: 'period', phase: 'menstrual', days: cycleLength - day + 1 };
}

export function energyAtCycleDay(
  cycleDay: number,
  cycleLength: number,
  settings: Settings,
): number {
  const day = wrappedCycleDay(cycleDay, cycleLength);
  const peak = ovulationDayForCycle(cycleLength, settings);
  const delta = Math.min(Math.abs(day - peak), cycleLength - Math.abs(day - peak));
  const width = Math.max(cycleLength * 0.35, 6);
  const bell = Math.cos(Math.min(1, delta / width) * Math.PI) * 0.5 + 0.5;
  const menstrualDip = day <= settings.periodLength ? 0.18 : 0;
  return Math.max(0.18, Math.min(1, 0.28 + 0.7 * bell - menstrualDip));
}

export type RhythmEnergyKind = 'low' | 'rising' | 'peak' | 'easing';

export function rhythmEnergyKind(phase: PhaseId): RhythmEnergyKind {
  if (phase === 'menstrual') return 'low';
  if (phase === 'follicular') return 'rising';
  if (phase === 'ovulatory') return 'peak';
  return 'easing';
}

export function phaseIdForCycleDay(
  cycleDay: number,
  cycleLength: number,
  settings: Settings,
): PhaseId {
  const ovulationDay = ovulationDayForCycle(cycleLength, settings);
  if (cycleDay <= settings.periodLength) return 'menstrual';
  if (cycleDay < ovulationDay - 1) return 'follicular';
  if (cycleDay <= ovulationDay + 1) return 'ovulatory';
  return 'luteal';
}

export function phaseOnDate(iso: string, starts: string[], settings: Settings): PhaseId | null {
  const sorted = sortedUnique(starts);
  if (!sorted.length || iso < sorted[0]) return null;
  const startIndex = sorted.reduce((found, value, index) => (value <= iso ? index : found), -1);
  if (startIndex < 0) return null;
  const start = sorted[startIndex];
  const nextLogged = sorted[startIndex + 1];
  const cycleLength = averageCycleLength(sorted);
  let cycleDay = diffDays(start, iso) + 1;
  if (settings.showForecast && nextLogged == null && cycleDay > cycleLength) {
    cycleDay = ((cycleDay - 1) % cycleLength) + 1;
  }
  return phaseIdForCycleDay(cycleDay, cycleLength, settings);
}

export function marksForYear(
  year: number,
  starts: string[],
  settings: Settings,
): Map<string, DayMark> {
  const marks = new Map<string, DayMark>();
  const yearPrefix = `${year}-`;
  const inYear = (iso: string) => iso.startsWith(yearPrefix);
  const cycleLength = averageCycleLength(starts);

  if (settings.showForecast && starts.length > 0) {
    const cursor = `${year}-01-01`;
    const last = `${year}-12-31`;
    let day = cursor;
    while (day <= last) {
      const phase = phaseOnDate(day, starts, settings);
      if (phase === 'menstrual') marks.set(day, 'periodForecast');
      day = addDays(day, 1);
    }

    for (const start of forecastStarts(starts, cycleLength, last)) {
      for (let i = 0; i < settings.periodLength; i += 1) {
        const iso = addDays(start, i);
        if (inYear(iso)) marks.set(iso, 'periodForecast');
      }
    }
  }

  if (settings.showOvulation && starts.length > 0) {
    let day = `${year}-01-01`;
    const last = `${year}-12-31`;
    while (day <= last) {
      if (!marks.has(day) && phaseOnDate(day, starts, settings) === 'ovulatory') {
        marks.set(day, 'ovulatory');
      }
      day = addDays(day, 1);
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

export type PeriodPromptKind = 'add' | 'remove';

export function periodPromptForDate(starts: string[], iso: string): PeriodPromptKind {
  return starts.includes(iso) ? 'remove' : 'add';
}
