import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DayMark } from './cycle';
import { daysInMonth, mondayIndex, MONTHS_UK } from './dates';
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

function monthISO(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function MonthGrid({
  year,
  monthIndex,
  today,
  marks,
  onToggleDay,
}: YearCalendarProps & { monthIndex: number }) {
  const leading = mondayIndex(year, monthIndex, 1);
  const count = daysInMonth(year, monthIndex);
  const cells: Array<number | null> = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: count }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={styles.month}>
      <Text style={styles.monthTitle}>{MONTHS_UK[monthIndex]}</Text>
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
            <Pressable
              key={iso}
              onPress={() => onToggleDay(iso)}
              style={styles.dayCell}
              accessibilityLabel={`${day} ${MONTHS_UK[monthIndex]}`}
            >
              <View
                style={[
                  styles.dayFill,
                  mark ? { backgroundColor: MARK_COLORS[mark] } : null,
                  isToday && styles.today,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    isPeriod && styles.dayPeriod,
                    isToday && styles.dayToday,
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
    rowGap: 22,
  },
  month: {
    width: '48%',
  },
  monthTitle: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 8,
    letterSpacing: 0.6,
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
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 9,
    color: colors.muted,
  },
  dayPeriod: {
    color: '#FFFFFF',
  },
  dayToday: {
    color: colors.ink,
    fontWeight: '600',
  },
  today: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.ink,
  },
});
