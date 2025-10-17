import { View, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const generateStars = (count) => {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      left: Math.random() * SCREEN_WIDTH,
      top: Math.random() * SCREEN_HEIGHT,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.3,
    });
  }
  return stars;
};

const STARS = generateStars(50);

export default function StarBackground() {
  return (
    <View style={styles.container}>
      {STARS.map((star) => (
        <View
          key={star.id}
          style={[
            styles.star,
            {
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
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
