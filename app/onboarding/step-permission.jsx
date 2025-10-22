import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, AppState, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Activity, Shield } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { checkStepPermission, requestStepPermission } from '../../lib/healthPermissions';

export default function StepPermissionScreen() {
  const router = useRouter();
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    console.log('[StepPermission] Component mounted, Platform:', Platform.OS);
    checkCurrentPermission();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = async (nextAppState) => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('[StepPermission] App returned to foreground, rechecking permission');
      await checkCurrentPermission();
    }
    setAppState(nextAppState);
  };

  const checkCurrentPermission = async () => {
    setIsChecking(true);
    try {
      const status = await checkStepPermission();
      console.log('[StepPermission] Permission status:', status);
      setPermissionStatus(status);

      if (status === 'granted') {
        console.log('[StepPermission] Permission granted, proceeding to initialization');
        router.replace('/onboarding/initializing');
      }
    } catch (error) {
      console.error('[StepPermission] Error checking permission:', error);
      setPermissionStatus('unavailable');
    } finally {
      setIsChecking(false);
    }
  };

  const handleAllowAccess = async () => {
    console.log('[StepPermission] User tapped Allow Access');
    setIsChecking(true);

    try {
      const status = await requestStepPermission();
      console.log('[StepPermission] Permission request result:', status);
      setPermissionStatus(status);

      if (status === 'granted') {
        console.log('[StepPermission] Permission granted, proceeding to initialization');
        router.replace('/onboarding/initializing');
      } else {
        console.log('[StepPermission] Permission denied, staying on this screen');
      }
    } catch (error) {
      console.error('[StepPermission] Error requesting permission:', error);
      setPermissionStatus('denied');
    } finally {
      setIsChecking(false);
    }
  };

  const handleOpenSettings = async () => {
    console.log('[StepPermission] Opening system settings');
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

  const handleIveEnabledIt = async () => {
    console.log('[StepPermission] User claims to have enabled permission, rechecking...');
    await checkCurrentPermission();
  };

  const showOpenSettingsButton = permissionStatus === 'denied' || permissionStatus === 'unavailable';

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
            <Activity size={52} color="#FF9A76" strokeWidth={2.5} />
          </View>
        </View>

        <Text style={styles.title}>Help Awaken understand your rhythm</Text>

        <Text style={styles.subtitle}>
          We use your step data to estimate your sleep and build your circadian rhythm.
        </Text>

        <View style={styles.securityCard}>
          <Shield size={22} color="#4A5F8F" strokeWidth={2} />
          <Text style={styles.securityText}>
            We only read step counts – no personal data or location is collected.
          </Text>
        </View>

        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>What we'll detect:</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <View style={styles.benefitDot} />
              <Text style={styles.benefitText}>Your natural sleep patterns</Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitDot} />
              <Text style={styles.benefitText}>Personal sleep need calculation</Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitDot} />
              <Text style={styles.benefitText}>Real-time circadian rhythm tracking</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {isChecking ? (
            <View style={styles.checkingContainer}>
              <Text style={styles.checkingText}>Checking permissions...</Text>
            </View>
          ) : (
            <>
              {!showOpenSettingsButton ? (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleAllowAccess}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#FF9A76', '#FFB08C', '#FFC5A2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryButtonGradient}
                  >
                    <Text style={styles.primaryButtonText}>Allow Access</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleOpenSettings}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#FF9A76', '#FFB08C', '#FFC5A2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryButtonGradient}
                  >
                    <Text style={styles.primaryButtonText}>Open Settings</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {showOpenSettingsButton && (
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={handleIveEnabledIt}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkButtonText}>I've Enabled It</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {showOpenSettingsButton && (
          <View style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>How to enable:</Text>
            <Text style={styles.instructionText}>
              {Platform.OS === 'ios'
                ? '1. Open the Health app\n2. Tap your profile icon (top right)\n3. Privacy → Apps → Awaken\n4. Enable "Steps" permission\n5. Return here and tap "I\'ve Enabled It"'
                : '1. Open Settings\n2. Apps → Awaken\n3. Permissions → Physical Activity\n4. Allow access\n5. Return here and tap "I\'ve Enabled It"'}
            </Text>
          </View>
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
    paddingHorizontal: 28,
    paddingTop: 70,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF9A76',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A2845',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    color: '#4A5F8F',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 18,
    borderRadius: 18,
    marginBottom: 28,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(74, 95, 143, 0.15)',
    shadowColor: '#4A5F8F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  securityText: {
    flex: 1,
    fontSize: 14,
    color: '#4A5F8F',
    lineHeight: 21,
    fontWeight: '500',
  },
  benefitsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    padding: 20,
    borderRadius: 18,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 154, 118, 0.2)',
  },
  benefitsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A5F8F',
    marginBottom: 14,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF9A76',
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: '#4A5F8F',
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 14,
    marginBottom: 20,
  },
  checkingContainer: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  checkingText: {
    fontSize: 16,
    color: '#4A5F8F',
    fontWeight: '600',
  },
  primaryButton: {
    borderRadius: 22,
    shadowColor: '#FF9A76',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 22,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  linkButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  linkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A5F8F',
    textDecorationLine: 'underline',
  },
  instructionCard: {
    backgroundColor: 'rgba(255, 184, 140, 0.12)',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 140, 0.25)',
  },
  instructionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A5F8F',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: '#6B7C99',
    lineHeight: 22,
  },
});
