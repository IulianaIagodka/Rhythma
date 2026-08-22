import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { monotoneCubicPath, monotoneCubicPathRange } from './chartPath';
import {
  energyAtCycleDay,
  energyPercentAtCycleDay,
  estrogenAtCycleDay,
  phaseIdForCycleDay,
  phaseWindows,
  progesteroneAtCycleDay,
  wrappedCycleDay,
  type PhaseId,
  type Settings,
} from './cycle';
import { t, type Language } from './i18n';
import { radius, type Theme } from './theme';

const CHART_WIDTH = 132;
const CHART_HEIGHT = 64;
const PAD_X = 10;
const PAD_Y = 16;
const EXPANDED_HEIGHT = 188;
const EXPANDED_PAD_X = 10;
const EXPANDED_PAD_Y = 18;
const EXPANDED_Y_LABEL_WIDTH = 36;
const EXPANDED_X_LABEL_HEIGHT = 28;

const PHASE_LABEL_KEY: Record<PhaseId, 'rhythmPhaseMenstrual' | 'rhythmPhaseFollicular' | 'rhythmPhaseOvulatory' | 'rhythmPhaseLuteal'> = {
  menstrual: 'rhythmPhaseMenstrual',
  follicular: 'rhythmPhaseFollicular',
  ovulatory: 'rhythmPhaseOvulatory',
  luteal: 'rhythmPhaseLuteal',
};
/** Extra samples between cycle days — denser path for smooth cubic curves. */
const SAMPLES_PER_DAY = 12;

type Point = { x: number; y: number; day: number; phase: PhaseId };

type CycleRhythmProps = {
  cycleDay: number;
  cycleLength: number;
  settings: Settings;
  theme: Theme;
  language: Language;
};

function phaseColor(phase: PhaseId, theme: Theme): string {
  // Compact curve: pink only for period; cyan elsewhere — no violet recommendation tint.
  if (phase === 'menstrual') return theme.period;
  return theme.teal;
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
  const steps = Math.max(2, (cycleLength - 1) * SAMPLES_PER_DAY + 1);
  const points: Point[] = [];

  for (let i = 0; i < steps; i += 1) {
    const dayFloat = 1 + (i / (steps - 1)) * (cycleLength - 1);
    const dayFloor = Math.min(cycleLength, Math.max(1, Math.round(dayFloat)));
    const value = valueAtDay(dayFloat);
    points.push({
      day: dayFloor,
      phase: phaseIdForCycleDay(dayFloor, cycleLength, settings),
      x: padX + ((dayFloat - 1) / Math.max(1, cycleLength - 1)) * innerWidth,
      y: padY + (1 - value) * innerHeight,
    });
  }
  return points;
}

/**
 * Smooth monotone cubic through samples — no Catmull-Rom overshoot on plateaus.
 */
function smoothPathRange(points: Point[], start: number, end: number): string {
  return monotoneCubicPathRange(points, start, end);
}

function smoothPath(points: Point[]): string {
  if (points.length < 2) return '';
  return monotoneCubicPath(points);
}

function phaseSegments(points: Point[]): { phase: PhaseId; start: number; end: number }[] {
  const segments: { phase: PhaseId; start: number; end: number }[] = [];
  for (let i = 0; i < points.length; i += 1) {
    const last = segments[segments.length - 1];
    if (last && last.phase === points[i].phase) {
      last.end = i;
    } else {
      segments.push({ phase: points[i].phase, start: i, end: i });
    }
  }
  return segments.filter((segment) => segment.end > segment.start);
}

function todayPoint(points: Point[], cycleDay: number, cycleLength: number, width: number, padX: number): Point {
  const todayDay = wrappedCycleDay(cycleDay, cycleLength);
  const todayX = padX + ((todayDay - 1) / Math.max(1, cycleLength - 1)) * (width - padX * 2);
  return points.reduce((best, point) =>
    Math.abs(point.x - todayX) < Math.abs(best.x - todayX) ? point : best,
  );
}

/** Small “today” dot with a soft glow halo on the energy curve. */
function TodayGlowDot({
  x,
  y,
  color,
  stroke,
}: {
  x: number;
  y: number;
  color: string;
  stroke: string;
}) {
  return (
    <>
      <Circle cx={x} cy={y} r={7} fill={color} opacity={0.16} />
      <Circle cx={x} cy={y} r={4.5} fill={color} opacity={0.32} />
      <Circle cx={x} cy={y} r={2.6} fill={color} stroke={stroke} strokeWidth={1.4} />
    </>
  );
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
  const today = todayPoint(points, cycleDay, cycleLength, CHART_WIDTH, PAD_X);
  const segments = useMemo(() => phaseSegments(points), [points]);
  const energyPercent = energyPercentAtCycleDay(cycleDay, cycleLength, settings);

  return (
    <View style={styles.compactWrap}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {segments.map((segment) => (
          <Path
            key={`${segment.phase}-${segment.start}`}
            d={smoothPathRange(points, segment.start, segment.end)}
            stroke={phaseColor(segment.phase, theme)}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={segment.phase === 'menstrual' ? 1 : 0.85}
          />
        ))}
        <TodayGlowDot x={today.x} y={today.y} color={theme.teal} stroke={theme.card} />
      </Svg>
      <Text style={[styles.compactPercent, { color: theme.teal }]}>
        {t(language, 'rhythmEnergyPercent', { value: energyPercent })}
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
  const plotWidth = Math.max(160, width - EXPANDED_Y_LABEL_WIDTH);
  const energyPoints = useMemo(
    () =>
      curvePoints(cycleLength, settings, plotWidth, EXPANDED_HEIGHT, EXPANDED_PAD_X, EXPANDED_PAD_Y, (day) =>
        energyAtCycleDay(day, cycleLength, settings),
      ),
    [cycleLength, settings, plotWidth],
  );
  const estrogenPoints = useMemo(
    () =>
      curvePoints(cycleLength, settings, plotWidth, EXPANDED_HEIGHT, EXPANDED_PAD_X, EXPANDED_PAD_Y, (day) =>
        estrogenAtCycleDay(day, cycleLength, settings),
      ),
    [cycleLength, settings, plotWidth],
  );
  const progesteronePoints = useMemo(
    () =>
      curvePoints(cycleLength, settings, plotWidth, EXPANDED_HEIGHT, EXPANDED_PAD_X, EXPANDED_PAD_Y, (day) =>
        progesteroneAtCycleDay(day, cycleLength, settings),
      ),
    [cycleLength, settings, plotWidth],
  );
  const today = todayPoint(energyPoints, cycleDay, cycleLength, plotWidth, EXPANDED_PAD_X);
  const windows = useMemo(() => phaseWindows(cycleLength, settings), [cycleLength, settings]);
  const axisX = EXPANDED_PAD_X;
  const axisYTop = EXPANDED_PAD_Y;
  const axisYBottom = EXPANDED_HEIGHT - EXPANDED_PAD_Y;
  const axisXEnd = plotWidth - EXPANDED_PAD_X;
  const axisColor = theme.faint;

  return (
    <View style={[styles.expandedChartWrap, { width }]}>
      <View style={styles.expandedPlotRow}>
        <View style={[styles.yAxisLabels, { height: EXPANDED_HEIGHT }]}>
          <Text style={[styles.axisLabel, { color: theme.muted }]}>
            {t(language, 'rhythmAxisHigh')}
          </Text>
          <Text style={[styles.axisLabel, { color: theme.muted }]}>
            {t(language, 'rhythmAxisLow')}
          </Text>
        </View>
        <View style={{ width: plotWidth, height: EXPANDED_HEIGHT }}>
          <Svg width={plotWidth} height={EXPANDED_HEIGHT}>
            <Line
              x1={axisX}
              y1={axisYTop}
              x2={axisX}
              y2={axisYBottom}
              stroke={axisColor}
              strokeWidth={1}
            />
            <Line
              x1={axisX}
              y1={axisYBottom}
              x2={axisXEnd}
              y2={axisYBottom}
              stroke={axisColor}
              strokeWidth={1}
            />
            <Path
              d={smoothPath(estrogenPoints)}
              stroke={theme.period}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={0.95}
            />
            <Path
              d={smoothPath(progesteronePoints)}
              stroke={theme.rhythmLuteal}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={0.95}
            />
            <Path
              d={smoothPath(energyPoints)}
              stroke={theme.teal}
              strokeWidth={3.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <TodayGlowDot x={today.x} y={today.y} color={theme.teal} stroke="#FFFFFF" />
          </Svg>
        </View>
      </View>
      <View
        style={[
          styles.xAxisLabels,
          {
            marginLeft: EXPANDED_Y_LABEL_WIDTH + EXPANDED_PAD_X,
            width: plotWidth - EXPANDED_PAD_X * 2,
          },
        ]}
      >
        {windows.map((window) => (
          <View key={`${window.phase}-${window.startDay}`} style={styles.xAxisLabelCell}>
            <Text
              style={[styles.axisLabel, styles.xAxisLabelText, { color: theme.muted }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {t(language, PHASE_LABEL_KEY[window.phase])}
            </Text>
          </View>
        ))}
      </View>
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

  const energyPercent = energyPercentAtCycleDay(cycleDay, cycleLength, settings);

  return (
    <>
      <Pressable
        onPress={() => setExpanded(true)}
        accessibilityRole="button"
        accessibilityLabel={`${t(language, 'cycleRhythm')}. ${t(language, 'rhythmToday')}. ${t(language, 'rhythmEnergyPercent', { value: energyPercent })}`}
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
              <LegendDot color={theme.period} label={t(language, 'rhythmEstrogen')} ink={theme.ink} />
              <LegendDot
                color={theme.rhythmLuteal}
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
    height: CHART_HEIGHT + 18,
    alignItems: 'center',
  },
  compactPercent: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
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
    borderRadius: radius.card,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 10,
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
    alignSelf: 'center',
    gap: 4,
  },
  expandedPlotRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  yAxisLabels: {
    width: EXPANDED_Y_LABEL_WIDTH,
    justifyContent: 'space-between',
    paddingTop: EXPANDED_PAD_Y - 2,
    paddingBottom: EXPANDED_PAD_Y - 6,
    paddingRight: 4,
  },
  xAxisLabels: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: EXPANDED_X_LABEL_HEIGHT,
  },
  xAxisLabelCell: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  xAxisLabelText: {
    textAlign: 'center',
    width: '100%',
  },
  axisLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
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
    borderRadius: radius.control,
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
