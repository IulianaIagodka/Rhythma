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
  daysUntilNextPeriod,
  marksForYear,
  togglePeriodStart,
  type DayMark,
  type StoredData,
} from './src/cycle';
import { todayISO, weekdayNameUk } from './src/dates';
import { loadData, saveData } from './src/storage';
import { themeFor, type Theme } from './src/theme';
import { WeekStrip } from './src/WeekStrip';
import { YearCalendar } from './src/YearCalendar';

type Tab = 'today' | 'year' | 'settings';

export default function App() {
  const today = todayISO();
  const [tab, setTab] = useState<Tab>('today');
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

  const status = useMemo(() => {
    if (!data) return null;
    return cycleStatus(today, data.periodStarts, data.settings);
  }, [data, today]);

  const theme = useMemo(
    () => themeFor(data?.settings.themeMode ?? 'light'),
    [data?.settings.themeMode],
  );

  const marks = useMemo(() => {
    if (!data) return new Map<string, DayMark>();
    return marksForYear(year, data.periodStarts, data.settings);
  }, [data, year]);

  if (!data || !status) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={[styles.screen, { backgroundColor: '#FFFFFF' }]}>
          <ActivityIndicator color="#E91E8C" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const todayIsStart = data.periodStarts.includes(today);
  const daysLeft = daysUntilNextPeriod(today, status.nextPeriod);
  const phase = status.phase;
  const insightDay = status.nextPeriod ?? today;
  const insightName = weekdayNameUk(insightDay);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top']}>
        <StatusBar style={data.settings.themeMode === 'dark' ? 'light' : 'dark'} />

        <View style={styles.header}>
          <Text style={[styles.brand, { color: theme.accent }]}>Rhythma</Text>
          <View style={[styles.avatar, { borderColor: theme.accent }]} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {tab === 'today' ? (
            <>
              <Text style={[styles.hero, { color: theme.ink }]}>Ваш ритм сьогодні</Text>

              <View style={[styles.card, { backgroundColor: theme.card }]}>
                {status.cycleDay == null ? (
                  <>
                    <Text style={[styles.cardTitle, { color: theme.ink }]}>
                      Позначте перший день
                    </Text>
                    <Text style={[styles.cardMeta, { color: theme.muted }]}>
                      Rhythma підлаштує тиждень і рік під ваш цикл
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.cardTitle, { color: theme.ink }]}>
                      День циклу {status.cycleDay}
                    </Text>
                    <Text style={[styles.cardMeta, { color: theme.muted }]}>
                      {daysLeft == null
                        ? 'Наступні місячні зʼявляться після запису'
                        : daysLeft === 0
                          ? 'Місячні очікуються сьогодні'
                          : `Наступні місячні через ~${daysLeft} дн.`}
                    </Text>
                  </>
                )}

                <Pressable
                  onPress={onFirstDay}
                  style={[styles.cta, { backgroundColor: theme.accent }]}
                >
                  <Text style={styles.ctaText}>
                    {todayIsStart ? 'Скасувати запис на сьогодні' : 'Місячні почалися сьогодні'}
                  </Text>
                </Pressable>
                <Pressable onPress={() => setTab('year')} hitSlop={8}>
                  <Text style={[styles.link, { color: theme.teal }]}>Обрати іншу дату</Text>
                </Pressable>
              </View>

              <View style={[styles.card, { backgroundColor: theme.card }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.ink }]}>Цей тиждень</Text>
                  <Text style={[styles.sectionTag, { color: theme.accent }]}>
                    {data.settings.showForecast ? 'Прогноз місячних' : 'Записи'}
                  </Text>
                </View>
                <WeekStrip today={today} data={data} theme={theme} onSelectDay={onToggleDay} />
              </View>

              {phase ? (
                <View style={[styles.insight, { backgroundColor: theme.card }]}>
                  <Text style={styles.insightIcon}>◎</Text>
                  <View style={styles.insightBody}>
                    <Text style={[styles.insightTitle, { color: theme.ink }]}>
                      {phase.season} — {phase.title}
                    </Text>
                    <Text style={[styles.insightMeta, { color: theme.muted }]}>
                      {phase.note}
                    </Text>
                  </View>
                  <Pressable style={[styles.insightBtn, { borderColor: theme.border }]}>
                    <Text style={[styles.insightBtnText, { color: theme.muted }]}>
                      {insightName}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </>
          ) : null}

          {tab === 'year' ? (
            <>
              <Text style={[styles.hero, { color: theme.ink }]}>Рік</Text>
              <View style={styles.yearNav}>
                <Pressable onPress={() => setYear((v) => v - 1)} hitSlop={12}>
                  <Text style={[styles.yearNavBtn, { color: theme.muted }]}>‹</Text>
                </Pressable>
                <Text style={[styles.yearLabel, { color: theme.ink }]}>{year}</Text>
                <Pressable onPress={() => setYear((v) => v + 1)} hitSlop={12}>
                  <Text style={[styles.yearNavBtn, { color: theme.muted }]}>›</Text>
                </Pressable>
              </View>
              <YearCalendar
                year={year}
                today={today}
                marks={marks}
                theme={theme}
                onToggleDay={onToggleDay}
              />
            </>
          ) : null}

          {tab === 'settings' ? (
            <>
              <Text style={[styles.hero, { color: theme.ink }]}>Налаштування</Text>
              <View style={[styles.settingRow, { backgroundColor: theme.card }]}>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.ink }]}>
                    Прогноз місячних
                  </Text>
                  <Text style={[styles.settingMeta, { color: theme.muted }]}>
                    Рожеві смужки в тижні та році
                  </Text>
                </View>
                <Switch
                  value={data.settings.showForecast}
                  onValueChange={(showForecast) =>
                    persist({ ...data, settings: { ...data.settings, showForecast } })
                  }
                  trackColor={{ false: theme.border, true: theme.accentSoft }}
                  thumbColor={data.settings.showForecast ? theme.accent : theme.faint}
                />
              </View>
              <View style={[styles.settingRow, { backgroundColor: theme.card }]}>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.ink }]}>Темна тема</Text>
                  <Text style={[styles.settingMeta, { color: theme.muted }]}>
                    Як на другому макеті
                  </Text>
                </View>
                <Switch
                  value={data.settings.themeMode === 'dark'}
                  onValueChange={(dark) =>
                    persist({
                      ...data,
                      settings: { ...data.settings, themeMode: dark ? 'dark' : 'light' },
                    })
                  }
                  trackColor={{ false: theme.border, true: theme.accentSoft }}
                  thumbColor={data.settings.themeMode === 'dark' ? theme.accent : theme.faint}
                />
              </View>
            </>
          ) : null}
        </ScrollView>

        <View style={[styles.tabBar, { backgroundColor: theme.tabBar, borderTopColor: theme.border }]}>
          <TabButton label="Сьогодні" active={tab === 'today'} theme={theme} onPress={() => setTab('today')} icon="◎" />
          <TabButton label="Рік" active={tab === 'year'} theme={theme} onPress={() => setTab('year')} icon="▦" />
          <TabButton label="Ще" active={tab === 'settings'} theme={theme} onPress={() => setTab('settings')} icon="⚙" />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function TabButton({
  label,
  active,
  theme,
  onPress,
  icon,
}: {
  label: string;
  active: boolean;
  theme: Theme;
  onPress: () => void;
  icon: string;
}) {
  const color = active ? theme.accent : theme.muted;
  return (
    <Pressable onPress={onPress} style={styles.tabBtn}>
      <Text style={[styles.tabIcon, { color }]}>{icon}</Text>
      <Text style={[styles.tabLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  brand: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  hero: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: 8,
    marginBottom: 4,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  cardMeta: {
    fontSize: 15,
    marginTop: 4,
  },
  cta: {
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  sectionTag: {
    fontSize: 13,
    fontWeight: '600',
  },
  insight: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  insightIcon: {
    fontSize: 22,
    color: '#E91E8C',
    marginTop: 2,
  },
  insightBody: { flex: 1, gap: 4 },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  insightMeta: {
    fontSize: 14,
    lineHeight: 20,
  },
  insightBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  insightBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },
  yearNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 8,
  },
  yearNavBtn: { fontSize: 28, fontWeight: '300' },
  yearLabel: { fontSize: 18, fontWeight: '600' },
  settingRow: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '600' },
  settingMeta: { fontSize: 13, marginTop: 4 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingBottom: 6,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  tabIcon: { fontSize: 18 },
  tabLabel: { fontSize: 11, fontWeight: '600' },
});
