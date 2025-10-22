import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, Animated, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Plus } from 'lucide-react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import useStore from '@/lib/store';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const IS_SMALL_DEVICE = SCREEN_HEIGHT < 700;

export default function SleepActionBar() {
  const router = useRouter();
  const alarms = useStore((state) => state.alarms);
  const sleepAutoTracking = useStore((state) => state.sleepAutoTracking);
  const toggleAutoTracking = useStore((state) => state.toggleAutoTracking);
  const [showModal, setShowModal] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const nextAlarm = alarms
    .filter((a) => a.enabled)
    .sort((a, b) => a.time.localeCompare(b.time))[0];

  const formatAlarmTime = (time) => {
    if (!time) return null;
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const period = h >= 12 ? 'p' : 'a';
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:${minutes}${period}`;
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handleAlarmPress = () => {
    if (nextAlarm) {
      router.push(`/alarm/${nextAlarm.id}`);
    } else {
      router.push('/alarm/create');
    }
  };

  const handleAddPress = () => {
    setShowModal(true);
  };

  return (
    <>
      <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
        <BlurView intensity={60} tint="light" style={styles.blur}>
            <View style={styles.content}>
            <TouchableOpacity
              style={styles.alarmButton}
              onPress={handleAlarmPress}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.8}
              accessibilityLabel={`Alarm, next at ${formatAlarmTime(nextAlarm?.time) || 'none'}, button`}
              accessibilityRole="button"
            >
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.alarmGradient}
              >
                <Clock size={20} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.alarmTime}>{nextAlarm ? formatAlarmTime(nextAlarm.time) : '--:--'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={toggleAutoTracking}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.8}
              accessibilityLabel={`Auto tracking, ${sleepAutoTracking ? 'on' : 'off'}, button`}
              accessibilityRole="button"
            >
              <Text style={styles.autoIcon}>z</Text>
              <Text style={styles.autoIconSmall}>Z</Text>
              <Text style={styles.autoLabel}>Auto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleAddPress}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.8}
              accessibilityLabel="Add sleep record, button"
              accessibilityRole="button"
            >
              <Plus size={28} color="#334155" strokeWidth={2.5} />
            </TouchableOpacity>
            </View>
        </BlurView>
      </Animated.View>

      <ManualSleepModal visible={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}

function ManualSleepModal({ visible, onClose }) {
  const addSleepSession = useStore((state) => state.addSleepSession);
  const [bedtime, setBedtime] = useState('23:00');
  const [waketime, setWaketime] = useState('07:00');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setBedtime('23:00');
      setWaketime('07:00');
      setError('');
    }
  }, [visible]);

  const calculateDuration = (bed, wake) => {
    const [bedH, bedM] = bed.split(':').map(Number);
    const [wakeH, wakeM] = wake.split(':').map(Number);

    let bedMinutes = bedH * 60 + bedM;
    let wakeMinutes = wakeH * 60 + wakeM;

    if (wakeMinutes <= bedMinutes) {
      wakeMinutes += 24 * 60;
    }

    const totalMinutes = wakeMinutes - bedMinutes;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return { hours, minutes, totalMinutes };
  };

  const duration = calculateDuration(bedtime, waketime);

  const handleSave = async () => {
    if (duration.totalMinutes < 10) {
      setError('Sleep must be at least 10 minutes');
      return;
    }
    if (duration.totalMinutes > 16 * 60) {
      setError('Sleep cannot exceed 16 hours');
      return;
    }

    const session = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      bedtimeISO: bedtime,
      waketimeISO: waketime,
      durationMin: duration.totalMinutes,
      source: 'manual',
    };

    await addSleepSession(session);
    onClose();
  };

  const incrementTime = (timeStr, isWake) => {
    const [h, m] = timeStr.split(':').map(Number);
    let newH = h;
    let newM = m + 15;
    if (newM >= 60) {
      newM = 0;
      newH = (newH + 1) % 24;
    }
    const setter = isWake ? setWaketime : setBedtime;
    setter(`${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`);
    setError('');
  };

  const decrementTime = (timeStr, isWake) => {
    const [h, m] = timeStr.split(':').map(Number);
    let newH = h;
    let newM = m - 15;
    if (newM < 0) {
      newM = 45;
      newH = (newH - 1 + 24) % 24;
    }
    const setter = isWake ? setWaketime : setBedtime;
    setter(`${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`);
    setError('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <Text style={modalStyles.title}>Add Sleep Record</Text>

          <View style={modalStyles.timeRow}>
            <Text style={modalStyles.label}>Bedtime</Text>
            <View style={modalStyles.timePicker}>
              <TouchableOpacity onPress={() => decrementTime(bedtime, false)} style={modalStyles.timeButton}>
                <Text style={modalStyles.timeButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={modalStyles.timeValue}>{bedtime}</Text>
              <TouchableOpacity onPress={() => incrementTime(bedtime, false)} style={modalStyles.timeButton}>
                <Text style={modalStyles.timeButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={modalStyles.timeRow}>
            <Text style={modalStyles.label}>Wake time</Text>
            <View style={modalStyles.timePicker}>
              <TouchableOpacity onPress={() => decrementTime(waketime, true)} style={modalStyles.timeButton}>
                <Text style={modalStyles.timeButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={modalStyles.timeValue}>{waketime}</Text>
              <TouchableOpacity onPress={() => incrementTime(waketime, true)} style={modalStyles.timeButton}>
                <Text style={modalStyles.timeButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={modalStyles.totalRow}>
            <Text style={modalStyles.label}>Total</Text>
            <Text
              style={modalStyles.totalValue}
              accessibilityLabel={`Total sleep ${duration.hours} hours ${duration.minutes} minutes`}
            >
              {duration.hours}h {duration.minutes}m
            </Text>
          </View>

          {error ? <Text style={modalStyles.error}>{error}</Text> : null}

          <View style={modalStyles.buttons}>
            <TouchableOpacity style={modalStyles.secondaryButton} onPress={onClose}>
              <Text style={modalStyles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={modalStyles.primaryButton} onPress={handleSave}>
              <Text style={modalStyles.primaryButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: IS_SMALL_DEVICE ? 104 : 112,
    left: 16,
    right: 16,
    zIndex: 100,
  },
  blur: {
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 8,
    alignItems: 'center',
  },
  alarmButton: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  alarmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  alarmTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  autoIcon: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    left: 16,
    top: 14,
  },
  autoIconSmall: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '600',
    color: '#334155',
    right: 14,
    top: 10,
  },
  autoLabel: {
    position: 'absolute',
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    bottom: 10,
    letterSpacing: 0.3,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: '#1A1A1F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#9D7AFF',
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginHorizontal: 16,
    minWidth: 60,
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#9D7AFF',
  },
  error: {
    fontSize: 13,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#9D7AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
