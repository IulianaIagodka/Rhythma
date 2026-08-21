import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  YEAR_CALENDAR_COLS,
  YEAR_CALENDAR_MAX_DAY_SIZE,
  YEAR_CALENDAR_MIN_DAY_SIZE,
  monthBlockHeight,
  monthWeekRows,
  yearCalendarMetrics,
  yearCalendarMonthFitsGrid,
  yearCalendarScrollOffset,
} from './yearCalendarLayout';

describe('yearCalendarMetrics', () => {
  it('uses one full-width month column with capped, tappable day cells', () => {
    const metrics = yearCalendarMetrics(350, 700);
    assert.equal(YEAR_CALENDAR_COLS, 1);
    assert.equal(metrics.monthWidth, 350);
    assert.ok(metrics.daySize >= YEAR_CALENDAR_MIN_DAY_SIZE);
    assert.ok(metrics.daySize <= YEAR_CALENDAR_MAX_DAY_SIZE);
    assert.ok(metrics.markSize < metrics.daySize);
    assert.equal(yearCalendarMonthFitsGrid(metrics), true);
  });

  it('keeps day cells in a normalized range on compact and roomy phones', () => {
    const compact = yearCalendarMetrics(320, 520);
    const roomy = yearCalendarMetrics(390, 720);
    assert.ok(compact.daySize >= YEAR_CALENDAR_MIN_DAY_SIZE);
    assert.ok(compact.daySize <= YEAR_CALENDAR_MAX_DAY_SIZE);
    assert.ok(roomy.daySize >= compact.daySize);
    assert.ok(roomy.markSize <= roomy.daySize);
    assert.equal(yearCalendarMonthFitsGrid(compact), true);
  });

  it('sizes each month from its real week count so empty weeks do not pad the block', () => {
    // August 2026 starts Saturday → 6 weeks; September 2026 starts Tuesday → 5 weeks.
    assert.equal(monthWeekRows(2026, 7), 6);
    assert.equal(monthWeekRows(2026, 8), 5);
    const metrics = yearCalendarMetrics(350, 700);
    const aug = monthBlockHeight(6, metrics.titleBlock, metrics.daySize);
    const sep = monthBlockHeight(5, metrics.titleBlock, metrics.daySize);
    assert.ok(aug > sep);
    assert.equal(aug - sep, metrics.daySize);
  });

  it('scrolls so the current month stays near the top of the visible window', () => {
    const metrics = yearCalendarMetrics(350, 700);
    assert.equal(yearCalendarScrollOffset(0, 2026, metrics), 0);
    const forAugust = yearCalendarScrollOffset(7, 2026, metrics);
    assert.ok(forAugust > 0);
    const forDecember = yearCalendarScrollOffset(11, 2026, metrics);
    assert.ok(forDecember >= forAugust);
  });
});
