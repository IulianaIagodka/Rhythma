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

import { effectiveAccessTier, hasFeatureAccess, previewUnlockSource } from './src/access';
import { adviseLoad, capacityForPhase, planningForPhase } from './src/activity';
import { loadWeekItems, type CalendarItem } from './src/calendar';
import {
  cycleStatus,
  daysUntilNextPeriod,
  marksForYear,
  periodPromptForDate,
  togglePeriodStart,
  type DayMark,
  type StoredData,
} from './src/cycle';
import { addDays, formatDay, todayISO } from './src/dates';
import { loadData, saveData } from './src/storage';
import { themeFor, type Theme } from './src/theme';
import { ConfirmDialog } from './src/ConfirmDialog';
import { detectLanguage, t } from './src/i18n';
import { WeekStrip } from './src/WeekStrip';
import { YearCalendar } from './src/YearCalendar';

type Tab = 'today' | 'year' | 'settings';

export default function App() {
  const today = todayISO();
  const language = detectLanguage();
  const [tab, setTab] = useState<Tab>('today');
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [data, setData] = useState<StoredData | null>(null);
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [selectedDay, setSelectedDay] = useState(today);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [calendarPermissionDenied, setCalendarPermissionDenied] = useState(false);
  const [periodPrompt, setPeriodPrompt] = useState<{ iso: string; kind: 'add' | 'remove' } | null>(null);

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

  const refreshCalendar = useCallback(async (enabled: boolean) => {
    if (!enabled) {
      setItems([]);
      setCalendarError(null);
      setCalendarPermissionDenied(false);
      return;
    }
    const monday = addDays(todayISO(), -((new Date(todayISO()).getDay() + 6) % 7));
    const result = await loadWeekItems(monday, addDays(monday, 6), language);
    setItems(result.items);
    setCalendarError(result.error);
    setCalendarPermissionDenied(result.permissionDenied);
  }, []);

  useEffect(() => {
    const canSync = hasFeatureAccess(data?.settings.accessTier ?? 'free', 'calendarSync');
    refreshCalendar(Boolean(canSync && data?.settings.calendarSync));
  }, [data?.settings.accessTier, data?.settings.calendarSync, refreshCalendar]);

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

  const onCalendarDayPress = useCallback(
    (iso: string) => {
      if (!data) return;
      setPeriodPrompt({ iso, kind: periodPromptForDate(data.periodStarts, iso) });
    },
    [data],
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
    () => themeFor(data?.settings.themeMode ?? 'dark'),
    [data?.settings.themeMode],
  );

  const marks = useMemo(() => {
    if (!data) return new Map<string, DayMark>();
    return marksForYear(year, data.periodStarts, data.settings);
  }, [data, year]);

  if (!data || !status) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={[styles.screen, { backgroundColor: '#0A0A0A' }]}>
          <ActivityIndicator color="#FF10F0" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const todayIsStart = data.periodStarts.includes(today);
  const daysLeft = daysUntilNextPeriod(today, status.nextPeriod);
  const storedTier = data.settings.accessTier;
  const tier = effectiveAccessTier(storedTier);
  const hasCalendarSync = hasFeatureAccess(storedTier, 'calendarSync');
  const hasEventLoadAdvice = hasFeatureAccess(storedTier, 'eventLoadAdvice');
  const hasPhasePlanningLists = hasFeatureAccess(storedTier, 'phasePlanningLists');
  const calendarEnabled = hasCalendarSync && data.settings.calendarSync;
  const showAdvice = hasEventLoadAdvice && data.settings.showEventAdvice;
  const showPhaseLists = hasPhasePlanningLists && data.settings.showPhaseLists;
  const calendarItems = calendarEnabled ? items : [];
  const selectedItems = calendarItems.filter((item) => item.day === selectedDay);
  const selectedWorkouts = selectedItems.filter((item) => item.kind === 'workout');
  const selectedEvents = selectedItems.filter((item) => item.kind === 'event');
  const visibleAdvice = showAdvice
    ? adviseLoad(status.phase, calendarItems, language)
    : null;
  const phaseCapacity = capacityForPhase(status.phase, language);
  const phasePlan = planningForPhase(status.phase, language);
  const unlockSource = previewUnlockSource();
  const planLabel =
    unlockSource === 'dev'
      ? t(language, 'devPlan')
      : unlockSource === 'testflight'
        ? t(language, 'testFlightPlan')
        : tier === 'pro'
          ? t(language, 'proPlan')
          : t(language, 'freePlan');

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top']}>
        <StatusBar style={data.settings.themeMode === 'dark' ? 'light' : 'dark'} />

        <View style={styles.header}>
          <Text style={[styles.brand, { color: theme.accent }]}>Rhythma</Text>
          <View style={[styles.avatar, { borderColor: theme.accent }]} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {tab === 'today' ? (
            <>
              <Text style={[styles.hero, { color: theme.ink }]}>{t(language, 'todayHeader')}</Text>

              <View style={[styles.card, { backgroundColor: theme.card }]}>
                {status.cycleDay == null ? (
                  <>
                    <Text style={[styles.cardTitle, { color: theme.ink }]}>{t(language, 'logCycle')}</Text>
                    <Text style={[styles.cardMeta, { color: theme.muted }]}>
                      {t(language, 'logCycleSub')}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.cardTitle, { color: theme.ink }]}>
                      {t(language, 'cycleDay')} {status.cycleDay}
                    </Text>
                    <Text style={[styles.phaseName, { color: theme.accent }]}>{phaseCapacity.label}</Text>
                    <Text style={[styles.cardMeta, { color: theme.muted }]}>
                      {daysLeft == null
                        ? t(language, 'nextAfterRecords')
                        : daysLeft === 0
                          ? t(language, 'nextToday')
                          : t(language, 'nextIn', { days: daysLeft })}
                    </Text>
                  </>
                )}

                <Pressable
                  onPress={onFirstDay}
                  style={[styles.cta, { backgroundColor: theme.accent }]}
                >
                  <Text style={styles.ctaText}>
                    {todayIsStart ? t(language, 'cancelToday') : t(language, 'startedToday')}
                  </Text>
                </Pressable>
                <Pressable onPress={() => setTab('year')} hitSlop={8}>
                  <Text style={[styles.link, { color: theme.teal }]}>{t(language, 'chooseOtherDate')}</Text>
                </Pressable>
              </View>

              <View style={[styles.card, { backgroundColor: theme.card }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.ink }]}>{t(language, 'thisWeek')}</Text>
                  <Text style={[styles.sectionTag, { color: theme.accent }]}>
                    {calendarEnabled ? t(language, 'calendarTag') : t(language, 'cycleTag')}
                  </Text>
                </View>
                <WeekStrip
                  today={today}
                  data={data}
                  theme={theme}
                  language={language}
                  items={calendarItems}
                  selectedDay={selectedDay}
                  showCalendarLoad={calendarEnabled}
                  onSelectDay={setSelectedDay}
                />
              </View>

              {calendarEnabled ? (
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.ink }]}>{t(language, 'selectedDay')}</Text>
                    <Text style={[styles.sectionTag, { color: theme.accent }]}>{selectedDay}</Text>
                  </View>
                  {selectedItems.length ? (
                    <View style={styles.dayList}>
                      {selectedItems.map((item) => (
                        <View key={item.id} style={styles.dayRow}>
                          <View
                            style={[
                              styles.dayBullet,
                              { backgroundColor: item.kind === 'workout' ? theme.teal : theme.accent },
                            ]}
                          />
                          <View style={styles.dayTextWrap}>
                            <Text style={[styles.dayTitle, { color: theme.ink }]}>{item.title}</Text>
                            <Text style={[styles.dayMeta, { color: theme.muted }]}>
                              {item.kind === 'workout' ? t(language, 'workouts') : t(language, 'events')}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.insightMeta, { color: theme.muted }]}>{t(language, 'noEventsForDay')}</Text>
                  )}
                </View>
              ) : !hasCalendarSync ? (
                <View style={[styles.settingRow, { backgroundColor: theme.card }]}>
                  <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: theme.ink }]}>{t(language, 'proCalendarSync')}</Text>
                    <Text style={[styles.settingMeta, { color: theme.muted }]}>
                      {t(language, 'calendarSyncLocked')}
                    </Text>
                  </View>
                  <View style={[styles.lockPill, { borderColor: theme.border }]}>
                    <Text style={[styles.lockPillText, { color: theme.muted }]}>PRO</Text>
                  </View>
                </View>
              ) : null}

              {visibleAdvice ? (
                <View style={[styles.insight, { backgroundColor: theme.card }]}>
                  <View
                    style={[
                      styles.fitDot,
                      {
                        backgroundColor:
                          visibleAdvice.fit === 'high'
                            ? theme.accent
                            : visibleAdvice.fit === 'low'
                              ? theme.teal
                              : theme.faint,
                      },
                    ]}
                  />
                  <View style={styles.insightBody}>
                    <Text style={[styles.insightTitle, { color: theme.ink }]}>{visibleAdvice.title}</Text>
                    <Text style={[styles.insightMeta, { color: theme.muted }]}>{visibleAdvice.note}</Text>
                    {calendarEnabled && calendarItems.length ? (
                      <Text style={[styles.insightCounts, { color: theme.muted }]}>
                        {t(language, 'eventsToday', { events: selectedEvents.length, workouts: selectedWorkouts.length })}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ) : !hasEventLoadAdvice ? (
                <View style={[styles.settingRow, { backgroundColor: theme.card }]}>
                  <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: theme.ink }]}>{t(language, 'proEventAdvice')}</Text>
                    <Text style={[styles.settingMeta, { color: theme.muted }]}>
                      {t(language, 'eventAdviceLocked')}
                    </Text>
                  </View>
                  <View style={[styles.lockPill, { borderColor: theme.border }]}>
                    <Text style={[styles.lockPillText, { color: theme.muted }]}>PRO</Text>
                  </View>
                </View>
              ) : null}

              {hasCalendarSync ? (
              <View style={[styles.calendarRow, { backgroundColor: theme.card }]}>
                <View style={styles.settingText}>
                  <Text style={[styles.syncText, { color: theme.ink }]}>
                    {t(language, 'syncCalendar')}
                  </Text>
                  <Text style={[styles.settingMeta, { color: calendarPermissionDenied ? theme.accent : theme.muted }]}>
                  {data.settings.calendarSync
                    ? calendarPermissionDenied
                      ? t(language, 'calendarPermissionHint')
                      : calendarItems.length
                        ? t(language, 'eventsOnWeek', { count: calendarItems.length })
                        : calendarError ?? t(language, 'readingEvents')
                    : t(language, 'syncPhone')}
                </Text>
                </View>
                <Switch
                  value={data.settings.calendarSync}
                  onValueChange={(calendarSync) => {
                    persist({ ...data, settings: { ...data.settings, calendarSync } });
                    refreshCalendar(calendarSync);
                  }}
                  trackColor={{ false: theme.border, true: theme.accentSoft }}
                  thumbColor={data.settings.calendarSync ? theme.accent : theme.faint}
                />
              </View>
              ) : null}

              {showPhaseLists && (phasePlan.best.length || phasePlan.avoid.length) ? (
                <View
                  style={[
                    styles.card,
                    { backgroundColor: theme.card, gap: data.settings.phaseListsExpanded ? 14 : 6 },
                  ]}
                >
                  <Pressable
                    onPress={() =>
                      persist({
                        ...data,
                        settings: {
                          ...data.settings,
                          phaseListsExpanded: !data.settings.phaseListsExpanded,
                        },
                      })
                    }
                    accessibilityRole="button"
                    accessibilityState={{ expanded: data.settings.phaseListsExpanded }}
                    style={styles.recommendHeader}
                  >
                    <View style={styles.settingText}>
                      <Text style={[styles.sectionTitle, { color: theme.ink }]}>
                        {t(language, 'phaseRecommendations')}
                      </Text>
                      <Text style={[styles.settingMeta, { color: theme.muted }]}>
                        {t(language, 'phaseRecommendationsHint')}
                      </Text>
                    </View>
                    <Text style={[styles.recommendChevron, { color: theme.muted }]}>
                      {data.settings.phaseListsExpanded ? '⌃' : '⌄'}
                    </Text>
                  </Pressable>
                  {data.settings.phaseListsExpanded ? (
                    <>
                      <ChipGroup
                        title={t(language, 'bestForPhase')}
                        items={phasePlan.best}
                        dot={theme.teal}
                        chipBackground={theme.tealSoft}
                        text={theme.ink}
                      />
                      <ChipGroup
                        title={t(language, 'avoidThisPhase')}
                        items={phasePlan.avoid}
                        dot={theme.accent}
                        chipBackground={theme.accentSoft}
                        text={theme.ink}
                      />
                    </>
                  ) : null}
                </View>
              ) : null}
            </>
          ) : null}

          {tab === 'year' ? (
            <>
              <Text style={[styles.hero, { color: theme.ink }]}>{t(language, 'cycleCalendar')}</Text>
              <View style={styles.yearNav}>
                <Pressable onPress={() => setYear((value) => value - 1)} hitSlop={12}>
                  <Text style={[styles.yearNavBtn, { color: theme.muted }]}>‹</Text>
                </Pressable>
                <Text style={[styles.yearLabel, { color: theme.ink }]}>{year}</Text>
                <Pressable onPress={() => setYear((value) => value + 1)} hitSlop={12}>
                  <Text style={[styles.yearNavBtn, { color: theme.muted }]}>›</Text>
                </Pressable>
              </View>
              <YearCalendar
                year={year}
                today={today}
                marks={marks}
                theme={theme}
                language={language}
                onPressDay={onCalendarDayPress}
              />
            </>
          ) : null}

          {tab === 'settings' ? (
            <>
              <Text style={[styles.hero, { color: theme.ink }]}>{t(language, 'settings')}</Text>
              <View style={[styles.settingRow, { backgroundColor: theme.card }]}>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.ink }]}>{t(language, 'plan')}</Text>
                  <Text style={[styles.settingMeta, { color: theme.muted }]}>
                    {unlockSource === 'dev'
                      ? t(language, 'devUnlockHint')
                      : unlockSource === 'testflight'
                        ? t(language, 'testFlightUnlockHint')
                        : t(language, 'proReadyHint')}
                  </Text>
                </View>
                <View style={[styles.planPill, { backgroundColor: theme.accentSoft }]}>
                  <Text style={[styles.planPillText, { color: theme.accent }]}>{planLabel}</Text>
                </View>
              </View>
              <View style={[styles.settingRow, { backgroundColor: theme.card }]}>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.ink }]}>{t(language, 'proCalendarSync')}</Text>
                  <Text style={[styles.settingMeta, { color: theme.muted }]}>
                    {hasCalendarSync ? t(language, 'calendarDesc') : t(language, 'calendarSyncLocked')}
                  </Text>
                </View>
                {hasCalendarSync ? (
                  <Switch
                    value={data.settings.calendarSync}
                    onValueChange={(calendarSync) => {
                      persist({ ...data, settings: { ...data.settings, calendarSync } });
                      refreshCalendar(calendarSync);
                    }}
                    trackColor={{ false: theme.border, true: theme.accentSoft }}
                    thumbColor={data.settings.calendarSync ? theme.accent : theme.faint}
                  />
                ) : (
                  <View style={[styles.lockPill, { borderColor: theme.border }]}>
                    <Text style={[styles.lockPillText, { color: theme.muted }]}>PRO</Text>
                  </View>
                )}
              </View>
              <View style={[styles.settingRow, { backgroundColor: theme.card }]}>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.ink }]}>{t(language, 'proEventAdvice')}</Text>
                  <Text style={[styles.settingMeta, { color: theme.muted }]}>
                    {hasEventLoadAdvice ? t(language, 'eventAdviceDesc') : t(language, 'eventAdviceLocked')}
                  </Text>
                </View>
                {hasEventLoadAdvice ? (
                  <Switch
                    value={data.settings.showEventAdvice}
                    onValueChange={(showEventAdvice) =>
                      persist({ ...data, settings: { ...data.settings, showEventAdvice } })
                    }
                    trackColor={{ false: theme.border, true: theme.accentSoft }}
                    thumbColor={data.settings.showEventAdvice ? theme.accent : theme.faint}
                  />
                ) : (
                  <View style={[styles.lockPill, { borderColor: theme.border }]}>
                    <Text style={[styles.lockPillText, { color: theme.muted }]}>PRO</Text>
                  </View>
                )}
              </View>
              <View style={[styles.settingRow, { backgroundColor: theme.card }]}>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.ink }]}>{t(language, 'proPhaseLists')}</Text>
                  <Text style={[styles.settingMeta, { color: theme.muted }]}>
                    {hasPhasePlanningLists ? t(language, 'phaseListsDesc') : t(language, 'proFeatureLocked')}
                  </Text>
                </View>
                {hasPhasePlanningLists ? (
                  <Switch
                    value={data.settings.showPhaseLists}
                    onValueChange={(showPhaseListsValue) =>
                      persist({ ...data, settings: { ...data.settings, showPhaseLists: showPhaseListsValue } })
                    }
                    trackColor={{ false: theme.border, true: theme.accentSoft }}
                    thumbColor={data.settings.showPhaseLists ? theme.accent : theme.faint}
                  />
                ) : (
                  <View style={[styles.lockPill, { borderColor: theme.border }]}>
                    <Text style={[styles.lockPillText, { color: theme.muted }]}>PRO</Text>
                  </View>
                )}
              </View>
              <View style={[styles.settingRow, { backgroundColor: theme.card }]}>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.ink }]}>{t(language, 'periodForecast')}</Text>
                  <Text style={[styles.settingMeta, { color: theme.muted }]}>
                    {t(language, 'forecastDesc')}
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
                  <Text style={[styles.settingTitle, { color: theme.ink }]}>{t(language, 'ovulationMark')}</Text>
                  <Text style={[styles.settingMeta, { color: theme.muted }]}>
                    {t(language, 'ovulationDesc')}
                  </Text>
                </View>
                <Switch
                  value={data.settings.showOvulation}
                  onValueChange={(showOvulation) =>
                    persist({ ...data, settings: { ...data.settings, showOvulation } })
                  }
                  trackColor={{ false: theme.border, true: theme.accentSoft }}
                  thumbColor={data.settings.showOvulation ? theme.accent : theme.faint}
                />
              </View>
              <View style={[styles.settingRow, { backgroundColor: theme.card }]}>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.ink }]}>{t(language, 'darkTheme')}</Text>
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
          <TabButton
            label={t(language, 'todayTab')}
            active={tab === 'today'}
            theme={theme}
            onPress={() => setTab('today')}
            icon="●"
          />
          <TabButton
            label={t(language, 'yearTab')}
            active={tab === 'year'}
            theme={theme}
            onPress={() => setTab('year')}
            icon="▦"
          />
          <TabButton
            label={t(language, 'moreTab')}
            active={tab === 'settings'}
            theme={theme}
            onPress={() => setTab('settings')}
            icon="⚙"
          />
        </View>
      </SafeAreaView>
      <ConfirmDialog
        visible={periodPrompt != null}
        theme={theme}
        title={t(language, 'periodStartTitle')}
        message={
          periodPrompt
            ? t(
                language,
                periodPrompt.kind === 'remove' ? 'confirmRemovePeriod' : 'confirmAddPeriod',
                { date: formatDay(periodPrompt.iso, language) },
              )
            : ''
        }
        cancelLabel={t(language, 'confirmCancel')}
        confirmLabel={
          periodPrompt?.kind === 'remove' ? t(language, 'confirmRemove') : t(language, 'confirmAdd')
        }
        destructive={periodPrompt?.kind === 'remove'}
        onCancel={() => setPeriodPrompt(null)}
        onConfirm={() => {
          if (!periodPrompt) return;
          onToggleDay(periodPrompt.iso);
          setPeriodPrompt(null);
        }}
      />
    </SafeAreaProvider>
  );
}

function ChipGroup({
  title,
  items,
  dot,
  chipBackground,
  text,
}: {
  title: string;
  items: string[];
  dot: string;
  chipBackground: string;
  text: string;
}) {
  if (!items.length) return null;
  return (
    <View style={styles.chipGroup}>
      <View style={styles.chipGroupHeader}>
        <View style={[styles.chipDot, { backgroundColor: dot }]} />
        <Text style={[styles.chipGroupTitle, { color: text }]}>{title}</Text>
      </View>
      <View style={styles.chipWrap}>
        {items.map((item) => (
          <View key={item} style={[styles.chip, { backgroundColor: chipBackground }]}>
            <Text style={[styles.chipText, { color: text }]}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
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
  phaseName: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 6,
  },
  recommendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recommendChevron: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 22,
  },
  chipGroup: {
    gap: 10,
  },
  chipGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipGroupTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
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
  dayList: {
    gap: 12,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dayBullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dayTextWrap: {
    flex: 1,
  },
  dayTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  dayMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  insight: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  fitDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
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
  insightCounts: {
    fontSize: 13,
    marginTop: 4,
  },
  calendarRow: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  syncText: {
    fontSize: 16,
    fontWeight: '600',
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
  planPill: {
    minWidth: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  lockPill: {
    minWidth: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockPillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
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
