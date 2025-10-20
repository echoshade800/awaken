import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useRef } from 'react';
import MonsterIcon from '../../components/MonsterIcon';

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

const ITEM_HEIGHT = 44;

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

  const ScrollPicker = ({ items, selectedValue, onValueChange, scrollViewRef }) => {
    const handleScroll = (event) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(items.length - 1, index));

      if (items[clampedIndex] !== selectedValue) {
        onValueChange(items[clampedIndex]);
      }
    };

    const handleMomentumScrollEnd = (event) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(items.length - 1, index));

      scrollViewRef.current?.scrollTo({
        y: clampedIndex * ITEM_HEIGHT,
        animated: true,
      });
    };

    useEffect(() => {
      const index = items.indexOf(selectedValue);
      if (index !== -1 && scrollViewRef.current) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: index * ITEM_HEIGHT,
            animated: false,
          });
        }, 100);
      }
    }, []);

    return (
      <View style={styles.pickerWrapper}>
        <View style={styles.selectionIndicator} />
        <ScrollView
          ref={scrollViewRef}
          style={styles.pickerScroll}
          contentContainerStyle={[
            styles.pickerContent,
            { paddingVertical: ITEM_HEIGHT * 2 }
          ]}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onScroll={handleScroll}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16}
        >
          {items.map((item, index) => {
            const isSelected = item === selectedValue;
            return (
              <TouchableOpacity
                key={item}
                style={styles.pickerItem}
                onPress={() => {
                  onValueChange(item);
                  scrollViewRef.current?.scrollTo({
                    y: index * ITEM_HEIGHT,
                    animated: true,
                  });
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pickerText,
                    isSelected && styles.pickerTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderTimePicker = (
    selectedHour,
    onSelectHour,
    selectedMinute,
    onSelectMinute,
    label,
    hourScrollRef,
    minuteScrollRef
  ) => (
    <View style={styles.pickerSection}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <View style={styles.pickerContainer}>
        <ScrollPicker
          items={HOURS}
          selectedValue={selectedHour}
          onValueChange={onSelectHour}
          scrollViewRef={hourScrollRef}
        />
        <Text style={styles.separator}>:</Text>
        <ScrollPicker
          items={MINUTES}
          selectedValue={selectedMinute}
          onValueChange={onSelectMinute}
          scrollViewRef={minuteScrollRef}
        />
      </View>
    </View>
  );

  const bedtimeHourScrollRef = useRef(null);
  const bedtimeMinuteScrollRef = useRef(null);
  const wakeHourScrollRef = useRef(null);
  const wakeMinuteScrollRef = useRef(null);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#3D5A80', '#5A7BA5', '#7A9BC4', '#FFB88C', '#E8F4FF', '#F0F8FF', '#FAFCFF']}
        locations={[0, 0.25, 0.4, 0.5, 0.65, 0.82, 1]}
        style={styles.background}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.header}>
            <MonsterIcon size={50} />
          </View>

          <View style={styles.glassCard}>
            <Text style={styles.title}>Let's set up your sleep routine</Text>
            <Text style={styles.subtitle}>This helps me understand your natural rhythm 🌙</Text>

            {renderTimePicker(
              bedtimeHour,
              setBedtimeHour,
              bedtimeMinute,
              setBedtimeMinute,
              'When do you usually go to bed? 🕙',
              bedtimeHourScrollRef,
              bedtimeMinuteScrollRef
            )}

            {renderTimePicker(
              wakeHour,
              setWakeHour,
              wakeMinute,
              setWakeMinute,
              'When do you usually wake up? 🌅',
              wakeHourScrollRef,
              wakeMinuteScrollRef
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
        </ScrollView>
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#FFB88C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#4A5F8F',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7C99',
    textAlign: 'center',
    marginBottom: 20,
  },
  pickerSection: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4A5F8F',
    marginBottom: 10,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    padding: 12,
    gap: 8,
    height: 160,
  },
  pickerWrapper: {
    flex: 1,
    height: 160,
    position: 'relative',
  },
  selectionIndicator: {
    position: 'absolute',
    top: '50%',
    left: 8,
    right: 8,
    height: ITEM_HEIGHT,
    marginTop: -ITEM_HEIGHT / 2,
    backgroundColor: 'rgba(255, 184, 140, 0.2)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 140, 0.3)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  pickerScroll: {
    flex: 1,
  },
  pickerContent: {
    alignItems: 'center',
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pickerText: {
    fontSize: 18,
    color: '#A0AEC0',
    fontWeight: '400',
  },
  pickerTextSelected: {
    fontSize: 24,
    color: '#4A5F8F',
    fontWeight: '600',
  },
  separator: {
    fontSize: 28,
    color: '#4A5F8F',
    fontWeight: '300',
    marginHorizontal: 8,
  },
  tipContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 184, 140, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 140, 0.2)',
  },
  tipText: {
    fontSize: 13,
    color: '#6B7C99',
    textAlign: 'center',
    lineHeight: 18,
  },
  button: {
    marginTop: 16,
    borderRadius: 20,
    shadowColor: '#FFB88C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 20,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A5F8F',
  },
});
