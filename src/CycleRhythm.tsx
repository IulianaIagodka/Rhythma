import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import {
  energyAtCycleDay,
  phaseIdForCycleDay,
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

function curvePoints(cycleLength: number, settings: Settings): Point[] {
  const innerWidth = CHART_WIDTH - PAD_X * 2;
  const innerHeight = CHART_HEIGHT - PAD_Y * 2;
  return Array.from({ length: cycleLength }, (_, index) => {
    const day = index + 1;
    const energy = energyAtCycleDay(day, cycleLength, settings);
    return {
      day,
      phase: phaseIdForCycleDay(day, cycleLength, settings),
      x: PAD_X + ((day - 1) / Math.max(1, cycleLength - 1)) * innerWidth,
      y: PAD_Y + (1 - energy) * innerHeight,
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

export function CycleRhythm({
  cycleDay,
  cycleLength,
  settings,
  theme,
  language,
}: CycleRhythmProps) {
  const points = useMemo(() => curvePoints(cycleLength, settings), [cycleLength, settings]);
  const todayDay = wrappedCycleDay(cycleDay, cycleLength);
  const today = points[todayDay - 1] ?? points[0];
  const segments = useMemo(() => phaseSegments(points), [points]);
  const labelWidth = language === 'uk' ? 72 : 44;
  const labelLeft = Math.max(0, Math.min(CHART_WIDTH - labelWidth, today.x - labelWidth / 2));

  return (
    <View
      style={styles.wrap}
      accessibilityLabel={`${t(language, 'cycleRhythm')}. ${t(language, 'rhythmToday')}`}
    >
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

const styles = StyleSheet.create({
  wrap: {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
  },
  todayLabel: {
    position: 'absolute',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});
