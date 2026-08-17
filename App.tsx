import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.brand}>Rhythma</Text>

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
                <Text style={styles.note}>позначте перший день — решта зʼявиться сама</Text>
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
            <Text style={styles.markLabel}>
              {todayIsStart ? 'скасувати' : 'перший день'}
            </Text>
          </Pressable>

          <View style={styles.yearNav}>
            <Pressable onPress={() => setYear((value) => value - 1)} hitSlop={16}>
              <Text style={styles.yearNavBtn}>‹</Text>
            </Pressable>
            <Text style={styles.yearLabel}>{year}</Text>
            <Pressable onPress={() => setYear((value) => value + 1)} hitSlop={16}>
              <Text style={styles.yearNavBtn}>›</Text>
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
              style={[
                styles.forecastLabel,
                data.settings.showForecast && styles.forecastOn,
              ]}
            >
              сезони
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 48,
  },
  brand: {
    fontSize: 13,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  phase: {
    marginTop: 48,
    marginBottom: 40,
    minHeight: 120,
  },
  season: {
    fontSize: 13,
    letterSpacing: 2,
    color: colors.muted,
    textTransform: 'lowercase',
  },
  title: {
    marginTop: 8,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '400',
    color: colors.ink,
  },
  note: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
    maxWidth: 240,
  },
  mark: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 48,
    gap: 10,
  },
  moon: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.ink,
  },
  markLabel: {
    fontSize: 12,
    letterSpacing: 1.2,
    color: colors.muted,
  },
  yearNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 20,
  },
  yearNavBtn: {
    fontSize: 22,
    color: colors.faint,
  },
  yearLabel: {
    fontSize: 13,
    letterSpacing: 2,
    color: colors.muted,
  },
  forecast: {
    marginTop: 28,
    alignSelf: 'flex-start',
  },
  forecastLabel: {
    fontSize: 12,
    letterSpacing: 1.4,
    color: colors.faint,
  },
  forecastOn: {
    color: colors.ink,
  },
});
