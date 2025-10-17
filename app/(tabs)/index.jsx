import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import useStore from '@/lib/store';
import { generateMockRhythm } from '@/lib/rhythm';
import RhythmChart from '@/components/RhythmChart';
import StarBackground from '@/components/StarBackground';
import DreamBubble from '@/components/DreamBubble';

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
    hour12: true
  });

  return (
    <LinearGradient colors={['#87CEEB', '#4A90E2', '#1E3A5F']} style={styles.container}>
      <StarBackground />
      <DreamBubble keyword="Starry Sky" initialX={50} initialY={300} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>What Does Your Rhythm{"\n"}Look Like Today?</Text>
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
            <Text style={styles.ctaButtonText}>Awake Me</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    marginTop: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 8,
  },
  currentTime: {
    fontSize: 56,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  alarmText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '400',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statValueSmall: {
    fontSize: 20,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  ctaButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  ctaButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: 100,
  },
});
