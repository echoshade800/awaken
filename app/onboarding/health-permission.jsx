import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react-native';
import useStore from '@/lib/store';
import StarBackground from '@/components/StarBackground';

export default function HealthPermissionScreen() {
  const router = useRouter();
  const [isRequesting, setIsRequesting] = useState(false);
  const requestHealthPermission = useStore((state) => state.requestHealthPermission);
  const syncHealthData = useStore((state) => state.syncHealthData);

  useEffect(() => {
    if (Platform.OS === 'web') {
      console.log('[Health Permission] Web platform detected - health features not available');
    }
  }, []);

  const handleRequestPermission = async () => {
    console.log('[Health Permission] Request button pressed');
    setIsRequesting(true);

    try {
      if (Platform.OS === 'web') {
        console.log('[Health Permission] Web platform - skipping to loading');
        Alert.alert(
          'Demo Mode',
          'Health tracking requires iOS or Android. Continuing with demo data.',
          [{ text: 'OK', onPress: () => router.replace('/onboarding/loading') }]
        );
        setIsRequesting(false);
        return;
      }

      console.log('[Health Permission] Requesting permission...');
      const granted = await requestHealthPermission();
      console.log('[Health Permission] Permission result:', granted);

      if (granted) {
        console.log('[Health Permission] Permission granted, syncing data...');
        await syncHealthData();
        console.log('[Health Permission] Data synced, navigating to loading...');
        router.replace('/onboarding/loading');
      } else {
        console.log('[Health Permission] Permission denied');
        Alert.alert(
          'Permission Required',
          'Health access is needed to track your sleep. Please allow access in Settings.',
          [
            { text: 'Skip for Now', onPress: () => router.replace('/onboarding/loading') },
            { text: 'Try Again', onPress: () => setIsRequesting(false) }
          ]
        );
        setIsRequesting(false);
      }
    } catch (error) {
      console.error('[Health Permission] Error:', error);
      Alert.alert(
        'Error',
        'Could not request health permission. Continue with limited features?',
        [
          { text: 'Continue', onPress: () => router.replace('/onboarding/loading') },
          { text: 'Retry', onPress: () => setIsRequesting(false) }
        ]
      );
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    console.log('[Health Permission] Skip button pressed');
    router.replace('/onboarding/loading');
  };

  return (
    <View style={styles.container}>
      <StarBackground />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Activity size={64} color="#6366f1" strokeWidth={2} />
        </View>

        <Text style={styles.title}>Allow Health Access</Text>

        <Text style={styles.description}>
          Awaken analyzes your step patterns to estimate your sleep and build your unique energy rhythm.
          {'\n\n'}
          We only read step counts from the last 14 days to calculate your sleep schedule.
        </Text>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Automatic sleep detection from step data</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Personalized sleep need calculation</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Real-time circadian rhythm tracking</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {isRequesting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>Requesting permission...</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity style={styles.primaryButton} onPress={handleRequestPermission}>
                <Text style={styles.primaryButtonText}>Allow Health Access</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={handleSkip}>
                <Text style={styles.secondaryButtonText}>Skip for Now</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={styles.privacyNote}>
          Your health data stays on your device and is never shared with anyone.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 32,
  },
  featureList: {
    width: '100%',
    marginBottom: 40,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366f1',
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  primaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  privacyNote: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
