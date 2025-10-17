import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MonsterHornBorder({ children, style }) {
  const width = 160;
  const height = 100;

  return (
    <View style={[styles.container, style]}>
      <Svg
        height={height}
        width={width}
        style={styles.monsterBorder}
        viewBox={`0 0 ${width} ${height}`}
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
          d="M 20 10
             L 50 10 L 58 4 L 66 10
             L 94 10 L 102 4 L 110 10
             L 140 10
             Q 150 10 150 20
             L 150 80
             Q 150 90 140 90
             L 20 90
             Q 10 90 10 80
             L 10 20
             Q 10 10 20 10 Z"
          fill="transparent"
          stroke="url(#glowGradient)"
          strokeWidth="2.5"
        />

        {/* Outer glow effect */}
        <Path
          d="M 20 10
             L 50 10 L 58 4 L 66 10
             L 94 10 L 102 4 L 110 10
             L 140 10
             Q 150 10 150 20
             L 150 80
             Q 150 90 140 90
             L 20 90
             Q 10 90 10 80
             L 10 20
             Q 10 10 20 10 Z"
          fill="none"
          stroke="rgba(180, 220, 255, 0.4)"
          strokeWidth="5"
          opacity="0.4"
          style={{ filter: 'blur(4px)' }}
        />

        {/* Decorative dots - eye effect */}
        <Circle cx="58" cy="40" r="2.5" fill="rgba(255, 255, 255, 0.7)" />
        <Circle cx="102" cy="40" r="2.5" fill="rgba(255, 255, 255, 0.7)" />

        {/* Inner highlight */}
        <Circle cx="58" cy="37" r="1.2" fill="rgba(255, 255, 255, 0.95)" />
        <Circle cx="102" cy="37" r="1.2" fill="rgba(255, 255, 255, 0.95)" />
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
    width: 160,
    height: 100,
  },
  monsterBorder: {
    position: 'absolute',
  },
  contentWrapper: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 100,
  },
});
