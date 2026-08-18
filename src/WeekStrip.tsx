import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CalendarItem } from './calendar';
import { markForDate, type StoredData } from './cycle';
import { parseISODate, weekDaysFromMonday, weekdayShortUk } from './dates';
import type { Theme } from './theme';

type WeekStripProps = {
  today: string;
  data: StoredData;
  theme: Theme;
  items: CalendarItem[];
  onSelectDay: (iso: string) => void;
};

export function WeekStrip({ today, data, theme, items, onSelectDay }: WeekStripProps) {
  const days = weekDaysFromMonday(today);
  const loadByDay = new Map<string, number>();
  for (const item of items) {
    loadByDay.set(item.day, (loadByDay.get(item.day) ?? 0) + (item.kind === 'workout' ? 2 : 1));
  }

  return (
    <View style={styles.row}>
      {days.map((iso) => {
        const mark = markForDate(iso, data.periodStarts, data.settings);
        const load = Math.min(4, loadByDay.get(iso) ?? 0);
        const period = mark === 'period' || mark === 'periodForecast';
        const isToday = iso === today;
        const dayNum = parseISODate(iso).getDate();
        return (
          <Pressable
            key={iso}
            onPress={() => onSelectDay(iso)}
            style={[
              styles.day,
              isToday && { borderColor: theme.accent, backgroundColor: theme.accentSoft },
            ]}
          >
            <Text style={[styles.weekday, { color: theme.muted }]}>{weekdayShortUk(iso)}</Text>
            <Text style={[styles.date, { color: isToday ? theme.accent : theme.ink }]}>{dayNum}</Text>
            <View style={styles.bars}>
              {period ? (
                <View
                  style={[
                    styles.bar,
                    { backgroundColor: mark === 'period' ? theme.period : theme.periodForecast },
                  ]}
                />
              ) : null}
              {Array.from({ length: load }, (_, i) => (
                <View key={i} style={[styles.bar, { backgroundColor: theme.teal }]} />
              ))}
              {!period && !load ? <View style={[styles.bar, { backgroundColor: theme.faint }]} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 2,
    gap: 6,
  },
  weekday: {
    fontSize: 11,
    fontWeight: '500',
  },
  date: {
    fontSize: 15,
    fontWeight: '600',
  },
  bars: {
    gap: 3,
    minHeight: 28,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 18,
    height: 4,
    borderRadius: 2,
  },
});
