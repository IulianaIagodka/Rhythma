/** Prefer visible calendars; fall back to every event calendar if none are marked visible. */
export function calendarIdsForSync(
  calendars: Array<{ id?: string | null; isVisible?: boolean | null }>,
): string[] {
  const withIds = calendars.filter((calendar) => Boolean(calendar.id?.trim()));
  const visible = withIds.filter((calendar) => calendar.isVisible !== false);
  const chosen = visible.length ? visible : withIds;
  return chosen.map((calendar) => calendar.id!.trim());
}
