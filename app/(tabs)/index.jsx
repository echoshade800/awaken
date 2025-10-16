import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import useStore from '@/lib/store';
import { generateMockRhythm } from '@/lib/rhythm';
import RhythmChart from '@/components/RhythmChart';

export default function HomeScreen() {
  const router = useRouter();
  const alarms = useStore((state) => state.alarms);
  const chronotype = useStore((state) => state.chronotype);
  const appData = useStore((state) => state.appData);

  const nextAlarm = alarms.filter((a) => a.enabled).sort((a, b) => a.time.localeCompare(b.time))[0];
  const rhythmData = generateMockRhythm({
    wake: nextAlarm?.time || '07:30',
    sleep: '23:00',
    chrono: chronotype,
  });

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return (
    <LinearGradient colors={['#FFF7E8', '#E6F4FF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Your Energy{"\n"}Rhythm Today</Text>
            <Text style={styles.currentTime}>{currentTime}</Text>
            {nextAlarm && (
              <Text style={styles.alarmText}>⏰ Next alarm: {nextAlarm.time} · {nextAlarm.label || 'Gentle Wake'}</Text>
            )}
          </View>

          <RhythmChart rhythmData={rhythmData} />

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Energy</Text>
              <Text style={styles.statValue}>{rhythmData.energyScore}<Text style={styles.statValueSmall}> / 100</Text></Text>
              <Text style={styles.statSubtext}>Stable and balanced</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Sleep Debt</Text>
              <Text style={styles.statValue}>{appData?.sleepDebt || '-2'}h</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push('/(tabs)/alarm')}
          >
            <Text style={styles.ctaButtonText}>Plan My Tomorrow</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '400',
    color: '#999999',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 4,
  },
  currentTime: {
    fontSize: 42,
    fontWeight: '300',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  alarmText: {
    fontSize: 13,
    color: '#1C1C1E',
    marginTop: 2,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  statLabel: {
    fontSize: 13,
    color: '#1C1C1E',
    marginBottom: 8,
    fontWeight: '400',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  statValueSmall: {
    fontSize: 20,
    fontWeight: '400',
    color: '#8E8E93',
  },
  statSubtext: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  ctaButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  ctaButtonText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#1C1C1E',
  },
});
