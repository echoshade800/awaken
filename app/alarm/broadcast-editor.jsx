import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Volume2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useStore from '../../lib/store';
import { BROADCAST_MODULES, VOICE_PACKAGES, replaceTags } from '../../lib/broadcastModules';

export default function BroadcastEditor() {
  const router = useRouter();
  const { currentAlarmDraft, updateDraft } = useStore();

  const [broadcastContent, setBroadcastContent] = useState(
    currentAlarmDraft?.broadcastContent || ''
  );
  const [selectedVoicePackage, setSelectedVoicePackage] = useState(
    currentAlarmDraft?.voicePackage || 'energetic-girl'
  );
  const [isPlaying, setIsPlaying] = useState(false);

  const insertModule = (module) => {
    setBroadcastContent(prev => prev + module.tag + ' ');
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

    const content = replaceTags(broadcastContent);
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

  const handleComplete = () => {
    updateDraft({
      broadcastContent,
      voicePackage: selectedVoicePackage,
    });
    router.back();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#3D5A80', '#5A7BA5', '#7A9BC4', '#FFB88C', '#E8F4FF', '#F0F8FF', '#FAFCFF']}
        locations={[0, 0.25, 0.4, 0.5, 0.65, 0.82, 1]}
        style={styles.backgroundGradient}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>自定义语音播报</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 固定的文本框 */}
      <View style={styles.editorCard}>
        <Text style={styles.sectionTitle}>播报内容</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={broadcastContent}
            onChangeText={setBroadcastContent}
            placeholder="点击下方模块添加播报内容..."
            placeholderTextColor="#999"
            multiline
            textAlignVertical="top"
          />
        </View>
      </View>

      {/* 可滑动区域 */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* 横向滑动的模块选择 */}
        <View style={styles.modulesSection}>
          <Text style={styles.sectionTitle}>选择播报模块</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.modulesHorizontalScroll}
          >
            {BROADCAST_MODULES.map((module) => {
              const IconComponent = module.icon;
              return (
                <TouchableOpacity
                  key={module.id}
                  style={styles.moduleCard}
                  onPress={() => insertModule(module)}
                  activeOpacity={0.7}
                >
                  <View style={styles.moduleIconContainer}>
                    <IconComponent size={24} color="#007AFF" strokeWidth={2} />
                  </View>
                  <Text style={styles.moduleLabel}>{module.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 语音包选择 */}
        <View style={styles.voicePackageSection}>
          <Text style={styles.sectionTitle}>选择语音包</Text>
          <View style={styles.voicePackageGrid}>
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
          </View>
        </View>
      </ScrollView>

      {/* 底部按钮 */}
      <View style={styles.bottomActions}>
        {broadcastContent.trim().length > 0 && (
          <TouchableOpacity
            style={[
              styles.previewButton,
              isPlaying && styles.previewButtonPlaying,
            ]}
            onPress={handlePreviewSpeech}
            activeOpacity={0.8}
          >
            <Volume2
              size={20}
              color={isPlaying ? '#FFFFFF' : '#007AFF'}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.previewButtonText,
                isPlaying && styles.previewButtonTextPlaying,
              ]}
            >
              {isPlaying ? '停止' : '预览'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleComplete}
          activeOpacity={0.8}
        >
          <Text style={styles.completeButtonText}>确认返回</Text>
        </TouchableOpacity>
      </View>
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
  editorCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
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
    marginBottom: 12,
  },
  inputWrapper: {
    height: 120,
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  modulesSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  modulesHorizontalScroll: {
    paddingRight: 20,
    gap: 12,
  },
  moduleCard: {
    width: 100,
    backgroundColor: '#F5F5F7',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
  },
  moduleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  moduleLabel: {
    fontSize: 13,
    color: '#1C1C1E',
    fontWeight: '500',
    textAlign: 'center',
  },
  voicePackageSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  voicePackageGrid: {
    gap: 12,
  },
  voiceCard: {
    backgroundColor: '#F5F5F7',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  voiceCardSelected: {
    backgroundColor: '#E3F2FF',
    borderColor: '#007AFF',
  },
  voiceCardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  voiceCardLabelSelected: {
    color: '#007AFF',
  },
  voiceCardDescription: {
    fontSize: 13,
    color: '#666',
  },
  voiceCardDescriptionSelected: {
    color: '#0051A8',
  },
  bottomActions: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
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
    color: '#FFFFFF',
  },
  completeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
