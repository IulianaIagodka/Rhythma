import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { t, type Language } from './i18n';
import { firstCycleTrialEndingTitleKind } from './firstCycleTrial';
import { radius, type Theme } from './theme';

export type FirstCycleTrialCardKind = 'started' | 'ending' | 'ended';

type FirstCycleTrialCardProps = {
  kind: FirstCycleTrialCardKind;
  theme: Theme;
  language: Language;
  /** Days until next period — used for the ending title. */
  daysLeft?: number | null;
  onPrimary: () => void;
  onSecondary: () => void;
};

function endingTitle(language: Language, daysLeft: number | null | undefined): string {
  switch (firstCycleTrialEndingTitleKind(daysLeft)) {
    case 'today':
      return t(language, 'firstCycleTrialEndingTitleToday');
    case 'one':
      return t(language, 'firstCycleTrialEndingTitleOne');
    case 'days':
      return t(language, 'firstCycleTrialEndingTitleDays', { days: daysLeft ?? 0 });
    case 'soon':
      return t(language, 'firstCycleTrialEndingTitleSoon');
  }
}

/** Mostly dark card with a light magenta wash — calmer than accentSoft. */
function calmTrialBackground(theme: Theme): string {
  return theme.background === '#0A0A0A' ? '#161218' : '#F7F0F4';
}

function TrialShell({
  theme,
  badge,
  calm,
  children,
}: {
  theme: Theme;
  badge?: string;
  calm?: boolean;
  children: ReactNode;
}) {
  return (
    <View
      style={[
        styles.card,
        calm ? styles.cardCalm : null,
        {
          backgroundColor: calm ? calmTrialBackground(theme) : theme.accentSoft,
          borderColor: theme.accent,
        },
      ]}
    >
      {badge ? (
        <View style={[styles.badge, { backgroundColor: theme.accent }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      {children}
    </View>
  );
}

function PrimaryButton({
  theme,
  label,
  onPress,
}: {
  theme: Theme;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
      accessibilityRole="button"
    >
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

function GhostButton({
  theme,
  label,
  onPress,
}: {
  theme: Theme;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.ghostBtn,
        {
          borderColor: theme.border,
          backgroundColor: theme.background === '#0A0A0A' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
        },
      ]}
      accessibilityRole="button"
    >
      <Text style={[styles.ghostBtnText, { color: theme.ink }]}>{label}</Text>
    </Pressable>
  );
}

export function FirstCycleTrialCard({
  kind,
  theme,
  language,
  daysLeft,
  onPrimary,
  onSecondary,
}: FirstCycleTrialCardProps) {
  if (kind === 'started') {
    return (
      <TrialShell theme={theme} badge={t(language, 'firstCycleTrialBadge')}>
        <Text style={[styles.title, { color: theme.ink }]}>
          {t(language, 'firstCycleTrialStartedTitle')}
        </Text>
        <Text style={[styles.body, { color: theme.ink }]}>
          {t(language, 'firstCycleTrialStartedBody')}
        </Text>
        <Text style={[styles.secondary, { color: theme.muted }]}>
          {t(language, 'firstCycleTrialStartedSecondary')}
        </Text>
        <View style={styles.actions}>
          <PrimaryButton
            theme={theme}
            label={t(language, 'firstCycleTrialContinueFree')}
            onPress={onPrimary}
          />
          <GhostButton
            theme={theme}
            label={t(language, 'firstCycleTrialSeePlus')}
            onPress={onSecondary}
          />
        </View>
      </TrialShell>
    );
  }

  if (kind === 'ending') {
    return (
      <TrialShell theme={theme} badge={t(language, 'firstCycleTrialBadge')}>
        <Text style={[styles.title, { color: theme.ink }]}>
          {endingTitle(language, daysLeft)}
        </Text>
        <Text style={[styles.body, { color: theme.ink }]}>
          {t(language, 'firstCycleTrialEndingBody')}
        </Text>
        <View style={styles.actions}>
          <PrimaryButton
            theme={theme}
            label={t(language, 'firstCycleTrialSeePlus')}
            onPress={onPrimary}
          />
          <GhostButton
            theme={theme}
            label={t(language, 'firstCycleTrialMaybeLater')}
            onPress={onSecondary}
          />
        </View>
      </TrialShell>
    );
  }

  return (
    <TrialShell theme={theme} calm>
      <Text style={[styles.title, { color: theme.ink }]}>
        {t(language, 'firstCycleTrialEndedTitle')}
      </Text>
      <Text style={[styles.body, { color: theme.muted }]}>
        {t(language, 'firstCycleTrialEndedBody')}
      </Text>
      <View style={styles.actions}>
        <PrimaryButton
          theme={theme}
          label={t(language, 'firstCycleTrialSeeRhythmaPlus')}
          onPress={onPrimary}
        />
        <GhostButton
          theme={theme}
          label={t(language, 'firstCycleTrialContinueWithFree')}
          onPress={onSecondary}
        />
      </View>
    </TrialShell>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    padding: 18,
    gap: 10,
    borderWidth: 1,
  },
  cardCalm: {
    // No outer glow — border alone keeps the card distinct.
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
  secondary: {
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    gap: 8,
    marginTop: 4,
  },
  primaryBtn: {
    borderRadius: radius.control,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  ghostBtn: {
    borderRadius: radius.control,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
  },
  ghostBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
