export const YEAR_CALENDAR_COLS = 1;
/** Approximate months that fit when day cells use full-width sizing. */
export const YEAR_CALENDAR_VISIBLE_MONTHS = 2;
export const YEAR_CALENDAR_VISIBLE_ROWS = YEAR_CALENDAR_VISIBLE_MONTHS / YEAR_CALENDAR_COLS;
export const YEAR_CALENDAR_ROW_GAP = 18;
export const YEAR_CALENDAR_COL_GAP = 0;
export const YEAR_CALENDAR_MAX_WEEKS = 6;
export const YEAR_CALENDAR_TITLE_GAP = 6;

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
 * One full-width month column. Day size follows width; month height follows the
 * 6-week grid so consecutive months never overlap.
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
  const monthTitleSize = Math.max(15, Math.min(18, Math.round(monthWidth * 0.055)));
  const titleBlock = monthTitleSize + YEAR_CALENDAR_TITLE_GAP;
  const daySize = Math.max(YEAR_CALENDAR_MIN_DAY_SIZE, Math.floor(monthWidth / 7) - 2);
  const monthHeight = titleBlock + YEAR_CALENDAR_MAX_WEEKS * daySize;
  const dayFontSize = Math.max(14, Math.round(daySize * 0.42));

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

/** True when a month block can hold its day grid without overflowing. */
export function yearCalendarMonthFitsGrid(metrics: YearCalendarMetrics): boolean {
  const titleBlock = metrics.monthTitleSize + YEAR_CALENDAR_TITLE_GAP;
  return metrics.monthHeight + 0.01 >= titleBlock + YEAR_CALENDAR_MAX_WEEKS * metrics.daySize;
}
