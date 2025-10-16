import { View, Text, StyleSheet } from 'react-native';
import { Clock, Calendar, Music, Gamepad2, Mic } from 'lucide-react-native';

const PERIOD_LABELS = {
  everyday: '每天',
  workday: '工作日',
  weekend: '周末',
  tomorrow: '明天',
  custom: '自定义',
};

const VOICE_PACKAGE_LABELS = {
  'energetic-girl': '元气少女',
  'calm-man': '沉稳大叔',
};

export default function AlarmInfoCard({ alarm }) {
  if (!alarm) return null;

  const periodLabel = PERIOD_LABELS[alarm.period] || alarm.period;
  const voiceLabel = VOICE_PACKAGE_LABELS[alarm.voicePackage] || alarm.voicePackage;

  return (
    <View style={styles.card}>
      <View style={styles.timeRow}>
        <Clock size={32} color="#007AFF" />
        <Text style={styles.time}>{alarm.time}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Calendar size={20} color="#666" />
          <Text style={styles.detailText}>{periodLabel}</Text>
        </View>

        {alarm.wakeMode === 'voice' ? (
          <>
            <View style={styles.detailItem}>
              <Mic size={20} color="#666" />
              <Text style={styles.detailText}>语音播报</Text>
            </View>
            <View style={styles.detailItem}>
              <Music size={20} color="#666" />
              <Text style={styles.detailText}>{voiceLabel}</Text>
            </View>
          </>
        ) : (
          <View style={styles.detailItem}>
            <Music size={20} color="#666" />
            <Text style={styles.detailText}>{alarm.ringtone || '默认铃声'}</Text>
          </View>
        )}

        {alarm.task && alarm.task !== 'none' && (
          <View style={styles.detailItem}>
            <Gamepad2 size={20} color="#666" />
            <Text style={styles.detailText}>{alarm.task}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  time: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
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
    color: '#8E8E93',
    fontWeight: '500',
  },
});
