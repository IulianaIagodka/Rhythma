import {
  EntityTypes,
  getCalendarPermissions,
  getCalendars,
  listEvents,
  requestCalendarPermissions,
  type PermissionResponse,
} from 'expo-calendar';

import { toISODate, type Language } from './dates';

export type CalendarItem = {
  id: string;
  title: string;
  day: string;
  kind: 'workout' | 'event';
};

export type CalendarLoadResult = {
  items: CalendarItem[];
  error: string | null;
  permissionDenied: boolean;
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

async function ensurePermission(): Promise<PermissionResponse> {
  const current = await getCalendarPermissions();
  if (current.status === 'granted') return current;
  return requestCalendarPermissions();
}

export async function loadWeekItems(
  weekStart: string,
  weekEnd: string,
  lang: Language,
): Promise<CalendarLoadResult> {
  try {
    const permission = await ensurePermission();
    if (permission.status !== 'granted') {
      return {
        items: [],
        error:
          lang === 'uk' ? 'Немає дозволу — відкрийте Налаштування → Rhythma → Календар → Повний доступ.' : 'No permission — open Settings → Rhythma → Calendars → Full Access.',
        permissionDenied: true,
      };
    }

    const calendars = await getCalendars(EntityTypes.EVENT);
    if (!calendars.length) {
      return {
        items: [],
        error: lang === 'uk' ? 'Не знайдено жодного календаря на телефоні.' : 'No calendars were found on this phone.',
        permissionDenied: false,
      };
    }

    const start = new Date(`${weekStart}T00:00:00`);
    const end = new Date(`${weekEnd}T23:59:59`);
    const events = await listEvents(calendars, start, end);

    const items: CalendarItem[] = events
      .map((event) => {
        const title = event.title?.trim() || (lang === 'uk' ? 'Подія' : 'Event');
        return {
          id: event.id,
          title,
          day: toISODate(new Date(event.startDate as string)),
          kind: classifyTitle(title),
        };
      })
      .sort((a, b) => a.day.localeCompare(b.day) || a.title.localeCompare(b.title));

    return {
      items,
      error: items.length ? null : (lang === 'uk' ? 'Подій на цьому тижні немає.' : 'No events found this week.'),
      permissionDenied: false,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      items: [],
      error: lang === 'uk' ? `Помилка: ${message}` : `Error: ${message}`,
      permissionDenied: false,
    };
  }
}
