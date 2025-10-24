import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { BROADCAST_MODULES } from '../lib/broadcastModules';

export default function VoiceBroadcastEditor({ value = '', onChange }) {
  // 插入模块
  const insertModule = (module) => {
    onChange(value + module.tag);
  };

  return (
    <View style={styles.container}>
      <View style={styles.editorCard}>
        <Text style={styles.label}>Broadcast Content</Text>

        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChange}
          placeholder="Enter content, tap modules below to insert..."
          placeholderTextColor="#999"
          multiline
        />
      </View>

      <View style={styles.modulesCard}>
        <Text style={styles.modulesTitle}>Insert Modules</Text>
        <View style={styles.modulesGrid}>
          {BROADCAST_MODULES.map((module) => {
            return (
              <TouchableOpacity
                key={module.id}
                style={styles.moduleButton}
                onPress={() => insertModule(module)}
              >
                <Text style={styles.moduleLabel}>{module.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
  editorCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    minHeight: 120,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FAFAFA',
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  modulesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  modulesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  moduleLabel: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
});
