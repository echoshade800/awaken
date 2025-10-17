import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Ellipse, Circle, Defs, RadialGradient, Stop, LinearGradient } from 'react-native-svg';
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
        <View style={styles.bubbleContent}>
          <Svg width={110} height={60} viewBox="0 0 110 60" style={styles.bubbleSvg}>
            <Defs>
              <RadialGradient id="bubbleGradient" cx="50%" cy="50%">
                <Stop offset="0%" stopColor="rgba(255, 255, 255, 0.1)" stopOpacity="1" />
                <Stop offset="40%" stopColor="rgba(200, 220, 255, 0.3)" stopOpacity="1" />
                <Stop offset="70%" stopColor="rgba(180, 200, 255, 0.4)" stopOpacity="1" />
                <Stop offset="100%" stopColor="rgba(160, 180, 255, 0.5)" stopOpacity="1" />
              </RadialGradient>

              <RadialGradient id="highlightGradient" cx="30%" cy="30%">
                <Stop offset="0%" stopColor="rgba(255, 255, 255, 0.8)" stopOpacity="1" />
                <Stop offset="50%" stopColor="rgba(255, 255, 255, 0.4)" stopOpacity="1" />
                <Stop offset="100%" stopColor="rgba(255, 255, 255, 0)" stopOpacity="0" />
              </RadialGradient>

              <LinearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="rgba(255, 240, 255, 0.6)" stopOpacity="1" />
                <Stop offset="25%" stopColor="rgba(200, 230, 255, 0.6)" stopOpacity="1" />
                <Stop offset="50%" stopColor="rgba(220, 255, 240, 0.6)" stopOpacity="1" />
                <Stop offset="75%" stopColor="rgba(255, 240, 200, 0.6)" stopOpacity="1" />
                <Stop offset="100%" stopColor="rgba(255, 230, 255, 0.6)" stopOpacity="1" />
              </LinearGradient>
            </Defs>

            <Ellipse
              cx="55"
              cy="30"
              rx="52"
              ry="27"
              fill="url(#bubbleGradient)"
            />

            <Ellipse
              cx="55"
              cy="30"
              rx="52"
              ry="27"
              fill="none"
              stroke="url(#edgeGradient)"
              strokeWidth="2"
            />

            <Ellipse
              cx="55"
              cy="30"
              rx="52"
              ry="27"
              fill="none"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="2.5"
              style={{ filter: 'blur(3px)' }}
            />

            <Ellipse
              cx="38"
              cy="18"
              rx="18"
              ry="12"
              fill="url(#highlightGradient)"
            />

            <Circle
              cx="70"
              cy="35"
              r="2"
              fill="rgba(255, 255, 255, 0.7)"
            />
            <Circle
              cx="42"
              cy="38"
              r="1.5"
              fill="rgba(255, 255, 255, 0.6)"
            />
          </Svg>

          <View style={styles.textContainer}>
            <Text style={styles.keyword}>{keyword}</Text>
          </View>
        </View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  bubbleContent: {
    position: 'relative',
    width: 110,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleSvg: {
    position: 'absolute',
  },
  textContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyword: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 13,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
