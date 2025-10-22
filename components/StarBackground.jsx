import { View, StyleSheet, useWindowDimensions, useMemo } from 'react-native';

const generateStars = (count, width, height) => {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      left: Math.random() * width,
      top: (Math.random() * height / 2) + (height / 2),
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.3,
    });
  }
  return stars;
};

export default function StarBackground({ opacity = 1 }) {
  const { width, height } = useWindowDimensions();
  const stars = useMemo(() => generateStars(50, width, height), [width, height]);

  return (
    <View style={styles.container}>
      {stars.map((star) => (
        <View
          key={star.id}
          style={[
            styles.star,
            {
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              opacity: star.opacity * opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
  },
});
