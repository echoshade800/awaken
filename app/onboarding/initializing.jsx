import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Brain, Activity, Moon, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { initializeSleepData } from '../../lib/sleepInference';
import { checkStepPermission } from '../../lib/healthPermissions';
import useStore from '../../lib/store';
import StorageUtils from '../../lib/StorageUtils';

export default function InitializingScreen() {
  const router = useRouter();
  const insertDemoSleepData = useStore((state) => state.insertDemoSleepData);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState(null);

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
          console.log('[Initializing] HealthKit access granted, fetching real step data...');
          const result = await initializeSleepData();

          // Load the saved sessions into store
          const sessions = await StorageUtils.getSleepSessions();
          if (sessions && sessions.length > 0) {
            console.log('[Initializing] Loaded', sessions.length, 'sleep sessions into store');
            const store = useStore.getState();
            store.sleepSessions = sessions;
          } else {
            console.log('[Initializing] No sleep sessions found, will use demo data');
            await insertDemoSleepData();
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
        console.error('Initialization error:', err);
        retryCount++;

        if (retryCount >= maxRetries) {
          setError('Unable to initialize. Falling back to demo data.');

          try {
            await insertDemoSleepData();
            setTimeout(() => {
              router.replace('/(tabs)');
            }, 2000);
          } catch (demoError) {
            console.error('Failed to load demo data:', demoError);
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
            <CurrentIcon size={48} color="#FF9A76" strokeWidth={2} />
          </View>
        </View>

        <Text style={styles.title}>Setting Up Your Profile</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
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
                          color={isActive ? '#FF9A76' : '#8B9BAE'}
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
              <ActivityIndicator size="large" color="#FF9A76" />
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
    borderColor: '#FF9A76',
    shadowColor: '#FF9A76',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  stepIconCompleted: {
    backgroundColor: '#FF9A76',
    borderColor: '#FF9A76',
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
    color: '#8B9BAE',
  },
  stepLabelActive: {
    color: '#4A5F8F',
    fontWeight: '500',
  },
  stepLabelCompleted: {
    color: '#4A5F8F',
  },
  loaderContainer: {
    alignItems: 'center',
    gap: 16,
    marginTop: 32,
  },
  loadingText: {
    fontSize: 15,
    color: '#4A5F8F',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.3)',
  },
  errorText: {
    fontSize: 15,
    color: '#FF4D4D',
    textAlign: 'center',
    lineHeight: 22,
  },
});
