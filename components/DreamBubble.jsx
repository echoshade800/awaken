import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, PanResponder } from 'react-native';
import Svg, { Ellipse, Circle, Defs, RadialGradient, Stop, LinearGradient } from 'react-native-svg';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function DreamBubble({
  keyword = null,
  initialX = SCREEN_WIDTH - 130,
  initialY = 150,
  onPress
}) {
  const router = useRouter();
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const translateX = useRef(new Animated.Value(initialX)).current;
  const translateY = useRef(new Animated.Value(initialY)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const hasKeyword = keyword !== null;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        Animated.spring(scaleAnim, {
          toValue: 1.1,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(position.x + gestureState.dx);
        translateY.setValue(position.y + gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        const newX = Math.max(0, Math.min(SCREEN_WIDTH - 90, position.x + gestureState.dx));
        const newY = Math.max(50, Math.min(SCREEN_HEIGHT - 80, position.y + gestureState.dy));

        setPosition({ x: newX, y: newY });
        translateX.setValue(newX);
        translateY.setValue(newY);

        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }).start();

        if (Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
          handlePress();
        }
      },
    })
  ).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const animatedStyle = {
    transform: [
      { translateX: translateX },
      { translateY: translateY },
      { translateY: floatY },
      { scale: scaleAnim },
    ],
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      console.log('Dream bubble pressed');
    }
  };

  const gradientColors = hasKeyword
    ? ['#E8D7FF', '#F4EBFF']
    : ['#EAE7FF', '#F4F3FF'];

  return (
    <Animated.View style={[styles.container, animatedStyle]} {...panResponder.panHandlers}>
      <View style={styles.bubble}>
        <View style={styles.bubbleContent}>
          <Svg width={90} height={60} viewBox="0 0 90 60" style={styles.bubbleSvg}>
            <Defs>
              <LinearGradient id="bubbleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={gradientColors[0]} stopOpacity="0.7" />
                <Stop offset="100%" stopColor={gradientColors[1]} stopOpacity="0.7" />
              </LinearGradient>

              <RadialGradient id="highlightGradient" cx="35%" cy="30%">
                <Stop offset="0%" stopColor="rgba(255, 255, 255, 0.9)" stopOpacity="1" />
                <Stop offset="50%" stopColor="rgba(255, 255, 255, 0.5)" stopOpacity="1" />
                <Stop offset="100%" stopColor="rgba(255, 255, 255, 0)" stopOpacity="0" />
              </RadialGradient>
            </Defs>

            <Ellipse
              cx="45"
              cy="30"
              rx="40"
              ry="26"
              fill="url(#bubbleGradient)"
            />

            <Ellipse
              cx="45"
              cy="30"
              rx="40"
              ry="26"
              fill="none"
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="2"
            />

            <Ellipse
              cx="35"
              cy="20"
              rx="15"
              ry="11"
              fill="url(#highlightGradient)"
            />

            <Circle
              cx="57"
              cy="35"
              r="2"
              fill="rgba(255, 255, 255, 0.8)"
            />
            <Circle
              cx="38"
              cy="38"
              r="1.5"
              fill="rgba(255, 255, 255, 0.7)"
            />
            <Circle
              cx="65"
              cy="22"
              r="1.2"
              fill="rgba(255, 255, 255, 0.6)"
            />
          </Svg>

          <View style={styles.textContainer}>
            {hasKeyword ? (
              <Text style={styles.keyword}>{keyword} ✨</Text>
            ) : (
              <Text style={styles.helloText}>Hello Dream</Text>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 100,
  },
  bubble: {
    shadowColor: '#9D8CFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  bubbleContent: {
    position: 'relative',
    width: 90,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleSvg: {
    position: 'absolute',
  },
  textContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helloText: {
    color: '#8B7BC8',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  keyword: {
    color: '#7E6BBF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
