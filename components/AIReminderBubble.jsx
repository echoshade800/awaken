import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

export default function AIReminderBubble({ message }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Svg width={16} height={16} viewBox="0 0 24 24">
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
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    gap: 6,
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  iconContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  message: {
    flex: 1,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 14,
    fontWeight: '500',
  },
});
