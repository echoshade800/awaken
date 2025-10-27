import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useMemo, useEffect } from 'react';
import { BlurView } from 'expo-blur';
import SleepTimesChart from '../../components/SleepTimesChart';
import SleepDebtChart from '../../components/SleepDebtChart';
import SleepActionBar from '../../components/SleepActionBar';
import useStore from '../../lib/store';
import { useHealthSteps } from '../../hooks/useHealthSteps';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH;

// Helper function to format ISO time to HH:MM
function formatTimeHM(iso) {
  if (!iso) return '--:--';
  const d = new Date(iso);
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${mins}`;
}

// Helper function to format duration in minutes to "Xh Ym"
function formatDuration(minsTotal) {
  if (!minsTotal && minsTotal !== 0) return '--';
  const h = Math.floor(minsTotal / 60);
  const m = minsTotal % 60;
  return `${h}h ${m}m`;
}

export default function SleepScreen() {
  const [activeTab, setActiveTab] = useState('times');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // 使用新的 useHealthSteps hook 获取真实 HealthKit 步数
  const healthSteps = useHealthSteps(14);
  const sleepNeed = useStore((state) => state.sleepNeed);
  const getSleepSessionsForChart = useStore((state) => state.getSleepSessionsForChart);
  const getSleepSessionsForDebtChart = useStore((state) => state.getSleepSessionsForDebtChart);
  const getAllSleepSessions = useStore((state) => state.getAllSleepSessions);
  const sleepSessions = useStore((state) => state.sleepSessions);
  const healthKitAuthorized = useStore((state) => state.healthKitAuthorized);
  const lastHealthKitSync = useStore((state) => state.lastHealthKitSync);
  const insertDemoSleepData = useStore((state) => state.insertDemoSleepData);
  const syncHealthKitData = useStore((state) => state.syncHealthKitData);
  const requestHealthKitPermission = useStore((state) => state.requestHealthKitPermission);
  const checkHealthKitPermission = useStore((state) => state.checkHealthKitPermission);

  const [timesChartData, setTimesChartData] = useState([]);
  const [debtChartData, setDebtChartData] = useState([]);
  const [allSessions, setAllSessions] = useState([]);

  useEffect(() => {
    const initializeData = async () => {
      console.log('[Sleep] Initializing data...');
      console.log('[Sleep] Current sessions:', sleepSessions?.length || 0);
      console.log('[Sleep] HealthSteps state:', healthSteps.state);
      console.log('[Sleep] HealthSteps data points:', healthSteps.steps?.length || 0);
      setIsLoading(true);
      try {
        // 优先使用真实 HealthKit 数据（如果已授权且有数据）
        const hasRealData = sleepSessions && sleepSessions.length > 0 &&
          sleepSessions.some(s => s.source !== 'demo');

        if (hasRealData) {
          console.log('[Sleep] Already have real sleep data, loading charts');
          // 直接加载现有数据到图表
          const timesData = getSleepSessionsForChart();
          const debtData = getSleepSessionsForDebtChart();
          const allSessionsData = getAllSleepSessions();
          if (timesData) setTimesChartData(timesData);
          if (debtData) setDebtChartData(debtData);
          if (allSessionsData) setAllSessions(allSessionsData);
          setIsLoading(false);
          return;
        }

        // 检查 useHealthSteps 的状态
        if (healthSteps.state === 'ready' && healthSteps.steps.length > 0) {
          console.log('[Sleep] Real HealthKit steps available, syncing...');
          // 有真实步数数据，同步睡眠会话
          const syncResult = await syncHealthKitData();
          console.log('[Sleep] Sync result:', syncResult);
        } else if (healthSteps.state === 'denied') {
          console.log('[Sleep] HealthKit permission denied - no demo fallback');
          // 权限被拒绝：不使用 demo 数据，显示提示信息
        } else if (healthSteps.state === 'empty') {
          console.log('[Sleep] HealthKit authorized but no steps data');
          // 已授权但无步数数据
        } else if (healthSteps.state === 'error') {
          console.error('[Sleep] HealthKit error:', healthSteps.error);
        }

        // 加载图表数据（可能为空）
        const timesData = getSleepSessionsForChart();
        const debtData = getSleepSessionsForDebtChart();
        const allSessionsData = getAllSleepSessions();
        console.log('[Sleep] Chart data loaded:', {
          timesDataLength: timesData?.length,
          debtDataLength: debtData?.length,
          allSessionsLength: allSessionsData?.length,
        });

        if (timesData) setTimesChartData(timesData);
        if (debtData) setDebtChartData(debtData);
        if (allSessionsData) setAllSessions(allSessionsData);
      } catch (error) {
        console.error('[Sleep] Failed to initialize sleep data:', error);
        setTimesChartData([]);
        setDebtChartData([]);
        setAllSessions([]);
      } finally {
        setIsLoading(false);
      }
    };
    initializeData();
  }, [healthSteps.state, healthSteps.steps]);

  useEffect(() => {
    console.log('[Sleep] sleepSessions changed, updating charts');
    try {
      const timesData = getSleepSessionsForChart();
      const debtData = getSleepSessionsForDebtChart();
      const allSessionsData = getAllSleepSessions();
      console.log('[Sleep] Updated chart data:', {
        timesDataLength: timesData?.length,
        debtDataLength: debtData?.length,
        allSessionsLength: allSessionsData?.length,
      });

      if (timesData) setTimesChartData(timesData);
      if (debtData) setDebtChartData(debtData);
      if (allSessionsData) setAllSessions(allSessionsData);
    } catch (error) {
      console.error('Failed to update sleep data:', error);
    }
  }, [sleepSessions]);


  const processedTimesData = useMemo(() => {
    console.log('[Sleep] Processing times data:', {
      hasTimesChartData: !!timesChartData,
      timesChartDataLength: timesChartData?.length,
    });
    if (!timesChartData || timesChartData.length === 0) return [];

    return timesChartData.map((item) => {
      try {
        const date = new Date(item.date);
        if (isNaN(date.getTime())) {
          console.warn('Invalid date in timesChartData:', item.date);
          return { ...item, fullDate: item.dayLabel || 'Unknown' };
        }
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return {
          ...item,
          fullDate: `${item.dayLabel}, ${months[date.getMonth()]} ${date.getDate()}`,
        };
      } catch (error) {
        console.error('Error processing times data:', error);
        return { ...item, fullDate: item.dayLabel || 'Unknown' };
      }
    });
  }, [timesChartData]);

  const processedDebtData = useMemo(() => {
    console.log('[Sleep] Processing debt data:', {
      hasDebtChartData: !!debtChartData,
      debtChartDataLength: debtChartData?.length,
      sleepNeed,
    });
    if (!debtChartData || debtChartData.length === 0) return [];

    return debtChartData.map((item) => {
      try {
        const date = new Date(item.date);
        if (isNaN(date.getTime())) {
          console.warn('Invalid date in debtChartData:', item.date);
          return null;
        }

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const slept = typeof item.slept === 'number' ? item.slept : 0;
        const debt = sleepNeed - slept;

        if (!isFinite(debt)) {
          console.warn('Invalid debt calculation:', { sleepNeed, slept, debt });
          return null;
        }

        return {
          date: item.date,
          dateLabel: `${date.getMonth() + 1}/${date.getDate()}`,
          fullDate: `${dayNames[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`,
          debt: debt,
          slept: slept,
          sleptDisplay: item.duration || '0h 0m',
        };
      } catch (error) {
        console.error('Error processing debt data:', error, item);
        return null;
      }
    }).filter(item => item !== null);
  }, [debtChartData, sleepNeed]);

  const averageSleep = useMemo(() => {
    if (!processedDebtData || processedDebtData.length === 0) return 0;
    const validData = processedDebtData.filter((item) => item && typeof item.slept === 'number' && item.slept > 0);
    if (validData.length === 0) return 0;
    const total = validData.reduce((sum, item) => sum + item.slept, 0);
    return total / validData.length;
  }, [processedDebtData]);

  const averageDebt = useMemo(() => {
    if (!processedDebtData || processedDebtData.length === 0) return 0;
    const validData = processedDebtData.filter((item) => item && typeof item.debt === 'number' && isFinite(item.debt));
    if (validData.length === 0) return 0;
    const total = validData.reduce((sum, item) => sum + item.debt, 0);
    return total / validData.length;
  }, [processedDebtData]);

  const getTimesMessage = () => {
    if (averageSleep < 6) return '😴 You\'ve been short on sleep lately.';
    if (averageSleep < 8) return '🌙 Your sleep routine is balancing out.';
    return '⚡ You\'re well-rested this week.';
  };

  const getDebtMessage = () => {
    if (averageDebt > 4) return '😴 You\'re heavily sleep-deprived — take a rest soon.';
    if (averageDebt > 2) return '🌙 Mild sleep debt — sleep earlier tonight.';
    return '⚡ Great recovery balance!';
  };

  const getDataSourceInfo = () => {
    // 优先使用 useHealthSteps 状态
    if (Platform.OS === 'ios') {
      if (healthSteps.state === 'denied') {
        return {
          show: true,
          message: '⚠️ 请在 设置→隐私与安全性→健康→应用 中为本应用打开“步数”读取权限',
          type: 'no-permission',
          showButton: true,
        };
      }

      if (healthSteps.state === 'empty') {
        return {
          show: true,
          message: '⚠️ 最近没有步数数据。请随身携带 iPhone 记录步数，然后再次同步。',
          type: 'no-data',
          showButton: true,
        };
      }

      if (healthSteps.state === 'error') {
        return {
          show: true,
          message: `⚠️ 加载 HealthKit 数据失败: ${healthSteps.error || '未知错误'}`,
          type: 'error',
          showButton: true,
        };
      }
    }

    // Android 平台提示
    if (Platform.OS === 'android') {
      return {
        show: true,
        message: '📱 HealthKit 功能仅支持 iOS 设备',
        type: 'platform-unsupported',
      };
    }

    // 检查现有睡眠会话数据
    const hasHealthKitData = sleepSessions.some(s => s.source === 'healthkit');
    const hasInferredData = sleepSessions.some(s => s.source === 'healthkit-inferred');

    if (hasHealthKitData) {
      return {
        show: true,
        message: '📊 来自 HealthKit 的真实数据',
        type: 'healthkit',
      };
    }

    if (hasInferredData) {
      return {
        show: true,
        message: '🔍 从步数推断的睡眠数据',
        type: 'inferred',
      };
    }

    if (sleepSessions.length === 0 && healthSteps.isAuthorized) {
      return {
        show: true,
        message: '⚠️ 暂无睡眠数据。点击同步以获取最新数据。',
        type: 'no-data',
        showButton: true,
      };
    }

    return {
      show: false,
    };
  };

  const handleSyncHealthKit = async () => {
    setIsSyncing(true);
    setSyncMessage('');

    try {
      console.log('[Sleep] Manual sync triggered');

      // 先刷新 HealthKit 步数数据
      await healthSteps.refresh();

      // 再同步睡眠会话
      if (healthSteps.isAuthorized) {
        const result = await syncHealthKitData();

        if (result.success) {
          setSyncMessage(`已同步 ${result.count || 0} 条睡眠记录`);
        } else {
          setSyncMessage(result.message || '同步失败');
        }
      } else {
        setSyncMessage('请先授予 HealthKit 步数读取权限');
      }
    } catch (error) {
      console.error('[Sleep] Error syncing HealthKit:', error);
      setSyncMessage('同步 HealthKit 数据失败');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(''), 3000);
    }
  };

  const dateRange = useMemo(() => {
    if (!timesChartData || timesChartData.length === 0) return '';
    try {
      const firstDate = new Date(timesChartData[0].date);
      const lastDate = new Date(timesChartData[timesChartData.length - 1].date);

      if (isNaN(firstDate.getTime()) || isNaN(lastDate.getTime())) {
        return '';
      }

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[firstDate.getMonth()]} ${firstDate.getDate()}–${lastDate.getDate()}`;
    } catch (error) {
      console.error('Error calculating date range:', error);
      return '';
    }
  }, [timesChartData]);

  if (isLoading) {
    return (
      <LinearGradient colors={['#0E0E10', '#18181B']} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9D7AFF" />
            <Text style={styles.loadingText}>Loading sleep data...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0E0E10', '#18181B']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.title}>My Progress</Text>
                <Text style={styles.dateRange}>{dateRange}</Text>
              </View>
              <TouchableOpacity
                style={styles.syncButton}
                onPress={handleSyncHealthKit}
                disabled={isSyncing}
                activeOpacity={0.7}
              >
                {isSyncing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.syncButtonText}>🔄 Sync HealthKit</Text>
                )}
              </TouchableOpacity>
            </View>
            {syncMessage ? (
              <Text style={styles.syncMessage}>{syncMessage}</Text>
            ) : null}
            {getDataSourceInfo().show && (
              <View>
                <View style={[
                  styles.dataSourceBanner,
                  getDataSourceInfo().type === 'demo' && styles.dataSourceBannerDemo,
                  getDataSourceInfo().type === 'no-permission' && styles.dataSourceBannerWarning,
                  getDataSourceInfo().type === 'no-data' && styles.dataSourceBannerWarning,
                ]}>
                  <Text style={styles.dataSourceText}>{getDataSourceInfo().message}</Text>
                </View>
                {getDataSourceInfo().showButton && (
                  <TouchableOpacity
                    style={styles.openHealthButton}
                    onPress={handleSyncHealthKit}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.openHealthButtonText}>Open Health Permissions</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <View style={styles.tabContainer}>
            <BlurView intensity={20} tint="dark" style={styles.tabBlur}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'times' && styles.tabActive]}
                onPress={() => setActiveTab('times')}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, activeTab === 'times' && styles.tabTextActive]}>
                  Sleep Times
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'debt' && styles.tabActive]}
                onPress={() => setActiveTab('debt')}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, activeTab === 'debt' && styles.tabTextActive]}>
                  Sleep Debt
                </Text>
              </TouchableOpacity>
            </BlurView>
          </View>

          <View style={styles.chartSection}>
            {activeTab === 'times' ? (
              <>
                <SleepTimesChart data={processedTimesData} chartWidth={CHART_WIDTH} />
                <Text style={styles.chartMessage}>{getTimesMessage()}</Text>
              </>
            ) : (
              <>
                <SleepDebtChart
                  data={processedDebtData}
                  sleepNeed={sleepNeed}
                  chartWidth={CHART_WIDTH}
                />
                <Text style={styles.chartMessage}>{getDebtMessage()}</Text>
              </>
            )}
          </View>

          <View style={styles.listSection}>
            <Text style={styles.listTitle}>All Sleep Times</Text>

            {!allSessions || allSessions.length === 0 ? (
              <Text style={styles.emptyText}>No sleep records yet. Sync HealthKit to load your sleep data.</Text>
            ) : (
              allSessions.map((item, index) => {
                try {
                  const date = new Date(item.date);
                  if (isNaN(date.getTime())) {
                    console.warn('Invalid date in allSessions:', item.date);
                    return null;
                  }

                  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  const label = item.isLastNight ? 'Last night' : dayNames[date.getDay()];

                  // Log for debugging - shows we're using real data
                  if (index === 0) {
                    console.log('[Sleep] Rendering session:', {
                      source: item.source,
                      sleepTime: item.sleepTime,
                      wakeTime: item.wakeTime,
                      duration: item.duration
                    });
                  }

                  return (
                    <View key={`${item.date}-${index}`} style={styles.listItem}>
                      <View style={styles.listItemLeft}>
                        <Text style={styles.listItemLabel}>{label}</Text>
                        <Text style={styles.listItemTime}>
                          {item.sleepTime || '--:--'} – {item.wakeTime || '--:--'}
                        </Text>
                      </View>
                      <Text style={styles.listItemDuration}>{item.duration || '0h 0m'}</Text>
                    </View>
                  );
                } catch (error) {
                  console.error('Error rendering session:', error, item);
                  return null;
                }
              })
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <SleepActionBar />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingTop: 40 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 16,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  dateRange: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  syncButton: {
    backgroundColor: '#9D7AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  syncMessage: {
    fontSize: 12,
    color: '#48E0C2',
    marginTop: 8,
    textAlign: 'center',
  },
  dataSourceBanner: {
    backgroundColor: 'rgba(157, 122, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(157, 122, 255, 0.3)',
  },
  dataSourceBannerDemo: {
    backgroundColor: 'rgba(255, 184, 140, 0.2)',
    borderColor: 'rgba(255, 184, 140, 0.3)',
  },
  dataSourceBannerWarning: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  dataSourceText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  openHealthButton: {
    backgroundColor: '#9D7AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  openHealthButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tabContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  tabBlur: {
    flexDirection: 'row',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 4,
  },
  tab: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: '#9D7AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  chartSection: {
    paddingHorizontal: 0,
    marginBottom: 48,
  },
  chartMessage: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 16,
    textAlign: 'center',
  },
  listSection: {
    paddingHorizontal: 20,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  listItemLeft: {
    flex: 1,
  },
  listItemLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
    marginBottom: 4,
  },
  listItemTime: {
    fontSize: 13,
    color: '#A0A0A0',
  },
  listItemDuration: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    paddingVertical: 24,
  },
  bottomSpacer: {
    height: 100,
  },
});
