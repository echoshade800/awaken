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

  // 检查是否有任何信息
  const hasAnyInfo = alarm.label || alarm.time || alarm.period || alarm.wakeMode || alarm.interactionEnabled !== undefined;

  // 如果没有任何信息，显示空状态
  if (!hasAnyInfo) {
    return (
      <View style={styles.card}>
        <View style={styles.emptyState}>
          <Clock size={32} color="rgba(26, 40, 69, 0.3)" />
          <Text style={styles.emptyText}>正在收集闹钟信息...</Text>
        </View>
      </View>
    );
  }

  const periodLabel = alarm.period ? (PERIOD_LABELS[alarm.period] || alarm.period) : null;
  const voiceLabel = alarm.voicePackage ? (VOICE_PACKAGE_LABELS[alarm.voicePackage] || alarm.voicePackage) : null;
  const gameLabel = alarm.interactionType ? getGameLabel(alarm.interactionType) : null;

  // 计算有多少信息已经填写
  const hasDetails = alarm.period || alarm.wakeMode || alarm.interactionEnabled || alarm.broadcastContent;

  return (
    <View style={styles.card}>
      {alarm.label && (
        <View style={styles.labelRow}>
          <Text style={styles.labelText}>📛 {alarm.label}</Text>
        </View>
      )}

      <View style={styles.timeRow}>
        <View style={styles.timeInfo}>
          <Clock size={32} color="#1A2845" />
          <Text style={styles.time}>{alarm.time || '--:--'}</Text>
        </View>
        {showConfirmButton && onConfirm && (
          <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
            <Check size={20} color="#FFFFFF" />
            <Text style={styles.confirmButtonText}>确认</Text>
          </TouchableOpacity>
        )}
      </View>

      {hasDetails && <View style={styles.divider} />}

      {hasDetails && (
        <View style={styles.detailsGrid}>
          {alarm.period && (
            <View style={styles.detailItem}>
              <Calendar size={20} color="#1A2845" />
              <Text style={styles.detailText}>{periodLabel}</Text>
            </View>
          )}

          {alarm.wakeMode === 'voice' && (
            <>
              <View style={styles.detailItem}>
                <Mic size={20} color="#1A2845" />
                <Text style={styles.detailText}>语音播报</Text>
              </View>
              {voiceLabel && (
                <View style={styles.detailItem}>
                  <Music size={20} color="#1A2845" />
                  <Text style={styles.detailText}>{voiceLabel}</Text>
                </View>
              )}
            </>
          )}

          {alarm.wakeMode === 'ringtone' && (
            <View style={styles.detailItem}>
              <Music size={20} color="#666" />
              <Text style={styles.detailText}>{alarm.ringtone || '默认铃声'}</Text>
            </View>
          )}

          {alarm.wakeMode === 'vibration' && (
            <View style={styles.detailItem}>
              <Music size={20} color="#666" />
              <Text style={styles.detailText}>震动</Text>
            </View>
          )}

          {alarm.interactionEnabled && gameLabel && (
            <View style={styles.detailItem}>
              <Gamepad2 size={20} color="#1A2845" />
              <Text style={styles.detailText}>{gameLabel}</Text>
            </View>
          )}

          {alarm.interactionEnabled === false && (
            <View style={styles.detailItem}>
              <Gamepad2 size={20} color="rgba(26, 40, 69, 0.4)" />
              <Text style={[styles.detailText, { opacity: 0.5 }]}>无游戏</Text>
            </View>
          )}

          {alarm.broadcastContent && (
            <View style={[styles.detailItem, styles.broadcastPreview]}>
              <Text style={styles.broadcastText} numberOfLines={2}>
                播报: {alarm.broadcastContent}
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
  time: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1A2845',
    letterSpacing: -0.5,
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
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(26, 40, 69, 0.5)',
    fontWeight: '500',
  },
  labelRow: {
    marginBottom: 8,
  },
  labelText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2845',
  },
});
