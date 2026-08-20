export const YEAR_CALENDAR_COLS = 3;
export const YEAR_CALENDAR_VISIBLE_MONTHS = 9;
export const YEAR_CALENDAR_VISIBLE_ROWS = YEAR_CALENDAR_VISIBLE_MONTHS / YEAR_CALENDAR_COLS;
export const YEAR_CALENDAR_ROW_GAP = 14;
export const YEAR_CALENDAR_COL_GAP = 10;

/** Fallback when layout has not been measured yet (compact phones). */
export const YEAR_CALENDAR_FALLBACK_MONTH_HEIGHT = 150;

export type YearCalendarMetrics = {
  monthHeight: number;
  monthWidth: number;
  daySize: number;
  dayFontSize: number;
  monthTitleSize: number;
  rowGap: number;
  colGap: number;
  viewportHeight: number;
};

/**
 * Size the 3×3 year grid to the available viewport so months fill the screen
 * instead of leaving empty space under a fixed short grid.
 */
export function yearCalendarMetrics(
  viewportWidth: number,
  viewportHeight: number,
): YearCalendarMetrics {
  const width = Math.max(0, viewportWidth);
  const height = Math.max(0, viewportHeight);
  const rowGap = YEAR_CALENDAR_ROW_GAP;
  const colGap = YEAR_CALENDAR_COL_GAP;
  const monthWidth = (width - colGap * (YEAR_CALENDAR_COLS - 1)) / YEAR_CALENDAR_COLS;
  const monthHeight = Math.max(
    YEAR_CALENDAR_FALLBACK_MONTH_HEIGHT,
    (height - rowGap * (YEAR_CALENDAR_VISIBLE_ROWS - 1)) / YEAR_CALENDAR_VISIBLE_ROWS,
  );
  // Seven weekday columns; leave a hair of padding inside the cell.
  const daySize = Math.max(14, Math.floor(monthWidth / 7) - 1);
  const dayFontSize = Math.max(9, Math.round(daySize * 0.62));
  const monthTitleSize = Math.max(11, Math.min(14, Math.round(monthWidth * 0.11)));

  return {
    monthHeight,
    monthWidth,
    daySize,
    dayFontSize,
    monthTitleSize,
    rowGap,
    colGap,
    viewportHeight: height,
  };
}

export function yearCalendarScrollOffset(monthIndex: number, monthHeight: number, rowGap: number): number {
  const rowIndex = Math.floor(monthIndex / YEAR_CALENDAR_COLS);
  const maxStartRow = Math.max(0, 12 / YEAR_CALENDAR_COLS - YEAR_CALENDAR_VISIBLE_ROWS);
  const centeredRow = Math.min(maxStartRow, Math.max(0, rowIndex - 1));
  return centeredRow * (monthHeight + rowGap);
}
