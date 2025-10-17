import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { Clock, Calendar, Music, Gamepad2 } from 'lucide-react-native';

const PERIOD_LABELS = {
  everyday: 'Everyday',
  workday: 'Weekdays',
  weekend: 'Weekends',
  tomorrow: 'Tomorrow',
  custom: 'Custom',
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
              <Calendar size={16} color="rgba(255, 154, 118, 0.8)" />
              <Text style={styles.detailText}>{periodLabel}</Text>
            </View>

            {alarm.wakeMode === 'voice' ? (
              <View style={styles.detailRow}>
                <Music size={16} color="rgba(255, 154, 118, 0.8)" />
                <Text style={styles.detailText}>
                  Voice - {alarm.voicePackage === 'energetic-girl' ? 'Energetic Girl' : 'Calm Man'}
                </Text>
              </View>
            ) : (
              <View style={styles.detailRow}>
                <Music size={16} color="rgba(255, 154, 118, 0.8)" />
                <Text style={styles.detailText}>{alarm.ringtone || 'Default Ringtone'}</Text>
              </View>
            )}

            {alarm.task && alarm.task !== 'none' && (
              <View style={styles.detailRow}>
                <Gamepad2 size={16} color="rgba(255, 154, 118, 0.8)" />
                <Text style={styles.detailText}>Task: {alarm.task}</Text>
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
          trackColor={{ false: 'rgba(255, 255, 255, 0.4)', true: '#FF9A76' }}
          thumbColor="#FFF"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  clickableArea: {
    flex: 1,
    padding: 16,
  },
  content: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  time: {
    fontSize: 36,
    fontWeight: '300',
    color: '#4A5F8F',
    letterSpacing: -0.5,
  },
  details: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: 'rgba(74, 95, 143, 0.7)',
    fontWeight: '400',
  },
  label: {
    fontSize: 14,
    color: '#FF9A76',
    fontWeight: '400',
  },
  switchContainer: {
    paddingRight: 12,
    paddingLeft: 8,
  },
});
