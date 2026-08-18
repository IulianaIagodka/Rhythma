import { Pressable, StyleSheet, Text, View } from 'react-native';

import { markForDate, type DayMark, type Settings, type StoredData } from './cycle';
import { parseISODate, weekDaysFromMonday, weekdayShortUk } from './dates';
import type { Theme } from './theme';

type WeekStripProps = {
  today: string;
  data: StoredData;
  theme: Theme;
  onSelectDay: (iso: string) => void;
};

function barCount(mark: DayMark | null): { count: number; tone: 'accent' | 'teal' | 'faint' } {
  if (mark === 'period' || mark === 'periodForecast') return { count: 4, tone: 'accent' };
  if (mark === 'ovulatory') return { count: 3, tone: 'teal' };
  if (mark === 'follicular') return { count: 2, tone: 'teal' };
  if (mark === 'luteal') return { count: 1, tone: 'teal' };
  return { count: 1, tone: 'faint' };
}

function barColor(tone: 'accent' | 'teal' | 'faint', mark: DayMark | null, theme: Theme): string {
  if (tone === 'accent') {
    return mark === 'period' ? theme.period : theme.periodForecast;
  }
  if (tone === 'teal') return theme.teal;
  return theme.faint;
}

export function WeekStrip({ today, data, theme, onSelectDay }: WeekStripProps) {
  const days = weekDaysFromMonday(today);

  return (
    <View style={styles.row}>
      {days.map((iso) => {
        const mark = markForDate(iso, data.periodStarts, data.settings);
        const { count, tone } = barCount(mark);
        const isToday = iso === today;
        const dayNum = parseISODate(iso).getDate();
        return (
          <Pressable
            key={iso}
            onPress={() => onSelectDay(iso)}
            style={[styles.day, isToday && { borderColor: theme.accent, backgroundColor: theme.accentSoft }]}
          >
            <Text style={[styles.weekday, { color: theme.muted }]}>{weekdayShortUk(iso)}</Text>
            <Text style={[styles.date, { color: theme.ink }, isToday && { color: theme.accent }]}>
              {dayNum}
            </Text>
            <View style={styles.bars}>
              {Array.from({ length: count }, (_, i) => (
                <View
                  key={i}
                  style={[styles.bar, { backgroundColor: barColor(tone, mark, theme) }]}
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
