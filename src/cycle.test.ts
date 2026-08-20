import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  averageCycleLength,
  cycleStatus,
  DEFAULT_CYCLE_LENGTH,
  defaultSettings,
  forecastStarts,
  loggedPeriodDays,
  marksForYear,
  energyAtCycleDay,
  estrogenAtCycleDay,
  nextRhythmMarker,
  ovulationDayForCycle,
  phaseIdForCycleDay,
  phaseWindows,
  periodPromptForDate,
  progesteroneAtCycleDay,
  rhythmEnergyKind,
  togglePeriodStart,
  wrappedCycleDay,
} from './cycle';
import { addDays, formatSelectedDayTitle, mondayIndex } from './dates';

describe('defaultSettings', () => {
  it('shows forecast and lists, hides ovulation', () => {
    const settings = defaultSettings();
    assert.equal(settings.showForecast, true);
    assert.equal(settings.showOvulation, false);
    assert.equal(settings.showEventAdvice, true);
    assert.equal(settings.showPhaseLists, true);
    assert.equal(settings.phaseListsExpanded, false);
    assert.equal(settings.showCycleRhythm, true);
    assert.equal(settings.themeMode, 'dark');
  });
});

describe('averageCycleLength', () => {
  it('defaults when there are fewer than two starts', () => {
    assert.equal(averageCycleLength([]), DEFAULT_CYCLE_LENGTH);
    assert.equal(averageCycleLength(['2026-01-01']), DEFAULT_CYCLE_LENGTH);
  });

  it('averages typical cycles and ignores outliers', () => {
    assert.equal(averageCycleLength(['2026-01-01', '2026-01-29']), 28);
    assert.equal(averageCycleLength(['2026-01-01', '2026-01-29', '2026-02-26']), 28);
    assert.equal(averageCycleLength(['2026-01-01', '2026-04-01', '2026-04-29']), 28);
  });
});

describe('loggedPeriodDays', () => {
  it('marks periodLength days from each start', () => {
    const days = loggedPeriodDays(['2026-08-01'], 5);
    assert.equal(days.has('2026-08-01'), true);
    assert.equal(days.has('2026-08-05'), true);
    assert.equal(days.has('2026-08-06'), false);
  });
});

describe('forecastStarts', () => {
  it('projects future first days from the last start', () => {
    const next = forecastStarts(['2026-01-01'], 28, '2026-03-01');
    assert.deepEqual(next, ['2026-01-29', '2026-02-26']);
  });
});

describe('marksForYear', () => {
  it('shows only logged periods when forecast is off', () => {
    const marks = marksForYear(2026, ['2026-08-01'], {
      ...defaultSettings(),
      showForecast: false,
    });
    assert.equal(marks.get('2026-08-01'), 'period');
    assert.equal(marks.has('2026-08-29'), false);
  });

  it('paints cycle marks when forecast is on', () => {
    const marks = marksForYear(2026, ['2026-08-01'], {
      ...defaultSettings(),
      showForecast: true,
    });
    assert.equal(marks.get('2026-08-01'), 'period');
    assert.equal(marks.get('2026-08-29'), 'periodForecast');
    assert.equal(marks.has('2026-08-10'), false);
    assert.equal(marks.has('2026-08-14'), false);
  });

  it('paints ovulation when the switch is on', () => {
    const marks = marksForYear(2026, ['2026-08-01'], {
      ...defaultSettings(),
      showOvulation: true,
    });
    assert.equal(marks.get('2026-08-14'), 'ovulatory');
    assert.equal(marks.get('2026-08-01'), 'period');
  });

  it('hides ovulation when the switch is off', () => {
    const marks = marksForYear(2026, ['2026-08-01'], {
      ...defaultSettings(),
      showOvulation: false,
    });
    assert.equal(marks.has('2026-08-14'), false);
  });
});

describe('cycleStatus', () => {
  it('reports cycle day, next period and phase', () => {
    const status = cycleStatus('2026-08-10', ['2026-08-01'], defaultSettings());
    assert.equal(status.cycleDay, 10);
    assert.equal(status.inPeriod, false);
    assert.equal(status.nextPeriod, '2026-08-29');
    assert.equal(status.phase, 'follicular');
  });

  it('flags the bleeding window', () => {
    const status = cycleStatus('2026-08-03', ['2026-08-01'], defaultSettings());
    assert.equal(status.inPeriod, true);
    assert.equal(status.phase, 'menstrual');
  });
});

describe('phaseIdForCycleDay', () => {
  it('maps a 28-day cycle to four load windows', () => {
    const settings = defaultSettings();
    assert.equal(phaseIdForCycleDay(1, 28, settings), 'menstrual');
    assert.equal(phaseIdForCycleDay(5, 28, settings), 'menstrual');
    assert.equal(phaseIdForCycleDay(6, 28, settings), 'follicular');
    assert.equal(phaseIdForCycleDay(12, 28, settings), 'follicular');
    assert.equal(phaseIdForCycleDay(14, 28, settings), 'ovulatory');
    assert.equal(phaseIdForCycleDay(16, 28, settings), 'luteal');
    assert.equal(phaseIdForCycleDay(32, 28, settings), 'luteal');
  });
});

describe('phaseWindows', () => {
  it('covers a 28-day cycle with four load windows', () => {
    const settings = defaultSettings();
    assert.deepEqual(phaseWindows(28, settings), [
      { phase: 'menstrual', startDay: 1, endDay: 5 },
      { phase: 'follicular', startDay: 6, endDay: 12 },
      { phase: 'ovulatory', startDay: 13, endDay: 15 },
      { phase: 'luteal', startDay: 16, endDay: 28 },
    ]);
  });
});

describe('nextRhythmMarker', () => {
  it('forecasts the peak window from late follicular', () => {
    const marker = nextRhythmMarker(10, 28, defaultSettings());
    assert.deepEqual(marker, { kind: 'phase', phase: 'ovulatory', days: 3 });
  });

  it('forecasts the next period from luteal', () => {
    const marker = nextRhythmMarker(18, 28, defaultSettings());
    assert.deepEqual(marker, { kind: 'period', phase: 'menstrual', days: 11 });
  });
});

describe('energyAtCycleDay', () => {
  it('peaks near the ovulatory window and stays lower in menstrual', () => {
    const settings = defaultSettings();
    const peakDay = ovulationDayForCycle(28, settings);
    assert.equal(peakDay, 14);
    assert.ok(energyAtCycleDay(peakDay, 28, settings) > energyAtCycleDay(1, 28, settings));
    assert.ok(energyAtCycleDay(peakDay, 28, settings) > energyAtCycleDay(22, 28, settings));
  });

  it('names energy by phase, not as a lab curve', () => {
    assert.equal(rhythmEnergyKind('menstrual'), 'low');
    assert.equal(rhythmEnergyKind('follicular'), 'rising');
    assert.equal(rhythmEnergyKind('ovulatory'), 'peak');
    assert.equal(rhythmEnergyKind('luteal'), 'easing');
  });
});

describe('hormone curves', () => {
  it('peaks estrogen near ovulation and keeps progesterone low before it', () => {
    const settings = defaultSettings();
    const ovulation = ovulationDayForCycle(28, settings);
    assert.ok(estrogenAtCycleDay(ovulation, 28, settings) > estrogenAtCycleDay(3, 28, settings));
    assert.ok(estrogenAtCycleDay(ovulation, 28, settings) > estrogenAtCycleDay(22, 28, settings));
    assert.ok(progesteroneAtCycleDay(3, 28, settings) < 0.2);
    assert.ok(progesteroneAtCycleDay(ovulation + 6, 28, settings) > progesteroneAtCycleDay(ovulation, 28, settings));
  });

  it('drops progesterone toward the end of the cycle', () => {
    const settings = defaultSettings();
    const midLuteal = progesteroneAtCycleDay(21, 28, settings);
    const lateLuteal = progesteroneAtCycleDay(27, 28, settings);
    assert.ok(midLuteal > lateLuteal);
  });

  it('keeps estrogen and energy free of post-ovulation notches', () => {
    const settings = defaultSettings();
    const length = 28;
    const steps = (length - 1) * 8 + 1;
    let estrogenNotches = 0;
    let energyNotches = 0;
    let prevEs = estrogenAtCycleDay(1, length, settings);
    let prevE = energyAtCycleDay(1, length, settings);
    let prevPrevEs = prevEs;
    let prevPrevE = prevE;
    for (let i = 1; i < steps; i += 1) {
      const day = 1 + (i / (steps - 1)) * (length - 1);
      const es = estrogenAtCycleDay(day, length, settings);
      const e = energyAtCycleDay(day, length, settings);
      if (i >= 2) {
        if (prevEs - prevPrevEs < -0.02 && es - prevEs > 0.02) estrogenNotches += 1;
        if (prevE - prevPrevE < -0.015 && e - prevE > 0.015) energyNotches += 1;
      }
      prevPrevEs = prevEs;
      prevPrevE = prevE;
      prevEs = es;
      prevE = e;
    }
    assert.equal(estrogenNotches, 0);
    assert.equal(energyNotches, 0);
  });
});

describe('wrappedCycleDay', () => {
  it('wraps days past the current cycle length', () => {
    assert.equal(wrappedCycleDay(29, 28), 1);
    assert.equal(wrappedCycleDay(18, 28), 18);
  });
});

describe('togglePeriodStart', () => {
  it('adds and removes a first-day mark', () => {
    const added = togglePeriodStart([], '2026-08-17');
    assert.deepEqual(added, ['2026-08-17']);
    assert.deepEqual(togglePeriodStart(added, '2026-08-17'), []);
  });
});

describe('periodPromptForDate', () => {
  it('asks to add a period start on an empty day', () => {
    assert.equal(periodPromptForDate([], '2026-08-18'), 'add');
    assert.equal(periodPromptForDate(['2026-08-01'], '2026-08-18'), 'add');
  });

  it('asks to remove a period start that is already logged', () => {
    assert.equal(periodPromptForDate(['2026-08-18'], '2026-08-18'), 'remove');
  });
});

describe('dates', () => {
  it('uses Monday-first weekday indexes', () => {
    assert.equal(mondayIndex(2026, 7, 17), 0);
    assert.equal(mondayIndex(2026, 7, 1), 5);
  });

  it('adds days across month bounds', () => {
    assert.equal(addDays('2026-08-30', 2), '2026-09-01');
  });

  it('formats the selected-day card title without an ISO date', () => {
    assert.equal(formatSelectedDayTitle('2026-08-23', 'en'), 'Sunday, Aug 23');
    assert.equal(formatSelectedDayTitle('2026-08-23', 'uk'), 'Неділя, 23 серпня');
  });
});
