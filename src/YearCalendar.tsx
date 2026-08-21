import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { DayMark } from './cycle';
import { daysInMonth, mondayIndex, monthName, type Language } from './dates';
import { radius, type Theme } from './theme';
import {
  YEAR_CALENDAR_TITLE_GAP,
  monthBlockHeight,
  monthWeekRows,
  yearCalendarMetrics,
  yearCalendarScrollOffset,
  type YearCalendarMetrics,
} from './yearCalendarLayout';

type YearCalendarProps = {
  year: number;
  today: string;
  marks: Map<string, DayMark>;
  theme: Theme;
  language: Language;
  onPressDay: (iso: string) => void;
};

/** Ignore layout blips from nested flex/ScrollView collapse. */
const MIN_STABLE_VIEWPORT_HEIGHT = 220;

function initialMetrics(): YearCalendarMetrics {
  const { width, height } = Dimensions.get('window');
  // Header + year nav + tab bar roughly; keep a usable year grid on first paint.
  return yearCalendarMetrics(Math.max(280, width - 40), Math.max(MIN_STABLE_VIEWPORT_HEIGHT, height * 0.58));
}

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
  metrics,
}: YearCalendarProps & { monthIndex: number; metrics: YearCalendarMetrics }) {
  const leading = mondayIndex(year, monthIndex, 1);
  const count = daysInMonth(year, monthIndex);
  const cells: Array<number | null> = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: count }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const colors = MARK_COLORS(theme);
  const weekRows = monthWeekRows(year, monthIndex);
  const { daySize, markSize, dayFontSize, monthTitleSize, monthWidth, titleBlock } = metrics;
  const monthHeight = monthBlockHeight(weekRows, titleBlock, daySize);

  return (
    <View style={[styles.month, { width: monthWidth, height: monthHeight }]}>
      <Text
        style={[
          styles.monthTitle,
          { color: theme.muted, fontSize: monthTitleSize, marginBottom: YEAR_CALENDAR_TITLE_GAP },
        ]}
      >
        {monthName(monthIndex, language)}
      </Text>
      <View style={styles.daysWrap}>
        <View style={styles.days}>
          {cells.map((day, index) => {
            if (day == null) {
              return (
                <View
                  key={`e-${index}`}
                  style={[styles.dayCell, { width: `${100 / 7}%`, height: daySize }]}
                />
              );
            }
            const iso = monthISO(year, monthIndex, day);
            const mark = marks.get(iso);
            const isToday = iso === today;
            const isPeriod = mark === 'period' || mark === 'periodForecast';
            const isOvulatory = mark === 'ovulatory';
            const fill = mark ? colors[mark] : undefined;
            const todayNoMark = isToday && !mark;
            return (
              <Pressable
                key={iso}
                onPress={() => onPressDay(iso)}
                style={[styles.dayCell, { width: `${100 / 7}%`, height: daySize }]}
                hitSlop={8}
              >
                <View
                  style={[
                    styles.dayFill,
                    {
                      width: markSize,
                      height: markSize,
                      borderRadius: radius.day,
                    },
                    mark && fill ? { backgroundColor: fill } : null,
                    todayNoMark ? { backgroundColor: theme.accent } : null,
                    isToday && mark ? { borderColor: theme.accent, borderWidth: 1.5 } : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: theme.muted, fontSize: dayFontSize },
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
    </View>
  );
}

export function YearCalendar(props: YearCalendarProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [metrics, setMetrics] = useState(initialMetrics);
  const currentMonthIndex = useMemo(() => {
    const date = new Date();
    return date.getFullYear() === props.year ? date.getMonth() : 0;
  }, [props.year]);

  const onViewportLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    // Flex collapse inside a parent ScrollView can report ~0 after a good first layout.
    if (width < 120 || height < MIN_STABLE_VIEWPORT_HEIGHT) return;
    setMetrics((prev) => {
      const next = yearCalendarMetrics(width, height);
      if (
        Math.abs(prev.daySize - next.daySize) < 1 &&
        Math.abs(prev.monthWidth - next.monthWidth) < 1 &&
        Math.abs(prev.markSize - next.markSize) < 1
      ) {
        return prev;
      }
      return next;
    });
  };

  useEffect(() => {
    const y = yearCalendarScrollOffset(currentMonthIndex, props.year, metrics);
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y, animated: false });
    }, 0);
    return () => clearTimeout(timer);
  }, [currentMonthIndex, props.year, metrics]);

  return (
    <View style={styles.viewport} onLayout={onViewportLayout}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.year,
          { rowGap: metrics.rowGap, columnGap: metrics.colGap },
        ]}
      >
        {Array.from({ length: 12 }, (_, monthIndex) => (
          <MonthGrid key={monthIndex} monthIndex={monthIndex} metrics={metrics} {...props} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    minHeight: MIN_STABLE_VIEWPORT_HEIGHT,
  },
  scroll: {
    flex: 1,
  },
  year: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingBottom: 8,
  },
  month: {
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  monthTitle: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  daysWrap: {
    justifyContent: 'flex-start',
  },
  days: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayFill: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontWeight: '600',
  },
  dayPeriod: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
