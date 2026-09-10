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

function TrialShell({
  theme,
  badge,
  children,
}: {
  theme: Theme;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.accentSoft,
          borderColor: theme.accent,
          shadowColor: theme.accent,
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
        <Pressable
          onPress={onPrimary}
          style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
          accessibilityRole="button"
        >
          <Text style={styles.primaryBtnText}>{t(language, 'firstCycleTrialContinueFree')}</Text>
        </Pressable>
        <Pressable onPress={onSecondary} hitSlop={8} accessibilityRole="button">
          <Text style={[styles.secondaryLink, { color: theme.muted }]}>
            {t(language, 'firstCycleTrialSeePlus')}
          </Text>
        </Pressable>
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
        <Pressable
          onPress={onPrimary}
          style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
          accessibilityRole="button"
        >
          <Text style={styles.primaryBtnText}>{t(language, 'firstCycleTrialSeePlus')}</Text>
        </Pressable>
        <Pressable onPress={onSecondary} hitSlop={8} accessibilityRole="button">
          <Text style={[styles.secondaryLink, { color: theme.muted }]}>
            {t(language, 'firstCycleTrialMaybeLater')}
          </Text>
        </Pressable>
      </TrialShell>
    );
  }

  return (
    <TrialShell theme={theme}>
      <Text style={[styles.title, { color: theme.ink }]}>
        {t(language, 'firstCycleTrialEndedTitle')}
      </Text>
      <Text style={[styles.body, { color: theme.ink }]}>
        {t(language, 'firstCycleTrialEndedBody')}
      </Text>
      <Pressable
        onPress={onPrimary}
        style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
        accessibilityRole="button"
      >
        <Text style={styles.primaryBtnText}>{t(language, 'firstCycleTrialSeeRhythmaPlus')}</Text>
      </Pressable>
      <Pressable onPress={onSecondary} hitSlop={8} accessibilityRole="button">
        <Text style={[styles.secondaryLink, { color: theme.muted }]}>
          {t(language, 'firstCycleTrialContinueWithFree')}
        </Text>
      </Pressable>
    </TrialShell>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
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
  primaryBtn: {
    borderRadius: radius.control,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    paddingVertical: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryLink: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    textDecorationLine: 'underline',
    paddingVertical: 2,
  },
});
