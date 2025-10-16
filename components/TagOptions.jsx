import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function TagOptions({ options, onSelect, selectedValue }) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isSelected = selectedValue === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.tag, isSelected && styles.tagSelected]}
            onPress={() => onSelect(option.value)}
          >
            <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 8,
    paddingHorizontal: 16,
    marginVertical: 8,
    alignItems: 'flex-start',
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    alignSelf: 'flex-start',
  },
  tagSelected: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tagText: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  tagTextSelected: {
    color: '#FFF',
  },
});
