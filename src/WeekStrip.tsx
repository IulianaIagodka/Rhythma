import { Pressable, StyleSheet, Text, View } from 'react-native';

import { dayAlignmentForPhase } from './activity';
import type { CalendarItem } from './calendar';
import { markForDate, phaseOnDate, type StoredData } from './cycle';
import { parseISODate, weekDaysFromMonday, weekdayShort, type Language } from './dates';
import type { Theme } from './theme';

type WeekStripProps = {
  today: string;
  data: StoredData;
  theme: Theme;
  language: Language;
  items: CalendarItem[];
  showCalendarLoad: boolean;
  onSelectDay: (iso: string) => void;
};

export function WeekStrip({ today, data, theme, language, items, showCalendarLoad, onSelectDay }: WeekStripProps) {
  const days = weekDaysFromMonday(today);
  const loadByDay = new Map<string, number>();
  if (showCalendarLoad) {
    for (const item of items) {
      loadByDay.set(item.day, (loadByDay.get(item.day) ?? 0) + (item.kind === 'workout' ? 2 : 1));
    }
  }

  return (
    <View style={styles.row}>
      {days.map((iso) => {
        const mark = markForDate(iso, data.periodStarts, data.settings);
        const load = Math.min(4, loadByDay.get(iso) ?? 0);
        const dayItems = showCalendarLoad ? items.filter((item) => item.day === iso) : [];
        const phase = phaseOnDate(iso, data.periodStarts, data.settings);
        const alignment = showCalendarLoad ? dayAlignmentForPhase(phase, dayItems) : 'fit';
        const period = mark === 'period' || mark === 'periodForecast';
        const isToday = iso === today;
        const dayNum = parseISODate(iso).getDate();
        const alignmentColor =
          alignment === 'over'
            ? theme.accent
            : alignment === 'under'
              ? theme.teal
              : 'transparent';
        return (
          <Pressable
            key={iso}
            onPress={() => onSelectDay(iso)}
            style={[
              styles.day,
              alignment !== 'fit' && { borderColor: alignmentColor },
              isToday && { borderColor: theme.accent, backgroundColor: theme.accentSoft },
            ]}
          >
            <Text style={[styles.weekday, { color: theme.muted }]}>{weekdayShort(iso, language)}</Text>
            <Text style={[styles.date, { color: isToday ? theme.accent : theme.ink }]}>{dayNum}</Text>
            {alignment !== 'fit' ? (
              <View
                style={[
                  styles.alignmentDot,
                  { backgroundColor: alignmentColor },
                ]}
              />
            ) : null}
            <View style={styles.bars}>
              {period ? (
                <View
                  style={[
                    styles.bar,
                    { backgroundColor: mark === 'period' ? theme.period : theme.periodForecast },
                  ]}
                />
              ) : null}
              {showCalendarLoad
                ? Array.from({ length: load }, (_, i) => (
                    <View key={i} style={[styles.bar, { backgroundColor: theme.teal }]} />
                  ))
                : null}
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
  alignmentDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
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
