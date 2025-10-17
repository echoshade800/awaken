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
          height="14"
          width="50"
          style={styles.teeth}
          viewBox="0 0 50 14"
        >
          {/* 左边的牙齿（向左倾斜） */}
          <Path
            d="M 16 0 L 14 12 L 22 0 Z"
            fill="rgba(255, 255, 255, 0.35)"
          />
          {/* 右边的牙齿（向右倾斜） */}
          <Path
            d="M 28 0 L 36 12 L 34 0 Z"
            fill="rgba(255, 255, 255, 0.35)"
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
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
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
