import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, RadialGradient, Stop, G } from 'react-native-svg';

export default function MonsterIcon({ size = 48, onPress }) {
  const width = size * 1.2;
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrapper}>
        <Svg width={width} height={size} viewBox="0 0 58 48">
          <Defs>
            <RadialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="rgba(255, 255, 255, 0.95)" />
              <Stop offset="100%" stopColor="rgba(255, 255, 255, 0.7)" />
            </RadialGradient>
          </Defs>

          {/* Outer glow layer - softer */}
          <G opacity="0.3">
            <Path
              d="M 29 2
                 C 31 2, 33 3, 34 5
                 C 36 3.5, 38 3.5, 39.5 5
                 C 44 8, 48 12, 48 18
                 L 48 30
                 C 48 37, 41 42, 29 42
                 C 17 42, 10 37, 10 30
                 L 10 18
                 C 10 12, 14 8, 18.5 5
                 C 20 3.5, 22 3.5, 24 5
                 C 25 3, 27 2, 29 2 Z"
              fill="none"
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </G>

          {/* Main monster body outline - wider pill/capsule shape with cute horns */}
          <Path
            d="M 29 4
               C 30.5 4, 32 4.5, 33 6
               C 34.5 5, 36 5, 37 6.5
               C 41 9, 46 13, 46 18
               L 46 30
               C 46 36, 39 40, 29 40
               C 19 40, 12 36, 12 30
               L 12 18
               C 12 13, 16 9, 21 6.5
               C 22 5, 23.5 5, 25 6
               C 26 4.5, 27.5 4, 29 4 Z"
            fill="none"
            stroke="url(#glowGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Center circle - monster eye/clock face */}
          <Circle
            cx="29"
            cy="20"
            r="7"
            fill="none"
            stroke="url(#glowGradient)"
            strokeWidth="2"
          />

          {/* Inner detail - small highlight dot */}
          <Circle
            cx="31"
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
    top: 16,
    left: 16,
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
