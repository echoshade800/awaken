import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function DreamBubble({ keyword = '星空', initialX = 100, initialY = 200 }) {
  const router = useRouter();

  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 800 });

    const path = [
      { x: initialX, y: initialY },
      { x: initialX + 40, y: initialY - 60 },
      { x: initialX + 80, y: initialY - 40 },
      { x: initialX + 120, y: initialY - 80 },
      { x: SCREEN_WIDTH + 100, y: initialY - 100 },
    ];

    const animatePath = () => {
      translateX.value = -100;
      translateY.value = initialY;
      opacity.value = 0;

      translateX.value = withSequence(
        withTiming(path[0].x, { duration: 0 }),
        withTiming(path[1].x, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(path[2].x, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(path[3].x, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(path[4].x, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      );

      translateY.value = withSequence(
        withTiming(path[0].y, { duration: 0 }),
        withTiming(path[1].y, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(path[2].y, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(path[3].y, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(path[4].y, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      );

      opacity.value = withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(1, { duration: 10000 }),
        withTiming(0, { duration: 800 })
      );
    };

    animatePath();

    const interval = setInterval(() => {
      animatePath();
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    console.log('Dream bubble pressed - navigating to dream records');
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity style={styles.bubble} onPress={handlePress} activeOpacity={0.7}>
        <Text style={styles.keyword}>{keyword}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 10,
  },
  bubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  keyword: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
});
