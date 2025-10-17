import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, RadialGradient, Stop, G } from 'react-native-svg';

export default function MonsterIcon({ size = 48, onPress }) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrapper}>
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Defs>
            <RadialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="rgba(255, 255, 255, 0.95)" />
              <Stop offset="100%" stopColor="rgba(255, 255, 255, 0.7)" />
            </RadialGradient>
          </Defs>

          {/* Outer glow layer - softer */}
          <G opacity="0.3">
            <Path
              d="M 24 2
                 C 26 2, 28 3, 29 5
                 C 30.5 3.5, 32 3.5, 33 5
                 C 36 8, 38 12, 38 18
                 L 38 30
                 C 38 37, 32 42, 24 42
                 C 16 42, 10 37, 10 30
                 L 10 18
                 C 10 12, 12 8, 15 5
                 C 16 3.5, 17.5 3.5, 19 5
                 C 20 3, 22 2, 24 2 Z"
              fill="none"
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </G>

          {/* Main monster body outline - pill/capsule shape with cute horns */}
          <Path
            d="M 24 4
               C 25.5 4, 27 4.5, 28 6
               C 29 5, 30 5, 30.5 6.5
               C 33 9, 36 13, 36 18
               L 36 30
               C 36 36, 31 40, 24 40
               C 17 40, 12 36, 12 30
               L 12 18
               C 12 13, 15 9, 17.5 6.5
               C 18 5, 19 5, 20 6
               C 21 4.5, 22.5 4, 24 4 Z"
            fill="none"
            stroke="url(#glowGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Center circle - monster eye/clock face */}
          <Circle
            cx="24"
            cy="20"
            r="7"
            fill="none"
            stroke="url(#glowGradient)"
            strokeWidth="2"
          />

          {/* Inner detail - small highlight dot */}
          <Circle
            cx="26"
            cy="18"
            r="1.5"
            fill="rgba(255, 255, 255, 0.8)"
          />
        </Svg>
      </View>
      <Text style={styles.label}>Awake Me</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 8,
    left: 0,
    zIndex: 10,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  iconWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  label: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 4,
    fontWeight: '500',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
