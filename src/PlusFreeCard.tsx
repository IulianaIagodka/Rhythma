import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isIapPlusEnabled } from './access';
import { t, type Language } from './i18n';
import { useIAPPlus } from './useIAPPlus';

type Theme = {
  card: string;
  ink: string;
  muted: string;
  accent: string;
  accentSoft: string;
};

type PlusFreeCardProps = {
  theme: Theme;
  language: Language;
  onUnlock: () => void;
};

const FEATURE_KEYS = ['paywallFeatureRecommendations', 'paywallFeaturePhaseTips', 'paywallFeatureEnergyCurve'] as const;

function PlusCardShell({
  theme,
  language,
  children,
}: {
  theme: Theme;
  language: Language;
  children: ReactNode;
}) {
  return (
    <View style={[styles.paywallInline, { backgroundColor: theme.card }]}>
      <View style={styles.paywallInlineHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.paywallCardTitle, { color: theme.ink }]}>{t(language, 'paywallTitle')}</Text>
          <Text style={[styles.paywallCardSub, { color: theme.muted }]}>{t(language, 'paywallSubtitle')}</Text>
        </View>
      </View>
      <View style={styles.paywallInlineFeatures}>
        {FEATURE_KEYS.map((key) => (
          <View key={key} style={styles.paywallInlineFeatureRow}>
            <Text style={[styles.paywallInlineCheck, { color: theme.accent }]}>✓</Text>
            <Text style={[styles.paywallInlineFeatureLabel, { color: theme.ink }]}>{t(language, key)}</Text>
          </View>
        ))}
      </View>
      {children}
    </View>
  );
}

function PlusComingSoonCard({ theme, language }: PlusFreeCardProps) {
  return (
    <PlusCardShell theme={theme} language={language}>
      <View style={[styles.paywallComingSoonBadge, { backgroundColor: theme.accentSoft }]}>
        <Text style={[styles.paywallComingSoonText, { color: theme.accent }]}>{t(language, 'paywallComingSoon')}</Text>
      </View>
    </PlusCardShell>
  );
}

function PlusPurchaseCard({ theme, language, onUnlock }: PlusFreeCardProps) {
  const iap = useIAPPlus({ onUnlock });

  return (
    <PlusCardShell theme={theme} language={language}>
      {iap.status === 'error' && iap.error ? (
        <Text style={[styles.paywallInlineError, { color: theme.accent }]}>{iap.error}</Text>
      ) : null}
      <Pressable
        style={[
          styles.paywallInlineBtn,
          { backgroundColor: theme.accent },
          (iap.status === 'purchasing' || iap.status === 'restoring') && { opacity: 0.7 },
        ]}
        onPress={iap.purchase}
        disabled={iap.status === 'purchasing' || iap.status === 'restoring'}
      >
        <Text style={styles.paywallInlineBtnText}>
          {iap.status === 'purchasing'
            ? t(language, 'purchasingPlus')
            : iap.price
              ? `${t(language, 'getPlus')} · ${iap.price}`
              : t(language, 'getPlus')}
        </Text>
      </Pressable>
      <Text style={[styles.paywallInlineLifetime, { color: theme.muted }]}>{t(language, 'paywallLifetime')}</Text>
      <Pressable
        onPress={iap.restore}
        disabled={iap.status === 'purchasing' || iap.status === 'restoring'}
        hitSlop={12}
      >
        <Text style={[styles.paywallInlineRestore, { color: theme.muted }]}>
          {iap.status === 'restoring' ? t(language, 'restoringPlus') : t(language, 'restorePurchase')}
        </Text>
      </Pressable>
    </PlusCardShell>
  );
}

export function PlusFreeCard(props: PlusFreeCardProps) {
  if (isIapPlusEnabled()) return <PlusPurchaseCard {...props} />;
  return <PlusComingSoonCard {...props} />;
}

const styles = StyleSheet.create({
  paywallInline: {
    borderRadius: 20,
    padding: 20,
    gap: 14,
    marginBottom: 12,
  },
  paywallInlineHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  paywallCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  paywallCardSub: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  paywallInlineFeatures: {
    gap: 8,
  },
  paywallInlineFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paywallInlineCheck: {
    fontSize: 14,
    fontWeight: '700',
  },
  paywallInlineFeatureLabel: {
    fontSize: 15,
    flex: 1,
  },
  paywallInlineError: {
    fontSize: 13,
  },
  paywallInlineBtn: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  paywallInlineBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  paywallInlineLifetime: {
    fontSize: 13,
    textAlign: 'center',
  },
  paywallInlineRestore: {
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  paywallComingSoonBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  paywallComingSoonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
