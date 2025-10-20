import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useRef } from 'react';
import MonsterIcon from '../../components/MonsterIcon';

const PERSON_TYPES = [
  { id: 'early-bird', emoji: '🐦', label: 'Early Bird', description: 'Love morning sunlight' },
  { id: 'night-owl', emoji: '🦉', label: 'Night Owl', description: 'More active at night' },
  { id: 'flexible', emoji: '😴', label: 'It depends', description: 'Varies by situation' },
];

const MOOD_LEVELS = [
  { id: 'energetic', emoji: '💪', label: 'Energetic', description: 'Full of energy' },
  { id: 'tired', emoji: '🌿', label: 'A bit tired', description: 'Could use rest' },
  { id: 'sleepy', emoji: '😴', label: 'Very sleepy', description: 'Need more sleep' },
];

export default function EnergyTypeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [selectedType, setSelectedType] = useState(null);
  const [selectedMood, setSelectedMood] = useState(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleContinue = () => {
    if (!selectedType || !selectedMood) return;

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      router.push('/onboarding/smart-alarm');
    });
  };

  const OptionCard = ({ option, selected, onSelect }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePress = () => {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      onSelect(option.id);
    };

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
      >
        <Animated.View
          style={[
            styles.optionCard,
            selected && styles.optionCardSelected,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Text style={styles.optionEmoji}>{option.emoji}</Text>
          <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
            {option.label}
          </Text>
          <Text style={[styles.optionDescription, selected && styles.optionDescriptionSelected]}>
            {option.description}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
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
          <Text style={styles.title}>Tell me about yourself</Text>
          <Text style={styles.subtitle}>This helps refine your energy rhythm 🌟</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What kind of person are you?</Text>
            <View style={styles.optionsGrid}>
              {PERSON_TYPES.map((type) => (
                <OptionCard
                  key={type.id}
                  option={type}
                  selected={selectedType === type.id}
                  onSelect={setSelectedType}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How have you been feeling lately?</Text>
            <View style={styles.optionsGrid}>
              {MOOD_LEVELS.map((mood) => (
                <OptionCard
                  key={mood.id}
                  option={mood}
                  selected={selectedMood === mood.id}
                  onSelect={setSelectedMood}
                />
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, (!selectedType || !selectedMood) && styles.buttonDisabled]}
          onPress={handleContinue}
          activeOpacity={0.8}
          disabled={!selectedType || !selectedMood}
        >
          <LinearGradient
            colors={
              selectedType && selectedMood
                ? ['#FFD89C', '#FFE4B5', '#FFF5E6']
                : ['#E0E0E0', '#F0F0F0', '#F5F5F5']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text
              style={[
                styles.buttonText,
                (!selectedType || !selectedMood) && styles.buttonTextDisabled,
              ]}
            >
              Continue
            </Text>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#4A5F8F',
    marginBottom: 16,
  },
  optionsGrid: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  optionCardSelected: {
    backgroundColor: 'rgba(255, 184, 140, 0.2)',
    borderColor: '#FFB88C',
  },
  optionEmoji: {
    fontSize: 32,
  },
  optionLabel: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#4A5F8F',
  },
  optionLabelSelected: {
    color: '#FF9A76',
  },
  optionDescription: {
    fontSize: 13,
    color: '#6B7C99',
  },
  optionDescriptionSelected: {
    color: '#FF9A76',
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
  buttonDisabled: {
    opacity: 0.5,
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
  buttonTextDisabled: {
    color: '#999',
  },
});
