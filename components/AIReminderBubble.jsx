import { View, Text, StyleSheet } from 'react-native';
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
      <Text style={[styles.message, { fontSize, lineHeight: fontSize * 1.4 }]}>{message}</Text>
      <Text style={styles.label}>Monster Tips</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 16,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  message: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(200, 230, 255, 0.95)',
    letterSpacing: 0.5,
    marginTop: 8,
    textAlign: 'center',
  },
});
