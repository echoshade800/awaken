import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { X, Sparkles, Edit2 } from 'lucide-react-native';
import { getGameLabel } from '../lib/interactionOptions';

const PERIOD_LABELS = {
  everyday: 'Every day',
  workday: 'Weekdays',
  weekend: 'Weekends',
  tomorrow: 'Just once',
};

const VOICE_PACKAGE_LABELS = {
  'energetic-girl': 'Energetic Girl 🎀',
  'calm-man': 'Calm Man 🧠',
  'ancient-style': 'Ancient Style 🌙',
  'cat': 'Cat 🐱',
};

export default function AlarmSummaryModal({
  visible,
  alarm,
  onConfirm,
  onClose,
  onAddInteraction,
  allowEdit = false,
  onEdit
}) {
  if (!alarm) return null;

  const periodLabel = PERIOD_LABELS[alarm.period] || alarm.period;
  const voiceLabel = VOICE_PACKAGE_LABELS[alarm.voicePackage] || alarm.voicePackage;
  const gameLabel = alarm.interactionType ? getGameLabel(alarm.interactionType) : null;
  const hasInteraction = alarm.interactionEnabled && alarm.interactionType;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Alarm Summary</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            <View style={styles.content}>
              {alarm.label && (
                <View style={styles.summaryItem}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>📛 Name</Text>
                    {allowEdit && onEdit && (
                      <TouchableOpacity
                        onPress={() => onEdit('label')}
                        style={styles.editButton}
                      >
                        <Edit2 size={16} color="#FF9A76" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.value}>{alarm.label}</Text>
                </View>
              )}

              <View style={styles.summaryItem}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>⏰ Time</Text>
                  {allowEdit && onEdit && (
                    <TouchableOpacity
                      onPress={() => onEdit('time')}
                      style={styles.editButton}
                    >
                      <Edit2 size={16} color="#FF9A76" />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.value}>{alarm.time || 'Not set'}</Text>
              </View>

              <View style={styles.summaryItem}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>📅 Period</Text>
                  {allowEdit && onEdit && (
                    <TouchableOpacity
                      onPress={() => onEdit('period')}
                      style={styles.editButton}
                    >
                      <Edit2 size={16} color="#FF9A76" />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.value}>{periodLabel || 'Not set'}</Text>
              </View>

              <View style={styles.summaryItem}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>🎙️ Wake Mode</Text>
                  {allowEdit && onEdit && (
                    <TouchableOpacity
                      onPress={() => onEdit('wakeMode')}
                      style={styles.editButton}
                    >
                      <Edit2 size={16} color="#FF9A76" />
                    </TouchableOpacity>
                  )}
                </View>
                {alarm.wakeMode === 'voice' ? (
                  <Text style={styles.value}>Voice Broadcast ({voiceLabel})</Text>
                ) : alarm.wakeMode === 'ringtone' ? (
                  <Text style={styles.value}>Ringtone</Text>
                ) : alarm.wakeMode === 'vibration' ? (
                  <Text style={styles.value}>Vibration</Text>
                ) : (
                  <Text style={styles.value}>Not set</Text>
                )}
              </View>

              {alarm.broadcastContent && (
                <View style={styles.summaryItem}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>📻 Broadcast Content</Text>
                    {allowEdit && onEdit && (
                      <TouchableOpacity
                        onPress={() => onEdit('broadcast')}
                        style={styles.editButton}
                      >
                        <Edit2 size={16} color="#FF9A76" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.value}>
                    {alarm.broadcastContent === 'default' ? 'Default broadcast' : 'Custom broadcast'}
                  </Text>
                </View>
              )}

              <View style={styles.summaryItem}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>🎮 Interactive Game</Text>
                  {allowEdit && onEdit && hasInteraction && (
                    <TouchableOpacity
                      onPress={() => onEdit('interaction')}
                      style={styles.editButton}
                    >
                      <Edit2 size={16} color="#FF9A76" />
                    </TouchableOpacity>
                  )}
                </View>
                {hasInteraction ? (
                  <Text style={styles.value}>{gameLabel}</Text>
                ) : (
                  <Text style={styles.value}>None</Text>
                )}
              </View>

              {!hasInteraction && onAddInteraction && (
                <View style={styles.recommendation}>
                  <View style={styles.recommendHeader}>
                    <Sparkles size={18} color="#FF9A76" />
                    <Text style={styles.recommendTitle}>Suggestion: Add Interactive Task</Text>
                  </View>
                  <Text style={styles.recommendDesc}>
                    Add a mini-task to wake up more alert! Like a quiz, shake, or puzzle~ 😆
                  </Text>
                  <View style={styles.gameOptions}>
                    <TouchableOpacity
                      style={styles.gameOption}
                      onPress={() => onAddInteraction('quiz')}
                    >
                      <Text style={styles.gameOptionText}>🧠 Quiz</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.gameOption}
                      onPress={() => onAddInteraction('shake')}
                    >
                      <Text style={styles.gameOptionText}>📱 Shake</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.gameOption}
                      onPress={() => onAddInteraction('game')}
                    >
                      <Text style={styles.gameOptionText}>🎮 Puzzle</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Continue Editing</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.confirmButtonText}>Confirm & Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    maxHeight: '70%',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  summaryItem: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  editButton: {
    padding: 4,
  },
  value: {
    fontSize: 17,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  recommendation: {
    marginTop: 8,
    padding: 16,
    backgroundColor: '#FFF8F0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE5CC',
  },
  recommendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  recommendTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF9A76',
  },
  recommendDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  gameOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  gameOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFE5CC',
  },
  gameOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF9A76',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#FF9A76',
    shadowColor: '#FF9A76',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
