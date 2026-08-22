import {
  EntityTypes,
  getCalendarPermissionsAsync,
  getCalendarsAsync,
  getEventsAsync,
  requestCalendarPermissionsAsync,
  type PermissionResponse,
} from 'expo-calendar/legacy';

import { itemsFromCalendarEvents, type CalendarEventLike, type CalendarItem } from './calendarItems';
import { calendarIdsForSync, plainCalendarEvent } from './calendarSync';
import { todayISO, weekRangeContaining, type Language } from './dates';

export type { CalendarItem } from './calendarItems';
export { classifyTitle, itemsFromCalendarEvents } from './calendarItems';
export { calendarIdsForSync, plainCalendarEvent } from './calendarSync';

export type CalendarLoadResult = {
  items: CalendarItem[];
  error: string | null;
  permissionDenied: boolean;
};

async function ensurePermission(): Promise<PermissionResponse> {
  const current = await getCalendarPermissionsAsync();
  if (current.status === 'granted') return current;
  return requestCalendarPermissionsAsync();
}

export async function loadCalendarItems(
  rangeStart: string,
  rangeEnd: string,
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

    const calendars = await getCalendarsAsync(EntityTypes.EVENT);
    const calendarIds = calendarIdsForSync(calendars);
    if (!calendarIds.length) {
      return {
        items: [],
        error: lang === 'uk' ? 'Не знайдено жодного календаря на телефоні.' : 'No calendars were found on this phone.',
        permissionDenied: false,
      };
    }

    // Local day bounds — EventKit matches inclusively on these instants.
    const start = new Date(`${rangeStart}T00:00:00`);
    const end = new Date(`${rangeEnd}T23:59:59.999`);
    // Legacy getEventsAsync returns plain serialized events (reliable startDate strings).
    const rawEvents = await getEventsAsync(calendarIds, start, end);
    const events: CalendarEventLike[] = [];
    rawEvents.forEach((event, index) => {
      const plain = plainCalendarEvent(event as unknown as Record<string, unknown>, index);
      if (plain) events.push(plain);
    });

    const items = itemsFromCalendarEvents(events, rangeStart, rangeEnd, lang);

    return {
      items,
      error: items.length
        ? null
        : lang === 'uk'
          ? 'Подій у цьому діапазоні немає.'
          : 'No events found in this range.',
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

export async function loadWeekItems(
  weekStart: string,
  weekEnd: string,
  lang: Language,
): Promise<CalendarLoadResult> {
  return loadCalendarItems(weekStart, weekEnd, lang);
}

export async function loadCurrentWeekItems(lang: Language): Promise<CalendarLoadResult> {
  const { start, end } = weekRangeContaining(todayISO());
  return loadWeekItems(start, end, lang);
}
