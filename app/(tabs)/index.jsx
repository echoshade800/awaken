import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import useStore from '@/lib/store';
import { generateMockRhythm } from '@/lib/rhythm';
import RhythmChart from '@/components/RhythmChart';
import StarBackground from '@/components/StarBackground';
import SleepDebtPuzzle from '@/components/SleepDebtPuzzle';
import UnifiedPanelBorder from '@/components/UnifiedPanelBorder';
import MonsterIcon from '@/components/MonsterIcon';
import GlowingText from '@/components/GlowingText';

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
    <LinearGradient colors={['#F5F9FC', '#D6EEFF', '#A8D8F0', '#6BA8D0', '#3D5A7F', '#2B4164', '#1A2845', '#0D1525']} style={styles.container}>
      <StarBackground />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topSpacer} />

          <View style={styles.headerPadded}>
            <Text style={styles.title}>What Does Your Rhythm{"\n"}Look Like Today?</Text>
            {nextAlarm && (
              <Text style={styles.alarmText}>⏰ Next alarm: {nextAlarm.time} · {nextAlarm.label || 'Gentle Wake'}</Text>
            )}
          </View>

          <View style={styles.chartContainer}>
            <MonsterIcon
              size={44}
              onPress={() => router.push('/(tabs)/alarm')}
            />
            <RhythmChart rhythmData={rhythmData} />
          </View>

          <View style={styles.contentPadded}>
            <View style={styles.horizontalContainer}>
              <View style={styles.panelWithLabel}>
                <UnifiedPanelBorder style={styles.unifiedPanel}>
                  <View style={styles.energyContent}>
                    <View style={styles.energyLeft}>
                      <Text style={styles.energyLabel}>Current</Text>
                      <Text style={styles.energyValue}>{rhythmData.energyScore}</Text>
                    </View>

                    <View style={styles.energyPeaksColumn}>
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
                </UnifiedPanelBorder>
                <Text style={styles.panelLabel}>Energy Status</Text>
              </View>

              <View style={styles.panelWithLabel}>
                <UnifiedPanelBorder style={styles.unifiedPanel}>
                  <Text style={styles.tipText}>✨ Energy's balanced. Keep it calm and consistent 🌙</Text>
                </UnifiedPanelBorder>
                <Text style={styles.panelLabel}>Monster Tips</Text>
              </View>
            </View>

            <View style={styles.horizontalContainer}>
              <View style={styles.panelWithLabel}>
                <UnifiedPanelBorder style={styles.unifiedPanel}>
                  <SleepDebtPuzzle />
                </UnifiedPanelBorder>
                <Text style={styles.panelLabel}>Sleep Debt: {appData?.sleepDebt || -2}h</Text>
              </View>

              <View style={styles.panelWithLabel}>
                <UnifiedPanelBorder style={styles.unifiedPanel}>
                  <GlowingText>Starry Sky</GlowingText>
                </UnifiedPanelBorder>
                <Text style={styles.panelLabel}>Dream Keyword</Text>
              </View>
            </View>
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
  topSpacer: {
    height: 60,
  },
  headerPadded: {
    marginTop: 16,
    marginBottom: 8,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  contentPadded: {
    paddingHorizontal: 20,
  },
  chartContainer: {
    position: 'relative',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: '#1A2845',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 8,
  },
  alarmText: {
    fontSize: 13,
    color: 'rgba(26, 40, 69, 0.8)',
    marginTop: 2,
    marginBottom: 4,
  },
  horizontalContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  panelWithLabel: {
    flex: 1,
  },
  unifiedPanel: {
    height: 110,
    width: '100%',
  },
  energyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
  },
  panelLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(200, 230, 255, 0.95)',
    letterSpacing: 0.8,
    marginTop: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(200, 230, 255, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
  tipText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  energyPeaksColumn: {
    flexDirection: 'column',
    gap: 12,
    alignItems: 'flex-end',
  },
  energyPeakItem: {
    alignItems: 'flex-end',
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
  bottomSpacer: {
    height: 100,
  },
});
