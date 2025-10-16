import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Clock, Calendar, Cloud, Battery, CalendarDays, Palette, Gift } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useStore from '../../lib/store';

const BROADCAST_MODULES = [
  { id: 'time', label: '当前时间', icon: Clock, tag: '{时间}' },
  { id: 'date', label: '日期', icon: Calendar, tag: '{日期}' },
  { id: 'weather', label: '天气', icon: Cloud, tag: '{天气}' },
  { id: 'battery', label: '电量', icon: Battery, tag: '{电量}' },
  { id: 'schedule', label: '日程提醒', icon: CalendarDays, tag: '{日程}' },
  { id: 'lucky-color', label: '幸运色', icon: Palette, tag: '{幸运色}' },
  { id: 'random', label: '随机彩蛋', icon: Gift, tag: '{彩蛋}' },
];

const VOICE_PACKAGES = [
  { id: 'energetic-girl', label: '元气少女', description: '活力满满的甜美女声' },
  { id: 'calm-man', label: '沉稳大叔', description: '温暖有力的男声' },
  { id: 'gentle-lady', label: '温柔姐姐', description: '轻柔舒缓的女声' },
  { id: 'cheerful-boy', label: '阳光男孩', description: '热情开朗的男声' },
];

export default function BroadcastEditor() {
  const router = useRouter();
  const { currentAlarmDraft, updateDraft, addChatMessage } = useStore();
  const inputRef = useRef(null);

  const [broadcastContent, setBroadcastContent] = useState(
    currentAlarmDraft?.broadcastContent || ''
  );
  const [selectedVoicePackage, setSelectedVoicePackage] = useState(
    currentAlarmDraft?.voicePackage || 'energetic-girl'
  );
  const [cursorPosition, setCursorPosition] = useState(0);

  const handleSelectionChange = (event) => {
    setCursorPosition(event.nativeEvent.selection.start);
  };

  const insertModule = (module) => {
    const beforeCursor = broadcastContent.substring(0, cursorPosition);
    const afterCursor = broadcastContent.substring(cursorPosition);
    const newText = beforeCursor + module.tag + afterCursor;

    setBroadcastContent(newText);

    const newCursorPos = cursorPosition + module.tag.length;
    setCursorPosition(newCursorPos);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleConfirm = () => {
    updateDraft({
      broadcastContent: broadcastContent,
      voicePackage: selectedVoicePackage,
    });

    router.back();
  };

  const renderPreview = () => {
    if (!broadcastContent) return null;

    const parts = [];
    let lastIndex = 0;
    const regex = /\{(时间|日期|天气|电量|日程|幸运色|彩蛋)\}/g;
    let match;

    while ((match = regex.exec(broadcastContent)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: broadcastContent.substring(lastIndex, match.index),
        });
      }

      parts.push({
        type: 'tag',
        content: match[0],
        label: match[1],
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < broadcastContent.length) {
      parts.push({
        type: 'text',
        content: broadcastContent.substring(lastIndex),
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
    <LinearGradient colors={['#FFF7E8', '#E6F4FF']} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>编辑播报内容</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* 输入框区域 */}
          <View style={styles.editorCard}>
            <Text style={styles.sectionTitle}>播报内容</Text>
            <Text style={styles.sectionDescription}>
              在下方输入文字，点击模块按钮可在光标位置插入动态信息
            </Text>

            <View style={styles.inputWrapper}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={broadcastContent}
                onChangeText={setBroadcastContent}
                onSelectionChange={handleSelectionChange}
                placeholder="例如：早上好！现在是{时间}，今天{日期}，外面{天气}"
                placeholderTextColor="#999"
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* 预览区域 */}
            {broadcastContent.length > 0 && (
              <View style={styles.previewContainer}>
                <Text style={styles.previewLabel}>预览效果</Text>
                <View style={styles.previewWrapper}>
                  {renderPreview().map((part, index) => {
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
              </View>
            )}
          </View>

          {/* 模块按钮区域 */}
          <View style={styles.modulesCard}>
            <Text style={styles.sectionTitle}>插入模块</Text>
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
                    <IconComponent size={20} color="#007AFF" strokeWidth={2} />
                    <Text style={styles.moduleLabel}>{module.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 语音包选择区域 */}
          <View style={styles.voicePackageCard}>
            <Text style={styles.sectionTitle}>选择语音包</Text>
            <Text style={styles.sectionDescription}>
              选择你喜欢的播报声音
            </Text>
            <View style={styles.voicePackageList}>
              {VOICE_PACKAGES.map((voicePackage) => {
                const isSelected = selectedVoicePackage === voicePackage.id;
                return (
                  <TouchableOpacity
                    key={voicePackage.id}
                    style={[
                      styles.voicePackageItem,
                      isSelected && styles.voicePackageItemSelected,
                    ]}
                    onPress={() => setSelectedVoicePackage(voicePackage.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.voicePackageInfo}>
                      <Text
                        style={[
                          styles.voicePackageLabel,
                          isSelected && styles.voicePackageLabelSelected,
                        ]}
                      >
                        {voicePackage.label}
                      </Text>
                      <Text
                        style={[
                          styles.voicePackageDescription,
                          isSelected && styles.voicePackageDescriptionSelected,
                        ]}
                      >
                        {voicePackage.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={styles.selectedIndicator}>
                        <View style={styles.selectedDot} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 确认按钮 */}
          <View style={styles.confirmContainer}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>确认</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: 48,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
    gap: 20,
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
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    lineHeight: 18,
  },
  inputWrapper: {
    minHeight: 140,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 22,
    padding: 0,
  },
  previewContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginBottom: 10,
  },
  previewWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  previewText: {
    fontSize: 14,
    color: '#333',
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
  voicePackageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  voicePackageList: {
    gap: 12,
  },
  voicePackageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  voicePackageItemSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  voicePackageInfo: {
    flex: 1,
  },
  voicePackageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  voicePackageLabelSelected: {
    color: '#007AFF',
  },
  voicePackageDescription: {
    fontSize: 13,
    color: '#666',
  },
  voicePackageDescriptionSelected: {
    color: '#0063CC',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFF',
  },
  confirmContainer: {
    paddingTop: 8,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
