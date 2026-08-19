import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Language } from './dates';
import type { Theme } from './theme';
import { t } from './i18n';
import type { IAPStatus } from './useIAPPlus';

type PaywallProps = {
  visible: boolean;
  theme: Theme;
  language: Language;
  status: IAPStatus;
  price: string | null;
  error: string | null;
  onPurchase: () => void;
  onRestore: () => void;
  onClose: () => void;
};

const FEATURES: Array<keyof ReturnType<typeof buildFeatures>> = [
  'paywallFeatureCalendar',
  'paywallFeatureRecommendations',
  'paywallFeaturePhaseTips',
  'paywallFeatureEnergyCurve',
];

function buildFeatures(lang: Language) {
  return {
    paywallFeatureCalendar: t(lang, 'paywallFeatureCalendar'),
    paywallFeatureRecommendations: t(lang, 'paywallFeatureRecommendations'),
    paywallFeaturePhaseTips: t(lang, 'paywallFeaturePhaseTips'),
    paywallFeatureEnergyCurve: t(lang, 'paywallFeatureEnergyCurve'),
  };
}

export function Paywall({ visible, theme, language, status, price, error, onPurchase, onRestore, onClose }: PaywallProps) {
  const busy = status === 'purchasing' || status === 'restoring';
  const features = buildFeatures(language);
  const btnLabel =
    status === 'purchasing'
      ? t(language, 'purchasingPlus')
      : status === 'restoring'
        ? t(language, 'restoringPlus')
        : price
          ? `${t(language, 'getPlus')} · ${price}`
          : t(language, 'getPlus');

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.sheet, { backgroundColor: theme.background }]}>
        {/* Close button */}
        <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
          <View style={[styles.closeCircle, { backgroundColor: theme.card }]}>
            <Text style={[styles.closeX, { color: theme.muted }]}>✕</Text>
          </View>
        </Pressable>

        {/* Icon + title */}
        <View style={[styles.iconWrap, { backgroundColor: theme.accentSoft }]}>
          <Text style={styles.iconStar}>✦</Text>
        </View>
        <Text style={[styles.title, { color: theme.ink }]}>{t(language, 'paywallTitle')}</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>{t(language, 'paywallSubtitle')}</Text>

        {/* Feature chips */}
        <View style={styles.features}>
          {FEATURES.map((key) => (
            <View key={key} style={styles.featureRow}>
              <Text style={[styles.check, { color: theme.accent }]}>✓</Text>
              <Text style={[styles.featureLabel, { color: theme.ink }]}>{features[key]}</Text>
            </View>
          ))}
        </View>

        {/* Error */}
        {status === 'error' && error ? (
          <Text style={[styles.errorText, { color: theme.accent }]}>{error}</Text>
        ) : null}

        {/* CTA */}
        <Pressable
          style={[styles.cta, { backgroundColor: theme.accent }, busy && styles.ctaBusy]}
          onPress={onPurchase}
          disabled={busy}
        >
          {status === 'purchasing' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>{btnLabel}</Text>
          )}
        </Pressable>

        <Text style={[styles.lifetime, { color: theme.muted }]}>{t(language, 'paywallLifetime')}</Text>

        {/* Restore */}
        <Pressable onPress={onRestore} disabled={busy} hitSlop={12}>
          <Text style={[styles.restore, { color: theme.muted }]}>
            {status === 'restoring' ? t(language, 'restoringPlus') : t(language, 'restorePurchase')}
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 28,
  },
  closeBtn: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeX: {
    fontSize: 14,
    fontWeight: '600',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconStar: {
    fontSize: 28,
    color: '#E91E8C',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
  },
  features: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(233,30,140,0.08)',
  },
  check: {
    fontSize: 13,
    fontWeight: '700',
  },
  featureLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  cta: {
    alignSelf: 'stretch',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaBusy: {
    opacity: 0.7,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lifetime: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  restore: {
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
