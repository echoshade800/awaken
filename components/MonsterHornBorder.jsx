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
        viewBox="0 0 280 90"
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
          d="M 30 10
             L 60 10 L 70 2 L 80 10
             L 200 10 L 210 2 L 220 10
             L 250 10
             Q 270 10 270 30
             L 270 60
             Q 270 80 250 80
             L 30 80
             Q 10 80 10 60
             L 10 30
             Q 10 10 30 10 Z"
          fill="transparent"
          stroke="url(#glowGradient)"
          strokeWidth="2.5"
        />

        {/* Outer glow effect */}
        <Path
          d="M 30 10
             L 60 10 L 70 2 L 80 10
             L 200 10 L 210 2 L 220 10
             L 250 10
             Q 270 10 270 30
             L 270 60
             Q 270 80 250 80
             L 30 80
             Q 10 80 10 60
             L 10 30
             Q 10 10 30 10 Z"
          fill="none"
          stroke="rgba(180, 220, 255, 0.4)"
          strokeWidth="5"
          opacity="0.4"
          style={{ filter: 'blur(4px)' }}
        />

        {/* Decorative dots - eye effect */}
        <Circle cx="70" cy="35" r="3" fill="rgba(255, 255, 255, 0.7)" />
        <Circle cx="210" cy="35" r="3" fill="rgba(255, 255, 255, 0.7)" />

        {/* Inner highlight */}
        <Circle cx="70" cy="33" r="1.5" fill="rgba(255, 255, 255, 0.95)" />
        <Circle cx="210" cy="33" r="1.5" fill="rgba(255, 255, 255, 0.95)" />
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
    paddingVertical: 20,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
});
