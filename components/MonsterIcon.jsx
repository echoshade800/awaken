import { TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

export default function MonsterIcon({ size = 48, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.container, { width: size + 16, height: size + 16 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="glowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="rgba(255, 255, 255, 0.9)" />
            <Stop offset="100%" stopColor="rgba(255, 255, 255, 0.6)" />
          </LinearGradient>
        </Defs>

        {/* Monster body - rounded rectangle with horns */}
        <Path
          d="M 12 8
             L 15 8 L 16 4 L 17 8
             L 31 8 L 32 4 L 33 8
             L 36 8
             Q 40 8 40 12
             L 40 32
             Q 40 36 36 36
             L 12 36
             Q 8 36 8 32
             L 8 12
             Q 8 8 12 8 Z"
          fill="none"
          stroke="url(#glowGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Center circle - alarm clock face */}
        <Circle
          cx="24"
          cy="22"
          r="8"
          fill="none"
          stroke="url(#glowGradient)"
          strokeWidth="2.5"
        />

        {/* Outer glow effect */}
        <Path
          d="M 12 8
             L 15 8 L 16 4 L 17 8
             L 31 8 L 32 4 L 33 8
             L 36 8
             Q 40 8 40 12
             L 40 32
             Q 40 36 36 36
             L 12 36
             Q 8 36 8 32
             L 8 12
             Q 8 8 12 8 Z"
          fill="none"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="6"
          opacity="0.5"
        />
      </Svg>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 8,
    left: 0,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});
