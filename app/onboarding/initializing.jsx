import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Brain, Activity, Moon, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { initializeSleepData } from '../../lib/sleepInference';
import { checkStepPermission } from '../../lib/healthPermissions';
import useStore from '../../lib/store';

export default function InitializingScreen() {
  const router = useRouter();
  const insertDemoSleepData = useStore((state) => state.insertDemoSleepData);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState(null);
  const [isStalled, setIsStalled] = useState(false);

  const steps = [
    { icon: Activity, label: 'Analyzing step data', duration: 2000 },
    { icon: Moon, label: 'Detecting sleep patterns', duration: 2000 },
    { icon: Brain, label: 'Calculating sleep need', duration: 1500 },
    { icon: TrendingUp, label: 'Building circadian rhythm', duration: 1500 },
  ];

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        for (let i = 0; i < steps.length; i++) {
          setCurrentStep(i);
          await new Promise(resolve => setTimeout(resolve, steps[i].duration));
        }

        console.log('[Initializing] Checking HealthKit permission...');
        const hasPermission = await checkStepPermission();

        if (hasPermission === 'granted') {
          console.log('[Initializing] HealthKit access granted, initializing sleep data...');

          try {
            const sleepData = await initializeSleepData();

            if (!sleepData || !sleepData.sleepSeries || sleepData.sleepSeries.length === 0) {
              console.log('[Initializing] No sleep data detected, showing message');
              setIsStalled(true);
              setError('We couldn\'t find enough step data yet. Carry your phone during the day, and we\'ll update automatically.');

              setTimeout(() => {
                router.replace('/(tabs)');
              }, 5000);
              return;
            }

            console.log('[Initializing] Sleep data initialized successfully:', sleepData.sleepSeries.length, 'sessions');
          } catch (inferError) {
            console.error('[Initializing] Error initializing sleep data:', inferError);

            if (inferError.message && inferError.message.includes('No step data')) {
              setIsStalled(true);
              setError('We couldn\'t find enough step data yet. Carry your phone during the day, and we\'ll update automatically.');

              setTimeout(() => {
                router.replace('/(tabs)');
              }, 5000);
              return;
            }

            throw inferError;
          }
        } else {
          console.log('[Initializing] HealthKit access not granted, using demo data...');
          await insertDemoSleepData();
        }

        setTimeout(() => {
          router.replace('/(tabs)');
        }, 500);

        return;
      } catch (err) {
        console.error('[Initializing] Initialization error:', err);
        retryCount++;

        if (retryCount >= maxRetries) {
          console.log('[Initializing] Max retries reached, falling back to demo data');
          setError('Unable to fetch step data. Loading demo data for now.');

          try {
            await insertDemoSleepData();
            setTimeout(() => {
              router.replace('/(tabs)');
            }, 2000);
          } catch (demoError) {
            console.error('[Initializing] Failed to load demo data:', demoError);
            setError('Unable to initialize. Please restart the app.');
            setTimeout(() => {
              router.back();
            }, 3000);
          }
          return;
        }

        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
      }
    }
  };

  const CurrentIcon = currentStep < steps.length ? steps[currentStep].icon : Activity;

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
            <CurrentIcon size={48} color="#9D7AFF" strokeWidth={2} />
          </View>
        </View>

        <Text style={styles.title}>
          {isStalled ? 'Almost there!' : 'Setting Up Your Profile'}
        </Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            {isStalled && (
              <Text style={styles.errorSubtext}>
                Don't worry – we'll keep trying in the background!
              </Text>
            )}
          </View>
        ) : (
          <>
            <View style={styles.stepsList}>
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;

                return (
                  <View key={index} style={styles.stepItem}>
                    <View style={[
                      styles.stepIconContainer,
                      isActive && styles.stepIconActive,
                      isCompleted && styles.stepIconCompleted
                    ]}>
                      {isCompleted ? (
                        <View style={styles.checkmark} />
                      ) : (
                        <StepIcon
                          size={20}
                          color={isActive ? '#9D7AFF' : '#8B9BAE'}
                          strokeWidth={2}
                        />
                      )}
                    </View>
                    <Text style={[
                      styles.stepLabel,
                      isActive && styles.stepLabelActive,
                      isCompleted && styles.stepLabelCompleted
                    ]}>
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#9D7AFF" />
              <Text style={styles.loadingText}>
                {currentStep < steps.length ? steps[currentStep].label : 'Finalizing...'}
              </Text>
            </View>
          </>
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
    paddingTop: 100,
    paddingBottom: 60,
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
    marginBottom: 48,
  },
  stepsList: {
    gap: 24,
    marginBottom: 48,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(139, 155, 174, 0.3)',
  },
  stepIconActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: '#9D7AFF',
    shadowColor: '#9D7AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  stepIconCompleted: {
    backgroundColor: '#9D7AFF',
    borderColor: '#9D7AFF',
  },
  checkmark: {
    width: 12,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#FFF',
    transform: [{ rotate: '-45deg' }],
    marginTop: -2,
  },
  stepLabel: {
    flex: 1,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  stepLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  stepLabelCompleted: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  loaderContainer: {
    alignItems: 'center',
    gap: 16,
    marginTop: 32,
  },
  loadingText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 184, 140, 0.2)',
    padding: 20,
    borderRadius: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 140, 0.4)',
  },
  errorText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
});
