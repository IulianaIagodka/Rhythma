import { toISODate } from './dates';

export type CalendarItem = {
  id: string;
  title: string;
  day: string;
  kind: 'workout' | 'event';
};

const WORKOUT = [
  'workout',
  'gym',
  'run',
  'yoga',
  'pilates',
  'train',
  'sport',
  'fit',
  'swim',
  'cycle',
  'bike',
  'hiit',
  'crossfit',
  'walk',
  'hike',
  'тренув',
  'зал',
  'йога',
  'пілатес',
  'біг',
  'спорт',
  'фітнес',
  'плаван',
  'силов',
];

export function classifyTitle(title: string): 'workout' | 'event' {
  const value = title.toLowerCase();
  return WORKOUT.some((word) => value.includes(word)) ? 'workout' : 'event';
}

export async function loadWeekItems(weekStart: string, weekEnd: string): Promise<CalendarItem[]> {
  try {
    const Calendar = await import('expo-calendar');
    const permission = await Calendar.requestCalendarPermissionsAsync();
    if (permission.status !== 'granted') return [];

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    if (!calendars.length) return [];

    const start = new Date(`${weekStart}T00:00:00`);
    const end = new Date(`${weekEnd}T23:59:59`);
    const events = await Calendar.getEventsAsync(
      calendars.map((calendar) => calendar.id),
      start,
      end,
    );

    return events
      .map((event) => {
        const title = event.title?.trim() || 'Подія';
        return {
          id: event.id,
          title,
          day: toISODate(new Date(event.startDate)),
          kind: classifyTitle(title),
        };
      })
      .sort((a, b) => a.day.localeCompare(b.day) || a.title.localeCompare(b.title));
  } catch {
    return [];
  }
}
