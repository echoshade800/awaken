import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import useStore from '@/lib/store';
import { generateMockRhythm } from '@/lib/rhythm';
import RhythmChart from '@/components/RhythmChart';
import StarBackground from '@/components/StarBackground';
import SleepDebtPuzzle from '@/components/SleepDebtPuzzle';
import UnifiedPanelBorder from '@/components/UnifiedPanelBorder';
import GlowingText from '@/components/GlowingText';
import EnergyHelpModal from '@/components/EnergyHelpModal';
import MonsterTipsBanner from '@/components/MonsterTipsBanner';
import SleepDebtCard from '@/components/SleepDebtCard';
import WelcomeToast from '@/components/WelcomeToast';
import DreamBubble from '@/components/DreamBubble';
import DemoDataBadge from '@/components/DemoDataBadge';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeBackgroundTasks } from '@/lib/backgroundTasks';

export default function HomeScreen() {
  const router = useRouter();
  const alarms = useStore((state) => state.alarms);
  const chronotype = useStore((state) => state.chronotype);
  const appData = useStore((state) => state.appData);
  const getEnergyRhythmData = useStore((state) => state.getEnergyRhythmData);
  const loadSleepData = useStore((state) => state.loadSleepData);
  const sleepDebt = useStore((state) => state.sleepDebt);
  const usageTrackingEnabled = useStore((state) => state.usageTrackingEnabled);
  const usingRealUsageData = useStore((state) => state.usingRealUsageData);

  // 实时时间状态
  const [currentTime, setCurrentTime] = useState(new Date());

  // 能量帮助模态框状态
  const [showEnergyModal, setShowEnergyModal] = useState(false);

  // Welcome toast state
  const [showWelcomeToast, setShowWelcomeToast] = useState(false);

  // Dream keyword state
  const [dreamKeyword, setDreamKeyword] = useState(null);

  // Energy rhythm data
  const [rhythmData, setRhythmData] = useState({
    energyScore: 50,
    peak: { time: '13:00', energy: 80 },
    valley: { time: '03:00', energy: 20 },
    curve: [],
    monsterTip: "✨ Energy's balanced. Keep it calm and consistent 🌙",
    debtInfo: { label: 'Good', emoji: '😊', color: '#90EE90', severity: 'good' },
  });

  // Initialize sleep data and background tasks
  useEffect(() => {
    const initializeSleepData = async () => {
      console.log('[Home] Initializing sleep data...');
      await loadSleepData();
      await initializeBackgroundTasks();
      updateRhythmData();
      console.log('[Home] Sleep data initialized');
    };
    initializeSleepData();
  }, []);

  // Update rhythm data when store changes
  useEffect(() => {
    updateRhythmData();
  }, [sleepDebt]);

  const updateRhythmData = () => {
    const energyData = getEnergyRhythmData();
    console.log('[Home] Energy data from store:', {
      hasData: !!energyData,
      curveLength: energyData?.curve?.length,
      sleepDebt: sleepDebt,
    });

    if (energyData && energyData.curve && energyData.curve.length > 0) {
      console.log('[Home] Using calculated energy data');
      setRhythmData(energyData);
    } else {
      console.log('[Home] Using mock data fallback');
      // Fallback to mock data if no calculated data available
      const nextAlarm = alarms.filter((a) => a.enabled).sort((a, b) => a.time.localeCompare(b.time))[0];
      const mockData = generateMockRhythm({
        wake: nextAlarm?.time || '07:30',
        sleep: '23:00',
        chrono: chronotype,
      });
      setRhythmData({
        energyScore: mockData?.energyScore || 50,
        peak: mockData?.peak || { time: '13:00', energy: 80 },
        valley: mockData?.valley || { time: '03:00', energy: 20 },
        curve: mockData?.curve || [],
        monsterTip: "✨ Energy's balanced. Keep it calm and consistent 🌙",
        debtInfo: { label: 'Good', emoji: '😊', color: '#90EE90', severity: 'good' },
      });
    }
  };

  // Check if this is first-time visit after onboarding
  useEffect(() => {
    const checkFirstVisit = async () => {
      const hasSeenWelcome = await AsyncStorage.getItem('hasSeenWelcomeToast');
      if (!hasSeenWelcome) {
        setShowWelcomeToast(true);
        await AsyncStorage.setItem('hasSeenWelcomeToast', 'true');
      }
    };
    checkFirstVisit();
  }, []);

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Update rhythm data every minute
  useEffect(() => {
    const timer = setInterval(() => {
      updateRhythmData();
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const nextAlarm = alarms.filter((a) => a.enabled).sort((a, b) => a.time.localeCompare(b.time))[0];

  // 格式化时间显示
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // 处理能量帮助按钮点击
  const handleEnergyHelpPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowEnergyModal(true);
  };


  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E8F4FD', '#D6EEFF', '#A8D8F0', '#6BA8D0', '#4A6B8A', '#2B4164', '#1A2845', '#0D1525']}
        style={styles.backgroundGradient}
      />
      <StarBackground />

      <WelcomeToast visible={showWelcomeToast} onDismiss={() => setShowWelcomeToast(false)} />

      <DreamBubble
        keyword={dreamKeyword}
        onPress={() => {
          console.log('Dream bubble pressed - navigate to dream records');
        }}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topSpacer} />

          {/* 时间显示模块 */}
          <View style={styles.timeContainer}>
            <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
          </View>

          {/* Demo Data Badge */}
          {usageTrackingEnabled && !usingRealUsageData && <DemoDataBadge />}

          {/* Next Alarm 信息条 - 紧凑胶囊样式 */}
          {nextAlarm && (
            <TouchableOpacity 
              style={styles.alarmInfo}
              onPress={() => router.push('/(tabs)/alarm')}
              activeOpacity={0.8}
            >
              <View style={styles.alarmContent}>
                <Text style={styles.alarmBellIcon}>🔔</Text>
                <Text style={styles.alarmTimeDisplay}>{nextAlarm.time}</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Monster Tips Banner - 移至曲线上方 */}
          <MonsterTipsBanner tip={rhythmData?.monsterTip || "✨ Energy's balanced. Keep it calm and consistent 🌙"} />

          <View style={styles.chartContainer}>
            {rhythmData && rhythmData.curve && rhythmData.curve.length > 0 && (
              <RhythmChart rhythmData={rhythmData} />
            )}
          </View>

          <View style={styles.contentPadded}>
            <View style={styles.horizontalContainer}>
              <View style={styles.panelWithLabel}>
                <UnifiedPanelBorder style={styles.unifiedPanel}>
                  <View style={styles.energyContent}>
                    <View style={styles.energyLeft}>
                      <View style={styles.currentLabelContainer}>
                        <Text style={styles.energyLabel}>Current</Text>
                        <TouchableOpacity
                          style={styles.energyHelpButton}
                          onPress={handleEnergyHelpPress}
                          accessible={true}
                          accessibilityLabel="Explain energy calculation"
                          accessibilityRole="button"
                        >
                          <Text style={styles.energyHelpIcon}>?</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.energyValue}>{rhythmData?.energyScore || 50}</Text>
                    </View>

                    <View style={styles.energyPeaksColumn}>
                      <View style={styles.energyPeakItem}>
                        <Text style={styles.energyTimeLabel}>Peak</Text>
                        <Text style={styles.energyTimeValue}>{rhythmData?.peak?.time || '13:00'}</Text>
                      </View>
                      <View style={styles.energyPeakItem}>
                        <Text style={styles.energyTimeLabel}>Low</Text>
                        <Text style={styles.energyTimeValue}>{rhythmData?.valley?.time || '03:00'}</Text>
                      </View>
                    </View>
                  </View>
                </UnifiedPanelBorder>
                <Text style={styles.panelLabel}>Energy Status</Text>
              </View>

              {/* Sleep Debt Card - 替换原Monster Tips */}
              <SleepDebtCard sleepDebt={sleepDebt} debtInfo={rhythmData?.debtInfo} />
            </View>

            <View style={styles.horizontalContainer}>
              <View style={styles.panelWithLabel}>
                <UnifiedPanelBorder style={styles.unifiedPanel}>
                  <SleepDebtPuzzle />
                </UnifiedPanelBorder>
                <Text style={styles.panelLabel}>Sleep Quality</Text>
              </View>

              <TouchableOpacity
                style={styles.panelWithLabel}
                onPress={() => {
                  setDreamKeyword(dreamKeyword ? null : 'Flying');
                }}
              >
                <UnifiedPanelBorder style={styles.unifiedPanel}>
                  <GlowingText>{dreamKeyword || 'No Dream Yet'}</GlowingText>
                </UnifiedPanelBorder>
                <Text style={styles.panelLabel}>Dream Keyword (Tap to Toggle)</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>

      {/* 能量帮助模态框 */}
      <EnergyHelpModal 
        visible={showEnergyModal}
        onClose={() => setShowEnergyModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: { flex: 1 },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  topSpacer: {
    height: 20,
  },
  contentPadded: {
    paddingHorizontal: 20,
  },
  chartContainer: {
    position: 'relative',
    paddingHorizontal: 20,
    marginTop: 0,
    marginBottom: 12,
  },
  // 时间显示模块样式
  timeContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  currentTime: {
    fontSize: 64,
    fontWeight: '700',
    color: '#1A2845',
    textAlign: 'center',
    letterSpacing: 1,
  },
  // Next Alarm 信息条样式 - 玻璃质感
  alarmInfo: {
    alignSelf: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // 半透明白色背景
    borderRadius: 25, // 圆角矩形
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)', // 白色边框
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
    transform: [{ scale: 1 }],
  },
  alarmContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  alarmBellIcon: {
    fontSize: 16,
    color: 'rgba(26, 40, 69, 0.8)',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  alarmTimeDisplay: {
    fontSize: 16,
    color: 'rgba(26, 40, 69, 0.9)',
    fontWeight: '600',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
  currentLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  energyLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  energyHelpButton: {
    marginLeft: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  energyHelpIcon: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
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
