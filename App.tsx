import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import {
  ActivityIndicator,
  AppState,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { canSwitchPlan, effectiveAccessTier, hasFeatureAccess, previewUnlockSource, type AccessTier } from './src/access';
import { PlusFreeCard } from './src/PlusFreeCard';
import { activityFitForPhase, activityFitLabel, adviseLoad, cycleInsight, phaseBriefDescription, phaseStatusLabel } from './src/activity';
import { loadCalendarItems, loadCurrentWeekItems, type CalendarItem } from './src/calendar';
import { formatEventTime } from './src/calendarItems';
import {
  cycleDayOnDate,
  cycleStatus,
  daysUntilNextPeriod,
  isPredictedCycleDate,
  markForDate,
  marksForYear,
  phaseOnDate,
  periodPromptForDate,
  togglePeriodStart,
  type DayMark,
  type StoredData,
} from './src/cycle';
import { appleCalendarShowInterval, formatDay, formatSelectedDayTitle, todayISO } from './src/dates';
import { loadData, saveData } from './src/storage';
import { radius, themeFor, type Theme } from './src/theme';
import { ConfirmDialog } from './src/ConfirmDialog';
import { CycleRhythm } from './src/CycleRhythm';
import { detectLanguage, t, type Language } from './src/i18n';
import { SourcesSheet } from './src/SourcesSheet';
import {
  calendarSyncNowState,
  cycleInsightToggleState,
  planSegmentIndex,
  scheduleInsightToggleState,
  themeSegmentIndex,
} from './src/settingsControls';
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
  const [yearItems, setYearItems] = useState<CalendarItem[]>([]);
  const [selectedDay, setSelectedDay] = useState(today);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [calendarPermissionDenied, setCalendarPermissionDenied] = useState(false);
  const [calendarSyncing, setCalendarSyncing] = useState(false);
  const [periodPrompt, setPeriodPrompt] = useState<{ iso: string; kind: 'add' | 'remove' } | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const switchesReady = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loadData().then((loaded) => {
      if (!cancelled) setData(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!data || switchesReady.current) return;
    const timer = setTimeout(() => {
      switchesReady.current = true;
    }, 500);
    return () => clearTimeout(timer);
  }, [data]);

  const persist = useCallback((next: StoredData) => {
    setData(next);
    saveData(next);
  }, []);

  const refreshCalendar = useCallback(async (enabled: boolean) => {
    if (!enabled) {
      setItems([]);
      setYearItems([]);
      setCalendarError(null);
      setCalendarPermissionDenied(false);
      return;
    }
    const result = await loadCurrentWeekItems(language);
    setItems(result.items);
    setCalendarError(result.error);
    setCalendarPermissionDenied(result.permissionDenied);
  }, [language]);

  const refreshYearEvents = useCallback(async (enabled: boolean, targetYear: number) => {
    if (!enabled) {
      setYearItems([]);
      return;
    }
    const result = await loadCalendarItems(`${targetYear}-01-01`, `${targetYear}-12-31`, language);
    setYearItems(result.items);
    if (result.permissionDenied) setCalendarPermissionDenied(true);
  }, [language]);

  useEffect(() => {
    const canSync = hasFeatureAccess(data?.settings.accessTier ?? 'free', 'calendarSync');
    refreshCalendar(Boolean(canSync && data?.settings.calendarSync));
  }, [data?.settings.accessTier, data?.settings.calendarSync, refreshCalendar]);

  useEffect(() => {
    const canSync = hasFeatureAccess(data?.settings.accessTier ?? 'free', 'calendarSync');
    const enabled = Boolean(canSync && data?.settings.calendarSync);
    if (tab === 'today' && enabled) {
      refreshCalendar(true);
    }
    if (tab === 'year' && enabled) {
      refreshYearEvents(true, year);
    }
  }, [tab, year, data?.settings.accessTier, data?.settings.calendarSync, refreshCalendar, refreshYearEvents]);

  // Re-read the phone calendar when returning to the app (new events often appear then).
  useEffect(() => {
    const canSync = hasFeatureAccess(data?.settings.accessTier ?? 'free', 'calendarSync');
    const enabled = Boolean(canSync && data?.settings.calendarSync);
    if (!enabled) return;
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        refreshCalendar(true);
        if (tab === 'year') refreshYearEvents(true, year);
      }
    });
    return () => sub.remove();
  }, [
    data?.settings.accessTier,
    data?.settings.calendarSync,
    refreshCalendar,
    refreshYearEvents,
    tab,
    year,
  ]);

  const onSyncCalendar = useCallback(async () => {
    const canSync = hasFeatureAccess(data?.settings.accessTier ?? 'free', 'calendarSync');
    const enabled = Boolean(canSync && data?.settings.calendarSync);
    if (!enabled || calendarSyncing) return;
    Haptics.selectionAsync().catch(() => {});
    setCalendarSyncing(true);
    const started = Date.now();
    try {
      // Clear first so the agenda visibly refreshes even if EventKit returns the same set.
      setItems([]);
      await refreshCalendar(true);
      await refreshYearEvents(true, year);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } finally {
      const elapsed = Date.now() - started;
      const wait = Math.max(0, 450 - elapsed);
      if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
      setCalendarSyncing(false);
    }
  }, [
    calendarSyncing,
    data?.settings.accessTier,
    data?.settings.calendarSync,
    refreshCalendar,
    refreshYearEvents,
    year,
  ]);

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
      Haptics.selectionAsync().catch(() => {});
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
  const hasCycleRhythm = hasFeatureAccess(storedTier, 'cycleRhythm');
  const showCycleRhythm = hasCycleRhythm && data.settings.showCycleRhythm;
  const calendarEnabled = hasCalendarSync && data.settings.calendarSync;
  const showCycleInsightCard = hasEventLoadAdvice && data.settings.showCycleInsight;
  const showScheduleInsightCard = hasEventLoadAdvice && data.settings.showScheduleInsight;
  const cycleInsightToggle = cycleInsightToggleState(data.settings.showCycleInsight);
  const scheduleInsightToggle = scheduleInsightToggleState(
    data.settings.calendarSync,
    data.settings.showScheduleInsight,
  );
  const syncNow = calendarSyncNowState(calendarEnabled, calendarSyncing);
  const calendarItems = calendarEnabled ? items : [];
  const selectedItems = calendarItems.filter((item) => item.day === selectedDay);
  const selectedDayMark = markForDate(selectedDay, data.periodStarts, data.settings);
  const selectedDayIsCycle =
    selectedDayMark === 'period' ||
    selectedDayMark === 'periodForecast' ||
    selectedDayMark === 'ovulatory';
  const selectedDayTitleColor = selectedDayIsCycle
    ? theme.accent
    : selectedItems.length
      ? theme.teal
      : theme.muted;
  const promptItems = periodPrompt
    ? yearItems.filter((item) => item.day === periodPrompt.iso)
    : [];
  const promptCycleDay = periodPrompt
    ? cycleDayOnDate(periodPrompt.iso, data.periodStarts, data.settings)
    : null;
  const promptPredicted = periodPrompt
    ? isPredictedCycleDate(periodPrompt.iso, data.periodStarts)
    : false;
  const promptOvulatory =
    periodPrompt != null &&
    data.settings.showOvulation &&
    phaseOnDate(periodPrompt.iso, data.periodStarts, data.settings) === 'ovulatory';
  const todayPredicted = isPredictedCycleDate(today, data.periodStarts);
  const visibleCycleInsight = showCycleInsightCard ? cycleInsight(status.phase, language) : null;
  const freePhaseBrief =
    status.phase && !showCycleInsightCard ? phaseBriefDescription(status.phase, language) : null;
  const visibleScheduleAdvice =
    showScheduleInsightCard && calendarEnabled
      ? adviseLoad(status.phase, calendarItems, language)
      : null;
  const unlockSource = previewUnlockSource();
  const planSwitcher = canSwitchPlan();


  const planLabel =
    unlockSource === 'dev'
      ? t(language, 'devPlan')
      : unlockSource === 'plus'
        ? t(language, 'proPlan')
        : tier === 'pro'
          ? t(language, 'proPlan')
          : t(language, 'freePlan');

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top']}>
        <StatusBar style={data.settings.themeMode === 'dark' ? 'light' : 'dark'} />

        <View style={styles.header}>
          <Text style={[styles.brand, { color: theme.accent }]}>Rhythma</Text>
        </View>

        {tab === 'year' ? (
          <View style={[styles.yearPane, styles.content]}>
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
          </View>
        ) : (
        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {tab === 'today' ? (
            <>
              <Text style={[styles.hero, { color: theme.ink }]}>{t(language, 'todayHeader')}</Text>

              <View style={[styles.card, styles.weekCard, { backgroundColor: theme.card }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.sectionLabel, styles.weekSectionLabel, { color: theme.ink }]}>
                    {t(language, 'thisWeek')}
                  </Text>
                  {syncNow.visible ? (
                    <Pressable
                      onPress={() => {
                        void onSyncCalendar();
                      }}
                      disabled={syncNow.disabled}
                      hitSlop={12}
                      accessibilityRole="button"
                      accessibilityLabel={t(language, 'syncNow')}
                      style={[
                        styles.syncNowBtn,
                        {
                          borderColor: theme.teal,
                          opacity: syncNow.disabled ? 0.45 : 1,
                        },
                      ]}
                    >
                      {calendarSyncing ? (
                        <ActivityIndicator color={theme.teal} size="small" />
                      ) : (
                        <Text style={[styles.syncNowLabel, { color: theme.teal }]}>
                          {t(language, 'syncNow')}
                        </Text>
                      )}
                    </Pressable>
                  ) : null}
                </View>
                {calendarEnabled && calendarError && !calendarPermissionDenied ? (
                  <Text style={[styles.secondaryLine, { color: theme.muted }]}>{calendarError}</Text>
                ) : null}
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
                {calendarEnabled ? (
                  <View
                    style={[
                      styles.cardBlock,
                      styles.weekDayAgenda,
                      { borderTopColor: theme.border },
                    ]}
                  >
                    <Text style={[styles.sectionLabel, { color: selectedDayTitleColor }]}>
                      {formatSelectedDayTitle(selectedDay, language)}
                    </Text>
                    {selectedItems.length ? (
                      <View style={styles.dayList}>
                        {selectedItems.map((item) => {
                          const fit = activityFitForPhase(status.phase, item.activity);
                          const fitLabel = activityFitLabel(status.phase, item.activity, language);
                          const timeLabel = formatEventTime(item, language);
                          return (
                            <View key={item.id} style={styles.dayRow}>
                              <View style={[styles.dayBullet, { backgroundColor: theme.teal }]} />
                              <View style={styles.dayTextWrap}>
                                <View style={styles.dayTitleRow}>
                                  <Text style={[styles.dayTitle, { color: theme.ink }]} numberOfLines={2}>
                                    {item.title}
                                  </Text>
                                  <Text style={[styles.dayTime, { color: theme.teal }]}>{timeLabel}</Text>
                                </View>
                                {fitLabel ? (
                                  <Text
                                    style={[
                                      styles.dayMeta,
                                      {
                                        color:
                                          fit === 'harder'
                                            ? theme.accent
                                            : fit === 'support'
                                              ? theme.teal
                                              : theme.muted,
                                      },
                                    ]}
                                  >
                                    {fitLabel}
                                  </Text>
                                ) : null}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    ) : (
                      <Text style={[styles.secondaryLine, { color: theme.muted }]}>
                        {t(language, 'noEventsForDay')}
                      </Text>
                    )}
                  </View>
                ) : null}
              </View>

              <View style={[styles.card, styles.periodCard, { backgroundColor: theme.card }]}>
                <View style={styles.periodCardBody}>
                  <View style={styles.periodCardText}>
                    {status.cycleDay == null ? (
                      <>
                        <Text style={[styles.periodTitle, { color: theme.accent }]}>
                          {t(language, 'logCycle')}
                        </Text>
                        <Text style={[styles.secondaryLine, { color: theme.muted }]}>
                          {t(language, 'logCycleSub')}
                        </Text>
                      </>
                    ) : (
                      <View style={showCycleRhythm ? styles.cycleHero : undefined}>
                        <View style={showCycleRhythm ? styles.cycleHeroText : undefined}>
                          <Text style={[styles.periodTitle, { color: theme.accent }]}>
                            {t(
                              language,
                              todayPredicted ? 'dayDetailCycleDayPredicted' : 'dayDetailCycleDay',
                              { day: status.cycleDay },
                            )}
                            {status.phase ? ` · ${phaseStatusLabel(status.phase, language)}` : ''}
                          </Text>
                          <Text style={[styles.secondaryLine, { color: theme.muted }]}>
                            {daysLeft == null
                              ? t(language, 'nextAfterRecords')
                              : daysLeft === 0
                                ? t(language, 'nextToday')
                                : t(language, 'nextIn', { days: daysLeft })}
                          </Text>
                          {freePhaseBrief ? (
                            <Text style={[styles.secondaryLine, styles.phaseBrief, { color: theme.muted }]}>
                              {freePhaseBrief}
                            </Text>
                          ) : null}
                        </View>
                        {showCycleRhythm ? (
                          <CycleRhythm
                            cycleDay={status.cycleDay}
                            cycleLength={status.cycleLength}
                            settings={data.settings}
                            theme={theme}
                            language={language}
                          />
                        ) : null}
                      </View>
                    )}
                  </View>
                  <Pressable
                    onPress={onFirstDay}
                    style={[styles.cta, styles.ctaCompact, { backgroundColor: theme.accent }]}
                  >
                    <Text style={styles.ctaText}>
                      {todayIsStart ? t(language, 'cancelToday') : t(language, 'startedToday')}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => setTab('year')} hitSlop={8}>
                    <Text style={[styles.textLink, styles.periodDateLink, { color: theme.muted }]}>
                      {t(language, 'chooseOtherDate')}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {visibleCycleInsight ? (
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                  <View style={styles.cardBlock}>
                    <Text style={[styles.sectionLabel, { color: theme.accent }]}>
                      {t(language, 'cycleInsight')}
                    </Text>
                    <Text
                      style={[
                        styles.sectionLabel,
                        {
                          color:
                            visibleCycleInsight.fit === 'high'
                              ? theme.accent
                              : visibleCycleInsight.fit === 'low'
                                ? theme.teal
                                : theme.ink,
                        },
                      ]}
                    >
                      {visibleCycleInsight.title}
                    </Text>
                    {visibleCycleInsight.note ? (
                      <Text style={[styles.secondaryLine, { color: theme.muted }]}>
                        {visibleCycleInsight.note}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ) : null}

              {visibleScheduleAdvice ? (
                <View style={[styles.card, styles.insightCard, { backgroundColor: theme.card }]}>
                  <View style={styles.cardBlock}>
                    <View style={styles.insightHeader}>
                      <Text style={[styles.sectionLabel, { color: theme.teal }]}>
                        {t(language, 'scheduleInsight')}
                      </Text>
                      <Text style={[styles.insightChevron, { color: theme.teal }]}>›</Text>
                    </View>
                    {visibleScheduleAdvice.busiestDayISO ? (
                      <Pressable
                        onPress={() => {
                          const interval = appleCalendarShowInterval(
                            visibleScheduleAdvice.busiestDayISO!,
                          );
                          Linking.openURL(`calshow:${interval}`).catch(() => {});
                        }}
                        accessibilityRole="link"
                        hitSlop={8}
                      >
                        <Text
                          style={[
                            styles.sectionLabel,
                            styles.textLink,
                            { color: theme.ink, textAlign: 'left' },
                          ]}
                        >
                          {visibleScheduleAdvice.title}
                        </Text>
                      </Pressable>
                    ) : (
                      <Text
                        style={[
                          styles.sectionLabel,
                          {
                            color:
                              visibleScheduleAdvice.fit === 'high'
                                ? theme.accent
                                : visibleScheduleAdvice.fit === 'low'
                                  ? theme.teal
                                  : theme.ink,
                          },
                        ]}
                      >
                        {visibleScheduleAdvice.title}
                      </Text>
                    )}
                    {visibleScheduleAdvice.note ? (
                      <Text style={[styles.secondaryLine, { color: theme.muted }]}>
                        {visibleScheduleAdvice.note}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ) : null}

              {!calendarEnabled &&
              (!hasEventLoadAdvice || data.settings.showScheduleInsight) ? (
                <Pressable
                  onPress={() => setTab('settings')}
                  style={[styles.card, styles.connectCalendarCard, { backgroundColor: theme.card }]}
                  accessibilityRole="button"
                >
                  <View style={styles.insightHeader}>
                    <Text style={[styles.sectionLabel, { color: theme.teal }]}>
                      {t(language, 'connectCalendar')}
                    </Text>
                    <Text style={[styles.insightChevron, { color: theme.teal }]}>›</Text>
                  </View>
                  <Text style={[styles.connectCalendarHint, { color: theme.muted }]}>
                    {t(language, 'connectCalendarHint')}
                  </Text>
                </Pressable>
              ) : null}
            </>
          ) : null}

          {tab === 'settings' ? (
            <>
              <Text style={[styles.hero, { color: theme.ink }]}>{t(language, 'settings')}</Text>

              {/* Plus paywall card — shown to free users; dev/switcher show normal plan row */}
              {planSwitcher ? (
                <View style={[styles.settingRow, { backgroundColor: theme.card }]}>
                  <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: theme.ink }]}>{t(language, 'plan')}</Text>
                    <Text style={[styles.settingMeta, { color: theme.muted }]}>{t(language, 'planSwitchHint')}</Text>
                  </View>
                  <PlanSwitch
                    value={storedTier}
                    appearance={data.settings.themeMode}
                    language={language}
                    onChange={(accessTier) => {
                      persist({ ...data, settings: { ...data.settings, accessTier } });
                      // Calendar sync is free — always refresh when enabled, never clear on Free.
                      if (data.settings.calendarSync) refreshCalendar(true);
                    }}
                  />
                </View>
              ) : storedTier === 'pro' || unlockSource !== 'off' ? (
                <View style={[styles.settingRow, { backgroundColor: theme.card }]}>
                  <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: theme.ink }]}>{t(language, 'plan')}</Text>
                    <Text style={[styles.settingMeta, { color: theme.muted }]}>
                      {unlockSource === 'dev' ? t(language, 'devUnlockHint') : unlockSource === 'plus' ? t(language, 'plusUnlockHint') : t(language, 'proReadyHint')}
                    </Text>
                  </View>
                  <View style={[styles.planPill, { backgroundColor: theme.accentSoft }]}>
                    <Text style={[styles.planPillText, { color: theme.accent }]}>{planLabel}</Text>
                  </View>
                </View>
              ) : (
                <PlusFreeCard
                  theme={theme}
                  language={language}
                  onUnlock={() => {
                    persist({ ...data, settings: { ...data.settings, accessTier: 'pro' } });
                    if (data.settings.calendarSync) refreshCalendar(true);
                  }}
                />
              )}

              {/* Calendar sync — free for everyone */}
              <View style={[styles.settingRow, { backgroundColor: theme.card }]}>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.ink }]}>{t(language, 'proCalendarSync')}</Text>
                  {calendarPermissionDenied ? (
                    <Text style={[styles.settingMeta, { color: theme.muted }]}>
                      {t(language, 'calendarPermissionHint')}
                    </Text>
                  ) : null}
                  <Pressable onPress={() => Linking.openURL('https://iulianaiagodka.github.io/Rhythma/#google-calendar')} hitSlop={8}>
                    <Text style={[styles.settingLink, { color: theme.teal }]}>{t(language, 'calendarGoogleLink')}</Text>
                  </Pressable>
                  {syncNow.visible ? (
                    <Pressable
                      onPress={() => {
                        void onSyncCalendar();
                      }}
                      disabled={syncNow.disabled}
                      hitSlop={8}
                      accessibilityRole="button"
                    >
                      <Text
                        style={[
                          styles.settingLink,
                          { color: theme.teal, opacity: syncNow.disabled ? 0.45 : 1 },
                        ]}
                      >
                        {calendarSyncing ? t(language, 'readingEvents') : t(language, 'syncNow')}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
                <BrightSwitch
                  value={data.settings.calendarSync}
                  readyRef={switchesReady}
                  onValueChange={(calendarSync) => {
                    persist({ ...data, settings: { ...data.settings, calendarSync } });
                    refreshCalendar(calendarSync);
                  }}
                />
              </View>

              {/* Plus feature rows — only shown when unlocked */}
              {storedTier === 'pro' || unlockSource !== 'off' ? (
                <>
                  <View style={[styles.settingRow, { backgroundColor: theme.card }]}>
                    <View style={styles.settingText}>
                      <Text style={[styles.settingTitle, { color: theme.ink }]}>
                        {t(language, 'cycleInsight')}
                      </Text>
                      <Text style={[styles.settingMeta, { color: theme.muted }]}>
                        {t(language, 'cycleInsightDesc')}
                      </Text>
                    </View>
                    <BrightSwitch
                      value={cycleInsightToggle.value}
                      disabled={cycleInsightToggle.disabled}
                      readyRef={switchesReady}
                      onValueChange={(showCycleInsight) =>
                        persist({ ...data, settings: { ...data.settings, showCycleInsight } })
                      }
                    />
                  </View>
                  <View style={[styles.settingRow, { backgroundColor: theme.card, opacity: scheduleInsightToggle.disabled ? 0.45 : 1 }]}>
                    <View style={styles.settingText}>
                      <Text style={[styles.settingTitle, { color: theme.ink }]}>
                        {t(language, 'scheduleInsight')}
                      </Text>
                      <Text style={[styles.settingMeta, { color: theme.muted }]}>
                        {t(language, 'scheduleInsightDesc')}
                      </Text>
                    </View>
                    <BrightSwitch
                      value={scheduleInsightToggle.value}
                      disabled={scheduleInsightToggle.disabled}
                      readyRef={switchesReady}
                      onValueChange={(showScheduleInsight) =>
                        persist({ ...data, settings: { ...data.settings, showScheduleInsight } })
                      }
                    />
                  </View>
                  <View style={[styles.settingRow, { backgroundColor: theme.card }]}>
                    <View style={styles.settingText}>
                      <Text style={[styles.settingTitle, { color: theme.ink }]}>{t(language, 'cycleRhythm')}</Text>
                      <Text style={[styles.settingMeta, { color: theme.muted }]}>{t(language, 'cycleRhythmDesc')}</Text>
                    </View>
                    <BrightSwitch
                      value={data.settings.showCycleRhythm}
                      readyRef={switchesReady}
                      onValueChange={(showCycleRhythm) =>
                        persist({ ...data, settings: { ...data.settings, showCycleRhythm } })
                      }
                    />
                  </View>
                </>
              ) : null}

              <View style={[styles.settingRow, { backgroundColor: theme.card }]}>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.ink }]}>{t(language, 'periodForecast')}</Text>
                  <Text style={[styles.settingMeta, { color: theme.muted }]}>
                    {t(language, 'forecastDesc')}
                  </Text>
                </View>
                <BrightSwitch
                  value={data.settings.showForecast}
                  readyRef={switchesReady}
                  onValueChange={(showForecast) =>
                    persist({ ...data, settings: { ...data.settings, showForecast } })
                  }
                />
              </View>
              <View style={[styles.settingRow, { backgroundColor: theme.card }]}>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.ink }]}>{t(language, 'ovulationMark')}</Text>
                  <Text style={[styles.settingMeta, { color: theme.muted }]}>
                    {t(language, 'ovulationDesc')}
                  </Text>
                </View>
                <BrightSwitch
                  value={data.settings.showOvulation}
                  readyRef={switchesReady}
                  onValueChange={(showOvulation) =>
                    persist({ ...data, settings: { ...data.settings, showOvulation } })
                  }
                />
              </View>
              <Pressable
                onPress={() => setSourcesOpen(true)}
                style={[styles.settingRow, { backgroundColor: theme.card }]}
                accessibilityRole="button"
              >
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.ink }]}>
                    {t(language, 'sourcesSettingsTitle')}
                  </Text>
                  <Text style={[styles.settingMeta, { color: theme.muted }]}>
                    {t(language, 'sourcesSettingsDesc')}
                  </Text>
                </View>
                <Text style={[styles.insightChevron, { color: theme.teal }]}>›</Text>
              </Pressable>
              <View style={[styles.settingRow, { backgroundColor: theme.card }]}>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.ink }]}>{t(language, 'darkTheme')}</Text>
                </View>
                <ThemeSwitch
                  value={data.settings.themeMode}
                  language={language}
                  onChange={(themeMode) =>
                    persist({ ...data, settings: { ...data.settings, themeMode } })
                  }
                />
              </View>
            </>
          ) : null}
        </ScrollView>
        )}

        <SafeAreaView edges={['bottom']} style={{ backgroundColor: theme.tabBar }}>
          <View style={[styles.tabBar, { borderTopColor: theme.border }]}>
            <TabButton
              label={t(language, 'todayTab')}
              active={tab === 'today'}
              theme={theme}
              onPress={() => setTab('today')}
              icon="■"
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
              icon="menu"
            />
          </View>
        </SafeAreaView>
      </SafeAreaView>
      <SourcesSheet
        visible={sourcesOpen}
        topic="all"
        theme={theme}
        language={language}
        onClose={() => setSourcesOpen(false)}
      />
      <ConfirmDialog
        visible={periodPrompt != null}
        theme={theme}
        language={language}
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
        cycleLine={
          promptCycleDay != null
            ? t(
                language,
                promptPredicted ? 'dayDetailCycleDayPredicted' : 'dayDetailCycleDay',
                { day: String(promptCycleDay) },
              )
            : t(language, 'dayDetailNoCycle')
        }
        ovulationLine={
          promptOvulatory
            ? t(
                language,
                promptPredicted ? 'dayDetailOvulationPredicted' : 'dayDetailOvulation',
              )
            : undefined
        }
        eventsLabel={t(language, 'dayDetailEvents')}
        events={calendarEnabled ? promptItems : []}
        emptyEventsLabel={
          calendarEnabled ? t(language, 'dayDetailNoEvents') : t(language, 'dayDetailEnableSync')
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

function PlanSwitch({
  value,
  appearance,
  language,
  onChange,
}: {
  value: AccessTier;
  appearance: 'light' | 'dark';
  language: Language;
  onChange: (tier: AccessTier) => void;
}) {
  return (
    <SegmentedControl
      values={[t(language, 'freePlan'), t(language, 'proPlan')]}
      selectedIndex={planSegmentIndex(value)}
      onChange={(event) => {
        const next: AccessTier = event.nativeEvent.selectedSegmentIndex === 1 ? 'pro' : 'free';
        if (next === value) return;
        void Haptics.selectionAsync();
        onChange(next);
      }}
      appearance={appearance}
      style={styles.nativeSegment}
    />
  );
}

function ThemeSwitch({
  value,
  language,
  onChange,
}: {
  value: 'light' | 'dark';
  language: Language;
  onChange: (mode: 'light' | 'dark') => void;
}) {
  return (
    <SegmentedControl
      values={[t(language, 'themeLight'), t(language, 'themeDark')]}
      selectedIndex={themeSegmentIndex(value)}
      onChange={(event) => {
        const next: 'light' | 'dark' = event.nativeEvent.selectedSegmentIndex === 1 ? 'dark' : 'light';
        if (next === value) return;
        void Haptics.selectionAsync();
        onChange(next);
      }}
      appearance={value}
      style={styles.nativeSegment}
    />
  );
}

function PlusBadge({ theme, language }: { theme: Theme; language: Language }) {
  return (
    <View style={[styles.lockPill, { borderColor: theme.border }]}>
      <Text style={[styles.lockPillText, { color: theme.muted }]}>{t(language, 'plusBadge')}</Text>
    </View>
  );
}

function BrightSwitch({
  value,
  onValueChange,
  readyRef,
  disabled = false,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  readyRef: MutableRefObject<boolean>;
  disabled?: boolean;
}) {
  return (
    <Switch
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        if (!readyRef.current || disabled) return;
        onValueChange(next);
      }}
    />
  );
}

function MenuIcon({ color }: { color: string }) {
  return (
    <View style={styles.menuIcon}>
      <View style={[styles.menuBar, { backgroundColor: color }]} />
      <View style={[styles.menuBar, { backgroundColor: color }]} />
      <View style={[styles.menuBar, { backgroundColor: color }]} />
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
      {icon === 'menu' ? (
        <MenuIcon color={color} />
      ) : (
        <Text style={[styles.tabIcon, { color }]}>{icon}</Text>
      )}
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
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  mainScroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },
  yearPane: {
    flex: 1,
    gap: 12,
    paddingBottom: 8,
    minHeight: 0,
  },
  hero: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: 4,
    marginBottom: 2,
  },
  card: {
    borderRadius: radius.card,
    padding: 18,
    gap: 14,
  },
  weekCard: {
    paddingVertical: 20,
    gap: 16,
  },
  weekSectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  weekDayAgenda: {
    marginTop: 4,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  periodCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  periodCardBody: {
    gap: 10,
  },
  periodCardText: {
    gap: 4,
  },
  periodTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  periodDateLink: {
    textAlign: 'left',
    fontSize: 13,
  },
  insightCard: {
    paddingVertical: 14,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  insightChevron: {
    fontSize: 20,
    fontWeight: '400',
    lineHeight: 20,
  },
  connectCalendarCard: {
    gap: 4,
    paddingVertical: 14,
  },
  connectCalendarHint: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  cycleHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cycleHeroText: {
    flex: 1,
    minWidth: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  syncNowBtn: {
    minHeight: 32,
    minWidth: 56,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncNowLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  cardBlock: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  primaryLine: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  primaryLineWithChart: {
    fontSize: 18,
    lineHeight: 24,
  },
  secondaryLine: {
    fontSize: 14,
    lineHeight: 20,
  },
  phaseBrief: {
    marginTop: 4,
  },
  phaseName: {
    fontSize: 15,
    fontWeight: '600',
  },
  tipGroupItems: {
    fontSize: 14,
    lineHeight: 20,
  },
  cta: {
    borderRadius: radius.control,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaCompact: {
    minHeight: 40,
    paddingVertical: 10,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  textLink: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    textDecorationLine: 'underline',
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
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dayTextWrap: {
    flex: 1,
  },
  dayTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  dayTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  dayTime: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  dayMeta: {
    fontSize: 12,
    marginTop: 2,
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
    borderRadius: radius.card,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: { flex: 1 },
  settingControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingTitle: { fontSize: 16, fontWeight: '600' },
  settingMeta: { fontSize: 13, marginTop: 4 },
  settingLink: { fontSize: 12, marginTop: 6 },
  planPill: {
    minWidth: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  paywallInline: {
    borderRadius: radius.card,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  paywallInlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paywallIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paywallIconStar: {
    fontSize: 20,
  },
  paywallCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  paywallCardSub: {
    fontSize: 12,
  },
  paywallInlineFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paywallInlineFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.control,
    backgroundColor: 'rgba(233,30,140,0.08)',
  },
  paywallInlineCheck: {
    fontSize: 11,
    fontWeight: '700',
  },
  paywallInlineFeatureLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  paywallInlineError: {
    fontSize: 12,
  },
  paywallInlineBtn: {
    paddingVertical: 14,
    borderRadius: radius.control,
    alignItems: 'center',
  },
  paywallInlineBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  paywallInlineLifetime: {
    fontSize: 11,
    textAlign: 'center',
  },
  paywallInlineRestore: {
    fontSize: 12,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  paywallComingSoonBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.control,
  },
  paywallComingSoonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  nativeSegment: {
    minWidth: 148,
  },
  lockPill: {
    minWidth: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.control,
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
    paddingBottom: 4,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  tabIcon: { fontSize: 18 },
  menuIcon: {
    width: 18,
    height: 14,
    justifyContent: 'space-between',
    paddingVertical: 1,
  },
  menuBar: {
    height: 2,
    borderRadius: 1,
  },
  tabLabel: { fontSize: 11, fontWeight: '600' },
});
