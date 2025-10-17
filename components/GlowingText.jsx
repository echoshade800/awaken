import { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';

const glowColors = [
  'rgba(255, 215, 0, 0.9)',
  'rgba(255, 105, 180, 0.9)',
  'rgba(0, 206, 209, 0.9)',
  'rgba(152, 251, 152, 0.9)',
  'rgba(221, 160, 221, 0.9)',
  'rgba(135, 206, 235, 0.9)',
  'rgba(255, 182, 193, 0.9)',
  'rgba(250, 250, 210, 0.9)',
];

export default function GlowingText({ children, style }) {
  const [glowColor, setGlowColor] = useState(glowColors[0]);

  useEffect(() => {
    const updateGlowColor = () => {
      const currentHour = new Date().getHours();
      const colorIndex = currentHour % glowColors.length;
      setGlowColor(glowColors[colorIndex]);
    };

    updateGlowColor();

    const interval = setInterval(() => {
      updateGlowColor();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Text
      style={[
        styles.text,
        {
          textShadowColor: glowColor,
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
    color: '#FFFFFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});
