import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import {
  cycleStatus,
  marksForYear,
  togglePeriodStart,
  type DayMark,
  type StoredData,
} from './src/cycle';
import { todayISO } from './src/dates';
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
          <ActivityIndicator color={colors.ink} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const todayIsStart = data.periodStarts.includes(today);
  const phase = status.phase;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="dark" />
        <View style={styles.content}>
          <View style={styles.top}>
            <Text style={styles.brand}>Rhythma</Text>
            <View style={styles.yearNav}>
              <Pressable onPress={() => setYear((value) => value - 1)} hitSlop={12}>
                <Text style={styles.yearNavBtn}>‹</Text>
              </Pressable>
              <Text style={styles.yearLabel}>{year}</Text>
              <Pressable onPress={() => setYear((value) => value + 1)} hitSlop={12}>
                <Text style={styles.yearNavBtn}>›</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.hero}>
            <View style={styles.phase}>
              {phase ? (
                <>
                  <Text style={styles.season}>{phase.season}</Text>
                  <Text style={styles.title}>{phase.title}</Text>
                  <Text style={styles.note}>{phase.note}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.season}>ритм</Text>
                  <Text style={styles.title}>жити за циклом</Text>
                  <Text style={styles.note}>позначте перший день</Text>
                </>
              )}
            </View>
            <Pressable
              onPress={onFirstDay}
              style={styles.mark}
              accessibilityRole="button"
              accessibilityLabel={
                todayIsStart ? 'Скасувати перший день місячних' : 'Перший день місячних'
              }
            >
              <View style={[styles.moon, todayIsStart && styles.moonFilled]}>
                {!todayIsStart ? <View style={styles.moonDot} /> : null}
              </View>
              <Text style={styles.markLabel}>{todayIsStart ? 'скасувати' : 'перший день'}</Text>
            </Pressable>
          </View>

          <YearCalendar year={year} today={today} marks={marks} onToggleDay={onToggleDay} />

          <Pressable
            onPress={() =>
              persist({
                ...data,
                settings: { ...data.settings, showForecast: !data.settings.showForecast },
              })
            }
            hitSlop={12}
            style={styles.forecast}
          >
            <Text
              style={[styles.forecastLabel, data.settings.showForecast && styles.forecastOn]}
            >
              сезони
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: 12,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  hero: {
    marginTop: 28,
    marginBottom: 28,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
  },
  phase: {
    flex: 1,
  },
  season: {
    fontSize: 12,
    letterSpacing: 2,
    color: colors.muted,
  },
  title: {
    marginTop: 4,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '400',
    color: colors.ink,
  },
  note: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
  mark: {
    alignItems: 'center',
    gap: 6,
  },
  moon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moonFilled: {
    backgroundColor: colors.period,
    borderColor: colors.period,
  },
  moonDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.ink,
  },
  markLabel: {
    fontSize: 10,
    letterSpacing: 1,
    color: colors.muted,
  },
  yearNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  yearNavBtn: {
    fontSize: 18,
    color: colors.faint,
  },
  yearLabel: {
    fontSize: 12,
    letterSpacing: 2,
    color: colors.muted,
  },
  forecast: {
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  forecastLabel: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.faint,
  },
  forecastOn: {
    color: colors.ink,
  },
});
