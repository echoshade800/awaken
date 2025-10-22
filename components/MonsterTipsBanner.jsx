import { View, Text, StyleSheet, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { useEffect, useRef } from 'react';

export default function MonsterTipsBanner({ tip = "✨ Energy's balanced. Keep it calm and consistent 🌙" }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [tip]);

  return (
    <Animated.View 
      style={[styles.container, { opacity: fadeAnim }]}
    >
      <BlurView intensity={15} tint="light" style={styles.blurContainer}>
        <Text style={styles.tipText}>{tip}</Text>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  blurContainer: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    minHeight: 48,
    justifyContent: 'center',
  },
  tipText: {
    fontSize: 15,
    color: 'rgba(26, 40, 69, 0.9)',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
