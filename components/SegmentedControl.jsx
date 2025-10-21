import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

export default function SegmentedControl({ options, selectedIndex, onSelect }) {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: selectedIndex,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [selectedIndex]);

  const indicatorWidth = 100 / options.length;
  const indicatorTranslateX = translateX.interpolate({
    inputRange: options.map((_, i) => i),
    outputRange: options.map((_, i) => i * indicatorWidth),
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.indicator,
          {
            width: `${indicatorWidth}%`,
            transform: [
              {
                translateX: indicatorTranslateX.interpolate({
                  inputRange: [0, 100],
                  outputRange: [0, 100],
                }),
              },
            ],
          },
        ]}
      />

      {options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={styles.option}
          onPress={() => onSelect(index)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.optionText,
              selectedIndex === index && styles.optionTextActive,
            ]}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 24,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    backgroundColor: '#7A5CF4',
    borderRadius: 20,
  },
  option: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
});
