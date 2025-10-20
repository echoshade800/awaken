import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useRef } from 'react';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react-native';
import MonsterIcon from '../../components/MonsterIcon';

export default function SmartAlarmScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [recommendedTime, setRecommendedTime] = useState('07:30');
  const [adjustedMinutes, setAdjustedMinutes] = useState(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const calculateDisplayTime = () => {
    const [hours, minutes] = recommendedTime.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes + adjustedMinutes;

    if (totalMinutes < 0) totalMinutes += 24 * 60;
    if (totalMinutes >= 24 * 60) totalMinutes -= 24 * 60;

    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;

    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
  };

  const adjustTime = (minutes) => {
    const newAdjusted = Math.max(-30, Math.min(30, adjustedMinutes + minutes));
    setAdjustedMinutes(newAdjusted);
  };

  const handleSetAlarm = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      router.push('/onboarding/loading');
    });
  };

  const handleSkip = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      router.push('/onboarding/loading');
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#3D5A80', '#5A7BA5', '#7A9BC4', '#FFB88C', '#E8F4FF', '#F0F8FF', '#FAFCFF']}
        locations={[0, 0.25, 0.4, 0.5, 0.65, 0.82, 1]}
        style={styles.background}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <MonsterIcon size={60} />
        </View>

        <View style={styles.glassCard}>
          <Text style={styles.title}>Monster now understands your rhythm!</Text>
          <Text style={styles.subtitle}>
            Would you like me to set the best wake-up time for you? ⏰
          </Text>

          <View style={styles.alarmDisplay}>
            <View style={styles.alarmIcon}>
              <Clock size={32} color="#FFB88C" />
            </View>
            <Text style={styles.alarmTime}>{calculateDisplayTime()}</Text>
            <Text style={styles.alarmLabel}>Recommended wake-up time</Text>
            <Text style={styles.alarmHint}>Based on your rhythm peak</Text>
          </View>

          <View style={styles.adjustmentSection}>
            <Text style={styles.adjustmentLabel}>Fine-tune your time</Text>
            <View style={styles.adjustmentControls}>
              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() => adjustTime(-15)}
                activeOpacity={0.7}
                disabled={adjustedMinutes <= -30}
              >
                <ChevronLeft size={24} color={adjustedMinutes <= -30 ? '#CCC' : '#4A5F8F'} />
              </TouchableOpacity>

              <View style={styles.adjustmentDisplay}>
                <Text style={styles.adjustmentText}>
                  {adjustedMinutes === 0 ? 'Perfect timing' :
                   adjustedMinutes > 0 ? `+${adjustedMinutes} min` :
                   `${adjustedMinutes} min`}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() => adjustTime(15)}
                activeOpacity={0.7}
                disabled={adjustedMinutes >= 30}
              >
                <ChevronRight size={24} color={adjustedMinutes >= 30 ? '#CCC' : '#4A5F8F'} />
              </TouchableOpacity>
            </View>
            <Text style={styles.adjustmentHint}>Adjust ±30 minutes</Text>
          </View>

          <View style={styles.tipContainer}>
            <Text style={styles.tipText}>
              💭 Monster tip: Waking at rhythm peak helps you feel more energized!
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleSetAlarm}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FFD89C', '#FFE4B5', '#FFF5E6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Yes, Set My Alarm</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Maybe Later</Text>
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  glassCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#FFB88C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4A5F8F',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7C99',
    textAlign: 'center',
    marginBottom: 32,
  },
  alarmDisplay: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 20,
    padding: 32,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  alarmIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 184, 140, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  alarmTime: {
    fontSize: 56,
    fontWeight: '300',
    color: '#4A5F8F',
    letterSpacing: -2,
    marginBottom: 8,
  },
  alarmLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7C99',
    marginBottom: 4,
  },
  alarmHint: {
    fontSize: 13,
    color: '#999',
  },
  adjustmentSection: {
    marginBottom: 24,
  },
  adjustmentLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4A5F8F',
    textAlign: 'center',
    marginBottom: 12,
  },
  adjustmentControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  adjustButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  adjustmentDisplay: {
    minWidth: 120,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 184, 140, 0.15)',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 140, 0.3)',
  },
  adjustmentText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A5F8F',
  },
  adjustmentHint: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  tipContainer: {
    padding: 16,
    backgroundColor: 'rgba(255, 184, 140, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 140, 0.2)',
  },
  tipText: {
    fontSize: 14,
    color: '#6B7C99',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  button: {
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
  skipButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7C99',
  },
});
