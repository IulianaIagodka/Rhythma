import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DayMark } from './cycle';
import { daysInMonth, mondayIndex, MONTHS_UK, WEEKDAYS_UK } from './dates';
import { colors } from './theme';

type YearCalendarProps = {
  year: number;
  today: string;
  periodStarts: string[];
  marks: Map<string, DayMark>;
  onToggleDay: (iso: string) => void;
};

const MARK_COLORS: Record<DayMark, string> = {
  period: colors.period,
  periodForecast: colors.periodForecast,
  ovulation: colors.ovulation,
  fertile: colors.fertile,
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
  periodStarts,
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
      <View style={styles.weekRow}>
        {WEEKDAYS_UK.map((label) => (
          <Text key={label} style={styles.weekday}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.days}>
        {cells.map((day, index) => {
          if (day == null) {
            return <View key={`e-${index}`} style={styles.dayCell} />;
          }
          const iso = monthISO(year, monthIndex, day);
          const mark = marks.get(iso);
          const isToday = iso === today;
          const isStart = periodStarts.includes(iso);
          const backgroundColor = mark ? MARK_COLORS[mark] : 'transparent';
          const color =
            mark === 'period' || mark === 'ovulation' ? colors.white : colors.ink;
          return (
            <Pressable
              key={iso}
              onPress={() => onToggleDay(iso)}
              style={[
                styles.dayCell,
                { backgroundColor },
                isToday && styles.today,
                isStart && styles.start,
              ]}
              accessibilityLabel={`${day} ${MONTHS_UK[monthIndex]}${isStart ? ', перший день' : ''}`}
            >
              <Text style={[styles.dayText, { color }]}>{day}</Text>
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
    rowGap: 16,
  },
  month: {
    width: '48%',
  },
  monthTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    textTransform: 'capitalize',
    marginBottom: 6,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 9,
    color: colors.muted,
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
    borderRadius: 9,
  },
  dayText: {
    fontSize: 10,
    fontWeight: '500',
  },
  today: {
    borderWidth: 1.5,
    borderColor: colors.today,
  },
  start: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
});
