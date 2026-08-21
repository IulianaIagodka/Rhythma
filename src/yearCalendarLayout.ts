import { daysInMonth, mondayIndex } from './dates';

export const YEAR_CALENDAR_COLS = 1;
/** Target how many months stay in view when scrolling to “today”. */
export const YEAR_CALENDAR_VISIBLE_MONTHS = 3;
export const YEAR_CALENDAR_VISIBLE_ROWS = YEAR_CALENDAR_VISIBLE_MONTHS / YEAR_CALENDAR_COLS;
export const YEAR_CALENDAR_ROW_GAP = 22;
export const YEAR_CALENDAR_COL_GAP = 0;
export const YEAR_CALENDAR_MAX_WEEKS = 6;
export const YEAR_CALENDAR_TITLE_GAP = 8;

/** Comfortable tap target without oversized month blocks. */
export const YEAR_CALENDAR_MIN_DAY_SIZE = 36;
export const YEAR_CALENDAR_MAX_DAY_SIZE = 44;
/** Mark chip inside each day cell — keeps the grid looking even. */
export const YEAR_CALENDAR_MARK_SCALE = 0.72;

export type YearCalendarMetrics = {
  /** Max month height (6 weeks) — used for conservative layout estimates. */
  monthHeight: number;
  monthWidth: number;
  /** Width of the 7-day grid (may be narrower than monthWidth when days are capped). */
  gridWidth: number;
  daySize: number;
  markSize: number;
  dayFontSize: number;
  monthTitleSize: number;
  titleBlock: number;
  rowGap: number;
  colGap: number;
  viewportHeight: number;
};

export function monthWeekRows(year: number, monthIndex: number): number {
  const leading = mondayIndex(year, monthIndex, 1);
  const count = daysInMonth(year, monthIndex);
  return Math.ceil((leading + count) / 7);
}

export function monthBlockHeight(weekRows: number, titleBlock: number, daySize: number): number {
  return titleBlock + weekRows * daySize;
}

/**
 * One full-width month column with normalized day cells:
 * capped size, inset marks, height follows each month’s real week count.
 * Day grid is centered when capped cells are narrower than the column.
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
  const monthTitleSize = Math.max(13, Math.min(15, Math.round(monthWidth * 0.042)));
  const titleBlock = monthTitleSize + YEAR_CALENDAR_TITLE_GAP;

  const rawDay = Math.floor(monthWidth / 7) - 2;
  const daySize = Math.min(
    YEAR_CALENDAR_MAX_DAY_SIZE,
    Math.max(YEAR_CALENDAR_MIN_DAY_SIZE, rawDay),
  );
  const gridWidth = Math.min(monthWidth, daySize * 7);
  const markSize = Math.max(22, Math.round(daySize * YEAR_CALENDAR_MARK_SCALE));
  const dayFontSize = Math.max(12, Math.min(15, Math.round(markSize * 0.48)));
  const monthHeight = monthBlockHeight(YEAR_CALENDAR_MAX_WEEKS, titleBlock, daySize);

  return {
    monthHeight,
    monthWidth,
    gridWidth,
    daySize,
    markSize,
    dayFontSize,
    monthTitleSize,
    titleBlock,
    rowGap,
    colGap,
    viewportHeight: height,
  };
}

export function yearCalendarScrollOffset(
  monthIndex: number,
  year: number,
  metrics: Pick<YearCalendarMetrics, 'titleBlock' | 'daySize' | 'rowGap'>,
): number {
  const { titleBlock, daySize, rowGap } = metrics;
  const heights = Array.from({ length: 12 }, (_, i) =>
    monthBlockHeight(monthWeekRows(year, i), titleBlock, daySize),
  );
  const total = heights.reduce((sum, h, i) => sum + h + (i < 11 ? rowGap : 0), 0);
  const approxViewport =
    heights[monthIndex] +
    (heights[monthIndex - 1] ?? 0) +
    (heights[monthIndex + 1] ?? 0) +
    rowGap * 2;

  let start = Math.max(0, monthIndex - 1);
  let y = 0;
  for (let i = 0; i < start; i++) y += heights[i] + rowGap;

  // Keep the last months reachable without overscrolling past content.
  const maxY = Math.max(0, total - approxViewport);
  return Math.min(y, maxY);
}

/** True when a month block can hold its day grid without overflowing. */
export function yearCalendarMonthFitsGrid(
  metrics: YearCalendarMetrics,
  weekRows: number = YEAR_CALENDAR_MAX_WEEKS,
): boolean {
  return (
    monthBlockHeight(weekRows, metrics.titleBlock, metrics.daySize) + 0.01 >=
    metrics.titleBlock + weekRows * metrics.daySize
  );
}
