import { useEffect, useRef, useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { t, type Language } from './i18n';
import {
  methodologySectionOrder,
  sectionForTopic,
  sourceCite,
  sourceTitle,
  sourcesForSection,
  type MethodologySectionId,
  type SourceTopic,
} from './sources';
import { radius, type Theme } from './theme';

type SourcesSheetProps = {
  visible: boolean;
  topic?: SourceTopic | 'all';
  theme: Theme;
  language: Language;
  onClose: () => void;
};

export function SourcesSheet({
  visible,
  topic = 'all',
  theme,
  language,
  onClose,
}: SourcesSheetProps) {
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Partial<Record<MethodologySectionId, number>>>({});
  const [ready, setReady] = useState(false);
  const focusSection = sectionForTopic(topic);
  const sections = methodologySectionOrder.filter((id) => sourcesForSection(id).length > 0);

  useEffect(() => {
    if (!visible) {
      setReady(false);
      return;
    }
    const timer = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(timer);
  }, [visible, topic]);

  useEffect(() => {
    if (!visible || !ready || focusSection === 'all') return;
    const y = sectionY.current[focusSection];
    if (y == null) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
  }, [visible, ready, focusSection]);

  const onSectionLayout = (id: MethodologySectionId, event: LayoutChangeEvent) => {
    sectionY.current[id] = event.nativeEvent.layout.y;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel={t(language, 'sourcesClose')}
        />
        <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.ink }]}>{t(language, 'sourcesTitle')}</Text>
          <Text style={[styles.intro, { color: theme.ink }]}>{t(language, 'sourcesIntro')}</Text>
          <Text style={[styles.disclaimer, { color: theme.muted }]}>
            {t(language, 'sourcesDisclaimer')}
          </Text>

          <ScrollView
            ref={scrollRef}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {sections.map((sectionId, sectionIndex) => {
              const sources = sourcesForSection(sectionId);
              const focused = focusSection === sectionId;
              return (
                <View
                  key={sectionId}
                  onLayout={(event) => onSectionLayout(sectionId, event)}
                  style={[
                    styles.section,
                    sectionIndex > 0 ? { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth } : null,
                    focused ? { backgroundColor: theme.accentSoft } : null,
                  ]}
                >
                  <Text style={[styles.sectionHeading, { color: theme.ink }]}>
                    {t(language, `sourcesSection_${sectionId}`)}
                  </Text>
                  <Text style={[styles.sectionDesc, { color: theme.muted }]}>
                    {t(language, `sourcesSectionDesc_${sectionId}`)}
                  </Text>
                  <View style={styles.citeList}>
                    {sources.map((source) => (
                      <Pressable
                        key={`${sectionId}-${source.id}`}
                        onPress={() => Linking.openURL(source.url).catch(() => {})}
                        hitSlop={6}
                        accessibilityRole="link"
                        accessibilityLabel={sourceTitle(source, language)}
                      >
                        <Text style={[styles.citeLink, { color: theme.teal }]}>
                          {sourceCite(source, language)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <Pressable
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: theme.background, borderColor: theme.border }]}
          >
            <Text style={[styles.closeButtonText, { color: theme.ink }]}>{t(language, 'sourcesClose')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

type SourcesInfoButtonProps = {
  theme: Theme;
  language: Language;
  onPress: () => void;
  accessibilityLabel?: string;
};

/** Small ⓘ control for contextual methodology deep-links. */
export function SourcesInfoButton({
  theme,
  language,
  onPress,
  accessibilityLabel,
}: SourcesInfoButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? t(language, 'sourcesInfoA11y')}
      style={styles.infoHit}
    >
      <Text style={[styles.infoGlyph, { color: theme.teal }]}>ⓘ</Text>
    </Pressable>
  );
}

type SourcesLinkProps = {
  topic: SourceTopic;
  theme: Theme;
  language: Language;
  onPress: () => void;
};

export function SourcesLink({ theme, language, onPress }: SourcesLinkProps) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button">
      <Text style={[styles.link, { color: theme.teal }]}>{t(language, 'sourcesLink')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  sheet: {
    width: '100%',
    maxHeight: '84%',
    borderRadius: radius.card,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  intro: {
    fontSize: 14,
    lineHeight: 20,
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 17,
  },
  list: {
    maxHeight: 360,
  },
  listContent: {
    paddingBottom: 8,
  },
  section: {
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 6,
    marginHorizontal: -6,
    borderRadius: radius.control,
    gap: 8,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  citeList: {
    gap: 8,
    marginTop: 2,
  },
  citeLink: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  closeButton: {
    minHeight: 44,
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
  link: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  infoHit: {
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoGlyph: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
});
