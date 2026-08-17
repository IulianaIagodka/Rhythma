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
  togglePeriodStart,
} from './cycle';
import { addDays, mondayIndex } from './dates';

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

  it('adds forecast, fertile window and ovulation when enabled', () => {
    const marks = marksForYear(2026, ['2026-08-01'], {
      ...defaultSettings(),
      showForecast: true,
    });
    assert.equal(marks.get('2026-08-01'), 'period');
    assert.equal(marks.get('2026-08-29'), 'periodForecast');
    assert.equal(marks.get('2026-08-15'), 'ovulation');
    assert.equal(marks.get('2026-08-14'), 'fertile');
    assert.equal(marks.get('2026-08-10'), 'fertile');
  });
});

describe('cycleStatus', () => {
  it('reports cycle day and next period', () => {
    const status = cycleStatus('2026-08-10', ['2026-08-01'], defaultSettings());
    assert.equal(status.cycleDay, 10);
    assert.equal(status.inPeriod, false);
    assert.equal(status.nextPeriod, '2026-08-29');
  });

  it('flags the bleeding window', () => {
    const status = cycleStatus('2026-08-03', ['2026-08-01'], defaultSettings());
    assert.equal(status.inPeriod, true);
  });
});

describe('togglePeriodStart', () => {
  it('adds and removes a first-day mark', () => {
    const added = togglePeriodStart([], '2026-08-17');
    assert.deepEqual(added, ['2026-08-17']);
    assert.deepEqual(togglePeriodStart(added, '2026-08-17'), []);
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
});
