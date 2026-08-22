import type { CalendarEventLike } from './calendarItems';

/** Flatten Expo / EventKit event records into plain fields Sync can parse. */
export function plainCalendarEvent(
  event: Record<string, unknown>,
  index: number,
): CalendarEventLike | null {
  const startRaw = event.startDate ?? event.start;
  const endRaw = event.endDate ?? event.end;
  if (startRaw == null) return null;
  const title = typeof event.title === 'string' ? event.title : null;
  const id = typeof event.id === 'string' ? event.id : `event-${index}`;
  return {
    id,
    title,
    startDate: startRaw as Date | string,
    endDate: (endRaw as Date | string | null | undefined) ?? null,
    allDay: Boolean(event.allDay),
  };
}

/** All event calendars with an id — do not drop subscribed calendars via isVisible. */
export function calendarIdsForSync(
  calendars: Array<{ id?: string | null; isVisible?: boolean | null }>,
): string[] {
  return calendars
    .map((calendar) => calendar.id?.trim() ?? '')
    .filter((id) => id.length > 0);
}
