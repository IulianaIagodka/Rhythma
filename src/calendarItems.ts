import { toISODate, type Language } from './dates';

export type ActivityKind = 'yoga' | 'massage' | 'swim' | 'gentle' | 'intense' | 'event';

export type CalendarItem = {
  id: string;
  title: string;
  day: string;
  kind: 'workout' | 'event';
  activity: ActivityKind;
  allDay: boolean;
  /** Local start instant for sorting / display. */
  startMs: number;
  endMs: number | null;
};

export type CalendarEventLike = {
  id?: string | null;
  title?: string | null;
  startDate: Date | string;
  endDate?: Date | string | null;
  allDay?: boolean | null;
};

const MATCHERS: Array<{ activity: ActivityKind; words: string[] }> = [
  { activity: 'massage', words: ['massage', 'масаж', 'spa day', 'спа', 'restore', 'recovery', 'відновл'] },
  { activity: 'yoga', words: ['yoga', 'йога', 'pilates', 'пілатес', 'stretch', 'розтяжк'] },
  { activity: 'swim', words: ['swim', 'плаван', 'басейн'] },
  { activity: 'gentle', words: ['walk', 'hike', 'прогулян', 'ходьб', 'mobility'] },
  {
    activity: 'intense',
    words: [
      'hiit',
      'crossfit',
      'gym',
      'зал',
      'силов',
      'train',
      'тренув',
      'run',
      'біг',
      'sport',
      'спорт',
      'workout',
      'фітнес',
      'fitness',
      'cycle',
      'bike',
      // Combat / martial arts (EN + UA/RU stems)
      'judo',
      'дзюдо',
      'jiu',
      'джиу',
      'джиujitsu',
      'grappling',
      'boxing',
      'бокс',
      'kickbox',
      'martial',
      'єдиноборств',
      'единоборств',
      'karate',
      'карате',
      'mma',
      'wrestling',
      'боротьб',
      'борьб',
      'taekwondo',
      'таеквон',
      'тхэквон',
      'muay',
      'sparring',
      'fight',
      'combat',
      'бій',
      'бойов',
      // Strength / hard cardio / team sports often mislabeled as plain events
      'powerlift',
      'deadlift',
      'squat',
      'strength',
      'weightlift',
      'circuit',
      'spinning',
      'rowing',
      'веслув',
      'tennis',
      'теніс',
      'теннис',
      'football',
      'футбол',
      'basketball',
      'баскет',
      'volleyball',
      'волейбол',
      'aerobics',
      'аероб',
      'climbing',
      'скелелаз',
    ],
  },
];

export function classifyActivity(title: string): ActivityKind {
  const lower = title.toLowerCase();
  for (const group of MATCHERS) {
    if (group.words.some((word) => lower.includes(word))) return group.activity;
  }
  return 'event';
}

export function classifyTitle(title: string): 'workout' | 'event' {
  return classifyActivity(title) === 'event' ? 'event' : 'workout';
}

function parseCalendarDate(value: Date | string): Date {
  return value instanceof Date ? new Date(value.getTime()) : new Date(value);
}

function isValidDate(date: Date): boolean {
  return Number.isFinite(date.getTime());
}

function calendarDayISO(date: Date, allDay: boolean): string {
  if (!allDay) return toISODate(date);
  const localMidnight =
    date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0;
  if (localMidnight) return toISODate(date);
  const utcMidnight =
    date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0;
  if (utcMidnight) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return toISODate(date);
}

export function daysSpannedByEvent(
  event: CalendarEventLike,
  rangeStart: string,
  rangeEnd: string,
): string[] {
  const allDay = Boolean(event.allDay);
  const start = parseCalendarDate(event.startDate);
  if (!isValidDate(start)) return [];
  const first = calendarDayISO(start, allDay);
  if (first < rangeStart || first > rangeEnd) return [];
  return [first];
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Clock time in 24h for uk, 12h for en. */
export function formatClockTime(date: Date, lang: Language): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  if (lang === 'uk') {
    return `${pad2(hours)}:${pad2(minutes)}`;
  }
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${pad2(minutes)} ${suffix}`;
}

/** Short label for agenda rows: all-day, start only, or start–end. */
export function formatEventTime(item: CalendarItem, lang: Language): string {
  if (item.allDay) {
    return lang === 'uk' ? 'Увесь день' : 'All day';
  }
  const start = new Date(item.startMs);
  const startLabel = formatClockTime(start, lang);
  if (item.endMs == null) return startLabel;
  const end = new Date(item.endMs);
  if (end.getTime() <= start.getTime()) return startLabel;
  return `${startLabel} – ${formatClockTime(end, lang)}`;
}

export function itemsFromCalendarEvents(
  events: CalendarEventLike[],
  rangeStart: string,
  rangeEnd: string,
  lang: Language,
): CalendarItem[] {
  const items: CalendarItem[] = [];
  events.forEach((event, index) => {
    const start = parseCalendarDate(event.startDate);
    if (!isValidDate(start)) return;
    const title = event.title?.trim() || (lang === 'uk' ? 'Подія' : 'Event');
    const activity = classifyActivity(title);
    const kind = activity === 'event' ? 'event' : 'workout';
    const eventId = event.id?.trim() || `event-${index}`;
    const allDay = Boolean(event.allDay);
    const end = event.endDate != null ? parseCalendarDate(event.endDate) : null;
    for (const day of daysSpannedByEvent(event, rangeStart, rangeEnd)) {
      items.push({
        id: `${eventId}:${day}:${index}`,
        title,
        day,
        kind,
        activity,
        allDay,
        startMs: start.getTime(),
        endMs: end && isValidDate(end) ? end.getTime() : null,
      });
    }
  });
  items.sort(
    (a, b) =>
      a.day.localeCompare(b.day) ||
      Number(a.allDay) - Number(b.allDay) ||
      a.startMs - b.startMs ||
      a.title.localeCompare(b.title),
  );
  return items;
}
