import { View, Text, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Accelerometer } from 'expo-sensors';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const SHAKE_THRESHOLD = 2.5;
const REQUIRED_SHAKES = 10;

export default function ShakeTaskCard({ onComplete, onProgress }) {
  const [shakeCount, setShakeCount] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const lastShakeTime = useRef(0);
  const subscription = useRef(null);

  useEffect(() => {
    startAccelerometer();

    return () => {
      stopAccelerometer();
    };
  }, []);

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: (shakeCount / REQUIRED_SHAKES) * 100,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();

    if (onProgress) {
      onProgress(shakeCount, REQUIRED_SHAKES);
    }

    if (shakeCount >= REQUIRED_SHAKES) {
      handleComplete();
    }
  }, [shakeCount]);

  const startAccelerometer = async () => {
    try {
      await Accelerometer.setUpdateInterval(100);

      subscription.current = Accelerometer.addListener((accelerometerData) => {
        const { x, y, z } = accelerometerData;
        const acceleration = Math.sqrt(x * x + y * y + z * z);

        const now = Date.now();
        if (acceleration > SHAKE_THRESHOLD && now - lastShakeTime.current > 300) {
          lastShakeTime.current = now;
          handleShake();
        }
      });

      console.log('[ShakeTask] Accelerometer started');
    } catch (error) {
      console.error('[ShakeTask] Failed to start accelerometer:', error);
    }
  };

  const stopAccelerometer = () => {
    if (subscription.current) {
      subscription.current.remove();
      subscription.current = null;
      console.log('[ShakeTask] Accelerometer stopped');
    }
  };

  const handleShake = () => {
    setShakeCount((prev) => Math.min(prev + 1, REQUIRED_SHAKES));
    setIsShaking(true);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsShaking(false);
    });
  };

  const handleComplete = async () => {
    stopAccelerometer();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (onComplete) {
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  };

  const progress = (shakeCount / REQUIRED_SHAKES) * 100;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: shakeAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
        style={styles.card}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Shake to Wake</Text>
          <Text style={styles.subtitle}>
            Shake your phone {REQUIRED_SHAKES} times to prove you're awake
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          <View style={styles.counterContainer}>
            <Text style={styles.counterText}>
              {shakeCount} / {REQUIRED_SHAKES}
            </Text>
            <Text style={styles.counterLabel}>shakes</Text>
          </View>
        </View>

        <View style={styles.instructionContainer}>
          <Text style={styles.instructionEmoji}>📱</Text>
          <Text style={styles.instructionText}>
            {shakeCount === 0 && 'Start shaking your phone'}
            {shakeCount > 0 && shakeCount < REQUIRED_SHAKES && 'Keep going!'}
            {shakeCount >= REQUIRED_SHAKES && 'Complete! 🎉'}
          </Text>
        </View>

        {isShaking && (
          <View style={styles.shakeFeedback}>
            <View style={styles.shakePulse} />
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#FFB88C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4A5F8F',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7C99',
    textAlign: 'center',
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 16,
    backgroundColor: 'rgba(74, 95, 143, 0.1)',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFB88C',
    borderRadius: 8,
  },
  counterContainer: {
    alignItems: 'center',
  },
  counterText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#4A5F8F',
    lineHeight: 56,
  },
  counterLabel: {
    fontSize: 16,
    color: '#6B7C99',
    marginTop: 4,
  },
  instructionContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  instructionEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A5F8F',
    textAlign: 'center',
  },
  shakeFeedback: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -30,
    marginLeft: -30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shakePulse: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 184, 140, 0.3)',
    borderWidth: 2,
    borderColor: '#FFB88C',
  },
});
