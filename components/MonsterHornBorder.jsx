import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MonsterHornBorder({ children, style }) {
  const height = 110;

  return (
    <View style={[styles.container, style]}>
      <Svg
        height={height}
        width="100%"
        style={styles.monsterBorder}
        viewBox="0 0 200 110"
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
          d="M 16 5
             L 70 5 L 82 0 L 94 5
             L 118 5 L 130 0 L 142 5
             L 184 5
             Q 195 5 195 16
             L 195 94
             Q 195 105 184 105
             L 16 105
             Q 5 105 5 94
             L 5 16
             Q 5 5 16 5 Z"
          fill="transparent"
          stroke="url(#glowGradient)"
          strokeWidth="2.5"
        />

        {/* Outer glow effect */}
        <Path
          d="M 16 5
             L 70 5 L 82 0 L 94 5
             L 118 5 L 130 0 L 142 5
             L 184 5
             Q 195 5 195 16
             L 195 94
             Q 195 105 184 105
             L 16 105
             Q 5 105 5 94
             L 5 16
             Q 5 5 16 5 Z"
          fill="none"
          stroke="rgba(180, 220, 255, 0.4)"
          strokeWidth="5"
          opacity="0.4"
          style={{ filter: 'blur(4px)' }}
        />

        {/* Decorative dots - eye effect */}
        <Circle cx="82" cy="45" r="2.5" fill="rgba(255, 255, 255, 0.7)" />
        <Circle cx="130" cy="45" r="2.5" fill="rgba(255, 255, 255, 0.7)" />

        {/* Inner highlight */}
        <Circle cx="82" cy="42" r="1.2" fill="rgba(255, 255, 255, 0.95)" />
        <Circle cx="130" cy="42" r="1.2" fill="rgba(255, 255, 255, 0.95)" />
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
    width: '100%',
    height: 110,
  },
  monsterBorder: {
    position: 'absolute',
  },
  contentWrapper: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 110,
  },
});
