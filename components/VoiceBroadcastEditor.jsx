import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Clock, Calendar, Cloud, Battery, CalendarDays, Palette, Gift } from 'lucide-react-native';

const BROADCAST_MODULES = [
  { id: 'time', label: 'Time', icon: Clock, tag: '{time}' },
  { id: 'date', label: 'Date', icon: Calendar, tag: '{date}' },
  { id: 'weather', label: 'Weather', icon: Cloud, tag: '{weather}' },
  { id: 'battery', label: 'Battery', icon: Battery, tag: '{battery}' },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays, tag: '{schedule}' },
  { id: 'lucky-color', label: 'Lucky Color', icon: Palette, tag: '{lucky}' },
  { id: 'random', label: 'Random', icon: Gift, tag: '{random}' },
];

export default function VoiceBroadcastEditor({ value = '', onChange }) {
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef(null);

  const handleTextChange = (text) => {
    onChange(text);
  };

  const handleSelectionChange = (event) => {
    setCursorPosition(event.nativeEvent.selection.start);
  };

  const insertModule = (module) => {
    const beforeCursor = value.substring(0, cursorPosition);
    const afterCursor = value.substring(cursorPosition);
    const newText = beforeCursor + module.tag + afterCursor;

    onChange(newText);

    const newCursorPos = cursorPosition + module.tag.length;
    setCursorPosition(newCursorPos);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const renderModuleTag = (text) => {
    const parts = [];
    let lastIndex = 0;
    const regex = /\{(time|date|weather|battery|schedule|lucky|random)\}/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index),
        });
      }

      parts.push({
        type: 'tag',
        content: match[0],
        label: match[1],
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex),
      });
    }

    return parts;
  };

  const getIconForTag = (label) => {
    const moduleMap = {
      'time': Clock,
      'date': Calendar,
      'weather': Cloud,
      'battery': Battery,
      'schedule': CalendarDays,
      'lucky': Palette,
      'random': Gift,
    };
    return moduleMap[label] || Clock;
  };

  return (
    <View style={styles.container}>
      <View style={styles.editorCard}>
        <Text style={styles.label}>Broadcast Content</Text>

        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={value}
            onChangeText={handleTextChange}
            onSelectionChange={handleSelectionChange}
            placeholder="Enter broadcast content, tap modules below to insert..."
            placeholderTextColor="#999"
            multiline
            textAlignVertical="top"
          />
        </View>

        {value.length > 0 && (
          <ScrollView
            style={styles.previewContainer}
            contentContainerStyle={styles.previewContent}
          >
            <View style={styles.previewWrapper}>
              {renderModuleTag(value).map((part, index) => {
                if (part.type === 'text') {
                  return (
                    <Text key={index} style={styles.previewText}>
                      {part.content}
                    </Text>
                  );
                } else {
                  const IconComponent = getIconForTag(part.label);
                  return (
                    <View key={index} style={styles.previewTag}>
                      <IconComponent size={14} color="#007AFF" />
                      <Text style={styles.previewTagText}>{part.label}</Text>
                    </View>
                  );
                }
              })}
            </View>
          </ScrollView>
        )}
      </View>

      <View style={styles.modulesCard}>
        <Text style={styles.modulesTitle}>Insert Modules</Text>
        <View style={styles.modulesGrid}>
          {BROADCAST_MODULES.map((module) => {
            const IconComponent = module.icon;
            return (
              <TouchableOpacity
                key={module.id}
                style={styles.moduleButton}
                onPress={() => insertModule(module)}
              >
                <IconComponent size={20} color="#007AFF" strokeWidth={2} />
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
  inputWrapper: {
    flex: 1,
    minHeight: 120,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 22,
    padding: 0,
  },
  previewContainer: {
    maxHeight: 80,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  previewContent: {
    flexGrow: 1,
  },
  previewWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  previewText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 24,
  },
  previewTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  previewTagText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
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
