import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
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

  const handleRequestPermission = async () => {
    setIsRequesting(true);

    try {
      const granted = await requestHealthPermission();

      if (granted) {
        await syncHealthData();
        router.replace('/onboarding/loading');
      } else {
        setIsRequesting(false);
      }
    } catch (error) {
      console.error('Permission request error:', error);
      setIsRequesting(false);
    }
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
            <TouchableOpacity style={styles.primaryButton} onPress={handleRequestPermission}>
              <Text style={styles.primaryButtonText}>Allow Health Access</Text>
            </TouchableOpacity>
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
  privacyNote: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
