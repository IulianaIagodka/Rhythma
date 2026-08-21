import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { CalendarItem } from './calendar';
import { radius, type Theme } from './theme';

type ConfirmDialogProps = {
  visible: boolean;
  theme: Theme;
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  destructive?: boolean;
  cycleLine?: string;
  ovulationLine?: string;
  eventsLabel?: string;
  events?: CalendarItem[];
  emptyEventsLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  visible,
  theme,
  title,
  message,
  cancelLabel,
  confirmLabel,
  cycleLine,
  ovulationLine,
  eventsLabel,
  events,
  emptyEventsLabel,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const showEvents = eventsLabel != null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.ink }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.muted }]}>{message}</Text>
          {cycleLine ? (
            <Text style={[styles.cycleLine, { color: theme.accent }]}>{cycleLine}</Text>
          ) : null}
          {ovulationLine ? (
            <Text style={[styles.ovulationLine, { color: theme.teal }]}>{ovulationLine}</Text>
          ) : null}
          {showEvents ? (
            <View style={styles.eventsBlock}>
              <Text style={[styles.sectionLabel, { color: theme.muted }]}>{eventsLabel}</Text>
              {events?.length ? (
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
            </View>
          ) : null}
          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={[styles.button, { backgroundColor: theme.background, borderColor: theme.border }]}
            >
              <Text style={[styles.buttonText, { color: theme.muted }]}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={[
                styles.button,
                styles.confirm,
                {
                  backgroundColor: theme.accent,
                  shadowColor: theme.accent,
                },
              ]}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>{confirmLabel}</Text>
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
    borderRadius: radius.card,
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
  message: {
    fontSize: 15,
    lineHeight: 22,
  },
  cycleLine: {
    fontSize: 16,
    fontWeight: '600',
  },
  ovulationLine: {
    fontSize: 15,
    fontWeight: '600',
  },
  eventsBlock: {
    gap: 6,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
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
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  confirm: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
