import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, AppState, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Activity, Shield, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { checkStepPermission, requestStepPermission } from '../../lib/healthPermissions';

export default function StepPermissionScreen() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = async (nextAppState) => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      await checkPermissionStatus();
    }
    setAppState(nextAppState);
  };

  const checkPermissionStatus = async () => {
    setIsChecking(true);
    try {
      const status = await checkStepPermission();
      if (status === 'granted') {
        router.push('/onboarding/initializing');
      }
    } catch (error) {
      console.error('Error checking permission:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleOpenSettings = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('Error opening settings:', error);
    }
  };

  const handleCheckPermission = async () => {
    await checkPermissionStatus();
  };

  const handleRequestPermission = async () => {
    setIsChecking(true);
    try {
      const status = await requestStepPermission();
      if (status === 'granted') {
        router.push('/onboarding/initializing');
      } else {
        await handleOpenSettings();
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      await handleOpenSettings();
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#3D5A80', '#5A7BA5', '#7A9BC4', '#FFB88C', '#E8F4FF', '#F0F8FF', '#FAFCFF']}
        locations={[0, 0.25, 0.4, 0.5, 0.65, 0.82, 1]}
        style={styles.backgroundGradient}
      />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Activity size={48} color="#FF9A76" strokeWidth={2} />
          </View>
        </View>

        <Text style={styles.title}>Allow Health Access to Continue</Text>

        <Text style={styles.subtitle}>
          Awaken needs step data to understand your sleep and circadian rhythm.
        </Text>

        <View style={styles.securityCard}>
          <Shield size={20} color="#4A5F8F" />
          <Text style={styles.securityText}>
            We only read step counts — no personal data or location is collected.
          </Text>
        </View>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Detect your sleep patterns automatically</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Calculate your personal sleep need</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Track your circadian rhythm</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleRequestPermission}
            disabled={isChecking}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              {isChecking ? 'Checking...' : 'Grant Permission'}
            </Text>
            <ChevronRight size={20} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleCheckPermission}
            disabled={isChecking}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>
              I've Enabled It
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.helpText}>
          Need help? Go to Settings → Privacy → Health → Awaken
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF9A76',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1A2845',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    color: '#4A5F8F',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(74, 95, 143, 0.2)',
  },
  securityText: {
    flex: 1,
    fontSize: 14,
    color: '#4A5F8F',
    lineHeight: 20,
  },
  featureList: {
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
    backgroundColor: '#FF9A76',
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: '#4A5F8F',
    lineHeight: 22,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9A76',
    paddingVertical: 16,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#FF9A76',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(74, 95, 143, 0.3)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A5F8F',
  },
  helpText: {
    fontSize: 13,
    color: '#8B9BAE',
    textAlign: 'center',
    lineHeight: 18,
  },
});
