import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useMemo, useEffect } from 'react';
import { BlurView } from 'expo-blur';
import SleepTimesChart from '../../components/SleepTimesChart';
import SleepDebtChart from '../../components/SleepDebtChart';
import SleepActionBar from '../../components/SleepActionBar';
import useStore from '../../lib/store';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH;

export default function SleepScreen() {
  const [activeTab, setActiveTab] = useState('times');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const sleepNeed = useStore((state) => state.sleepNeed);
  const getSleepSessionsForChart = useStore((state) => state.getSleepSessionsForChart);
  const getSleepSessionsForDebtChart = useStore((state) => state.getSleepSessionsForDebtChart);
  const getAllSleepSessions = useStore((state) => state.getAllSleepSessions);
  const sleepSessions = useStore((state) => state.sleepSessions);
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
      setIsLoading(true);
      try {
        // Check if we have HealthKit permission
        const hasPermission = await checkHealthKitPermission();
        console.log('[Sleep] HealthKit permission:', hasPermission);

        if (hasPermission) {
          // Try to sync HealthKit data first
          console.log('[Sleep] Syncing HealthKit data on mount...');
          const syncResult = await syncHealthKitData();
          console.log('[Sleep] Sync result:', syncResult);
        } else {
          // Fall back to demo data if no HealthKit access
          await insertDemoSleepData();
        }

        // Load chart data
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
        console.error('Failed to initialize sleep data:', error);
        setTimesChartData([]);
        setDebtChartData([]);
        setAllSessions([]);
      } finally {
        setIsLoading(false);
      }
    };
    initializeData();
  }, []);

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

  const handleSyncHealthKit = async () => {
    setIsSyncing(true);
    setSyncMessage('');

    try {
      // Check if permission is already granted
      const hasPermission = await checkHealthKitPermission();

      if (!hasPermission) {
        // Request permission
        const granted = await requestHealthKitPermission();
        if (!granted) {
          setSyncMessage('HealthKit permission denied');
          setIsSyncing(false);
          return;
        }
      }

      // Sync data
      const result = await syncHealthKitData();

      if (result.success) {
        setSyncMessage(`Synced ${result.count} sleep sessions from HealthKit`);
      } else {
        setSyncMessage(result.message || 'Sync failed');
      }
    } catch (error) {
      console.error('Error syncing HealthKit:', error);
      setSyncMessage('Error syncing HealthKit data');
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
              <Text style={styles.emptyText}>No sleep records yet. Add your first sleep session below.</Text>
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
  safeArea: { flex: 1, paddingTop: 20 },
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
