import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import useStore from '@/lib/store';
import { generateMockRhythm } from '@/lib/rhythm';
import RhythmChart from '@/components/RhythmChart';
import StarBackground from '@/components/StarBackground';
import SleepDebtPuzzle from '@/components/SleepDebtPuzzle';
import MonsterHornBorder from '@/components/MonsterHornBorder';

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


  return (
    <LinearGradient colors={['#87CEEB', '#4A90E2', '#1E3A5F']} style={styles.container}>
      <StarBackground />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerPadded}>
            <Text style={styles.title}>What Does Your Rhythm{"\n"}Look Like Today?</Text>
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

              <View style={styles.energyPeaksRow}>
                <View style={styles.energyPeakItem}>
                  <Text style={styles.energyTimeLabel}>Peak</Text>
                  <Text style={styles.energyTimeValue}>{rhythmData.peak.time}</Text>
                </View>
                <View style={styles.energyPeakItem}>
                  <Text style={styles.energyTimeLabel}>Low</Text>
                  <Text style={styles.energyTimeValue}>{rhythmData.valley.time}</Text>
                </View>
              </View>
            </View>

            <SleepDebtPuzzle sleepDebt={appData?.sleepDebt || -2} />

            <View style={styles.dreamKeywordContainer}>
              <MonsterHornBorder>
                <Text style={styles.dreamKeywordText}>Starry Sky</Text>
              </MonsterHornBorder>
              <Text style={styles.dreamKeywordLabel}>Dream Keyword</Text>
            </View>

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
  alarmText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
    marginBottom: 4,
  },
  energyPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    marginTop: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  energyLeft: {
    alignItems: 'flex-start',
  },
  energyLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
    fontWeight: '500',
  },
  energyValue: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  energyPeaksRow: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  energyPeakItem: {
    alignItems: 'center',
  },
  energyTimeLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 3,
    fontWeight: '500',
  },
  energyTimeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dreamKeywordContainer: {
    marginBottom: 8,
    marginTop: 8,
  },
  dreamKeywordText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  dreamKeywordLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
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
