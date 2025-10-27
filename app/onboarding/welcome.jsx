import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Activity, TestTube } from 'lucide-react-native';

// 使用统一的 HealthKit bridge
import AppleHealthKit from '../../lib/modules/health/healthkitBridge';

export default function WelcomeScreen() {
  const router = useRouter();
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleStart = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      router.push('/onboarding/energy-type');
    });
  };

  const handleTestSteps = async () => {
    console.log('[Welcome] Testing HealthKit step data fetch...');
    setIsTesting(true);
    setTestResult(null);

    if (Platform.OS !== 'ios') {
      Alert.alert(
        'Platform Not Supported',
        'HealthKit is only available on iOS devices.',
        [{ text: 'OK' }]
      );
      setIsTesting(false);
      return;
    }

    if (!AppleHealthKit) {
      Alert.alert(
        'HealthKit Not Available',
        'HealthKit library is not properly installed or linked.',
        [{ text: 'OK' }]
      );
      setIsTesting(false);
      return;
    }

    try {
      // First check if HealthKit is available on this device
      AppleHealthKit.isAvailable((err, available) => {
        if (err || !available) {
          console.error('[Welcome] HealthKit not available:', err);
          Alert.alert(
            'HealthKit Not Available',
            'HealthKit is not available on this device.',
            [{ text: 'OK' }]
          );
          setIsTesting(false);
          return;
        }

        console.log('[Welcome] HealthKit is available, requesting permission...');

        // Request permissions
        const permissions = {
          permissions: {
            read: [
              AppleHealthKit.Constants.Permissions.Steps,
              AppleHealthKit.Constants.Permissions.StepCount,
            ],
            write: [],
          },
        };

        AppleHealthKit.initHealthKit(permissions, (initErr) => {
          if (initErr) {
            console.error('[Welcome] Permission request failed:', initErr);
            Alert.alert(
              'Permission Request Failed',
              `Could not request HealthKit permission: ${initErr.message || 'Unknown error'}`,
              [{ text: 'OK' }]
            );
            setIsTesting(false);
            return;
          }

          console.log('[Welcome] Permission granted, fetching step data...');

          // Get step data for the last 7 days
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(endDate.getDate() - 6); // Last 7 days

          const options = {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            period: 60 * 24, // Daily aggregation
            ascending: true,
          };

          AppleHealthKit.getDailyStepCountSamples(options, (stepErr, results) => {
            setIsTesting(false);

            if (stepErr) {
              console.error('[Welcome] Error fetching step data:', stepErr);
              Alert.alert(
                'Data Fetch Error',
                `Could not fetch step data: ${stepErr.message || 'Unknown error'}`,
                [{ text: 'OK' }]
              );
              return;
            }

            console.log('[Welcome] Step data fetched successfully:', results);

            if (!results || results.length === 0) {
              setTestResult({
                success: false,
                message: 'No step data found for the last 7 days.',
                data: []
              });
              return;
            }

            const totalSteps = results.reduce((sum, day) => sum + (day.value || 0), 0);
            const avgSteps = Math.round(totalSteps / results.length);

            setTestResult({
              success: true,
              message: `Found ${results.length} days of step data`,
              data: results,
              totalSteps,
              avgSteps
            });

            // Show success alert with summary
            Alert.alert(
              'HealthKit Test Successful! 🎉',
              `✅ Found ${results.length} days of step data\n📊 Total steps: ${totalSteps.toLocaleString()}\n📈 Daily average: ${avgSteps.toLocaleString()} steps`,
              [{ text: 'Great!' }]
            );
          });
        });
      });
    } catch (error) {
      console.error('[Welcome] Unexpected error during HealthKit test:', error);
      Alert.alert(
        'Unexpected Error',
        `An unexpected error occurred: ${error.message || 'Unknown error'}`,
        [{ text: 'OK' }]
      );
      setIsTesting(false);
    }
  };

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#3D5A80', '#5A7BA5', '#7A9BC4', '#FFB88C', '#E8F4FF', '#F0F8FF', '#FAFCFF']}
        locations={[0, 0.25, 0.4, 0.5, 0.65, 0.82, 1]}
        style={styles.background}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.glassCard}>
          <Text style={styles.greeting}>Hi, I'm Monster 👋</Text>
          <Text style={styles.description}>
            I'll help you discover your own rhythm{'\n'}
            so every morning feels full of energy ⚡
          </Text>
        </View>

        {/* Test HealthKit Button */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={[styles.button, styles.testButton]}
            onPress={handleTestSteps}
            activeOpacity={0.8}
            disabled={isTesting}
          >
            <LinearGradient
              colors={['#9D7AFF', '#B794FF', '#D6B8FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <View style={styles.testButtonContent}>
                {isTesting ? (
                  <Activity size={20} color="#FFFFFF" />
                ) : (
                  <TestTube size={20} color="#FFFFFF" />
                )}
                <Text style={styles.testButtonText}>
                  {isTesting ? 'Testing HealthKit...' : 'Test HealthKit Steps'}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Show test result */}
        {testResult && (
          <View style={[
            styles.resultCard,
            testResult.success ? styles.resultSuccess : styles.resultError
          ]}>
            <Text style={styles.resultTitle}>
              {testResult.success ? '✅ Test Result' : '❌ Test Result'}
            </Text>
            <Text style={styles.resultMessage}>{testResult.message}</Text>
            {testResult.success && testResult.data && (
              <View style={styles.resultStats}>
                <Text style={styles.resultStat}>
                  📊 Total: {testResult.totalSteps?.toLocaleString()} steps
                </Text>
                <Text style={styles.resultStat}>
                  📈 Average: {testResult.avgSteps?.toLocaleString()} steps/day
                </Text>
                <Text style={styles.resultStat}>
                  📅 Days: {testResult.data.length}
                </Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={handleStart}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FFD89C', '#FFE4B5', '#FFF5E6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Start My Rhythm Journey</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  glassCard: {
    marginTop: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 24,
    padding: 32,
    marginBottom: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#FFB88C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '600',
    color: '#4A5F8F',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#6B7C99',
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    width: '100%',
    borderRadius: 20,
    shadowColor: '#FFB88C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 20,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#4A5F8F',
  },
  testButton: {
    marginBottom: 16,
  },
  testButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultSuccess: {
    borderColor: 'rgba(72, 224, 194, 0.3)',
    backgroundColor: 'rgba(72, 224, 194, 0.05)',
  },
  resultError: {
    borderColor: 'rgba(255, 77, 79, 0.3)',
    backgroundColor: 'rgba(255, 77, 79, 0.05)',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A5F8F',
    marginBottom: 8,
  },
  resultMessage: {
    fontSize: 14,
    color: '#6B7C99',
    marginBottom: 12,
    lineHeight: 20,
  },
  resultStats: {
    gap: 4,
  },
  resultStat: {
    fontSize: 13,
    color: '#4A5F8F',
    fontWeight: '500',
  },
});
