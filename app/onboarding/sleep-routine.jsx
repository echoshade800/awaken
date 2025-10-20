import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useRef } from 'react';
import MonsterIcon from '../../components/MonsterIcon';

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

const BEDTIME_HOURS = ['21', '22', '23', '00', '01'];
const WAKE_HOURS = ['06', '07', '08', '09'];

export default function SleepRoutineScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [bedtimeHour, setBedtimeHour] = useState('22');
  const [bedtimeMinute, setBedtimeMinute] = useState('30');
  const [wakeHour, setWakeHour] = useState('07');
  const [wakeMinute, setWakeMinute] = useState('00');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleContinue = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      router.push('/onboarding/permissions');
    });
  };

  const renderTimePicker = (hours, selectedHour, onSelectHour, selectedMinute, onSelectMinute, label) => (
    <View style={styles.pickerSection}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <View style={styles.pickerContainer}>
        <View style={styles.pickerColumn}>
          <ScrollView
            style={styles.pickerScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.pickerContent}
          >
            {hours.map((hour) => (
              <TouchableOpacity
                key={hour}
                style={[
                  styles.pickerItem,
                  selectedHour === hour && styles.pickerItemSelected,
                ]}
                onPress={() => onSelectHour(hour)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pickerText,
                    selectedHour === hour && styles.pickerTextSelected,
                  ]}
                >
                  {hour}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <Text style={styles.separator}>:</Text>
        <View style={styles.pickerColumn}>
          <ScrollView
            style={styles.pickerScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.pickerContent}
          >
            {MINUTES.map((minute) => (
              <TouchableOpacity
                key={minute}
                style={[
                  styles.pickerItem,
                  selectedMinute === minute && styles.pickerItemSelected,
                ]}
                onPress={() => onSelectMinute(minute)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pickerText,
                    selectedMinute === minute && styles.pickerTextSelected,
                  ]}
                >
                  {minute}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );

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
          <Text style={styles.title}>Let's set up your sleep routine</Text>
          <Text style={styles.subtitle}>This helps me understand your natural rhythm 🌙</Text>

          {renderTimePicker(
            BEDTIME_HOURS,
            bedtimeHour,
            setBedtimeHour,
            bedtimeMinute,
            setBedtimeMinute,
            'When do you usually go to bed? 🕙'
          )}

          {renderTimePicker(
            WAKE_HOURS,
            wakeHour,
            setWakeHour,
            wakeMinute,
            setWakeMinute,
            'When do you usually wake up? 🌅'
          )}

          <View style={styles.tipContainer}>
            <Text style={styles.tipText}>
              💭 Monster says: Your natural rhythm is unique!
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FFD89C', '#FFE4B5', '#FFF5E6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Continue</Text>
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
  pickerSection: {
    marginBottom: 24,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A5F8F',
    marginBottom: 12,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerScroll: {
    maxHeight: 120,
  },
  pickerContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(255, 184, 140, 0.3)',
  },
  pickerText: {
    fontSize: 18,
    color: '#6B7C99',
    fontWeight: '400',
  },
  pickerTextSelected: {
    fontSize: 22,
    color: '#4A5F8F',
    fontWeight: '600',
  },
  separator: {
    fontSize: 28,
    color: '#4A5F8F',
    fontWeight: '300',
  },
  tipContainer: {
    marginTop: 16,
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
  button: {
    marginTop: 24,
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
});
