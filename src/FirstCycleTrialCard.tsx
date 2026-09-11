import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { t, type Language } from './i18n';
import { firstCycleTrialEndingTitleKind } from './firstCycleTrial';
import { radius, type Theme } from './theme';

export type FirstCycleTrialCardKind = 'ending';

type FirstCycleTrialCardProps = {
  kind?: FirstCycleTrialCardKind;
  theme: Theme;
  language: Language;
  /** Days until next period — used for the ending title. */
  daysLeft?: number | null;
  onPrimary: () => void;
  onSecondary: () => void;
};

type FirstCycleTrialEndedModalProps = {
  visible: boolean;
  theme: Theme;
  language: Language;
  onSeePlus: () => void;
  onContinueFree: () => void;
};

type FirstCycleTrialStartedModalProps = {
  visible: boolean;
  theme: Theme;
  language: Language;
  onContinueFree: () => void;
  onSeePlus: () => void;
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

/** Blocking modal after the first period start — cannot miss the free-cycle offer. */
export function FirstCycleTrialStartedModal({
  visible,
  theme,
  language,
  onContinueFree,
  onSeePlus,
}: FirstCycleTrialStartedModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.modalOverlay} accessibilityViewIsModal>
        <View style={styles.modalCardWrap}>
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
                onPress={onContinueFree}
              />
              <GhostButton
                theme={theme}
                label={t(language, 'firstCycleTrialSeePlus')}
                onPress={onSeePlus}
              />
            </View>
          </TrialShell>
        </View>
      </View>
    </Modal>
  );
}

/** Blocking modal — UI behind is not tappable until See Plus or Continue with free. */
export function FirstCycleTrialEndedModal({
  visible,
  theme,
  language,
  onSeePlus,
  onContinueFree,
}: FirstCycleTrialEndedModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // Android back must not dismiss without an explicit choice.
      onRequestClose={() => {}}
    >
      <View style={styles.modalOverlay} accessibilityViewIsModal>
        <View style={styles.modalCardWrap}>
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
                onPress={onSeePlus}
              />
              <GhostButton
                theme={theme}
                label={t(language, 'firstCycleTrialContinueWithFree')}
                onPress={onContinueFree}
              />
            </View>
          </TrialShell>
        </View>
      </View>
    </Modal>
  );
}

export function FirstCycleTrialCard({
  theme,
  language,
  daysLeft,
  onPrimary,
  onSecondary,
}: FirstCycleTrialCardProps) {
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

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCardWrap: {
    width: '100%',
  },
  card: {
    borderRadius: radius.card,
    padding: 18,
    gap: 10,
    borderWidth: 1,
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
