import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, AlarmClock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import useStore from '../../lib/store';
import AlarmCard from '../../components/AlarmCard';
import StarBackground from '../../components/StarBackground';

export default function AlarmScreen() {
  const router = useRouter();
  const alarms = useStore((state) => state.alarms);
  const toggleAlarm = useStore((state) => state.toggleAlarm);

  const sortedAlarms = [...alarms].sort((a, b) => {
    if (a.enabled !== b.enabled) {
      return a.enabled ? -1 : 1;
    }

    return a.time.localeCompare(b.time);
  });

  const handleCreateAlarm = () => {
    router.push('/alarm/create');
  };

  const handleViewAlarm = (alarmId) => {
    router.push(`/alarm/${alarmId}`);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#3D5A80', '#5A7BA5', '#7A9BC4', '#FFB88C', '#E8F4FF', '#F0F8FF', '#FAFCFF']}
        locations={[0, 0.25, 0.4, 0.5, 0.65, 0.82, 1]}
        style={styles.backgroundGradient}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Awake Me</Text>
          <Text style={styles.subtitle}>Set Your Morning Rhythm</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {sortedAlarms.length === 0 ? (
            <View style={styles.emptyState}>
              <AlarmClock size={64} color="rgba(255, 255, 255, 0.5)" />
              <Text style={styles.emptyStateText}>No Alarms Set</Text>
              <Text style={styles.emptyStateSubtext}>Create your first gentle wake-up call</Text>
            </View>
          ) : (
            sortedAlarms.map((alarm) => (
              <AlarmCard
                key={alarm.id}
                alarm={alarm}
                onPress={() => handleViewAlarm(alarm.id)}
                onToggle={toggleAlarm}
              />
            ))
          )}
        </ScrollView>
      </SafeAreaView>

      <View style={styles.fabContainer}>
        <Text style={styles.fabLabel}>Create</Text>
        <TouchableOpacity
          style={styles.fab}
          onPress={handleCreateAlarm}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FF8C42', '#FFB366']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabCircle}
          >
            <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 36,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '300',
    color: '#FFFFFF',
    marginTop: 20,
    letterSpacing: 0.5,
  },
  emptyStateSubtext: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '300',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fabLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  fab: {
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  fabCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
});
