import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { darkTheme } from './theme';
import { weekDayBars, weekDayCellColors } from './weekStripLogic';

describe('weekDayBars', () => {
  it('omits gray placeholder bars when a day has no marks or load', () => {
    assert.deepEqual(
      weekDayBars({
        mark: 'follicular',
        showOvulation: true,
        loadUnits: 0,
        showCalendarLoad: true,
      }),
      [],
    );
  });

  it('includes period and load bars only when present', () => {
    assert.deepEqual(
      weekDayBars({
        mark: 'period',
        showOvulation: true,
        loadUnits: 2,
        showCalendarLoad: true,
      }),
      ['period', 'event', 'event'],
    );
  });

  it('caps load bars at four', () => {
    assert.deepEqual(
      weekDayBars({
        mark: null,
        showOvulation: false,
        loadUnits: 9,
        showCalendarLoad: true,
      }),
      ['event', 'event', 'event', 'event'],
    );
  });

  it('skips load bars when calendar load is hidden', () => {
    assert.deepEqual(
      weekDayBars({
        mark: 'ovulatory',
        showOvulation: true,
        loadUnits: 3,
        showCalendarLoad: false,
      }),
      ['ovulatory'],
    );
  });

  it('shows two bars for one intense session (load units 2)', () => {
    assert.deepEqual(
      weekDayBars({
        mark: null,
        showOvulation: false,
        loadUnits: 2,
        showCalendarLoad: true,
      }),
      ['event', 'event'],
    );
  });
});

describe('weekDayCellColors', () => {
  it('uses soft pink tint and pink date for the selected day without relying on a border', () => {
    const selected = weekDayCellColors(true, true, darkTheme);
    assert.equal(selected.backgroundColor, darkTheme.accentSoft);
    assert.equal(selected.dateColor, darkTheme.accent);
  });

  it('uses soft cyan tint for today when not selected', () => {
    const today = weekDayCellColors(false, true, darkTheme);
    assert.equal(today.backgroundColor, darkTheme.tealSoft);
    assert.equal(today.dateColor, darkTheme.teal);
  });

  it('keeps unselected non-today days transparent', () => {
    const plain = weekDayCellColors(false, false, darkTheme);
    assert.equal(plain.backgroundColor, 'transparent');
    assert.equal(plain.dateColor, darkTheme.ink);
  });
});
