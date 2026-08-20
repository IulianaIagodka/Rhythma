import { useEffect, useMemo, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { DayMark } from './cycle';
import { daysInMonth, mondayIndex, monthName, type Language } from './dates';
import type { Theme } from './theme';

type YearCalendarProps = {
  year: number;
  today: string;
  marks: Map<string, DayMark>;
  theme: Theme;
  language: Language;
  onPressDay: (iso: string) => void;
};

const COLS = 3;
const MONTH_HEIGHT = 118;
const ROW_GAP = 16;
const COL_GAP = 8;
const VISIBLE_MONTHS = 9;
const VISIBLE_ROWS = VISIBLE_MONTHS / COLS;
const VIEWPORT_HEIGHT = MONTH_HEIGHT * VISIBLE_ROWS + ROW_GAP * (VISIBLE_ROWS - 1);

function monthISO(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

const MARK_COLORS = (theme: Theme): Partial<Record<DayMark, string>> => ({
  period: theme.period,
  periodForecast: theme.periodForecast,
  ovulatory: theme.ovulatory,
});

function MonthGrid({
  year,
  monthIndex,
  today,
  marks,
  theme,
  language,
  onPressDay,
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
      <Text style={[styles.monthTitle, { color: theme.muted }]}>{monthName(monthIndex, language)}</Text>
      <View style={styles.days}>
        {cells.map((day, index) => {
          if (day == null) {
            return <View key={`e-${index}`} style={styles.dayCell} />;
          }
          const iso = monthISO(year, monthIndex, day);
          const mark = marks.get(iso);
          const isToday = iso === today;
          const isPeriod = mark === 'period' || mark === 'periodForecast';
          const isOvulatory = mark === 'ovulatory';
          const fill = mark ? colors[mark] : undefined;
          const todayNoMark = isToday && !mark;
          return (
            <Pressable key={iso} onPress={() => onPressDay(iso)} style={styles.dayCell}>
              <View
                style={[
                  styles.dayFill,
                  mark && fill ? { backgroundColor: fill } : null,
                  todayNoMark ? { backgroundColor: theme.accent } : null,
                  isToday && mark ? { borderColor: theme.accent, borderWidth: 1.5 } : null,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    { color: theme.muted },
                    (isPeriod || isOvulatory) && styles.dayPeriod,
                    todayNoMark && styles.dayPeriod,
                    isToday && mark ? { color: '#FFFFFF', fontWeight: '700' } : null,
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
  const scrollRef = useRef<ScrollView>(null);
  const currentMonthIndex = useMemo(() => {
    const date = new Date();
    return date.getFullYear() === props.year ? date.getMonth() : 0;
  }, [props.year]);

  useEffect(() => {
    const rowIndex = Math.floor(currentMonthIndex / COLS);
    const maxStartRow = Math.max(0, 12 / COLS - VISIBLE_ROWS);
    const centeredRow = Math.min(maxStartRow, Math.max(0, rowIndex - 1));
    const y = centeredRow * (MONTH_HEIGHT + ROW_GAP);
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y, animated: false });
    }, 0);
    return () => clearTimeout(timer);
  }, [currentMonthIndex, props.year]);

  return (
    <View style={styles.viewport}>
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.year}>
        {Array.from({ length: 12 }, (_, monthIndex) => (
          <MonthGrid key={monthIndex} monthIndex={monthIndex} {...props} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    height: VIEWPORT_HEIGHT,
  },
  year: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: ROW_GAP,
    columnGap: COL_GAP,
    paddingBottom: 8,
  },
  month: {
    width: '31%',
    minHeight: MONTH_HEIGHT,
  },
  monthTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
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
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 8,
    fontWeight: '500',
  },
  dayPeriod: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
