import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { BROADCAST_MODULES } from '../lib/broadcastModules';

export default function VoiceBroadcastEditor({ value = '', onChange }) {
  const [focusedIndex, setFocusedIndex] = useState(null);
  const inputRefs = useRef({});

  // 解析文本为元素数组
  const parseContent = (text) => {
    const elements = [];
    let lastIndex = 0;

    const tagIds = BROADCAST_MODULES.map(m => m.id).join('|');
    const regex = new RegExp(`\\{(${tagIds})\\}`, 'g');
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const textContent = text.substring(lastIndex, match.index);
        elements.push({
          type: 'text',
          content: textContent,
          id: `text-${lastIndex}`,
        });
      }

      elements.push({
        type: 'tag',
        content: match[0],
        label: match[1],
        id: `tag-${match.index}`,
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      const textContent = text.substring(lastIndex);
      elements.push({
        type: 'text',
        content: textContent,
        id: `text-${lastIndex}`,
      });
    }

    // 确保至少有一个文本输入框
    if (elements.length === 0 || elements[elements.length - 1].type === 'tag') {
      elements.push({
        type: 'text',
        content: '',
        id: `text-end`,
      });
    }

    return elements;
  };

  // 将元素数组转回文本
  const elementsToText = (elements) => {
    return elements.map(el => el.content).join('');
  };

  // 处理文本变化
  const handleTextChange = (index, newText, elements) => {
    const updatedElements = [...elements];
    updatedElements[index].content = newText;
    onChange(elementsToText(updatedElements));
  };

  // 删除模块标签
  const removeTag = (index, elements) => {
    const updatedElements = [...elements];

    // 删除标签
    updatedElements.splice(index, 1);

    // 合并相邻的文本元素
    for (let i = 0; i < updatedElements.length - 1; i++) {
      if (updatedElements[i].type === 'text' && updatedElements[i + 1].type === 'text') {
        updatedElements[i].content += updatedElements[i + 1].content;
        updatedElements.splice(i + 1, 1);
        i--;
      }
    }

    // 确保至少有一个文本框
    if (updatedElements.length === 0) {
      updatedElements.push({
        type: 'text',
        content: '',
        id: `text-0`,
      });
    }

    onChange(elementsToText(updatedElements));
  };

  // 插入模块
  const insertModule = (module) => {
    const elements = parseContent(value);

    // 如果有焦点的文本框，在其后插入
    if (focusedIndex !== null && elements[focusedIndex]) {
      const insertAt = focusedIndex + 1;

      // 在标签后添加一个空文本框
      elements.splice(insertAt, 0, {
        type: 'tag',
        content: module.tag,
        label: module.id,
        id: `tag-${Date.now()}`,
      });

      elements.splice(insertAt + 1, 0, {
        type: 'text',
        content: '',
        id: `text-${Date.now()}`,
      });
    } else {
      // 否则在末尾添加
      if (elements.length > 0 && elements[elements.length - 1].type === 'text' && elements[elements.length - 1].content === '') {
        // 在最后一个空文本框前插入
        elements.splice(elements.length - 1, 0, {
          type: 'tag',
          content: module.tag,
          label: module.id,
          id: `tag-${Date.now()}`,
        });
      } else {
        elements.push({
          type: 'tag',
          content: module.tag,
          label: module.id,
          id: `tag-${Date.now()}`,
        });
        elements.push({
          type: 'text',
          content: '',
          id: `text-${Date.now()}`,
        });
      }
    }

    onChange(elementsToText(elements));

    // 聚焦到新插入标签后的文本框
    setTimeout(() => {
      const newFocusIndex = focusedIndex !== null ? focusedIndex + 2 : elements.length - 1;
      if (inputRefs.current[newFocusIndex]) {
        inputRefs.current[newFocusIndex].focus();
        setFocusedIndex(newFocusIndex);
      }
    }, 100);
  };

  const elements = parseContent(value);

  return (
    <View style={styles.container}>
      <View style={styles.editorCard}>
        <Text style={styles.label}>Broadcast Content</Text>

        <ScrollView style={styles.editableArea} contentContainerStyle={styles.editableContent}>
          <View style={styles.elementsWrapper}>
            {elements.map((element, index) => {
              if (element.type === 'text') {
                return (
                  <TextInput
                    key={element.id}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    style={styles.inlineInput}
                    value={element.content}
                    onChangeText={(text) => handleTextChange(index, text, elements)}
                    onFocus={() => setFocusedIndex(index)}
                    placeholder={index === 0 && elements.length === 1 ? "Enter content, tap modules below to insert..." : ""}
                    placeholderTextColor="#999"
                    multiline
                  />
                );
              } else {
                return (
                  <View key={element.id} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{element.label}</Text>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeTag(index, elements)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <X size={14} color="#FFFFFF" strokeWidth={3} />
                    </TouchableOpacity>
                  </View>
                );
              }
            })}
          </View>
        </ScrollView>

        {value.length > 0 && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>Preview:</Text>
            <ScrollView
              style={styles.previewScroll}
              contentContainerStyle={styles.previewContent}
            >
              <View style={styles.previewWrapper}>
                {elements.map((element, index) => {
                  if (element.type === 'text' && element.content) {
                    return (
                      <Text key={index} style={styles.previewText}>
                        {element.content}
                      </Text>
                    );
                  } else if (element.type === 'tag') {
                    return (
                      <View key={index} style={styles.previewTag}>
                        <Text style={styles.previewTagText}>{element.label}</Text>
                      </View>
                    );
                  }
                  return null;
                })}
              </View>
            </ScrollView>
          </View>
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
  editableArea: {
    flex: 1,
    minHeight: 120,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FAFAFA',
  },
  editableContent: {
    flexGrow: 1,
  },
  elementsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  inlineInput: {
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 24,
    padding: 0,
    minWidth: 20,
    maxWidth: '100%',
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9A76',
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E67E5D',
    gap: 6,
  },
  tagChipText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  removeButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    maxHeight: 100,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  previewScroll: {
    maxHeight: 60,
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
    backgroundColor: '#FF9A76',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E67E5D',
  },
  previewTagText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
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
