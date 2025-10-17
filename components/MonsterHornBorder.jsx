import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MonsterHornBorder({ children, style }) {
  return (
    <View style={[styles.container, style]}>
      <Svg
        height={60}
        width={120}
        style={styles.monsterBorder}
        viewBox="0 0 120 60"
        preserveAspectRatio="xMidYMid meet"
      >
        <Defs>
          <LinearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="rgba(255, 255, 255, 0.5)" stopOpacity="1" />
            <Stop offset="50%" stopColor="rgba(200, 230, 255, 0.6)" stopOpacity="1" />
            <Stop offset="100%" stopColor="rgba(255, 255, 255, 0.5)" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Monster horn border - rounded rectangle with sharp corners */}
        <Path
          d="M 15 6
             L 35 6 L 42 2 L 49 6
             L 71 6 L 78 2 L 85 6
             L 105 6
             Q 114 6 114 15
             L 114 45
             Q 114 54 105 54
             L 15 54
             Q 6 54 6 45
             L 6 15
             Q 6 6 15 6 Z"
          fill="transparent"
          stroke="url(#glowGradient)"
          strokeWidth="2.5"
        />

        {/* Outer glow effect */}
        <Path
          d="M 15 6
             L 35 6 L 42 2 L 49 6
             L 71 6 L 78 2 L 85 6
             L 105 6
             Q 114 6 114 15
             L 114 45
             Q 114 54 105 54
             L 15 54
             Q 6 54 6 45
             L 6 15
             Q 6 6 15 6 Z"
          fill="none"
          stroke="rgba(180, 220, 255, 0.4)"
          strokeWidth="5"
          opacity="0.4"
          style={{ filter: 'blur(4px)' }}
        />

        {/* Decorative dots - eye effect */}
        <Circle cx="42" cy="25" r="2" fill="rgba(255, 255, 255, 0.7)" />
        <Circle cx="78" cy="25" r="2" fill="rgba(255, 255, 255, 0.7)" />

        {/* Inner highlight */}
        <Circle cx="42" cy="23" r="1" fill="rgba(255, 255, 255, 0.95)" />
        <Circle cx="78" cy="23" r="1" fill="rgba(255, 255, 255, 0.95)" />
      </Svg>

      <View style={styles.contentWrapper}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 60,
  },
  monsterBorder: {
    position: 'absolute',
  },
  contentWrapper: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 60,
  },
});
