import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { CalendarItem } from './calendar';
import type { Theme } from './theme';

type DayDetailSheetProps = {
  visible: boolean;
  theme: Theme;
  title: string;
  cycleLine: string;
  eventsLabel: string;
  events: CalendarItem[];
  emptyEventsLabel: string;
  periodActionLabel: string;
  closeLabel: string;
  onClose: () => void;
  onPeriodAction: () => void;
};

export function DayDetailSheet({
  visible,
  theme,
  title,
  cycleLine,
  eventsLabel,
  events,
  emptyEventsLabel,
  periodActionLabel,
  closeLabel,
  onClose,
  onPeriodAction,
}: DayDetailSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.ink }]}>{title}</Text>
          <Text style={[styles.cycleLine, { color: theme.teal }]}>{cycleLine}</Text>

          <Text style={[styles.sectionLabel, { color: theme.muted }]}>{eventsLabel}</Text>
          {events.length ? (
            <View style={styles.eventList}>
              {events.map((item) => (
                <Text key={item.id} style={[styles.eventItem, { color: theme.ink }]}>
                  {item.title}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={[styles.empty, { color: theme.muted }]}>{emptyEventsLabel}</Text>
          )}

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={[styles.button, { backgroundColor: theme.background, borderColor: theme.border }]}
            >
              <Text style={[styles.buttonText, { color: theme.muted }]}>{closeLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onPeriodAction}
              style={[styles.button, styles.confirm, { backgroundColor: theme.accent }]}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>{periodActionLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  cycleLine: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  eventList: {
    gap: 6,
  },
  eventItem: {
    fontSize: 15,
    lineHeight: 22,
  },
  empty: {
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 10,
  },
  confirm: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
