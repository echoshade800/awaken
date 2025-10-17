import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import useStore from '@/lib/store';
import { generateMockRhythm } from '@/lib/rhythm';
import RhythmChart from '@/components/RhythmChart';
import StarBackground from '@/components/StarBackground';
import DreamBubble from '@/components/DreamBubble';
import SleepDebtPuzzle from '@/components/SleepDebtPuzzle';

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
          <View style={styles.headerPadded}>
            <Text style={styles.title}>What Does Your Rhythm{"\n"}Look Like Today?</Text>
            <Text style={styles.currentTime}>{currentTime}</Text>
            {nextAlarm && (
              <Text style={styles.alarmText}>⏰ Next alarm: {nextAlarm.time} · {nextAlarm.label || 'Gentle Wake'}</Text>
            )}
          </View>

          <RhythmChart rhythmData={rhythmData} />

          <View style={styles.contentPadded}>
            <View style={styles.energyPanel}>
              <View style={styles.energyLeft}>
                <Text style={styles.energyLabel}>Current</Text>
                <Text style={styles.energyValue}>{rhythmData.energyScore}</Text>
              </View>

              <View style={styles.energyCenter}>
                <Text style={styles.energyStatus}>
                  {rhythmData.energyScore > 80 ? 'Peak' :
                   rhythmData.energyScore > 60 ? 'High' :
                   rhythmData.energyScore > 40 ? 'Moderate' : 'Low'}
                </Text>
              </View>

              <View style={styles.energyRight}>
                <View style={styles.energyTimeRow}>
                  <Text style={styles.energyTimeLabel}>Peak</Text>
                  <Text style={styles.energyTimeValue}>{rhythmData.peak.time}</Text>
                </View>
                <View style={styles.energyTimeRow}>
                  <Text style={styles.energyTimeLabel}>Low</Text>
                  <Text style={styles.energyTimeValue}>{rhythmData.valley.time}</Text>
                </View>
              </View>
            </View>

            <SleepDebtPuzzle sleepDebt={appData?.sleepDebt || -2} />

            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.push('/(tabs)/alarm')}
            >
              <Text style={styles.ctaButtonText}>Awake Me</Text>
            </TouchableOpacity>
          </View>

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
    paddingBottom: 20,
  },
  headerPadded: {
    marginTop: 8,
    marginBottom: 8,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  contentPadded: {
    paddingHorizontal: 20,
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
  energyPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    marginTop: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  energyLeft: {
    alignItems: 'flex-start',
    flex: 1,
  },
  energyLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    fontWeight: '500',
  },
  energyValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  energyCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  energyStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  energyRight: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 8,
  },
  energyTimeRow: {
    alignItems: 'flex-end',
  },
  energyTimeLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 2,
    fontWeight: '500',
  },
  energyTimeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
