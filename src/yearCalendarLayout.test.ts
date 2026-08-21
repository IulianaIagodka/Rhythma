import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  YEAR_CALENDAR_COLS,
  YEAR_CALENDAR_FALLBACK_MONTH_HEIGHT,
  YEAR_CALENDAR_MIN_DAY_SIZE,
  YEAR_CALENDAR_VISIBLE_ROWS,
  yearCalendarMetrics,
  yearCalendarScrollOffset,
} from './yearCalendarLayout';

describe('yearCalendarMetrics', () => {
  it('fills the viewport with three visible month rows in two columns', () => {
    const metrics = yearCalendarMetrics(350, 600);
    assert.equal(YEAR_CALENDAR_COLS, 2);
    assert.equal(metrics.monthWidth, (350 - metrics.colGap) / 2);
    assert.ok(metrics.monthHeight > YEAR_CALENDAR_FALLBACK_MONTH_HEIGHT);
    const used =
      metrics.monthHeight * YEAR_CALENDAR_VISIBLE_ROWS +
      metrics.rowGap * (YEAR_CALENDAR_VISIBLE_ROWS - 1);
    assert.ok(Math.abs(used - 600) < 0.01);
  });

  it('keeps day cells large enough to tap on compact phones', () => {
    const compact = yearCalendarMetrics(320, 400);
    const roomy = yearCalendarMetrics(390, 560);
    assert.ok(compact.daySize >= YEAR_CALENDAR_MIN_DAY_SIZE);
    assert.ok(compact.dayFontSize >= 12);
    assert.ok(roomy.daySize >= compact.daySize);
    assert.ok(roomy.dayFontSize >= compact.dayFontSize);
  });

  it('scrolls so the current month stays inside the visible window', () => {
    const monthHeight = 180;
    const rowGap = 16;
    assert.equal(yearCalendarScrollOffset(0, monthHeight, rowGap), 0);
    assert.equal(yearCalendarScrollOffset(3, monthHeight, rowGap), 0);
    assert.equal(yearCalendarScrollOffset(7, monthHeight, rowGap), 2 * (monthHeight + rowGap));
    assert.equal(yearCalendarScrollOffset(11, monthHeight, rowGap), 3 * (monthHeight + rowGap));
  });

  it('keeps a usable month height even when the viewport is short', () => {
    const metrics = yearCalendarMetrics(350, 100);
    assert.ok(metrics.monthHeight >= YEAR_CALENDAR_FALLBACK_MONTH_HEIGHT);
    assert.ok(metrics.daySize >= YEAR_CALENDAR_MIN_DAY_SIZE);
  });
});
