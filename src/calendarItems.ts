import { addDays, toISODate, type Language } from './dates';

export type CalendarItem = {
  id: string;
  title: string;
  day: string;
  kind: 'workout' | 'event';
};

export type CalendarEventLike = {
  id?: string | null;
  title?: string | null;
  startDate: Date | string;
  endDate?: Date | string | null;
  allDay?: boolean | null;
};

const WORKOUT = [
  'workout', 'gym', 'run', 'yoga', 'pilates', 'train', 'sport', 'fit',
  'swim', 'cycle', 'bike', 'hiit', 'crossfit', 'walk', 'hike',
  'тренув', 'зал', 'йога', 'пілатес', 'біг', 'спорт', 'фітнес', 'плаван', 'силов',
];

export function classifyTitle(title: string): 'workout' | 'event' {
  const lower = title.toLowerCase();
  return WORKOUT.some((word) => lower.includes(word)) ? 'workout' : 'event';
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
    const kind = classifyTitle(title);
    const eventId = event.id?.trim() || `event-${index}`;
    for (const day of daysSpannedByEvent(event, rangeStart, rangeEnd)) {
      items.push({
        id: `${eventId}:${day}:${index}`,
        title,
        day,
        kind,
      });
    }
  });
  items.sort((a, b) => a.day.localeCompare(b.day) || a.title.localeCompare(b.title));
  return items;
}
