import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Volume2 } from 'lucide-react-native';
import useStore from '../../lib/store';
import { BROADCAST_MODULES, BROADCAST_TEMPLATES } from '../../lib/broadcastModules';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function BroadcastEditor() {
  const router = useRouter();
  const { currentAlarmDraft, updateDraft } = useStore();
  const textInputRef = useRef(null);

  // Initialize with custom template or saved content
  const [broadcastContent, setBroadcastContent] = useState(
    currentAlarmDraft?.broadcastContent || []
  );
  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [cursorPosition, setCursorPosition] = useState(0);

  // Handle template selection
  const selectTemplate = (templateId) => {
    const template = BROADCAST_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setBroadcastContent([...template.content]);
    }
  };

  // Insert module at cursor position
  const insertModule = (module) => {
    const newContent = [...broadcastContent];
    const insertIndex = findInsertIndex(cursorPosition);

    newContent.splice(insertIndex, 0, {
      type: 'module',
      moduleId: module.id,
    });

    setBroadcastContent(newContent);
  };

  // Find the correct index in content array based on cursor position in rendered text
  const findInsertIndex = (cursor) => {
    let charCount = 0;
    for (let i = 0; i < broadcastContent.length; i++) {
      const item = broadcastContent[i];
      if (item.type === 'text') {
        charCount += item.value.length;
      } else {
        charCount += 1; // Module counts as 1 character position
      }
      if (charCount >= cursor) {
        return i + 1;
      }
    }
    return broadcastContent.length;
  };

  // Handle text changes (including deletions)
  const handleTextChange = (newText) => {
    // For now, we'll handle this by reconstructing the content
    // This is a simplified approach - a production app would need more sophisticated handling
    const plainText = getPlainText();

    if (newText.length < plainText.length) {
      // Deletion occurred
      handleDeletion(plainText, newText);
    } else {
      // Addition occurred
      handleAddition(plainText, newText);
    }
  };

  const handleDeletion = (oldText, newText) => {
    const deletedAtIndex = findDeletionIndex(oldText, newText);
    const contentIndex = findContentIndexFromTextIndex(deletedAtIndex);

    const newContent = [...broadcastContent];
    const item = newContent[contentIndex];

    if (item?.type === 'text') {
      // Calculate position within this text item
      const textStartIndex = getTextIndexBeforeContent(contentIndex);
      const posInText = deletedAtIndex - textStartIndex;

      // Remove character from text
      const newValue = item.value.slice(0, posInText) + item.value.slice(posInText + 1);

      if (newValue.length === 0) {
        newContent.splice(contentIndex, 1);
      } else {
        newContent[contentIndex] = { ...item, value: newValue };
      }
    } else if (item?.type === 'module') {
      // Delete the entire module
      newContent.splice(contentIndex, 1);
    }

    setBroadcastContent(newContent);
  };

  const handleAddition = (oldText, newText) => {
    const addedAtIndex = findAdditionIndex(oldText, newText);
    const addedChar = newText[addedAtIndex];
    const contentIndex = findContentIndexFromTextIndex(addedAtIndex);

    const newContent = [...broadcastContent];

    if (contentIndex >= newContent.length) {
      // Append to end
      if (newContent.length > 0 && newContent[newContent.length - 1].type === 'text') {
        newContent[newContent.length - 1].value += addedChar;
      } else {
        newContent.push({ type: 'text', value: addedChar });
      }
    } else {
      const item = newContent[contentIndex];

      if (item?.type === 'text') {
        const textStartIndex = getTextIndexBeforeContent(contentIndex);
        const posInText = addedAtIndex - textStartIndex;

        const newValue = item.value.slice(0, posInText) + addedChar + item.value.slice(posInText);
        newContent[contentIndex] = { ...item, value: newValue };
      } else {
        // Insert before module
        if (contentIndex > 0 && newContent[contentIndex - 1].type === 'text') {
          newContent[contentIndex - 1].value += addedChar;
        } else {
          newContent.splice(contentIndex, 0, { type: 'text', value: addedChar });
        }
      }
    }

    setBroadcastContent(newContent);
  };

  const findDeletionIndex = (oldText, newText) => {
    for (let i = 0; i < oldText.length; i++) {
      if (oldText[i] !== newText[i]) {
        return i;
      }
    }
    return oldText.length - 1;
  };

  const findAdditionIndex = (oldText, newText) => {
    for (let i = 0; i < newText.length; i++) {
      if (oldText[i] !== newText[i]) {
        return i;
      }
    }
    return newText.length - 1;
  };

  const findContentIndexFromTextIndex = (textIndex) => {
    let charCount = 0;
    for (let i = 0; i < broadcastContent.length; i++) {
      const item = broadcastContent[i];
      if (item.type === 'text') {
        if (charCount + item.value.length > textIndex) {
          return i;
        }
        charCount += item.value.length;
      } else {
        if (charCount === textIndex) {
          return i;
        }
        charCount += 1;
      }
    }
    return broadcastContent.length;
  };

  const getTextIndexBeforeContent = (contentIndex) => {
    let charCount = 0;
    for (let i = 0; i < contentIndex; i++) {
      const item = broadcastContent[i];
      if (item.type === 'text') {
        charCount += item.value.length;
      } else {
        charCount += 1;
      }
    }
    return charCount;
  };

  // Get plain text representation (for TextInput)
  const getPlainText = () => {
    return broadcastContent
      .map((item) => {
        if (item.type === 'text') {
          return item.value;
        } else {
          // Module represented as a special character
          return '\u200B'; // Zero-width space as placeholder
        }
      })
      .join('');
  };

  const handleComplete = () => {
    updateDraft({
      broadcastContent,
      selectedTemplate,
    });
    router.back();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#5B7BC4', '#9B6FB8', '#E67E5D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.backgroundGradient}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Voice Broadcast</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollableContent}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Editable Preview Card */}
          <View style={styles.previewCard}>
            <ScrollView
              style={styles.previewScrollArea}
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.contentWrapper}>
                {broadcastContent.map((item, index) => {
                  if (item.type === 'text') {
                    return (
                      <Text key={`text-${index}`} style={styles.editableText}>
                        {item.value}
                      </Text>
                    );
                  } else {
                    const module = BROADCAST_MODULES.find((m) => m.id === item.moduleId);
                    if (!module) return null;
                    const IconComponent = module.icon;
                    return (
                      <View key={`module-${index}`} style={styles.moduleTag}>
                        <IconComponent size={16} color="#E67E5D" strokeWidth={2} />
                        <Text style={styles.moduleTagText}>{module.label}</Text>
                      </View>
                    );
                  }
                })}
              </View>

              {/* Hidden TextInput for keyboard input */}
              <TextInput
                ref={textInputRef}
                style={styles.hiddenInput}
                value={getPlainText()}
                onChangeText={handleTextChange}
                onSelectionChange={(e) => setCursorPosition(e.nativeEvent.selection.start)}
                multiline
                autoFocus
              />
            </ScrollView>
          </View>

          {/* Voice Style Templates - Horizontal Scroll */}
          <View style={styles.templateSection}>
            <Text style={styles.sectionTitle}>Voice Style</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.templateScrollContent}
            >
              {BROADCAST_TEMPLATES.map((template) => {
                const isSelected = selectedTemplate === template.id;
                return (
                  <TouchableOpacity
                    key={template.id}
                    style={[
                      styles.templateCard,
                      isSelected && styles.templateCardSelected,
                    ]}
                    onPress={() => selectTemplate(template.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.templateLabel}>{template.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Insert Modules */}
          <View style={styles.modulesCard}>
            <Text style={styles.sectionTitle}>Insert Modules</Text>
            <View style={styles.modulesGrid}>
              {BROADCAST_MODULES.map((module) => {
                const IconComponent = module.icon;
                return (
                  <TouchableOpacity
                    key={module.id}
                    style={styles.moduleButton}
                    onPress={() => insertModule(module)}
                    activeOpacity={0.7}
                  >
                    <IconComponent size={16} color="#E67E5D" strokeWidth={2} />
                    <Text style={styles.moduleLabel}>{module.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.previewButton}
            onPress={() => {}}
            activeOpacity={0.8}
          >
            <Volume2 size={20} color="#E67E5D" strokeWidth={2} />
            <Text style={styles.previewButtonText}>Preview</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleComplete}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  scrollableContent: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  previewCard: {
    backgroundColor: '#F5F5F7',
    borderRadius: 24,
    padding: 20,
    minHeight: 180,
    maxHeight: 240,
  },
  previewScrollArea: {
    flex: 1,
  },
  contentWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  editableText: {
    fontSize: 18,
    color: '#1C1C1E',
    lineHeight: 32,
    fontWeight: '400',
  },
  moduleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE8DC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#FFD4C0',
  },
  moduleTagText: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  templateSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  templateScrollContent: {
    paddingRight: 20,
    gap: 12,
  },
  templateCard: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  templateCardSelected: {
    backgroundColor: '#5B8DD6',
    borderColor: '#5B8DD6',
  },
  templateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  modulesCard: {
    backgroundColor: '#F5F5F7',
    borderRadius: 24,
    padding: 20,
    marginTop: 8,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE8DC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 6,
  },
  moduleLabel: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E67E5D',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: '#E67E5D',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#E67E5D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
