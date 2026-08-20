import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import {
  energyAtCycleDay,
  estrogenAtCycleDay,
  phaseIdForCycleDay,
  progesteroneAtCycleDay,
  wrappedCycleDay,
  type PhaseId,
  type Settings,
} from './cycle';
import { t, type Language } from './i18n';
import type { Theme } from './theme';

const CHART_WIDTH = 132;
const CHART_HEIGHT = 64;
const PAD_X = 10;
const PAD_Y = 16;
const EXPANDED_HEIGHT = 188;
const EXPANDED_PAD_X = 14;
const EXPANDED_PAD_Y = 22;

type Point = { x: number; y: number; day: number; phase: PhaseId };

type CycleRhythmProps = {
  cycleDay: number;
  cycleLength: number;
  settings: Settings;
  theme: Theme;
  language: Language;
};

function phaseColor(phase: PhaseId, theme: Theme): string {
  if (phase === 'menstrual') return theme.period;
  if (phase === 'follicular') return theme.rhythmFollicular;
  if (phase === 'ovulatory') return theme.teal;
  return theme.rhythmLuteal;
}

function curvePoints(
  cycleLength: number,
  settings: Settings,
  width: number,
  height: number,
  padX: number,
  padY: number,
  valueAtDay: (day: number) => number,
): Point[] {
  const innerWidth = width - padX * 2;
  const innerHeight = height - padY * 2;
  return Array.from({ length: cycleLength }, (_, index) => {
    const day = index + 1;
    const value = valueAtDay(day);
    return {
      day,
      phase: phaseIdForCycleDay(day, cycleLength, settings),
      x: padX + ((day - 1) / Math.max(1, cycleLength - 1)) * innerWidth,
      y: padY + (1 - value) * innerHeight,
    };
  });
}

function smoothPath(points: Point[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

function phaseSegments(points: Point[]): { phase: PhaseId; points: Point[] }[] {
  const segments: { phase: PhaseId; points: Point[] }[] = [];
  for (const point of points) {
    const last = segments[segments.length - 1];
    if (last && last.phase === point.phase) {
      last.points.push(point);
    } else {
      const join = last ? [last.points[last.points.length - 1], point] : [point];
      segments.push({ phase: point.phase, points: join });
    }
  }
  return segments.filter((segment) => segment.points.length >= 2);
}

function CompactChart({
  cycleDay,
  cycleLength,
  settings,
  theme,
  language,
}: CycleRhythmProps) {
  const points = useMemo(
    () =>
      curvePoints(cycleLength, settings, CHART_WIDTH, CHART_HEIGHT, PAD_X, PAD_Y, (day) =>
        energyAtCycleDay(day, cycleLength, settings),
      ),
    [cycleLength, settings],
  );
  const todayDay = wrappedCycleDay(cycleDay, cycleLength);
  const today = points[todayDay - 1] ?? points[0];
  const segments = useMemo(() => phaseSegments(points), [points]);
  const labelWidth = language === 'uk' ? 72 : 44;
  const labelLeft = Math.max(0, Math.min(CHART_WIDTH - labelWidth, today.x - labelWidth / 2));

  return (
    <View style={styles.compactWrap}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {segments.map((segment) => (
          <Path
            key={`${segment.phase}-${segment.points[0].day}`}
            d={smoothPath(segment.points)}
            stroke={phaseColor(segment.phase, theme)}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
        <Circle
          cx={today.x}
          cy={today.y}
          r={5}
          fill={theme.teal}
          stroke="#FFFFFF"
          strokeWidth={2}
        />
      </Svg>
      <Text
        style={[
          styles.todayLabel,
          {
            color: theme.teal,
            left: labelLeft,
            top: Math.max(0, today.y - 18),
            width: labelWidth,
          },
        ]}
      >
        {t(language, 'rhythmToday')}
      </Text>
    </View>
  );
}

function LegendDot({ color, label, ink }: { color: string; label: string; ink: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text style={[styles.legendLabel, { color: ink }]}>{label}</Text>
    </View>
  );
}

function ExpandedChart({
  cycleDay,
  cycleLength,
  settings,
  theme,
  language,
  width,
}: CycleRhythmProps & { width: number }) {
  const energyPoints = useMemo(
    () =>
      curvePoints(cycleLength, settings, width, EXPANDED_HEIGHT, EXPANDED_PAD_X, EXPANDED_PAD_Y, (day) =>
        energyAtCycleDay(day, cycleLength, settings),
      ),
    [cycleLength, settings, width],
  );
  const estrogenPoints = useMemo(
    () =>
      curvePoints(cycleLength, settings, width, EXPANDED_HEIGHT, EXPANDED_PAD_X, EXPANDED_PAD_Y, (day) =>
        estrogenAtCycleDay(day, cycleLength, settings),
      ),
    [cycleLength, settings, width],
  );
  const progesteronePoints = useMemo(
    () =>
      curvePoints(cycleLength, settings, width, EXPANDED_HEIGHT, EXPANDED_PAD_X, EXPANDED_PAD_Y, (day) =>
        progesteroneAtCycleDay(day, cycleLength, settings),
      ),
    [cycleLength, settings, width],
  );
  const todayDay = wrappedCycleDay(cycleDay, cycleLength);
  const today = energyPoints[todayDay - 1] ?? energyPoints[0];
  const labelWidth = language === 'uk' ? 72 : 44;
  const labelLeft = Math.max(0, Math.min(width - labelWidth, today.x - labelWidth / 2));

  return (
    <View style={[styles.expandedChartWrap, { width }]}>
      <Svg width={width} height={EXPANDED_HEIGHT}>
        <Path
          d={smoothPath(estrogenPoints)}
          stroke={theme.estrogen}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={0.95}
        />
        <Path
          d={smoothPath(progesteronePoints)}
          stroke={theme.progesterone}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={0.95}
        />
        <Path
          d={smoothPath(energyPoints)}
          stroke={theme.teal}
          strokeWidth={2.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Circle
          cx={today.x}
          cy={today.y}
          r={6}
          fill={theme.teal}
          stroke="#FFFFFF"
          strokeWidth={2}
        />
      </Svg>
      <Text
        style={[
          styles.todayLabel,
          styles.expandedTodayLabel,
          {
            color: theme.teal,
            left: labelLeft,
            top: Math.max(0, today.y - 20),
            width: labelWidth,
          },
        ]}
      >
        {t(language, 'rhythmToday')}
      </Text>
    </View>
  );
}

export function CycleRhythm({
  cycleDay,
  cycleLength,
  settings,
  theme,
  language,
}: CycleRhythmProps) {
  const [expanded, setExpanded] = useState(false);
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = Math.max(240, windowWidth - 64);

  return (
    <>
      <Pressable
        onPress={() => setExpanded(true)}
        accessibilityRole="button"
        accessibilityLabel={`${t(language, 'cycleRhythm')}. ${t(language, 'rhythmToday')}`}
        accessibilityHint={t(language, 'rhythmExpandHint')}
        hitSlop={8}
      >
        <CompactChart
          cycleDay={cycleDay}
          cycleLength={cycleLength}
          settings={settings}
          theme={theme}
          language={language}
        />
      </Pressable>

      <Modal
        visible={expanded}
        transparent
        animationType="fade"
        onRequestClose={() => setExpanded(false)}
      >
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setExpanded(false)} />
          <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.sheetMark, { backgroundColor: theme.accent }]} />
            <Text style={[styles.sheetTitle, { color: theme.ink }]}>
              {t(language, 'rhythmExpandedTitle')}
            </Text>
            <Text style={[styles.sheetMeta, { color: theme.muted }]}>
              {t(language, 'rhythmExpandedDesc')}
            </Text>

            <ExpandedChart
              cycleDay={cycleDay}
              cycleLength={cycleLength}
              settings={settings}
              theme={theme}
              language={language}
              width={chartWidth}
            />

            <View style={styles.legend}>
              <LegendDot color={theme.teal} label={t(language, 'rhythmEnergy')} ink={theme.ink} />
              <LegendDot color={theme.estrogen} label={t(language, 'rhythmEstrogen')} ink={theme.ink} />
              <LegendDot
                color={theme.progesterone}
                label={t(language, 'rhythmProgesterone')}
                ink={theme.ink}
              />
            </View>

            <Text style={[styles.sheetNote, { color: theme.muted }]}>
              {t(language, 'rhythmHormoneNote')}
            </Text>

            <Pressable
              onPress={() => setExpanded(false)}
              style={[styles.closeButton, { backgroundColor: theme.background, borderColor: theme.border }]}
            >
              <Text style={[styles.closeButtonText, { color: theme.ink }]}>
                {t(language, 'rhythmClose')}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  compactWrap: {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
  },
  todayLabel: {
    position: 'absolute',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  expandedTodayLabel: {
    fontSize: 12,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  sheet: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 10,
  },
  sheetMark: {
    width: 28,
    height: 4,
    borderRadius: 2,
    marginBottom: 2,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  sheetMeta: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  expandedChartWrap: {
    height: EXPANDED_HEIGHT,
    alignSelf: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  sheetNote: {
    fontSize: 12,
    lineHeight: 17,
  },
  closeButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 4,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
