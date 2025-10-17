import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MonsterHornBorder({ children, style }) {
  return (
    <View style={[styles.container, style]}>
      <Svg
        height="100%"
        width="100%"
        style={styles.monsterBorder}
        viewBox="0 0 100 80"
        preserveAspectRatio="none"
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
          d="M 15 8
             L 30 8 L 35 2 L 40 8
             L 60 8 L 65 2 L 70 8
             L 85 8
             Q 92 8 92 15
             L 92 65
             Q 92 72 85 72
             L 15 72
             Q 8 72 8 65
             L 8 15
             Q 8 8 15 8 Z"
          fill="transparent"
          stroke="url(#glowGradient)"
          strokeWidth="2.5"
        />

        {/* Outer glow effect */}
        <Path
          d="M 15 8
             L 30 8 L 35 2 L 40 8
             L 60 8 L 65 2 L 70 8
             L 85 8
             Q 92 8 92 15
             L 92 65
             Q 92 72 85 72
             L 15 72
             Q 8 72 8 65
             L 8 15
             Q 8 8 15 8 Z"
          fill="none"
          stroke="rgba(180, 220, 255, 0.4)"
          strokeWidth="5"
          opacity="0.4"
          style={{ filter: 'blur(4px)' }}
        />

        {/* Decorative dots - eye effect */}
        <Circle cx="35" cy="30" r="2" fill="rgba(255, 255, 255, 0.7)" />
        <Circle cx="65" cy="30" r="2" fill="rgba(255, 255, 255, 0.7)" />

        {/* Inner highlight */}
        <Circle cx="35" cy="28" r="1" fill="rgba(255, 255, 255, 0.95)" />
        <Circle cx="65" cy="28" r="1" fill="rgba(255, 255, 255, 0.95)" />
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
  },
  monsterBorder: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  contentWrapper: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 70,
  },
});
