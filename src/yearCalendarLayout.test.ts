import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  YEAR_CALENDAR_FALLBACK_MONTH_HEIGHT,
  YEAR_CALENDAR_VISIBLE_ROWS,
  yearCalendarMetrics,
  yearCalendarScrollOffset,
} from './yearCalendarLayout';

describe('yearCalendarMetrics', () => {
  it('fills the viewport with three visible month rows', () => {
    const metrics = yearCalendarMetrics(350, 480);
    assert.equal(metrics.monthWidth, (350 - metrics.colGap * 2) / 3);
    assert.ok(metrics.monthHeight > YEAR_CALENDAR_FALLBACK_MONTH_HEIGHT);
    const used =
      metrics.monthHeight * YEAR_CALENDAR_VISIBLE_ROWS +
      metrics.rowGap * (YEAR_CALENDAR_VISIBLE_ROWS - 1);
    assert.ok(Math.abs(used - 480) < 0.01);
  });

  it('sizes day numerals from month width so they stay readable', () => {
    const compact = yearCalendarMetrics(300, 400);
    const roomy = yearCalendarMetrics(390, 560);
    assert.ok(compact.dayFontSize >= 9);
    assert.ok(roomy.daySize >= compact.daySize);
    assert.ok(roomy.dayFontSize >= compact.dayFontSize);
    assert.ok(roomy.daySize <= Math.floor(roomy.monthWidth / 7));
  });

  it('scrolls so the current month stays inside the 9-month window', () => {
    const monthHeight = 160;
    const rowGap = 14;
    assert.equal(yearCalendarScrollOffset(0, monthHeight, rowGap), 0);
    assert.equal(yearCalendarScrollOffset(7, monthHeight, rowGap), monthHeight + rowGap);
    assert.equal(yearCalendarScrollOffset(11, monthHeight, rowGap), monthHeight + rowGap);
  });

  it('keeps a usable month height even when the viewport is short', () => {
    const metrics = yearCalendarMetrics(350, 100);
    assert.ok(metrics.monthHeight >= 150);
    assert.ok(metrics.daySize >= 14);
  });
});
