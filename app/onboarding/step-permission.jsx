import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, AppState, Platform, Linking } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Activity, Shield, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { bootstrapSleepFromHealthKit } from '../../lib/sleepInference';
import useStore from '../../lib/store';
import StorageUtils from '../../lib/StorageUtils';

export default function StepPermissionScreen() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [isDenied, setIsDenied] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);

  const requestHealthKitPermission = useStore((state) => state.requestHealthKitPermission);
  const checkHealthKitPermission = useStore((state) => state.checkHealthKitPermission);

  useEffect(() => {
    console.log('[StepPermission] Component mounted, Platform:', Platform.OS);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isDenied) {
        checkPermissionStatus();
      }
    }, [isDenied])
  );

  const handleAppStateChange = async (nextAppState) => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      await checkPermissionStatus();
    }
    setAppState(nextAppState);
  };

  const bootstrapAndNavigate = async () => {
    console.log('[StepPermission] Attempting to bootstrap sleep data from HealthKit...');
    const result = await bootstrapSleepFromHealthKit();

    if (result.success && result.sessions.length > 0) {
      console.log('[StepPermission] Successfully bootstrapped', result.sessions.length, 'sleep sessions');

      // Save sessions to storage and update store
      await StorageUtils.saveSleepSessions(result.sessions);
      const store = useStore.getState();
      store.sleepSessions = result.sessions;

      console.log('[StepPermission] Sessions saved to storage');
      router.replace('/onboarding/initializing');
    } else {
      console.warn('[StepPermission] Failed to bootstrap or no sessions:', result.message);
      // Continue anyway - user can sync later from Sleep page
      router.replace('/onboarding/initializing');
    }
  };

  const checkPermissionStatus = async () => {
    setIsChecking(true);
    try {
      const granted = await checkHealthKitPermission();
      console.log('[StepPermission] Permission status:', granted);
      console.log('[StepPermission] Platform:', Platform.OS);

      if (granted) {
        console.log('[StepPermission] Permission granted, bootstrapping...');
        setIsDenied(false);
        await bootstrapAndNavigate();
      } else {
        console.log('[StepPermission] Permission not granted, showing buttons');
        setIsDenied(false);
        setIsChecking(false);
      }
    } catch (error) {
      console.error('[StepPermission] Error checking permission:', error);
      setIsDenied(false);
      setIsChecking(false);
    }
  };

  const handleOpenHealthApp = async () => {
    try {
      await Linking.openURL('x-apple-health://');
    } catch (error) {
      console.error('Error opening Health app:', error);
    }
  };

  const handleOpenSettings = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openSettings();
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('Error opening settings:', error);
    }
  };

  const handleCheckPermission = async () => {
    console.log('[StepPermission] handleCheckPermission called - User confirmed permission enabled');
    setIsChecking(true);
    try {
      await bootstrapAndNavigate();
    } catch (error) {
      console.error('[StepPermission] Error during check:', error);
      setIsChecking(false);
    }
  };

  const handleRequestPermission = async () => {
    console.log('[StepPermission] handleRequestPermission called');
    if (Platform.OS === 'web') {
      console.log('[StepPermission] Web platform, navigating to initializing');
      router.replace('/onboarding/initializing');
      return;
    }
    setIsChecking(true);
    setIsDenied(false);
    try {
      const granted = await requestHealthKitPermission();
      console.log('[StepPermission] Request permission result:', granted);

      if (granted) {
        await bootstrapAndNavigate();
      } else {
        console.log('[StepPermission] Permission denied, showing denied state');
        setIsDenied(true);
        setIsChecking(false);
      }
    } catch (error) {
      console.error('[StepPermission] Error requesting permission:', error);
      setIsDenied(true);
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

        <Text style={styles.title}>Enable Steps Access</Text>

        <Text style={styles.subtitle}>
          We analyze your step patterns to estimate past sleep and personalize your rhythm.
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

        <Text style={styles.helpText}>
          Need help? Go to Settings → Privacy & Security → Health → Awaken
        </Text>

        <View style={styles.buttonContainer}>
          {isChecking ? (
            <View style={styles.checkingContainer}>
              <Text style={styles.checkingText}>Checking permissions...</Text>
            </View>
          ) : isDenied ? (
            <>
              <View style={styles.deniedContainer}>
                <Text style={styles.deniedText}>
                  Permission was denied. Please enable Steps access in Health app or Settings.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleOpenHealthApp}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>
                  Open Health App
                </Text>
                <ChevronRight size={20} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleOpenSettings}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>
                  Open Settings
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={checkPermissionStatus}
                activeOpacity={0.8}
              >
                <Text style={styles.retryButtonText}>
                  I've Enabled It
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleRequestPermission}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>
                  Allow in Health
                </Text>
                <ChevronRight size={20} color="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.replace('/onboarding/initializing')}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>
                  Not Now
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
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
    marginTop: 20,
  },
  checkingContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkingText: {
    fontSize: 16,
    color: '#4A5F8F',
    fontWeight: '500',
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
  deniedContainer: {
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  deniedText: {
    fontSize: 14,
    color: '#4A5F8F',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: 'rgba(157, 122, 255, 0.2)',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(157, 122, 255, 0.4)',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9D7AFF',
  },
});
