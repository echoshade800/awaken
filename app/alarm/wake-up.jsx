import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform, StatusBar, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useRef } from 'react';
import { Clock, Sun, Cloud, Calendar } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import useStore from '../../lib/store';
import { stopAllSounds, playAlarmRingtone, speakWakeMessage } from '../../lib/audioManager';
import { scheduleSnooze } from '../../lib/alarmScheduler';
import { Accelerometer } from 'expo-sensors';

const SHAKE_THRESHOLD = 2.5;
const REQUIRED_SHAKES = 3;

export default function WakeUpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { alarmId, type, task } = params;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [shakeCount, setShakeCount] = useState(0);
  const [taskCompleted, setTaskCompleted] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const lastShakeTime = useRef(0);
  const subscription = useRef(null);

  const alarms = useStore((state) => state.alarms);
  const alarm = alarms.find((a) => a.id === alarmId);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    startAlarmAudio();

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    if (task === 'shake') {
      startAccelerometer();
    }

    return () => {
      clearInterval(timeInterval);
      stopAllSounds();
      stopAccelerometer();
    };
  }, []);

  useEffect(() => {
    if (shakeCount >= REQUIRED_SHAKES && !taskCompleted) {
      handleTaskComplete();
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
    } catch (error) {
      console.error('[WakeUp] Failed to start accelerometer:', error);
    }
  };

  const stopAccelerometer = () => {
    if (subscription.current) {
      subscription.current.remove();
      subscription.current = null;
    }
  };

  const handleShake = () => {
    if (taskCompleted) return;

    setShakeCount((prev) => Math.min(prev + 1, REQUIRED_SHAKES));
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
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startAlarmAudio = async () => {
    try {
      if (alarm?.ringtone) {
        await playAlarmRingtone(alarm.ringtone, { loop: true });
      } else {
        await playAlarmRingtone(null, { loop: true });
      }

      if (alarm?.voiceBroadcast?.enabled && alarm?.voiceBroadcast?.content) {
        setTimeout(() => {
          speakWakeMessage(alarm.voiceBroadcast.content);
        }, 2000);
      }
    } catch (error) {
      console.error('[WakeUp] Failed to start alarm audio:', error);
    }
  };

  const handleTaskComplete = () => {
    setTaskCompleted(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    stopAccelerometer();
  };

  const handleImUp = async () => {
    await stopAllSounds();

    if (alarm && !alarm.repeat) {
      const updateAlarm = useStore.getState().updateAlarm;
      updateAlarm(alarm.id, { enabled: false });
    }

    router.replace('/(tabs)');
  };

  const handleSnooze = async () => {
    await stopAllSounds();

    if (alarm) {
      await scheduleSnooze(alarm, 5);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    router.replace('/(tabs)');
  };

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getRepeatText = () => {
    if (!alarm?.repeat || !alarm?.days?.length) return '';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (alarm.days.length === 7) return 'Every day';
    if (alarm.days.length === 5 && !alarm.days.includes(0) && !alarm.days.includes(6)) {
      return 'Weekdays';
    }
    return alarm.days.map(d => days[d]).join(', ');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <LinearGradient
        colors={['#A8D5E2', '#FBEDCE', '#FBEDCE']}
        locations={[0, 0.5, 1]}
        style={styles.background}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateX: shakeAnim }] }]}>
        <View style={styles.timeSection}>
          <Text style={styles.time}>{formattedTime}</Text>
          {alarm && (
            <View style={styles.alarmLabelContainer}>
              <Text style={styles.alarmLabel}>{alarm.label || 'Alarm'}</Text>
              {getRepeatText() && (
                <>
                  <View style={styles.dot} />
                  <Text style={styles.repeatText}>{getRepeatText()}</Text>
                </>
              )}
            </View>
          )}
        </View>

        <View style={styles.characterSection}>
          <View style={styles.glowCircle} />
          <Text style={styles.characterEmoji}>🌊</Text>
        </View>

        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>{getGreeting()},</Text>
          <Text style={styles.wakeText}>I'm waking you up 🐾</Text>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Sun size={16} color="#4A5F8F" />
            <Text style={styles.infoText}>Today is a beautiful day</Text>
          </View>
        </View>

        {task === 'shake' && (
          <View style={styles.taskSection}>
            <Text style={styles.taskTitle}>Wake Task</Text>
            <Text style={styles.taskDescription}>
              Shake your phone {REQUIRED_SHAKES} times to turn off the alarm · {shakeCount}/{REQUIRED_SHAKES}
            </Text>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBg}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${(shakeCount / REQUIRED_SHAKES) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {!taskCompleted && shakeCount > 0 && (
              <Text style={styles.encouragementText}>
                {shakeCount === 1 && "Great! Keep going..."}
                {shakeCount === 2 && "Almost there!"}
              </Text>
            )}

            {taskCompleted && (
              <Text style={styles.completedText}>✅ Task completed!</Text>
            )}
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.snoozeButton}
            onPress={handleSnooze}
            activeOpacity={0.7}
          >
            <Text style={styles.snoozeButtonText}>Snooze 5 min</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.imUpButton,
              (task === 'shake' && !taskCompleted) && styles.imUpButtonDisabled,
            ]}
            onPress={handleImUp}
            activeOpacity={(task === 'shake' && !taskCompleted) ? 1 : 0.7}
            disabled={task === 'shake' && !taskCompleted}
          >
            <LinearGradient
              colors={
                (task === 'shake' && !taskCompleted)
                  ? ['#D0D0D0', '#B0B0B0']
                  : ['#FFB88C', '#FF9A6C']
              }
              style={styles.imUpButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.imUpButtonText}>I'm up</Text>
            </LinearGradient>
          </TouchableOpacity>
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
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  timeSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  time: {
    fontSize: 56,
    fontWeight: '700',
    color: '#2C3E50',
    letterSpacing: -1,
    marginBottom: 8,
  },
  alarmLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alarmLabel: {
    fontSize: 16,
    color: '#4A5F8F',
    fontWeight: '500',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4A5F8F',
  },
  repeatText: {
    fontSize: 16,
    color: '#4A5F8F',
    fontWeight: '400',
  },
  characterSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
    position: 'relative',
  },
  glowCircle: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(168, 213, 226, 0.3)',
  },
  characterEmoji: {
    fontSize: 100,
  },
  greetingSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 4,
  },
  wakeText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#4A5F8F',
  },
  infoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#4A5F8F',
  },
  taskSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  taskDescription: {
    fontSize: 14,
    color: '#4A5F8F',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(74, 95, 143, 0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFB88C',
    borderRadius: 4,
  },
  encouragementText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFB88C',
    textAlign: 'center',
  },
  completedText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 'auto',
  },
  snoozeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(74, 95, 143, 0.2)',
  },
  snoozeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#4A5F8F',
  },
  imUpButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FFB88C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  imUpButtonDisabled: {
    shadowOpacity: 0.1,
  },
  imUpButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  imUpButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
});
