import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Clock, Calendar, Cloud, Battery, CalendarDays, Palette, Gift } from 'lucide-react-native';

const BROADCAST_MODULES = [
  { id: 'time', label: '当前时间', icon: Clock, tag: '{时间}' },
  { id: 'date', label: '日期', icon: Calendar, tag: '{日期}' },
  { id: 'weather', label: '天气', icon: Cloud, tag: '{天气}' },
  { id: 'battery', label: '电量', icon: Battery, tag: '{电量}' },
  { id: 'schedule', label: '日程提醒', icon: CalendarDays, tag: '{日程}' },
  { id: 'lucky-color', label: '幸运色', icon: Palette, tag: '{幸运色}' },
  { id: 'random', label: '随机彩蛋', icon: Gift, tag: '{彩蛋}' },
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
    const regex = /\{(时间|日期|天气|电量|日程|幸运色|彩蛋)\}/g;
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
      '时间': Clock,
      '日期': Calendar,
      '天气': Cloud,
      '电量': Battery,
      '日程': CalendarDays,
      '幸运色': Palette,
      '彩蛋': Gift,
    };
    return moduleMap[label] || Clock;
  };

  return (
    <View style={styles.container}>
      <View style={styles.editorCard}>
        <Text style={styles.label}>播报内容</Text>

        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={value}
            onChangeText={handleTextChange}
            onSelectionChange={handleSelectionChange}
            placeholder="输入播报内容，点击下方模块插入动态信息..."
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
        <Text style={styles.modulesTitle}>插入模块</Text>
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
