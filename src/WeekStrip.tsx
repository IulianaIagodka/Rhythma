import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CalendarItem } from './calendar';
import { markForDate, type StoredData } from './cycle';
import { parseISODate, weekDaysFromMonday, weekdayShort, type Language } from './dates';
import type { Theme } from './theme';

type WeekStripProps = {
  today: string;
  data: StoredData;
  theme: Theme;
  language: Language;
  selectedDay: string;
  items: CalendarItem[];
  showCalendarLoad: boolean;
  onSelectDay: (iso: string) => void;
};

export function WeekStrip({ today, selectedDay, data, theme, language, items, showCalendarLoad, onSelectDay }: WeekStripProps) {
  const days = weekDaysFromMonday(today);
  const countByDay = new Map<string, number>();
  if (showCalendarLoad) {
    for (const item of items) {
      countByDay.set(item.day, (countByDay.get(item.day) ?? 0) + 1);
    }
  }

  return (
    <View style={styles.row}>
      {days.map((iso) => {
        const mark = markForDate(iso, data.periodStarts, data.settings);
        const eventCount = Math.min(4, countByDay.get(iso) ?? 0);
        const period = mark === 'period' || mark === 'periodForecast';
        const ovulatory = data.settings.showOvulation && mark === 'ovulatory';
        const isToday = iso === today;
        const isSelected = iso === selectedDay;
        const dayNum = parseISODate(iso).getDate();
        return (
          <Pressable
            key={iso}
            onPress={() => onSelectDay(iso)}
            style={[
              styles.day,
              isToday && { borderColor: theme.teal, backgroundColor: theme.tealSoft },
              isSelected && { borderColor: theme.accent, backgroundColor: theme.accentSoft },
            ]}
          >
            <Text style={[styles.weekday, { color: theme.muted }]}>{weekdayShort(iso, language)}</Text>
            <Text
              style={[
                styles.date,
                { color: isSelected ? theme.accent : isToday ? theme.teal : theme.ink },
              ]}
            >
              {dayNum}
            </Text>
            <View style={styles.bars}>
              {period ? (
                <View
                  style={[
                    styles.bar,
                    { backgroundColor: mark === 'period' ? theme.period : theme.periodForecast },
                  ]}
                />
              ) : null}
              {ovulatory ? (
                <View style={[styles.bar, { backgroundColor: theme.ovulatory }]} />
              ) : null}
              {showCalendarLoad
                ? Array.from({ length: eventCount }, (_, i) => (
                    <View key={i} style={[styles.bar, { backgroundColor: theme.teal }]} />
                  ))
                : null}
              {!period && !ovulatory && !eventCount ? <View style={[styles.bar, { backgroundColor: theme.faint }]} /> : null}
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
    borderRadius: 0,
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
    borderRadius: 0,
  },
});
