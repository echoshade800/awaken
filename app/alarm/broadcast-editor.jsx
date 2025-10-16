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
import { ArrowLeft, Clock, Calendar, Cloud, Battery, CalendarDays, Palette, Gift, Shirt, ThermometerSun, Snowflake, Thermometer, Droplets, Moon, Activity, Volume2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useStore from '../../lib/store';

const BROADCAST_MODULES = [
  { id: 'time', label: '当前时间', icon: Clock, tag: '{时间}' },
  { id: 'date', label: '日期', icon: Calendar, tag: '{日期}' },
  { id: 'weather', label: '天气', icon: Cloud, tag: '{天气}' },
  { id: 'high-temp', label: '最高温', icon: ThermometerSun, tag: '{最高温}' },
  { id: 'low-temp', label: '最低温', icon: Snowflake, tag: '{最低温}' },
  { id: 'avg-temp', label: '平均温', icon: Thermometer, tag: '{平均温}' },
  { id: 'humidity', label: '湿度', icon: Droplets, tag: '{湿度}' },
  { id: 'clothing', label: '穿衣提醒', icon: Shirt, tag: '{穿衣}' },
  { id: 'dream', label: '梦境关键词', icon: Moon, tag: '{梦境}' },
  { id: 'rhythm', label: '节律状态', icon: Activity, tag: '{节律}' },
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
  const [isPlaying, setIsPlaying] = useState(false);

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

  const MOCK_DATA = {
    '{时间}': '7点30分',
    '{日期}': '2025年10月16日星期三',
    '{天气}': '晴天',
    '{最高温}': '28度',
    '{最低温}': '18度',
    '{平均温}': '23度',
    '{湿度}': '65%',
    '{穿衣}': '适合穿薄外套或长袖',
    '{梦境}': '你梦到了大海和星空',
    '{节律}': '当前能量水平高峰期',
    '{电量}': '80%',
    '{日程}': '上卜10点有会议',
    '{幸运色}': '蓝色',
    '{彩蛋}': '今天会遇到好运',
  };

  const handlePreviewSpeech = async () => {
    if (!broadcastContent.trim()) {
      return;
    }

    if (isPlaying) {
      if (Platform.OS === 'web') {
        window.speechSynthesis?.cancel();
      } else {
        const Speech = require('expo-speech');
        Speech.stop();
      }
      setIsPlaying(false);
      return;
    }

    let content = broadcastContent;
    Object.keys(MOCK_DATA).forEach(tag => {
      content = content.replace(new RegExp(tag.replace(/[{}]/g, '\\$&'), 'g'), MOCK_DATA[tag]);
    });

    setIsPlaying(true);

    if (Platform.OS === 'web') {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(content);
        utterance.lang = 'zh-CN';
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setIsPlaying(false);
      }
    } else {
      const Speech = require('expo-speech');
      Speech.speak(content, {
        language: 'zh-CN',
        onDone: () => setIsPlaying(false),
        onStopped: () => setIsPlaying(false),
        onError: () => setIsPlaying(false),
      });
    }
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
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.voiceScrollContainer}
            >
              {VOICE_PACKAGES.map((voicePackage) => {
                const isSelected = selectedVoicePackage === voicePackage.id;
                return (
                  <TouchableOpacity
                    key={voicePackage.id}
                    style={[
                      styles.voiceCard,
                      isSelected && styles.voiceCardSelected,
                    ]}
                    onPress={() => setSelectedVoicePackage(voicePackage.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.voiceCardLabel,
                        isSelected && styles.voiceCardLabelSelected,
                      ]}
                    >
                      {voicePackage.label}
                    </Text>
                    <Text
                      style={[
                        styles.voiceCardDescription,
                        isSelected && styles.voiceCardDescriptionSelected,
                      ]}
                    >
                      {voicePackage.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* 语音试听按钮 */}
          {broadcastContent.trim().length > 0 && (
            <TouchableOpacity
              style={[
                styles.previewButton,
                isPlaying && styles.previewButtonPlaying,
              ]}
              onPress={handlePreviewSpeech}
              activeOpacity={0.8}
            >
              <Volume2 size={20} color={isPlaying ? '#FFF' : '#007AFF'} />
              <Text
                style={[
                  styles.previewButtonText,
                  isPlaying && styles.previewButtonTextPlaying,
                ]}
              >
                {isPlaying ? '正在播放...' : '试听播报效果'}
              </Text>
            </TouchableOpacity>
          )}

          {/* 确认按钮 */}
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmButtonText}>完成设置</Text>
          </TouchableOpacity>
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
  voiceScrollContainer: {
    paddingVertical: 4,
    gap: 12,
  },
  voiceCard: {
    width: 200,
    backgroundColor: '#F9F9F9',
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  voiceCardSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  voiceCardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  voiceCardLabelSelected: {
    color: '#007AFF',
  },
  voiceCardDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  voiceCardDescriptionSelected: {
    color: '#0063CC',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  previewButtonPlaying: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  previewButtonTextPlaying: {
    color: '#FFF',
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
