import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DayMark } from './cycle';
import { daysInMonth, MONTHS_UK } from './dates';
import { colors } from './theme';

type YearCalendarProps = {
  year: number;
  today: string;
  marks: Map<string, DayMark>;
  onToggleDay: (iso: string) => void;
};

const MARK_COLORS: Record<DayMark, string> = {
  period: colors.period,
  periodForecast: colors.periodForecast,
  follicular: colors.follicular,
  ovulatory: colors.ovulatory,
  luteal: colors.luteal,
};

const MONTH_SHORT = MONTHS_UK.map((name) => name.slice(0, 3));

function monthISO(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function YearCalendar({ year, today, marks, onToggleDay }: YearCalendarProps) {
  return (
    <View style={styles.year}>
      {Array.from({ length: 12 }, (_, monthIndex) => {
        const count = daysInMonth(year, monthIndex);
        return (
          <View key={monthIndex} style={styles.row}>
            <Text style={styles.label}>{MONTH_SHORT[monthIndex]}</Text>
            <View style={styles.dots}>
              {Array.from({ length: 31 }, (_, i) => {
                const day = i + 1;
                if (day > count) {
                  return <View key={`e-${monthIndex}-${day}`} style={styles.dot} />;
                }
                const iso = monthISO(year, monthIndex, day);
                const mark = marks.get(iso);
                return (
                  <Pressable
                    key={iso}
                    onPress={() => onToggleDay(iso)}
                    hitSlop={2}
                    style={[
                      styles.dot,
                      styles.cell,
                      mark ? { backgroundColor: MARK_COLORS[mark] } : null,
                      iso === today && styles.today,
                    ]}
                    accessibilityLabel={`${day} ${MONTHS_UK[monthIndex]}`}
                  />
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  year: {
    gap: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    width: 28,
    fontSize: 10,
    color: colors.muted,
  },
  dots: {
    flex: 1,
    flexDirection: 'row',
    gap: 2,
  },
  dot: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 2,
  },
  cell: {
    backgroundColor: colors.faint,
  },
  today: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.ink,
  },
});
