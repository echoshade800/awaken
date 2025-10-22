import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useMemo, useEffect } from 'react';
import { BlurView } from 'expo-blur';
import SleepTimesChart from '@/components/SleepTimesChart';
import SleepDebtChart from '@/components/SleepDebtChart';
import SleepActionBar from '@/components/SleepActionBar';
import useStore from '@/lib/store';
import { getSleepData, formatSleepDuration, formatTime } from '@/lib/sleepInference';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH;

const mockSleepData = [
  { date: '2025-10-14', sleepTime: '00:25', wakeTime: '07:07', slept: 6.7 },
  { date: '2025-10-15', sleepTime: '23:45', wakeTime: '06:30', slept: 6.75 },
  { date: '2025-10-16', sleepTime: '01:15', wakeTime: '07:00', slept: 5.75 },
  { date: '2025-10-17', sleepTime: '00:00', wakeTime: '08:15', slept: 8.25 },
  { date: '2025-10-18', sleepTime: '23:30', wakeTime: '06:45', slept: 7.25 },
  { date: '2025-10-19', sleepTime: '00:50', wakeTime: '06:20', slept: 5.5 },
  { date: '2025-10-20', sleepTime: '23:20', wakeTime: '07:30', slept: 8.17 },
];

export default function SleepScreen() {
  const [activeTab, setActiveTab] = useState('times');
  const sleepNeed = useStore((state) => state.sleepNeed);
  const getSleepSessionsForChart = useStore((state) => state.getSleepSessionsForChart);
  const getAllSleepSessions = useStore((state) => state.getAllSleepSessions);
  const sleepSessions = useStore((state) => state.sleepSessions);

  const [chartData, setChartData] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [inferredSleepNeed, setInferredSleepNeed] = useState(8);

  useEffect(() => {
    loadSleepDataFromStorage();
    setChartData(getSleepSessionsForChart());
    setAllSessions(getAllSleepSessions());
  }, [sleepSessions]);

  const loadSleepDataFromStorage = async () => {
    const data = await getSleepData();
    if (data && data.sleepSeries) {
      setInferredSleepNeed(data.sleepNeedMin / 60);

      const formattedData = data.sleepSeries.slice(-7).map(session => {
        const date = new Date(session.date);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        return {
          date: session.date,
          dayLabel: dayNames[date.getDay()],
          sleepTime: formatTime(session.startISO),
          wakeTime: formatTime(session.endISO),
          duration: formatSleepDuration(session.durationMin),
          slept: session.durationMin / 60,
        };
      });

      if (formattedData.length > 0) {
        setChartData(formattedData);
      }
    }
  };

  const processedTimesData = chartData.map((item) => {
    const date = new Date(item.date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      ...item,
      fullDate: `${item.dayLabel}, ${months[date.getMonth()]} ${date.getDate()}`,
    };
  });

  const processedDebtData = useMemo(() => {
    return chartData.map((item) => {
      const date = new Date(item.date);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const slept = item.slept || 0;
      const currentSleepNeed = inferredSleepNeed || sleepNeed;
      const debt = currentSleepNeed - slept;

      return {
        date: item.date,
        dateLabel: `${date.getMonth() + 1}/${date.getDate()}`,
        fullDate: `${dayNames[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`,
        debt: debt,
        slept: slept,
        sleptDisplay: item.duration || '0h 0m',
      };
    });
  }, [chartData, sleepNeed]);

  const averageSleep = useMemo(() => {
    const validData = processedDebtData.filter((item) => item.slept > 0);
    if (validData.length === 0) return 0;
    const total = validData.reduce((sum, item) => sum + item.slept, 0);
    return total / validData.length;
  }, [processedDebtData]);

  const averageDebt = useMemo(() => {
    const total = processedDebtData.reduce((sum, item) => sum + item.debt, 0);
    return total / processedDebtData.length;
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

  const dateRange = useMemo(() => {
    if (chartData.length === 0) return '';
    const firstDate = new Date(chartData[0].date);
    const lastDate = new Date(chartData[chartData.length - 1].date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return `${months[firstDate.getMonth()]} ${firstDate.getDate()}–${lastDate.getDate()}`;
  }, [chartData]);

  return (
    <LinearGradient colors={['#0E0E10', '#18181B']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>My Progress</Text>
            <Text style={styles.dateRange}>{dateRange}</Text>
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

            {allSessions.length === 0 ? (
              <Text style={styles.emptyText}>No sleep records yet. Add your first sleep session below.</Text>
            ) : (
              allSessions.map((item, index) => {
                const date = new Date(item.date);
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

                const label = item.isLastNight ? 'Last night' : dayNames[date.getDay()];

                return (
                  <View key={`${item.date}-${index}`} style={styles.listItem}>
                    <View style={styles.listItemLeft}>
                      <Text style={styles.listItemLabel}>{label}</Text>
                      <Text style={styles.listItemTime}>
                        {item.sleepTime} – {item.wakeTime}
                      </Text>
                    </View>
                    <Text style={styles.listItemDuration}>{item.duration}</Text>
                  </View>
                );
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
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
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
