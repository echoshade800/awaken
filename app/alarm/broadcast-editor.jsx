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
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Volume2, User, MessageSquare, UserCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useStore from '../../lib/store';
import { BROADCAST_MODULES, VOICE_PACKAGES, replaceTags } from '../../lib/broadcastModules';
import { BROADCAST_TEMPLATES } from '../../lib/broadcastTemplates';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function BroadcastEditor() {
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

  const [customModules, setCustomModules] = useState([]);

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
    updateCustomModules(text);
  };

  const updateCustomModules = (text) => {
    const foundModules = [];
    BROADCAST_MODULES.forEach(module => {
      if (text.includes(module.tag)) {
        foundModules.push(module);
      }
    });
    setCustomModules(foundModules);
  };

  const renderContentWithModules = () => {
    const parts = [];
    let remainingText = broadcastContent;
    let key = 0;

    const regex = /\{[^}]+\}/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(broadcastContent)) !== null) {
      if (match.index > lastIndex) {
        const textBefore = broadcastContent.substring(lastIndex, match.index);
        parts.push(
          <Text key={`text-${key++}`} style={styles.displayText}>
            {textBefore}
          </Text>
        );
      }

      const tag = match[0];
      const module = BROADCAST_MODULES.find(m => m.tag === tag);

      if (module) {
        const IconComponent = module.icon;
        parts.push(
          <View key={`module-${key++}`} style={styles.moduleChip}>
            <View style={styles.moduleChipIcon}>
              <IconComponent size={14} color="#FF9A76" strokeWidth={2} />
            </View>
            <Text style={styles.moduleChipText}>{module.label}</Text>
          </View>
        );
      } else {
        parts.push(
          <Text key={`tag-${key++}`} style={styles.displayText}>
            {tag}
          </Text>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < broadcastContent.length) {
      parts.push(
        <Text key={`text-${key++}`} style={styles.displayText}>
          {broadcastContent.substring(lastIndex)}
        </Text>
      );
    }

    return parts;
  };

  const insertModule = (module) => {
    setBroadcastContent(prev => prev + module.tag + ' ');
    setIsCustom(true);
    if (!customModules.find(m => m.id === module.id)) {
      setCustomModules(prev => [...prev, module]);
    }
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

      <View style={styles.contentCard}>
        <View style={styles.inputContainer}>
          {broadcastContent.length > 0 ? (
            <View style={styles.displayLayer}>
              {renderContentWithModules()}
            </View>
          ) : null}
          <TextInput
            style={[
              styles.mainInput,
              broadcastContent.length > 0 && styles.mainInputTransparent
            ]}
            value={broadcastContent}
            onChangeText={handleContentChange}
            placeholder="Type text or insert modules below..."
            placeholderTextColor="#999"
            multiline
            textAlignVertical="top"
            selectionColor="#FF9A76"
          />
        </View>
      </View>

      <View style={styles.voicePackageSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.voicePackageScroll}
        >
          {VOICE_PACKAGES.map((voicePackage) => {
            const isSelected = selectedVoicePackage === voicePackage.id;
            const IconComponent = voicePackage.id === 'energetic-girl' ? MessageSquare :
                                 voicePackage.id === 'calm-man' ? User :
                                 voicePackage.id === 'gentle-lady' ? MessageSquare : UserCircle;
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
                <View style={[
                  styles.voiceIconContainer,
                  isSelected && styles.voiceIconContainerSelected
                ]}>
                  <IconComponent
                    size={24}
                    color={isSelected ? "#FFFFFF" : "#666"}
                    strokeWidth={2}
                  />
                </View>
                <Text
                  style={[
                    styles.voiceCardLabel,
                    isSelected && styles.voiceCardLabelSelected,
                  ]}
                >
                  {voicePackage.label.split(' ')[1]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.modulesSection}>
          <Text style={styles.sectionTitle}>Insert Modules</Text>
          <View style={styles.modulesGrid}>
            {BROADCAST_MODULES.slice(0, 8).map((module) => {
              const IconComponent = module.icon;
              return (
                <TouchableOpacity
                  key={module.id}
                  style={styles.moduleCard}
                  onPress={() => insertModule(module)}
                  activeOpacity={0.7}
                >
                  <View style={styles.moduleIconContainer}>
                    <IconComponent size={20} color="#FF9A76" strokeWidth={2} />
                  </View>
                  <Text style={styles.moduleLabel}>{module.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.customAreaSection}>
          <Text style={styles.sectionTitle}>Custom Voice area</Text>
          <View style={styles.customAreaContent}>
            {customModules.length > 0 ? (
              <View style={styles.customModulesWrapper}>
                {customModules.map((module) => {
                  const IconComponent = module.icon;
                  return (
                    <View key={module.id} style={styles.customModuleTag}>
                      <View style={styles.customModuleIcon}>
                        <IconComponent size={16} color="#666" strokeWidth={2} />
                      </View>
                      <Text style={styles.customModuleText}>{module.label}</Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.customAreaPlaceholder}>+ Drag modules here</Text>
            )}
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
  contentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    minHeight: 140,
  },
  inputContainer: {
    position: 'relative',
    minHeight: 100,
  },
  mainInput: {
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 22,
    minHeight: 100,
    textAlignVertical: 'top',
    zIndex: 2,
  },
  mainInputTransparent: {
    color: 'transparent',
    caretColor: '#FF9A76',
  },
  displayLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    paddingTop: 0,
    paddingRight: 4,
    pointerEvents: 'none',
    zIndex: 1,
  },
  displayText: {
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 22,
  },
  moduleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    borderWidth: 1,
    borderColor: '#FFE5D9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 2,
    gap: 4,
  },
  moduleChipIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFE5D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleChipText: {
    fontSize: 13,
    color: '#FF9A76',
    fontWeight: '500',
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
    marginBottom: 16,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moduleCard: {
    width: '48%',
    backgroundColor: '#FFF5F0',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#FFE5D9',
  },
  moduleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE5D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleLabel: {
    fontSize: 13,
    color: '#1C1C1E',
    fontWeight: '500',
    flex: 1,
  },
  voicePackageSection: {
    marginBottom: 16,
  },
  voicePackageScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  voiceCard: {
    alignItems: 'center',
    gap: 8,
  },
  voiceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceIconContainerSelected: {
    backgroundColor: '#5AC8FA',
  },
  voiceCardLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  voiceCardLabelSelected: {
    color: '#1C1C1E',
    fontWeight: '600',
  },
  customAreaSection: {
    marginBottom: 16,
  },
  customAreaContent: {
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 16,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  customModulesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  customModuleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  customModuleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customModuleText: {
    fontSize: 13,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  customAreaPlaceholder: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 32,
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
