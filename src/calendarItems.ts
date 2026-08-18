import { addDays, toISODate, type Language } from './dates';

export type ActivityKind = 'yoga' | 'massage' | 'swim' | 'gentle' | 'intense' | 'event';

export type CalendarItem = {
  id: string;
  title: string;
  day: string;
  kind: 'workout' | 'event';
  activity: ActivityKind;
};

export type CalendarEventLike = {
  id?: string | null;
  title?: string | null;
  startDate: Date | string;
  endDate?: Date | string | null;
  allDay?: boolean | null;
};

const MATCHERS: Array<{ activity: ActivityKind; words: string[] }> = [
  { activity: 'massage', words: ['massage', 'масаж', 'spa', 'restore', 'recovery', 'відновл'] },
  { activity: 'yoga', words: ['yoga', 'йога', 'pilates', 'пілатес', 'stretch', 'розтяжк'] },
  { activity: 'swim', words: ['swim', 'плаван', 'басейн'] },
  { activity: 'gentle', words: ['walk', 'hike', 'прогулян', 'ходьб', 'mobility'] },
  {
    activity: 'intense',
    words: [
      'hiit', 'crossfit', 'gym', 'зал', 'силов', 'train', 'тренув', 'run', 'біг',
      'sport', 'спорт', 'workout', 'фітнес', 'fitness', 'cycle', 'bike',
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

function calendarDayISO(date: Date, allDay: boolean): string {
  if (allDay) {
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
  const end = event.endDate != null ? parseCalendarDate(event.endDate) : new Date(start.getTime());
  let first = calendarDayISO(start, allDay);
  let last = calendarDayISO(end, allDay);

  if (allDay && last > first) {
    last = addDays(last, -1);
  } else if (
    !allDay &&
    last > first &&
    end.getHours() === 0 &&
    end.getMinutes() === 0 &&
    end.getSeconds() === 0 &&
    end.getMilliseconds() === 0
  ) {
    last = addDays(last, -1);
  }
  if (last < first) last = first;

  const from = first < rangeStart ? rangeStart : first;
  const to = last > rangeEnd ? rangeEnd : last;
  if (from > to) return [];

  const days: string[] = [];
  for (let cursor = from; cursor <= to; cursor = addDays(cursor, 1)) {
    days.push(cursor);
  }
  return days;
}

export function itemsFromCalendarEvents(
  events: CalendarEventLike[],
  rangeStart: string,
  rangeEnd: string,
  lang: Language,
): CalendarItem[] {
  const items: CalendarItem[] = [];
  events.forEach((event, index) => {
    const title = event.title?.trim() || (lang === 'uk' ? 'Подія' : 'Event');
    const activity = classifyActivity(title);
    const kind = activity === 'event' ? 'event' : 'workout';
    const eventId = event.id?.trim() || `event-${index}`;
    for (const day of daysSpannedByEvent(event, rangeStart, rangeEnd)) {
      items.push({
        id: `${eventId}:${day}:${index}`,
        title,
        day,
        kind,
        activity,
      });
    }
  });
  items.sort((a, b) => a.day.localeCompare(b.day) || a.title.localeCompare(b.title));
  return items;
}
