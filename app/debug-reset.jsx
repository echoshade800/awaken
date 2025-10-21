import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import useStore from '@/lib/store';
import StorageUtils from '@/lib/StorageUtils';

export default function DebugResetScreen() {
  const router = useRouter();
  const addSleepSession = useStore((state) => state.addSleepSession);
  const sleepSessions = useStore((state) => state.sleepSessions);

  const handleReset = async () => {
    try {
      await AsyncStorage.clear();
      console.log('[Debug] AsyncStorage cleared');
      alert('Storage cleared! Reloading app...');
      router.replace('/');
    } catch (error) {
      console.error('[Debug] Failed to clear storage:', error);
      alert('Failed to clear storage: ' + error.message);
    }
  };

  const handleViewStorage = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      console.log('[Debug] Current storage:', items);
      alert('Check console for storage contents');
    } catch (error) {
      console.error('[Debug] Failed to view storage:', error);
    }
  };

  const addSampleData = async () => {
    const today = new Date();
    const sampleSessions = [
      {
        id: Date.now().toString() + '-1',
        date: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        bedtimeISO: '23:30',
        waketimeISO: '07:15',
        durationMin: 465,
        source: 'manual',
      },
      {
        id: Date.now().toString() + '-2',
        date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        bedtimeISO: '00:15',
        waketimeISO: '06:45',
        durationMin: 390,
        source: 'manual',
      },
      {
        id: Date.now().toString() + '-3',
        date: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        bedtimeISO: '23:45',
        waketimeISO: '08:00',
        durationMin: 495,
        source: 'manual',
      },
      {
        id: Date.now().toString() + '-4',
        date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        bedtimeISO: '00:00',
        waketimeISO: '07:30',
        durationMin: 450,
        source: 'manual',
      },
      {
        id: Date.now().toString() + '-5',
        date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        bedtimeISO: '23:20',
        waketimeISO: '06:50',
        durationMin: 450,
        source: 'manual',
      },
      {
        id: Date.now().toString() + '-6',
        date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        bedtimeISO: '00:30',
        waketimeISO: '07:00',
        durationMin: 390,
        source: 'manual',
      },
    ];

    for (const session of sampleSessions) {
      await addSleepSession(session);
    }

    Alert.alert('Success', 'Added 6 days of sample sleep data');
  };

  const clearSleepData = async () => {
    await StorageUtils.saveSleepSessions([]);
    Alert.alert('Success', 'Cleared all sleep data');
    router.replace('/sleep');
  };

  return (
    <LinearGradient colors={['#0E0E10', '#18181B']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Debug Tools</Text>
          <Text style={styles.subtitle}>Reset app state for testing</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sleep Data</Text>
            <Text style={styles.info}>Current sessions: {sleepSessions.length}</Text>

            <TouchableOpacity style={styles.button} onPress={addSampleData}>
              <Text style={styles.buttonText}>Add Sample Data (6 days)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearSleepData}>
              <Text style={styles.buttonText}>Clear Sleep Data</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleReset}>
            <Text style={styles.buttonText}>Clear All Storage</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleViewStorage}>
            <Text style={styles.buttonText}>View Storage (Console)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
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
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  info: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#9D7AFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  dangerButton: {
    backgroundColor: '#FF6B6B',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
