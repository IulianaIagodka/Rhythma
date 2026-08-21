import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CalendarItem } from './calendar';
import { markForDate, type StoredData } from './cycle';
import { parseISODate, weekDaysFromMonday, weekdayShort, type Language } from './dates';
import type { Theme } from './theme';
import { weekDayBars, weekDayCellColors } from './weekStripLogic';

export { weekDayBars, weekDayCellColors } from './weekStripLogic';
export type { WeekDayBarKind } from './weekStripLogic';

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
        const eventCount = countByDay.get(iso) ?? 0;
        const isToday = iso === today;
        const isSelected = iso === selectedDay;
        const dayNum = parseISODate(iso).getDate();
        const cell = weekDayCellColors(isSelected, isToday, theme);
        const bars = weekDayBars({
          mark,
          showOvulation: data.settings.showOvulation,
          eventCount,
          showCalendarLoad,
        });
        return (
          <Pressable
            key={iso}
            onPress={() => onSelectDay(iso)}
            style={[styles.day, { backgroundColor: cell.backgroundColor }]}
          >
            <Text style={[styles.weekday, { color: theme.muted }]}>{weekdayShort(iso, language)}</Text>
            <Text style={[styles.date, { color: cell.dateColor }]}>{dayNum}</Text>
            <View style={styles.bars}>
              {bars.map((kind, i) => (
                <View
                  key={`${kind}-${i}`}
                  style={[
                    styles.bar,
                    {
                      backgroundColor:
                        kind === 'period'
                          ? theme.period
                          : kind === 'periodForecast'
                            ? theme.periodForecast
                            : kind === 'ovulatory'
                              ? theme.ovulatory
                              : theme.teal,
                    },
                  ]}
                />
              ))}
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
    gap: 6,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 2,
    gap: 8,
  },
  weekday: {
    fontSize: 11,
    fontWeight: '500',
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
  },
  bars: {
    gap: 3,
    minHeight: 20,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 16,
    height: 3,
    borderRadius: 2,
  },
});
