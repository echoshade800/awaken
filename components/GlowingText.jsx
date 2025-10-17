import { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';

const colors = [
  { color: '#FFD700', shadow: 'rgba(255, 215, 0, 0.8)' },
  { color: '#FF69B4', shadow: 'rgba(255, 105, 180, 0.8)' },
  { color: '#00CED1', shadow: 'rgba(0, 206, 209, 0.8)' },
  { color: '#98FB98', shadow: 'rgba(152, 251, 152, 0.8)' },
  { color: '#DDA0DD', shadow: 'rgba(221, 160, 221, 0.8)' },
  { color: '#87CEEB', shadow: 'rgba(135, 206, 235, 0.8)' },
  { color: '#FFB6C1', shadow: 'rgba(255, 182, 193, 0.8)' },
  { color: '#FAFAD2', shadow: 'rgba(250, 250, 210, 0.8)' },
];

export default function GlowingText({ children, style }) {
  const [colorIndex, setColorIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % colors.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const currentColor = colors[colorIndex];

  return (
    <Text
      style={[
        styles.text,
        {
          color: currentColor.color,
          textShadowColor: currentColor.shadow,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});
