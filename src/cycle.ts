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
  showCalendarEvents: boolean;
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
    showCalendarEvents: true,
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
  const rawCycleDay = diffDays(last, today) + 1;
  if (rawCycleDay < 1) {
    return { cycleDay: null, nextPeriod: null, cycleLength, inPeriod: false, phase: null };
  }
  const cycleDay =
    rawCycleDay > cycleLength ? wrappedCycleDay(rawCycleDay, cycleLength) : rawCycleDay;
  let nextPeriod = addDays(last, cycleLength);
  while (nextPeriod <= today) {
    nextPeriod = addDays(nextPeriod, cycleLength);
  }
  const inPeriod = rawCycleDay >= 1 && rawCycleDay <= settings.periodLength;
  return {
    cycleDay,
    nextPeriod,
    cycleLength,
    inPeriod,
    phase: phaseIdForCycleDay(cycleDay, cycleLength, settings),
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
  // Circular distance to ovulation peak
  const delta = Math.min(Math.abs(day - peak), cycleLength - Math.abs(day - peak));
  const width = Math.max(cycleLength * 0.38, 7);
  const t = Math.min(1, delta / width);
  // Smoothstep bell — softer shoulders than a hard cos kink
  const smooth = t * t * (3 - 2 * t);
  const bell = Math.cos(smooth * Math.PI) * 0.5 + 0.5;
  // Soft menstrual dip that eases out after the period instead of a step
  const periodEnd = settings.periodLength;
  let menstrualDip = 0;
  if (day <= periodEnd) {
    menstrualDip = 0.16 * (1 - (day - 1) / Math.max(1, periodEnd));
  } else if (day <= periodEnd + 3) {
    const fade = (day - periodEnd) / 3;
    menstrualDip = 0.04 * (1 - fade);
  }
  return Math.max(0.2, Math.min(1, 0.3 + 0.68 * bell - menstrualDip));
}

/** Illustrative relative estrogen pattern — not a lab value. */
export function estrogenAtCycleDay(
  cycleDay: number,
  cycleLength: number,
  settings: Settings,
): number {
  const day = wrappedCycleDay(cycleDay, cycleLength);
  const ovulation = ovulationDayForCycle(cycleLength, settings);
  // Broad peri-ovulatory peak (wider left shoulder for the follicular climb)
  const leftWidth = Math.max(cycleLength * 0.16, 3.2);
  const rightWidth = Math.max(cycleLength * 0.1, 2.2);
  const width = day <= ovulation ? leftWidth : rightWidth;
  const primary = Math.exp(-0.5 * ((day - ovulation) / width) ** 2);
  // Soft secondary luteal bump — ease in after ovulation instead of a step
  const lutealMid = ovulation + Math.max(3, Math.round((cycleLength - ovulation) * 0.42));
  const lutealWidth = Math.max(cycleLength * 0.12, 2.6);
  const lutealRaw = Math.exp(-0.5 * ((day - lutealMid) / lutealWidth) ** 2) * 0.34;
  let lutealBump = 0;
  if (day > ovulation) {
    const t = Math.max(0, Math.min(1, (day - ovulation) / 2.5));
    lutealBump = lutealRaw * (t * t * (3 - 2 * t));
  }
  const floor = day <= settings.periodLength ? 0.06 : 0.1;
  return Math.max(0, Math.min(1, floor + primary * 0.9 + lutealBump));
}

/** Illustrative relative progesterone pattern — not a lab value. */
export function progesteroneAtCycleDay(
  cycleDay: number,
  cycleLength: number,
  settings: Settings,
): number {
  const day = wrappedCycleDay(cycleDay, cycleLength);
  const ovulation = ovulationDayForCycle(cycleLength, settings);
  const baseline = 0.08 + ((day - 1) / Math.max(1, cycleLength - 1)) * 0.03;
  // Luteal dome centered after ovulation, with a soft lead-in (no corner)
  const peakDay = ovulation + Math.max(4, Math.round((cycleLength - ovulation) * 0.45));
  const width = Math.max(cycleLength * 0.16, 3.5);
  const dome = Math.exp(-0.5 * ((day - peakDay) / width) ** 2);
  let gate = 0;
  if (day > ovulation - 2) {
    const t = Math.max(0, Math.min(1, (day - (ovulation - 2)) / 4));
    gate = t * t * (3 - 2 * t);
  }
  return Math.max(0.08, Math.min(1, baseline + dome * 0.82 * gate));
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

export function cycleDayOnDate(iso: string, starts: string[], settings: Settings): number | null {
  const sorted = sortedUnique(starts);
  if (!sorted.length || iso < sorted[0]) return null;
  const startIndex = sorted.reduce((found, value, index) => (value <= iso ? index : found), -1);
  if (startIndex < 0) return null;
  const start = sorted[startIndex];
  const nextLogged = sorted[startIndex + 1];
  const cycleLength = averageCycleLength(sorted);
  let cycleDay = diffDays(start, iso) + 1;
  if (cycleDay < 1) return null;
  // Past the last logged start with no following start: stay within 1..cycleLength.
  // Cycle day 62+ is not a meaningful status — wrap onto the projected cycle.
  if (nextLogged == null && cycleDay > cycleLength) {
    cycleDay = wrappedCycleDay(cycleDay, cycleLength);
  }
  return cycleDay;
}

export function phaseOnDate(iso: string, starts: string[], settings: Settings): PhaseId | null {
  const cycleDay = cycleDayOnDate(iso, starts, settings);
  if (cycleDay == null) return null;
  const cycleLength = averageCycleLength(starts);
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
