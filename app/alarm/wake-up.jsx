import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform, StatusBar } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useRef } from 'react';
import { Clock, Volume2, VolumeX, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import ShakeTaskCard from '../../components/ShakeTaskCard';
import useStore from '../../lib/store';
import { stopAllSounds, playAlarmRingtone, speakWakeMessage, isPlaying } from '../../lib/audioManager';
import { scheduleSnooze } from '../../lib/alarmScheduler';

export default function WakeUpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { alarmId, type, task } = params;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [soundPlaying, setSoundPlaying] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const alarms = useStore((state) => state.alarms);
  const alarm = alarms.find((a) => a.id === alarmId);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    startAlarmAudio();

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timeInterval);
      pulseAnimation.stop();
      stopAllSounds();
    };
  }, []);

  const startAlarmAudio = async () => {
    try {
      if (alarm?.ringtone) {
        await playAlarmRingtone(alarm.ringtone, { loop: true });
      } else {
        await playAlarmRingtone(null, { loop: true });
      }

      setSoundPlaying(true);

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

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      handleStopAlarm();
    });
  };

  const handleStopAlarm = async () => {
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

  const handleToggleMute = async () => {
    if (isMuted) {
      await playAlarmRingtone(alarm?.ringtone, { loop: true });
      setSoundPlaying(true);
    } else {
      await stopAllSounds();
      setSoundPlaying(false);
    }
    setIsMuted(!isMuted);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#1A2332', '#2A3F5F', '#3D5A80', '#5A7BA5']}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.background}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.topSection}>
          <TouchableOpacity
            style={styles.muteButton}
            onPress={handleToggleMute}
            activeOpacity={0.7}
          >
            {isMuted ? (
              <VolumeX size={24} color="#FFF" />
            ) : (
              <Volume2 size={24} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.timeContainer}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Text style={styles.time}>{formattedTime}</Text>
          </Animated.View>
          <Text style={styles.date}>{formattedDate}</Text>

          {alarm && (
            <View style={styles.alarmInfo}>
              <Clock size={20} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.alarmLabel}>
                {alarm.label || 'Alarm'}
                {type === 'snooze' && ' (Snoozed)'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.taskContainer}>
          {!taskCompleted && task === 'shake' && (
            <ShakeTaskCard
              onComplete={handleTaskComplete}
              onProgress={(current, total) => {
                console.log(`Shake progress: ${current}/${total}`);
              }}
            />
          )}

          {!taskCompleted && task !== 'shake' && (
            <View style={styles.simpleTask}>
              <Text style={styles.simpleTaskText}>
                Tap "Stop" to dismiss the alarm
              </Text>
            </View>
          )}

          {taskCompleted && (
            <View style={styles.completedContainer}>
              <Text style={styles.completedEmoji}>✅</Text>
              <Text style={styles.completedText}>Task Completed!</Text>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          {!taskCompleted && (
            <TouchableOpacity
              style={styles.snoozeButton}
              onPress={handleSnooze}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                style={styles.buttonGradient}
              >
                <Clock size={24} color="#FFF" />
                <Text style={styles.snoozeButtonText}>Snooze 5 min</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.stopButton,
              task === 'shake' && !taskCompleted && styles.stopButtonDisabled,
            ]}
            onPress={handleStopAlarm}
            activeOpacity={task === 'shake' && !taskCompleted ? 1 : 0.8}
            disabled={task === 'shake' && !taskCompleted}
          >
            <LinearGradient
              colors={
                task === 'shake' && !taskCompleted
                  ? ['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.2)']
                  : ['#FFB88C', '#FF9A6C', '#FF8C5C']
              }
              style={styles.buttonGradient}
            >
              <X size={24} color="#FFF" />
              <Text style={styles.stopButtonText}>Stop</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {task === 'shake' && !taskCompleted && (
          <Text style={styles.hint}>Complete the shake task to stop the alarm</Text>
        )}
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
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 40,
  },
  muteButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  time: {
    fontSize: 72,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -2,
  },
  date: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
  alarmInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  alarmLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  taskContainer: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 32,
  },
  simpleTask: {
    padding: 32,
    alignItems: 'center',
  },
  simpleTaskText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  completedContainer: {
    alignItems: 'center',
    padding: 32,
  },
  completedEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  completedText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  buttonContainer: {
    gap: 12,
  },
  snoozeButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  stopButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  stopButtonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 12,
  },
  snoozeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  stopButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  hint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 16,
  },
});
