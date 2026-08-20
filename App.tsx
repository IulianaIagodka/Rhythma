import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import {
  ActivityIndicator,
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
import { activityFitForPhase, activityFitLabel, adviseLoad, capacityForPhase, planningForPhase } from './src/activity';
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
import { CycleRhythm } from './src/CycleRhythm';
import { detectLanguage, t, type Language } from './src/i18n';
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
  const hasCycleRhythm = hasFeatureAccess(storedTier, 'cycleRhythm');
  const showCycleRhythm = hasCycleRhythm && data.settings.showCycleRhythm;
  const calendarEnabled = hasCalendarSync && data.settings.calendarSync;
  const showAdvice = hasEventLoadAdvice && data.settings.showEventAdvice;
  const showPhaseLists = hasPhasePlanningLists && data.settings.showPhaseLists;
  const calendarItems = calendarEnabled ? items : [];
  const selectedItems = calendarItems.filter((item) => item.day === selectedDay);
  const visibleAdvice = showAdvice
    ? adviseLoad(status.phase, calendarItems, language)
    : null;
  const phaseCapacity = capacityForPhase(status.phase, language);
  const phasePlan = planningForPhase(status.phase, language);
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
                  <View style={showCycleRhythm ? styles.cycleHero : undefined}>
                    <View style={showCycleRhythm ? styles.cycleHeroText : undefined}>
                      <Text
                        style={[
                          styles.cardTitle,
                          showCycleRhythm ? styles.cardTitleWithChart : null,
                          { color: theme.ink },
                        ]}
                      >
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
                  <Pressable onPress={() => setTab('year')} hitSlop={8}>
                    <Text
                      style={[
                        calendarEnabled ? styles.sectionLink : styles.sectionTag,
                        { color: calendarEnabled ? theme.teal : theme.accent },
                      ]}
                    >
                      {calendarEnabled ? t(language, 'calendarTag') : t(language, 'cycleTag')}
                    </Text>
                  </Pressable>
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
                              { backgroundColor: theme.teal },
                            ]}
                          />
                          <View style={styles.dayTextWrap}>
                            <Text style={[styles.dayTitle, { color: theme.ink }]}>{item.title}</Text>
                            <Text
                              style={[
                                styles.dayMeta,
                                {
                                  color:
                                    activityFitForPhase(status.phase, item.activity) === 'support'
                                      ? theme.teal
                                      : activityFitForPhase(status.phase, item.activity) === 'harder'
                                        ? theme.accent
                                        : theme.muted,
                                },
                              ]}
                            >
                              {[
                                t(language, 'events'),
                                activityFitLabel(status.phase, item.activity, language),
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.insightMeta, { color: theme.muted }]}>{t(language, 'noEventsForDay')}</Text>
                  )}
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
                        {t(language, 'eventsToday', { count: selectedItems.length })}
                      </Text>
                    ) : null}
                  </View>
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
                      <TipGroup
                        title={t(language, 'bestForPhase')}
                        items={phasePlan.best}
                        titleColor={theme.ink}
                        textColor={theme.muted}
                      />
                      <TipGroup
                        title={t(language, 'avoidThisPhase')}
                        items={phasePlan.avoid}
                        titleColor={theme.ink}
                        textColor={theme.muted}
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

              {/* Plus paywall card — shown to free users; dev/switcher show normal plan row */}
              {planSwitcher ? (
                <View style={[styles.settingRow, { backgroundColor: theme.card }]}>
                  <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: theme.ink }]}>{t(language, 'plan')}</Text>
                    <Text style={[styles.settingMeta, { color: theme.muted }]}>{t(language, 'planSwitchHint')}</Text>
                  </View>
                  <PlanSwitch
                    value={storedTier}
                    theme={theme}
                    language={language}
                    onChange={(accessTier) => {
                      persist({ ...data, settings: { ...data.settings, accessTier } });
                      if (accessTier === 'pro' && data.settings.calendarSync) refreshCalendar(true);
                      else refreshCalendar(false);
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
                </View>
                <BrightSwitch
                  value={data.settings.calendarSync}
                  theme={theme}
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
                      <Text style={[styles.settingTitle, { color: theme.ink }]}>{t(language, 'proEventAdvice')}</Text>
                      <Text style={[styles.settingMeta, { color: theme.muted }]}>{t(language, 'eventAdviceDesc')}</Text>
                    </View>
                    <BrightSwitch
                      value={data.settings.showEventAdvice}
                      theme={theme}
                      readyRef={switchesReady}
                      onValueChange={(showEventAdvice) =>
                        persist({ ...data, settings: { ...data.settings, showEventAdvice } })
                      }
                    />
                  </View>
                  <View style={[styles.settingRow, { backgroundColor: theme.card }]}>
                    <View style={styles.settingText}>
                      <Text style={[styles.settingTitle, { color: theme.ink }]}>{t(language, 'proPhaseLists')}</Text>
                      <Text style={[styles.settingMeta, { color: theme.muted }]}>{t(language, 'phaseListsDesc')}</Text>
                    </View>
                    <BrightSwitch
                      value={data.settings.showPhaseLists}
                      theme={theme}
                      readyRef={switchesReady}
                      onValueChange={(showPhaseListsValue) =>
                        persist({ ...data, settings: { ...data.settings, showPhaseLists: showPhaseListsValue } })
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
                      theme={theme}
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
                  theme={theme}
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
                  theme={theme}
                  readyRef={switchesReady}
                  onValueChange={(showOvulation) =>
                    persist({ ...data, settings: { ...data.settings, showOvulation } })
                  }
                />
              </View>
              <View style={[styles.settingRow, { backgroundColor: theme.card }]}>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.ink }]}>{t(language, 'darkTheme')}</Text>
                </View>
                <BrightSwitch
                  value={data.settings.themeMode === 'dark'}
                  theme={theme}
                  readyRef={switchesReady}
                  onValueChange={(dark) =>
                    persist({
                      ...data,
                      settings: { ...data.settings, themeMode: dark ? 'dark' : 'light' },
                    })
                  }
                />
              </View>
            </>
          ) : null}
        </ScrollView>

        <SafeAreaView edges={['bottom']} style={{ backgroundColor: theme.tabBar }}>
          <View style={[styles.tabBar, { borderTopColor: theme.border }]}>
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
              icon="menu"
            />
          </View>
        </SafeAreaView>
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

function TipGroup({
  title,
  items,
  titleColor,
  textColor,
}: {
  title: string;
  items: string[];
  titleColor: string;
  textColor: string;
}) {
  if (!items.length) return null;
  return (
    <View style={styles.tipGroup}>
      <Text style={[styles.tipGroupTitle, { color: titleColor }]}>{title}</Text>
      <Text style={[styles.tipGroupItems, { color: textColor }]}>{items.join(' · ')}</Text>
    </View>
  );
}

function PlanSwitch({
  value,
  theme,
  language,
  onChange,
}: {
  value: AccessTier;
  theme: Theme;
  language: Language;
  onChange: (tier: AccessTier) => void;
}) {
  return (
    <View style={[styles.planSwitch, { borderColor: theme.border }]}>
      {(['free', 'pro'] as const).map((tier) => {
        const active = value === tier;
        return (
          <Pressable
            key={tier}
            onPress={() => {
              if (tier === value) return;
              void Haptics.selectionAsync();
              onChange(tier);
            }}
            style={[styles.planSwitchBtn, active ? { backgroundColor: theme.accent } : null]}
          >
            <Text style={[styles.planSwitchText, { color: active ? '#FFFFFF' : theme.muted }]}>
              {tier === 'pro' ? t(language, 'proPlan') : t(language, 'freePlan')}
            </Text>
          </Pressable>
        );
      })}
    </View>
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
  theme,
  readyRef,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  theme: Theme;
  readyRef: MutableRefObject<boolean>;
}) {
  return (
    <Switch
      value={value}
      onValueChange={(next) => {
        if (!readyRef.current) return;
        if (next === value) return;
        onValueChange(next);
      }}
      trackColor={{ false: theme.faint, true: theme.accent }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={theme.faint}
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
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
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
  cardTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  cardTitleWithChart: {
    fontSize: 22,
  },
  cardMeta: {
    fontSize: 15,
    marginTop: 4,
  },
  phaseName: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
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
  tipGroup: {
    gap: 6,
  },
  tipGroupTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  tipGroupItems: {
    fontSize: 14,
    lineHeight: 20,
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
  sectionLink: {
    fontSize: 13,
    fontWeight: '600',
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
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  paywallInline: {
    borderRadius: 14,
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
    borderRadius: 11,
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
    borderRadius: 999,
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
    borderRadius: 999,
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
    borderRadius: 999,
  },
  paywallComingSoonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  planSwitch: {
    flexDirection: 'row',
    borderRadius: 999,
    borderWidth: 1,
    padding: 2,
    gap: 2,
  },
  planSwitchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  planSwitchText: {
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
