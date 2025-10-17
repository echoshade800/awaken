import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useState } from 'react';

export default function AIReminderBubble({ message, style }) {
  const [fontSize, setFontSize] = useState(13);

  const handleLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    const minDimension = Math.min(width, height);
    const calculatedSize = Math.max(11, Math.min(14, minDimension * 0.08));
    setFontSize(calculatedSize);
  };

  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
      <View style={styles.iconContainer}>
        <Svg width={20} height={20} viewBox="0 0 24 24">
          <Circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="rgba(255, 255, 255, 0.9)"
            strokeWidth="1.5"
          />
          <Path
            d="M12 6 L12 13 L16 13"
            fill="none"
            stroke="rgba(255, 255, 255, 0.9)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="12" cy="17" r="0.8" fill="rgba(255, 255, 255, 0.9)" />
        </Svg>
      </View>
      <Text style={[styles.message, { fontSize, lineHeight: fontSize * 1.4 }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    gap: 8,
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  iconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
});
