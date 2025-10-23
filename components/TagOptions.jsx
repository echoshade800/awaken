import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function TagOptions({ options, onSelect, selectedValue }) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isSelected = selectedValue === option.value;
        const isRecommended = option.recommended === true;
        const hasDescription = !!option.description;

        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.tag,
              isSelected && styles.tagSelected,
              isRecommended && styles.tagRecommended,
            ]}
            onPress={() => onSelect(option.value)}
          >
            <View style={styles.tagContent}>
              <View style={styles.labelRow}>
                <Text style={[
                  styles.tagText,
                  isSelected && styles.tagTextSelected,
                  isRecommended && styles.tagTextRecommended,
                ]}>
                  {option.label}
                </Text>
                {isRecommended && !isSelected && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedBadgeText}>推荐</Text>
                  </View>
                )}
              </View>
              {hasDescription && (
                <Text style={[
                  styles.description,
                  isSelected && styles.descriptionSelected,
                ]}>
                  {option.description}
                </Text>
              )}
            </View>
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
    paddingHorizontal: 0,
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
    minWidth: '85%',
  },
  tagRecommended: {
    backgroundColor: 'rgba(255, 184, 140, 0.15)',
    borderWidth: 1.5,
    borderColor: '#FFB88C',
    shadowColor: '#FFB88C',
    shadowOpacity: 0.2,
  },
  tagSelected: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 0,
  },
  tagContent: {
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagText: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  tagTextRecommended: {
    color: '#FF9A76',
    fontWeight: '600',
  },
  tagTextSelected: {
    color: '#FFF',
  },
  recommendedBadge: {
    backgroundColor: '#FFB88C',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recommendedBadgeText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  descriptionSelected: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
});
