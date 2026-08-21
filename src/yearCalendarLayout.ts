export const YEAR_CALENDAR_COLS = 1;
/** Full-width months so day taps stay near Apple’s ~44pt target. */
export const YEAR_CALENDAR_VISIBLE_MONTHS = 3;
export const YEAR_CALENDAR_VISIBLE_ROWS = YEAR_CALENDAR_VISIBLE_MONTHS / YEAR_CALENDAR_COLS;
export const YEAR_CALENDAR_ROW_GAP = 18;
export const YEAR_CALENDAR_COL_GAP = 0;

/** Fallback when layout has not been measured yet (compact phones). */
export const YEAR_CALENDAR_FALLBACK_MONTH_HEIGHT = 220;

/** Prefer comfortable finger targets on year days. */
export const YEAR_CALENDAR_MIN_DAY_SIZE = 40;

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
 * One full-width month column — day cells stay large enough to tap reliably.
 */
export function yearCalendarMetrics(
  viewportWidth: number,
  viewportHeight: number,
): YearCalendarMetrics {
  const width = Math.max(0, viewportWidth);
  const height = Math.max(0, viewportHeight);
  const rowGap = YEAR_CALENDAR_ROW_GAP;
  const colGap = YEAR_CALENDAR_COL_GAP;
  const monthWidth = width;
  const monthHeight = Math.max(
    YEAR_CALENDAR_FALLBACK_MONTH_HEIGHT,
    (height - rowGap * (YEAR_CALENDAR_VISIBLE_ROWS - 1)) / YEAR_CALENDAR_VISIBLE_ROWS,
  );
  const daySize = Math.max(YEAR_CALENDAR_MIN_DAY_SIZE, Math.floor(monthWidth / 7) - 2);
  const dayFontSize = Math.max(14, Math.round(daySize * 0.48));
  const monthTitleSize = Math.max(15, Math.min(18, Math.round(monthWidth * 0.055)));

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
