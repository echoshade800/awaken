import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, Calendar, Music, Gamepad2, Mic, Check } from 'lucide-react-native';
import { getGameLabel } from '../lib/interactionOptions';

const PERIOD_LABELS = {
  everyday: 'Everyday',
  workday: 'Weekdays',
  weekend: 'Weekend',
  tomorrow: 'Tomorrow',
  custom: 'Custom',
};

const VOICE_PACKAGE_LABELS = {
  'energetic-girl': 'Energetic Girl 🎀',
  'calm-man': 'Calm Man 🧠',
  'ancient-style': 'Ancient Style 🌙',
  'cat': 'Cat 🐱',
};

export default function AlarmInfoCard({ alarm, onConfirm, showConfirmButton = false }) {
  if (!alarm) return null;

  const hasLabel = alarm.label && alarm.label !== '';
  const hasTime = alarm.time && alarm.time !== '';
  const hasPeriod = alarm.period && alarm.period !== '';
  const hasWakeMode = alarm.wakeMode && alarm.wakeMode !== '';
  const hasVoicePackage = alarm.voicePackage && alarm.voicePackage !== '';
  const hasInteraction = alarm.interactionEnabled && alarm.interactionType;
  const hasBroadcast = alarm.broadcastContent && alarm.broadcastContent.trim() !== '';

  const hasAnyDetails = hasLabel || hasPeriod || hasWakeMode || hasInteraction || hasBroadcast;

  if (!hasTime && !hasAnyDetails) {
    return null;
  }

  const periodLabel = hasPeriod ? (PERIOD_LABELS[alarm.period] || alarm.period) : null;
  const voiceLabel = hasVoicePackage ? (VOICE_PACKAGE_LABELS[alarm.voicePackage] || alarm.voicePackage) : null;
  const gameLabel = hasInteraction ? getGameLabel(alarm.interactionType) : null;

  return (
    <View style={styles.card}>
      {hasLabel && !hasTime && (
        <Text style={styles.label}>{alarm.label}</Text>
      )}

      {hasTime && (
        <>
          <View style={styles.timeRow}>
            <View style={styles.timeInfo}>
              <Clock size={32} color="#1A2845" />
              <View style={styles.timeAndLabel}>
                <Text style={styles.time}>{alarm.time}</Text>
                {hasLabel && <Text style={styles.labelSmall}>{alarm.label}</Text>}
              </View>
            </View>
            {showConfirmButton && onConfirm && (
              <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
                <Check size={20} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>确认</Text>
              </TouchableOpacity>
            )}
          </View>
          {hasAnyDetails && <View style={styles.divider} />}
        </>
      )}

      {hasAnyDetails && (
        <View style={styles.detailsGrid}>
          {hasPeriod && (
            <View style={styles.detailItem}>
              <Calendar size={20} color="#1A2845" />
              <Text style={styles.detailText}>{periodLabel}</Text>
            </View>
          )}

          {hasWakeMode && alarm.wakeMode === 'voice' && (
            <>
              <View style={styles.detailItem}>
                <Mic size={20} color="#1A2845" />
                <Text style={styles.detailText}>Voice Broadcast</Text>
              </View>
              {hasVoicePackage && (
                <View style={styles.detailItem}>
                  <Music size={20} color="#1A2845" />
                  <Text style={styles.detailText}>{voiceLabel}</Text>
                </View>
              )}
            </>
          )}

          {hasWakeMode && alarm.wakeMode === 'ringtone' && (
            <View style={styles.detailItem}>
              <Music size={20} color="#666" />
              <Text style={styles.detailText}>{alarm.ringtone || 'Default Ringtone'}</Text>
            </View>
          )}

          {hasWakeMode && alarm.wakeMode === 'vibration' && (
            <View style={styles.detailItem}>
              <Music size={20} color="#666" />
              <Text style={styles.detailText}>Vibration</Text>
            </View>
          )}

          {hasInteraction && gameLabel && (
            <View style={styles.detailItem}>
              <Gamepad2 size={20} color="#1A2845" />
              <Text style={styles.detailText}>{gameLabel}</Text>
            </View>
          )}

          {hasBroadcast && (
            <View style={[styles.detailItem, styles.broadcastPreview]}>
              <Text style={styles.broadcastText} numberOfLines={2}>
                Broadcast: {alarm.broadcastContent}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeAndLabel: {
    flexDirection: 'column',
    gap: 2,
  },
  time: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1A2845',
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A2845',
    marginBottom: 8,
  },
  labelSmall: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A2845',
    opacity: 0.7,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF9A76',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#FF9A76',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginVertical: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  detailText: {
    fontSize: 14,
    color: '#1A2845',
    fontWeight: '500',
    opacity: 0.8,
  },
  broadcastPreview: {
    width: '100%',
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  broadcastText: {
    fontSize: 13,
    color: '#007AFF',
    lineHeight: 18,
  },
});
