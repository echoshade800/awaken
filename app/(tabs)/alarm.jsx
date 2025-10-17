import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, AlarmClock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import useStore from '@/lib/store';
import AlarmCard from '@/components/AlarmCard';
import StarBackground from '@/components/StarBackground';

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
    <LinearGradient colors={['#4A5F8F', '#FF9A76', '#FFE4B5']} style={styles.container}>
      <StarBackground opacity={0.3} />
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

        <View style={styles.fabContainer}>
          <TouchableOpacity style={styles.fab} onPress={handleCreateAlarm}>
            <Plus size={24} color="#FFF" />
            <Text style={styles.fabText}>New Alarm</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.5,
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
    bottom: 16,
    left: 24,
    right: 24,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
