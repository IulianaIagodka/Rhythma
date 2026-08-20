export type Language = 'uk' | 'en';

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function diffDays(from: string, to: string): number {
  const a = parseISODate(from).getTime();
  const b = parseISODate(to).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** 0 = Monday … 6 = Sunday */
export function mondayIndex(year: number, monthIndex: number, day: number): number {
  const jsDay = new Date(year, monthIndex, day).getDay();
  return (jsDay + 6) % 7;
}

const months = {
  uk: ['січень','лютий','березень','квітень','травень','червень','липень','серпень','вересень','жовтень','листопад','грудень'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
} as const;

const monthsGenitiveUk = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'] as const;
const weekdays = {
  uk: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
} as const;
const weekdayNames = {
  uk: ['неділя', 'понеділок', 'вівторок', 'середа', 'четвер', "п'ятниця", 'субота'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
} as const;

export function monthName(monthIndex: number, lang: Language): string {
  return months[lang][monthIndex];
}

export function formatDay(iso: string, lang: Language): string {
  const date = parseISODate(iso);
  if (lang === 'uk') return `${date.getDate()} ${monthsGenitiveUk[date.getMonth()]}`;
  return `${months.en[date.getMonth()]} ${date.getDate()}`;
}

export function weekDaysFromMonday(anchor: string): string[] {
  const date = parseISODate(anchor);
  const offset = (date.getDay() + 6) % 7;
  const monday = addDays(anchor, -offset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function weekdayShort(iso: string, lang: Language): string {
  const day = parseISODate(iso).getDay();
  const index = (day + 6) % 7;
  return weekdays[lang][index];
}

export function weekdayName(iso: string, lang: Language): string {
  return weekdayNames[lang][parseISODate(iso).getDay()];
}

const monthsShort = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
} as const;

/** Human title for the selected-day card, e.g. "Sunday, Aug 23" / "Неділя, 23 серпня". */
export function formatSelectedDayTitle(iso: string, lang: Language): string {
  const date = parseISODate(iso);
  const weekday = capitalize(weekdayName(iso, lang));
  if (lang === 'uk') return `${weekday}, ${date.getDate()} ${monthsGenitiveUk[date.getMonth()]}`;
  return `${weekday}, ${monthsShort.en[date.getMonth()]} ${date.getDate()}`;
}

/** Seconds since Apple's reference date (2001-01-01 UTC) for calshow: deep links. */
export function appleCalendarShowInterval(iso: string): number {
  const day = parseISODate(iso);
  const reference = Date.UTC(2001, 0, 1);
  return Math.floor((day.getTime() - reference) / 1000);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
