import { View, Text, StyleSheet } from 'react-native';
import { Info } from 'lucide-react-native';

export default function DemoDataBadge({ show = true }) {
  if (!show) return null;

  return (
    <View style={styles.container}>
      <Info size={14} color="#6B7C99" />
      <Text style={styles.text}>Using sample data for demonstration</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    alignSelf: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(107, 124, 153, 0.2)',
  },
  text: {
    fontSize: 12,
    color: '#6B7C99',
    fontWeight: '500',
  },
});
