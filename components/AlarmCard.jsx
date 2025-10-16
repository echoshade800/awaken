import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { Clock, Calendar, Music, Gamepad2 } from 'lucide-react-native';

const PERIOD_LABELS = {
  everyday: '每天',
  workday: '工作日',
  weekend: '周末',
  tomorrow: '明天',
  custom: '自定义',
};

export default function AlarmCard({ alarm, onPress, onToggle }) {
  const periodLabel = PERIOD_LABELS[alarm.period] || alarm.period;

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.clickableArea}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.time}>{alarm.time}</Text>
          </View>

          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Calendar size={16} color="#666" />
              <Text style={styles.detailText}>{periodLabel}</Text>
            </View>

            {alarm.wakeMode === 'voice' ? (
              <View style={styles.detailRow}>
                <Music size={16} color="#666" />
                <Text style={styles.detailText}>
                  语音播报 - {alarm.voicePackage === 'energetic-girl' ? '元气少女' : '沉稳大叔'}
                </Text>
              </View>
            ) : (
              <View style={styles.detailRow}>
                <Music size={16} color="#666" />
                <Text style={styles.detailText}>{alarm.ringtone || '默认铃声'}</Text>
              </View>
            )}

            {alarm.task && alarm.task !== 'none' && (
              <View style={styles.detailRow}>
                <Gamepad2 size={16} color="#666" />
                <Text style={styles.detailText}>任务: {alarm.task}</Text>
              </View>
            )}
          </View>

          {alarm.label && <Text style={styles.label}>{alarm.label}</Text>}
        </View>
      </TouchableOpacity>

      <View style={styles.switchContainer}>
        <Switch
          value={alarm.enabled}
          onValueChange={() => onToggle(alarm.id)}
          trackColor={{ false: '#E0E0E0', true: '#34C759' }}
          thumbColor="#FFF"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clickableArea: {
    flex: 1,
    padding: 16,
  },
  content: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  time: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  label: {
    fontSize: 14,
    color: '#C7C7CC',
    fontStyle: 'italic',
  },
  switchContainer: {
    paddingRight: 16,
    paddingLeft: 8,
  },
});
