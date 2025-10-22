import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Volume2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useStore from '../../lib/store';
import { BROADCAST_MODULES, VOICE_PACKAGES, replaceTags } from '../../lib/broadcastModules';
import { BROADCAST_TEMPLATES } from '../../lib/broadcastTemplates';

export default function BroadcastEditor() {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const router = useRouter();
  const { currentAlarmDraft, updateDraft } = useStore();

  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0);
  const [broadcastContent, setBroadcastContent] = useState(
    currentAlarmDraft?.broadcastContent || BROADCAST_TEMPLATES[0].content
  );
  const [selectedVoicePackage, setSelectedVoicePackage] = useState(
    currentAlarmDraft?.voicePackage || 'energetic-girl'
  );
  const [isCustom, setIsCustom] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const flatListRef = useRef(null);

  const handleTemplateScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentTemplateIndex && index >= 0 && index < BROADCAST_TEMPLATES.length) {
      setCurrentTemplateIndex(index);
      if (!isCustom) {
        setBroadcastContent(BROADCAST_TEMPLATES[index].content);
      }
    }
  };

  const handleContentChange = (text) => {
    setBroadcastContent(text);
    setIsCustom(true);
  };

  const insertModule = (module) => {
    setBroadcastContent(prev => prev + module.tag + ' ');
    setIsCustom(true);
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
        utterance.lang = 'en-US';
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setIsPlaying(false);
      }
    } else {
      const Speech = require('expo-speech');
      Speech.speak(content, {
        language: 'en-US',
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

  const currentTemplate = BROADCAST_TEMPLATES[currentTemplateIndex];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#3D5A80', '#5A7BA5', '#7A9BC4', '#FFB88C', '#E8F4FF', '#F0F8FF', '#FAFCFF']}
        locations={[0, 0.25, 0.4, 0.5, 0.65, 0.82, 1]}
        style={styles.backgroundGradient}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Broadcast</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.templateContainer}>
        <FlatList
          ref={flatListRef}
          horizontal
          pagingEnabled
          data={BROADCAST_TEMPLATES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.templateSlide, { width: SCREEN_WIDTH }]}>
              <View style={styles.templateCard}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={broadcastContent}
                    onChangeText={handleContentChange}
                    placeholder="Swipe left/right to see templates..."
                    placeholderTextColor="#999"
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </View>
          )}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleTemplateScroll}
          decelerationRate="fast"
          snapToInterval={SCREEN_WIDTH}
          snapToAlignment="center"
        />

        <View style={styles.templateInfo}>
          <Text style={styles.templateEmoji}>{currentTemplate.emoji}</Text>
          <View style={styles.templateTextContainer}>
            <Text style={styles.templateName}>
              {isCustom ? '✏️ Custom' : currentTemplate.name}
            </Text>
            <Text style={styles.templateSubtitle}>
              {isCustom ? 'Edited template' : currentTemplate.subtitle}
            </Text>
          </View>
        </View>

        <View style={styles.pageIndicator}>
          {BROADCAST_TEMPLATES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentTemplateIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.modulesSection}>
          <Text style={styles.sectionTitle}>Insert Modules</Text>
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
                    <IconComponent size={24} color="#FF9A76" strokeWidth={2} />
                  </View>
                  <Text style={styles.moduleLabel}>{module.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.voicePackageSection}>
          <Text style={styles.sectionTitle}>Voice Package</Text>
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
              color={isPlaying ? '#FFFFFF' : '#FF9A76'}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.previewButtonText,
                isPlaying && styles.previewButtonTextPlaying,
              ]}
            >
              {isPlaying ? 'Stop' : 'Preview'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleComplete}
          activeOpacity={0.8}
        >
          <Text style={styles.completeButtonText}>Confirm</Text>
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
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  templateContainer: {
    marginBottom: 12,
  },
  templateSlide: {
    paddingHorizontal: 16,
  },
  templateCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  inputWrapper: {
    height: 160,
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
  templateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 12,
    gap: 12,
  },
  templateEmoji: {
    fontSize: 32,
  },
  templateTextContainer: {
    flex: 1,
  },
  templateName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  templateSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
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
    backgroundColor: '#FFF5F0',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFE5D9',
  },
  moduleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFE5D9',
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
    backgroundColor: '#FFF5F0',
    borderColor: '#FF9A76',
  },
  voiceCardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  voiceCardLabelSelected: {
    color: '#FF9A76',
  },
  voiceCardDescription: {
    fontSize: 13,
    color: '#666',
  },
  voiceCardDescriptionSelected: {
    color: '#D17A5A',
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
    borderColor: '#FF9A76',
  },
  previewButtonPlaying: {
    backgroundColor: '#FF9A76',
    borderColor: '#FF9A76',
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9A76',
  },
  previewButtonTextPlaying: {
    color: '#FFFFFF',
  },
  completeButton: {
    backgroundColor: '#FF9A76',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#FF9A76',
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
