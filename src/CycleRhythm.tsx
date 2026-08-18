import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { capacityForPhase } from './activity';
import {
  energyAtCycleDay,
  nextRhythmMarker,
  phaseIdForCycleDay,
  rhythmEnergyKind,
  wrappedCycleDay,
  type PhaseId,
  type Settings,
} from './cycle';
import { t, type Language } from './i18n';
import type { Theme } from './theme';

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

function energyCopy(kind: ReturnType<typeof rhythmEnergyKind>, language: Language): string {
  if (kind === 'low') return t(language, 'rhythmEnergyLow');
  if (kind === 'rising') return t(language, 'rhythmEnergyRising');
  if (kind === 'peak') return t(language, 'rhythmEnergyPeak');
  return t(language, 'rhythmEnergyEasing');
}

export function CycleRhythm({
  cycleDay,
  cycleLength,
  settings,
  theme,
  language,
}: CycleRhythmProps) {
  const todayDay = wrappedCycleDay(cycleDay, cycleLength);
  const [previewDay, setPreviewDay] = useState<number | null>(null);
  const activeDay = previewDay ?? todayDay;

  const samples = useMemo(
    () =>
      Array.from({ length: cycleLength }, (_, index) => {
        const day = index + 1;
        const phase = phaseIdForCycleDay(day, cycleLength, settings);
        return {
          day,
          phase,
          energy: energyAtCycleDay(day, cycleLength, settings),
        };
      }),
    [cycleLength, settings],
  );

  const activePhase = phaseIdForCycleDay(activeDay, cycleLength, settings);
  const marker = nextRhythmMarker(activeDay, cycleLength, settings);
  const phaseLabel = capacityForPhase(activePhase, language).label;
  const forecast = marker
    ? marker.kind === 'period'
      ? marker.days === 0
        ? t(language, 'nextToday')
        : t(language, 'nextIn', { days: marker.days })
      : t(language, 'rhythmNextPhase', {
          phase: capacityForPhase(marker.phase, language).label,
          days: marker.days,
        })
    : null;

  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.ink }]}>{t(language, 'cycleRhythm')}</Text>
        {previewDay == null || previewDay === todayDay ? (
          <Text style={[styles.tag, { color: theme.teal }]}>{t(language, 'rhythmToday')}</Text>
        ) : (
          <Text style={[styles.tag, { color: theme.muted }]}>
            {t(language, 'rhythmPreviewDay', { day: previewDay })}
          </Text>
        )}
      </View>

      <View style={styles.chart} accessibilityLabel={t(language, 'cycleRhythm')}>
        {samples.map((sample) => {
          const isToday = sample.day === todayDay;
          const isActive = sample.day === activeDay;
          const height = 8 + sample.energy * 36;
          return (
            <Pressable
              key={sample.day}
              onPress={() => {
                void Haptics.selectionAsync();
                setPreviewDay(sample.day === todayDay ? null : sample.day);
              }}
              hitSlop={4}
              style={styles.barHit}
              accessibilityLabel={`${t(language, 'rhythmPreviewDay', { day: sample.day })}`}
            >
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: isToday ? '#FFFFFF' : 'transparent',
                    borderColor: isToday ? theme.teal : isActive ? theme.ink : 'transparent',
                  },
                ]}
              />
              <View
                style={[
                  styles.bar,
                  {
                    height,
                    backgroundColor: phaseColor(sample.phase, theme),
                    opacity: isActive || isToday ? 1 : 0.72,
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.phase, { color: theme.accent }]}>{phaseLabel}</Text>
      {forecast ? <Text style={[styles.meta, { color: theme.muted }]}>{forecast}</Text> : null}
      <Text style={[styles.meta, { color: theme.muted }]}>
        {energyCopy(rhythmEnergyKind(activePhase), language)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  tag: {
    fontSize: 13,
    fontWeight: '600',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 56,
    gap: 1,
    marginTop: 4,
    marginBottom: 8,
  },
  barHit: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    marginBottom: 3,
  },
  bar: {
    width: '100%',
    borderRadius: 3,
  },
  phase: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  meta: {
    fontSize: 14,
    lineHeight: 20,
  },
});
