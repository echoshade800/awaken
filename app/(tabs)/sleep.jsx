import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import SegmentedControl from '../../components/SegmentedControl';
import SleepTimesChart from '../../components/SleepTimesChart';
import SleepDebtChart from '../../components/SleepDebtChart';
import SleepTimesList from '../../components/SleepTimesList';

export default function SleepScreen() {
  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <LinearGradient colors={['#0D0D0F', '#1A1A1D']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>My Progress</Text>
            <Text style={styles.dateRange}>Nov 13–26</Text>
          </View>

          <SegmentedControl
            options={['Sleep Times', 'Sleep Debt']}
            selectedIndex={selectedTab}
            onSelect={setSelectedTab}
          />

          {selectedTab === 0 ? <SleepTimesChart /> : <SleepDebtChart />}

          <SleepTimesList />
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingTop: 20,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  dateRange: {
    fontSize: 16,
    color: '#A9AFB6',
    fontWeight: '500',
  },
});
