import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { t, type Language } from './i18n';
import { sourceTitle, sourcesForTopic, allSourceTopics, type SourceTopic } from './sources';
import type { Theme } from './theme';

type SourcesSheetProps = {
  visible: boolean;
  topic: SourceTopic | 'all';
  theme: Theme;
  language: Language;
  onClose: () => void;
};

export function SourcesSheet({ visible, topic, theme, language, onClose }: SourcesSheetProps) {
  const topics = topic === 'all' ? allSourceTopics : [topic];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t(language, 'sourcesClose')} />
        <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.ink }]}>{t(language, 'sourcesTitle')}</Text>
          {topic !== 'all' ? (
            <Text style={[styles.subtitle, { color: theme.muted }]}>{t(language, `sourcesTopic_${topic}`)}</Text>
          ) : null}
          <Text style={[styles.disclaimer, { color: theme.muted }]}>{t(language, 'sourcesDisclaimer')}</Text>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {topics.map((sectionTopic) => (
              <View key={sectionTopic}>
                {topic === 'all' ? (
                  <Text style={[styles.sectionHeading, { color: theme.ink }]}>
                    {t(language, `sourcesTopic_${sectionTopic}`)}
                  </Text>
                ) : null}
                {sourcesForTopic(sectionTopic).map((source, index) => (
                  <Pressable
                    key={source.id}
                    onPress={() => Linking.openURL(source.url).catch(() => {})}
                    style={[
                      styles.sourceRow,
                      index > 0 || topic === 'all' ? { borderTopColor: theme.border, borderTopWidth: 1 } : null,
                    ]}
                    accessibilityRole="link"
                  >
                    <Text style={[styles.sourceTitle, { color: theme.teal }]}>{sourceTitle(source, language)}</Text>
                    <Text style={[styles.sourceUrl, { color: theme.muted }]} numberOfLines={2}>
                      {source.url}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ))}
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
    maxHeight: '80%',
    borderRadius: 0,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 17,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  list: {
    maxHeight: 320,
  },
  listContent: {
    paddingVertical: 4,
  },
  sourceRow: {
    paddingVertical: 12,
    gap: 4,
  },
  sourceTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  sourceUrl: {
    fontSize: 11,
    lineHeight: 15,
  },
  closeButton: {
    minHeight: 44,
    borderRadius: 0,
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
});
