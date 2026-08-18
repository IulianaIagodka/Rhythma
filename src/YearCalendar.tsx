import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DayMark } from './cycle';
import { daysInMonth, mondayIndex, MONTHS_UK } from './dates';
import type { Theme } from './theme';

type YearCalendarProps = {
  year: number;
  today: string;
  marks: Map<string, DayMark>;
  theme: Theme;
  onToggleDay: (iso: string) => void;
};

function monthISO(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

const MARK_COLORS = (theme: Theme): Record<DayMark, string> => ({
  period: theme.period,
  periodForecast: theme.periodForecast,
  follicular: theme.follicular,
  ovulatory: theme.ovulatory,
  luteal: theme.luteal,
});

function MonthGrid({
  year,
  monthIndex,
  today,
  marks,
  theme,
  onToggleDay,
}: YearCalendarProps & { monthIndex: number }) {
  const leading = mondayIndex(year, monthIndex, 1);
  const count = daysInMonth(year, monthIndex);
  const cells: Array<number | null> = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: count }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const colors = MARK_COLORS(theme);

  return (
    <View style={styles.month}>
      <Text style={[styles.monthTitle, { color: theme.muted }]}>{MONTHS_UK[monthIndex]}</Text>
      <View style={styles.days}>
        {cells.map((day, index) => {
          if (day == null) {
            return <View key={`e-${index}`} style={styles.dayCell} />;
          }
          const iso = monthISO(year, monthIndex, day);
          const mark = marks.get(iso);
          const isToday = iso === today;
          const isPeriod = mark === 'period';
          return (
            <Pressable key={iso} onPress={() => onToggleDay(iso)} style={styles.dayCell}>
              <View
                style={[
                  styles.dayFill,
                  mark ? { backgroundColor: colors[mark] } : null,
                  isToday && { borderColor: theme.accent, borderWidth: 1.5 },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    { color: theme.muted },
                    isPeriod && styles.dayPeriod,
                    isToday && { color: theme.accent, fontWeight: '700' },
                  ]}
                >
                  {day}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function YearCalendar(props: YearCalendarProps) {
  return (
    <View style={styles.year}>
      {Array.from({ length: 12 }, (_, monthIndex) => (
        <MonthGrid key={monthIndex} monthIndex={monthIndex} {...props} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  year: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 20,
  },
  month: {
    width: '48%',
  },
  monthTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  days: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayFill: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 9,
    fontWeight: '500',
  },
  dayPeriod: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
