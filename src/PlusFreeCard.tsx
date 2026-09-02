import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { isIapPlusEnabled } from './access';
import { t, type Language } from './i18n';
import { radius } from './theme';
import { useIAPPlus } from './useIAPPlus';

type Theme = {
  card: string;
  ink: string;
  muted: string;
  accent: string;
  accentSoft: string;
  border: string;
  teal: string;
};

type PlusFreeCardProps = {
  theme: Theme;
  language: Language;
  onUnlock: () => void;
};

const FEATURE_KEYS = ['paywallFeatureRecommendations', 'paywallFeaturePhaseTips', 'paywallFeatureEnergyCurve'] as const;

function FeatureList({ theme, language }: { theme: Theme; language: Language }) {
  return (
    <View style={styles.paywallInlineFeatures}>
      {FEATURE_KEYS.map((key) => (
        <View key={key} style={styles.paywallInlineFeatureRow}>
          <Text style={[styles.paywallInlineCheck, { color: theme.accent }]}>✓</Text>
          <Text style={[styles.paywallInlineFeatureLabel, { color: theme.ink }]}>{t(language, key)}</Text>
        </View>
      ))}
    </View>
  );
}

function PlusComingSoonCard({ theme, language }: PlusFreeCardProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  return (
    <View
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize({ width, height });
      }}
      style={[
        styles.paywallInline,
        styles.plusAccentCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.accent,
          shadowColor: theme.accent,
        },
      ]}
    >
      {size.width > 0 && size.height > 0 ? (
        <Svg
          width={size.width}
          height={size.height}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Defs>
            <LinearGradient id="plusMagentaGlow" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={theme.accent} stopOpacity="0.14" />
              <Stop offset="0.45" stopColor={theme.accent} stopOpacity="0.06" />
              <Stop offset="1" stopColor={theme.accent} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect
            x={0}
            y={0}
            width={size.width}
            height={size.height}
            rx={radius.card}
            fill="url(#plusMagentaGlow)"
          />
        </Svg>
      ) : null}

      <View style={styles.paywallInlineHeader}>
        <View style={styles.paywallTitleBlock}>
          <Text style={[styles.paywallCardTitle, { color: theme.ink }]}>{t(language, 'paywallTitle')}</Text>
          <Text style={[styles.paywallCardSub, { color: theme.muted }]}>{t(language, 'paywallSubtitle')}</Text>
        </View>
        <View
          style={[
            styles.comingSoonPill,
            { backgroundColor: theme.accentSoft, borderColor: theme.accent },
          ]}
          accessibilityRole="text"
        >
          <Text style={[styles.comingSoonPillText, { color: theme.accent }]}>
            {t(language, 'paywallComingSoon')}
          </Text>
        </View>
      </View>

      <FeatureList theme={theme} language={language} />
    </View>
  );
}

function PlusPurchaseCard({ theme, language, onUnlock }: PlusFreeCardProps) {
  const iap = useIAPPlus({ onUnlock });

  return (
    <View style={[styles.paywallInline, { backgroundColor: theme.card }]}>
      <View style={styles.paywallInlineHeader}>
        <View style={styles.paywallTitleBlock}>
          <Text style={[styles.paywallCardTitle, { color: theme.ink }]}>{t(language, 'paywallTitle')}</Text>
          <Text style={[styles.paywallCardSub, { color: theme.muted }]}>{t(language, 'paywallSubtitle')}</Text>
        </View>
      </View>
      <FeatureList theme={theme} language={language} />
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
    </View>
  );
}

export function PlusFreeCard(props: PlusFreeCardProps) {
  if (isIapPlusEnabled()) return <PlusPurchaseCard {...props} />;
  return <PlusComingSoonCard {...props} />;
}

const styles = StyleSheet.create({
  paywallInline: {
    borderRadius: radius.card,
    padding: 20,
    gap: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  plusAccentCard: {
    borderWidth: 1,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  paywallInlineHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  paywallTitleBlock: {
    flex: 1,
    minWidth: 0,
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
  comingSoonPill: {
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  comingSoonPillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
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
    borderRadius: radius.control,
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
});
