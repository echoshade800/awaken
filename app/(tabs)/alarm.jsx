import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, AlarmClock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import useStore from '@/lib/store';
import AlarmCard from '@/components/AlarmCard';

export default function AlarmScreen() {
  const router = useRouter();
  const alarms = useStore((state) => state.alarms);
  const toggleAlarm = useStore((state) => state.toggleAlarm);

  const handleCreateAlarm = () => {
    router.push('/alarm/create');
  };

  const handleViewAlarm = (alarmId) => {
    router.push(`/alarm/${alarmId}`);
  };

  return (
    <LinearGradient colors={['#FFF7E8', '#E6F4FF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>我的闹钟</Text>
          <Text style={styles.subtitle}>管理你的闹钟设置</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {alarms.length === 0 ? (
            <View style={styles.emptyState}>
              <AlarmClock size={64} color="#C7C7CC" />
              <Text style={styles.emptyStateText}>还没有闹钟</Text>
              <Text style={styles.emptyStateSubtext}>点击下方按钮创建你的第一个闹钟</Text>
            </View>
          ) : (
            alarms.map((alarm) => (
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
            <Text style={styles.fabText}>新建闹钟</Text>
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
    marginTop: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    marginTop: 8,
    textAlign: 'center',
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
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
});
