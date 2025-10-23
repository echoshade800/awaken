import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useStore from '../../lib/store';

export default function LoadingScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;
  const calculateAndStoreSleepData = useStore((state) => state.calculateAndStoreSleepData);
  const updateAppData = useStore((state) => state.updateAppData);

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

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(dotsAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(dotsAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const completeOnboarding = async () => {
      try {
        // Get onboarding data from AsyncStorage
        const sleepRoutine = await AsyncStorage.getItem('onboarding_sleepRoutine');
        const energyType = await AsyncStorage.getItem('onboarding_energyType');

        console.log('[Onboarding] Retrieved data:', { sleepRoutine, energyType });

        if (sleepRoutine && energyType) {
          const routineData = JSON.parse(sleepRoutine);
          const routineWithEnergy = {
            ...routineData,
            energyType: energyType,
            alertnessLevel: 'moderate',
          };

          console.log('[Onboarding] Calculating sleep data with:', routineWithEnergy);

          // Calculate and store sleep data
          const sleepData = await calculateAndStoreSleepData(routineWithEnergy);
          console.log('[Onboarding] Sleep data calculated:', {
            sleepNeed: sleepData?.sleepNeed,
            sleepDebt: sleepData?.sleepDebt,
            curveLength: sleepData?.circadianCurve?.length,
          });

          // Store routine data in app data
          await updateAppData({
            hasOnboarded: true,
            routineData: routineWithEnergy,
          });

          console.log('[Onboarding] Sleep data calculated and stored successfully');
        } else {
          console.warn('[Onboarding] Missing sleep routine or energy type data');
          console.warn('[Onboarding] sleepRoutine:', sleepRoutine);
          console.warn('[Onboarding] energyType:', energyType);
        }

        await AsyncStorage.setItem('onboardingCompleted', 'true');
      } catch (error) {
        console.error('[Onboarding] Error completing onboarding:', error);
      }
    };

    const timer = setTimeout(async () => {
      await completeOnboarding();

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        router.replace('/(tabs)');
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const dot1Opacity = dotsAnim.interpolate({
    inputRange: [0, 0.2, 0.4, 1],
    outputRange: [0.3, 1, 0.3, 0.3],
  });

  const dot2Opacity = dotsAnim.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 1],
    outputRange: [0.3, 0.3, 1, 0.3, 0.3],
  });

  const dot3Opacity = dotsAnim.interpolate({
    inputRange: [0, 0.4, 0.6, 0.8, 1],
    outputRange: [0.3, 0.3, 0.3, 1, 0.3],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFE4B5', '#E8F4FF', '#FAFCFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.glowRing, { transform: [{ rotate }] }]} />
        <Animated.View style={[styles.glowRing2, { transform: [{ rotate }] }]} />

        <View style={styles.textContainer}>
          <Text style={styles.title}>Monster is analyzing your rhythm</Text>
          <View style={styles.dotsContainer}>
            <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
            <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
            <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
          </View>
        </View>

        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>
            "The morning sun ☀️, the afternoon calm 🌙,{'\n'}
            every moment is part of your unique rhythm."
          </Text>
        </View>

        <View style={styles.waveContainer}>
          {[0, 1, 2, 3, 4, 5, 6].map((index) => (
            <Animated.View
              key={index}
              style={[
                styles.waveDot,
                {
                  opacity: dotsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                  transform: [
                    {
                      translateY: dotsAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [
                          0,
                          Math.sin((index / 6) * Math.PI * 2) * 15,
                          0,
                        ],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
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
  glowRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: 'rgba(255, 184, 140, 0.3)',
    top: '50%',
    left: '50%',
    marginTop: -70,
    marginLeft: -90,
  },
  glowRing2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 140, 0.2)',
    top: '50%',
    left: '50%',
    marginTop: -90,
    marginLeft: -110,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4A5F8F',
    textAlign: 'center',
    marginBottom: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFB88C',
  },
  quoteContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  quoteText: {
    fontSize: 15,
    color: '#6B7C99',
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  waveContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  waveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFB88C',
  },
});
