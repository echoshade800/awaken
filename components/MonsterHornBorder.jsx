import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export default function MonsterHornBorder({ children, style }) {
  return (
    <View style={[styles.container, style]}>
      {/* 顶部装饰角 */}
      <Svg
        height="20"
        width="100%"
        style={styles.topHorns}
        viewBox="0 0 100 20"
        preserveAspectRatio="none"
      >
        {/* 左边的角 */}
        <Path
          d="M 15 20 L 20 5 L 25 20"
          fill="rgba(200, 220, 255, 0.25)"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="1.5"
        />
        {/* 右边的角 */}
        <Path
          d="M 75 20 L 80 5 L 85 20"
          fill="rgba(200, 220, 255, 0.25)"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="1.5"
        />
      </Svg>

      {/* 主体内容区域 */}
      <View style={styles.mainPanel}>
        {children}

        {/* 底部牙齿 */}
        <Svg
          height="12"
          width="60"
          style={styles.teeth}
          viewBox="0 0 60 12"
        >
          {/* 左边的牙齿 */}
          <Path
            d="M 20 0 L 24 10 L 28 0"
            fill="rgba(255, 255, 255, 0.3)"
          />
          {/* 右边的牙齿 */}
          <Path
            d="M 32 0 L 36 10 L 40 0"
            fill="rgba(255, 255, 255, 0.3)"
          />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
  },
  topHorns: {
    position: 'absolute',
    top: -15,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  mainPanel: {
    backgroundColor: 'rgba(200, 220, 255, 0.12)',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderTopWidth: 0,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#87CEEB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
    width: '100%',
  },
  teeth: {
    marginTop: 8,
  },
});
