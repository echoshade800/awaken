import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, AppState, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Activity, Shield, Settings } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { checkStepPermission, requestStepPermission } from '../../lib/healthPermissions';

export default function StepPermissionScreen() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [permissionStatus, setPermissionStatus] = useState('unknown');

  useEffect(() => {
    console.log('[StepPermission] Component mounted, Platform:', Platform.OS);
    checkInitialPermission();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const checkInitialPermission = async () => {
    try {
      const status = await checkStepPermission();
      console.log('[StepPermission] Initial permission status:', status);
      setPermissionStatus(status);

      if (status === 'granted') {
        console.log('[StepPermission] Permission already granted, proceeding...');
        router.replace('/onboarding/initializing');
      }
    } catch (error) {
      console.error('[StepPermission] Error checking initial permission:', error);
      setPermissionStatus('denied');
    }
  };

  const handleAppStateChange = async (nextAppState) => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('[StepPermission] App returned to foreground, rechecking permission...');
      await recheckPermissionStatus();
    }
    setAppState(nextAppState);
  };

  const recheckPermissionStatus = async () => {
    setIsChecking(true);
    try {
      const status = await checkStepPermission();
      console.log('[StepPermission] Recheck permission status:', status);
      setPermissionStatus(status);

      if (status === 'granted') {
        console.log('[StepPermission] Permission now granted, navigating to initializing...');
        router.replace('/onboarding/initializing');
      } else {
        setIsChecking(false);
      }
    } catch (error) {
      console.error('[StepPermission] Error rechecking permission:', error);
      setIsChecking(false);
    }
  };

  const handleOpenSettings = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else if (Platform.OS === 'android') {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('[StepPermission] Error opening settings:', error);
    }
  };

  const handleAllowAccess = async () => {
    console.log('[StepPermission] handleAllowAccess called');

    if (Platform.OS === 'web') {
      console.log('[StepPermission] Web platform, proceeding to initializing');
      router.replace('/onboarding/initializing');
      return;
    }

    setIsChecking(true);

    try {
      const status = await requestStepPermission();
      console.log('[StepPermission] Request permission result:', status);
      setPermissionStatus(status);

      if (status === 'granted') {
        console.log('[StepPermission] Permission granted, proceeding to initializing');
        router.replace('/onboarding/initializing');
      } else {
        console.log('[StepPermission] Permission denied, showing settings option');
        setIsChecking(false);
      }
    } catch (error) {
      console.error('[StepPermission] Error requesting permission:', error);
      setPermissionStatus('denied');
      setIsChecking(false);
    }
  };

  const handleIveEnabledIt = async () => {
    console.log('[StepPermission] User claims to have enabled permission, rechecking...');
    await recheckPermissionStatus();
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
            <Activity size={48} color="#9D7AFF" strokeWidth={2} />
          </View>
        </View>

        <Text style={styles.title}>Help Awaken understand your rhythm</Text>

        <Text style={styles.subtitle}>
          We use your step data to estimate your sleep and build your circadian rhythm.
        </Text>

        <View style={styles.securityCard}>
          <Shield size={20} color="#6B7C99" />
          <Text style={styles.securityText}>
            We only read step counts – no personal data or location is collected.
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
            <Text style={styles.featureText}>Build your unique circadian rhythm</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Track sleep debt over time</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {isChecking ? (
            <View style={styles.checkingContainer}>
              <Text style={styles.checkingText}>Checking permissions...</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleAllowAccess}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#9D7AFF', '#B899FF', '#C9B3FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryButtonGradient}
                >
                  <Text style={styles.primaryButtonText}>Allow Access</Text>
                </LinearGradient>
              </TouchableOpacity>

              {permissionStatus === 'denied' && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleOpenSettings}
                  activeOpacity={0.8}
                >
                  <Settings size={18} color="#6B7C99" />
                  <Text style={styles.secondaryButtonText}>Open Settings</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.linkButton}
                onPress={handleIveEnabledIt}
                activeOpacity={0.7}
              >
                <Text style={styles.linkButtonText}>I've Enabled It</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {Platform.OS === 'ios' && (
          <Text style={styles.helpText}>
            Need help? Go to Settings → Privacy & Security → Health → Awaken
          </Text>
        )}
        {Platform.OS === 'android' && (
          <Text style={styles.helpText}>
            Need help? Go to Settings → Apps → Permissions → Physical activity
          </Text>
        )}
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
    shadowColor: '#9D7AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(157, 122, 255, 0.2)',
  },
  securityText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7C99',
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
    backgroundColor: '#9D7AFF',
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  checkingContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  primaryButton: {
    borderRadius: 20,
    shadowColor: '#9D7AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 20,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(107, 124, 153, 0.3)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7C99',
  },
  linkButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textDecorationLine: 'underline',
  },
  helpText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 18,
  },
});
