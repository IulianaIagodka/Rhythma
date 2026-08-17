import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import {
  cycleStatus,
  marksForYear,
  togglePeriodStart,
  type DayMark,
  type StoredData,
} from './src/cycle';
import { formatDayUk, todayISO } from './src/dates';
import { loadData, saveData } from './src/storage';
import { colors } from './src/theme';
import { YearCalendar } from './src/YearCalendar';

export default function App() {
  const today = todayISO();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [data, setData] = useState<StoredData | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadData().then((loaded) => {
      if (!cancelled) setData(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: StoredData) => {
    setData(next);
    saveData(next);
  }, []);

  const onToggleDay = useCallback(
    (iso: string) => {
      if (!data) return;
      Haptics.selectionAsync().catch(() => {});
      persist({
        ...data,
        periodStarts: togglePeriodStart(data.periodStarts, iso),
      });
    },
    [data, persist],
  );

  const onFirstDay = useCallback(() => {
    if (!data) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onToggleDay(today);
  }, [data, onToggleDay, today]);

  const marks = useMemo(() => {
    if (!data) return new Map<string, DayMark>();
    return marksForYear(year, data.periodStarts, data.settings);
  }, [data, year]);

  const status = useMemo(() => {
    if (!data) return null;
    return cycleStatus(today, data.periodStarts, data.settings);
  }, [data, today]);

  if (!data || !status) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.screen}>
          <ActivityIndicator color={colors.primary} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const todayIsStart = data.periodStarts.includes(today);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.brand}>Rhythma</Text>
        <Text style={styles.tagline}>Ваш ритм — лише на цьому телефоні</Text>

        <View style={styles.card}>
          {status.cycleDay == null ? (
            <Text style={styles.statusTitle}>Позначте перший день місячних</Text>
          ) : (
            <>
              <Text style={styles.statusKicker}>
                {status.inPeriod ? 'Місячні' : 'Цикл'}
              </Text>
              <Text style={styles.statusTitle}>День {status.cycleDay}</Text>
              {status.nextPeriod ? (
                <Text style={styles.statusMeta}>
                  Наступні місячні близько {formatDayUk(status.nextPeriod)} · цикл{' '}
                  {status.cycleLength} дн.
                </Text>
              ) : null}
            </>
          )}

          <Pressable
            onPress={onFirstDay}
            style={({ pressed }) => [
              styles.primaryButton,
              todayIsStart && styles.primaryButtonAlt,
              pressed && styles.primaryButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              todayIsStart ? 'Скасувати перший день місячних' : 'Перший день місячних'
            }
          >
            <Text style={styles.primaryButtonText}>
              {todayIsStart ? 'Скасувати сьогоднішній запис' : 'Перший день місячних'}
            </Text>
          </Pressable>
          <Text style={styles.hint}>
            Кнопка фіксує сьогодні як перший день. День у календарі можна натиснути, щоб
            додати або прибрати запис.
          </Text>
        </View>

        <View style={styles.rowCard}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Овуляція і прогноз</Text>
            <Text style={styles.rowMeta}>
              Опційно: фертильне вікно, овуляція та наступні місячні за середнім циклом
            </Text>
          </View>
          <Switch
            value={data.settings.showForecast}
            onValueChange={(showForecast) =>
              persist({ ...data, settings: { ...data.settings, showForecast } })
            }
            trackColor={{ false: colors.line, true: colors.fertile }}
            thumbColor={data.settings.showForecast ? colors.ovulation : colors.white}
          />
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.yearNav}>
            <Pressable onPress={() => setYear((value) => value - 1)} hitSlop={12}>
              <Text style={styles.yearNavBtn}>‹</Text>
            </Pressable>
            <Text style={styles.yearLabel}>{year}</Text>
            <Pressable onPress={() => setYear((value) => value + 1)} hitSlop={12}>
              <Text style={styles.yearNavBtn}>›</Text>
            </Pressable>
          </View>

          <YearCalendar
            year={year}
            today={today}
            periodStarts={data.periodStarts}
            marks={marks}
            onToggleDay={onToggleDay}
          />

          <View style={styles.legend}>
            <LegendDot color={colors.period} label="Місячні" />
            {data.settings.showForecast ? (
              <>
                <LegendDot color={colors.periodForecast} label="Прогноз" />
                <LegendDot color={colors.ovulation} label="Овуляція" />
                <LegendDot color={colors.fertile} label="Фертильні" />
              </>
            ) : null}
          </View>
        </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  brand: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: 0.4,
    marginTop: 8,
  },
  tagline: {
    marginTop: 4,
    marginBottom: 20,
    color: colors.muted,
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
  },
  statusKicker: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 4,
  },
  statusMeta: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: 18,
    backgroundColor: colors.primary,
    borderRadius: 16,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonAlt: {
    backgroundColor: colors.ink,
  },
  primaryButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    marginTop: 12,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  rowCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
  },
  rowMeta: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  calendarCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
  },
  yearNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 24,
  },
  yearNavBtn: {
    fontSize: 28,
    color: colors.primary,
    fontWeight: '500',
    paddingHorizontal: 8,
  },
  yearLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 12,
    color: colors.muted,
  },
});
