import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, Check } from 'lucide-react-native';

export default function AlarmInfoCard({ alarm, onConfirm, showConfirmButton = false }) {
  if (!alarm) return null;

  return (
    <View style={styles.card}>
      <View style={styles.timeRow}>
        <View style={styles.timeInfo}>
          <Clock size={28} color="#1A2845" />
          <Text style={styles.time}>{alarm.time || '--:--'}</Text>
          {alarm.label && <Text style={styles.label}>{alarm.label}</Text>}
        </View>
        {showConfirmButton && onConfirm && (
          <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
            <Check size={20} color="#FFFFFF" />
            <Text style={styles.confirmButtonText}>确认</Text>
          </TouchableOpacity>
        )}
      </View>
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
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  time: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1A2845',
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A2845',
    opacity: 0.7,
    marginLeft: 8,
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
});
