import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Volume2, Briefcase, Clock, UserCircle } from 'lucide-react-native';
import useStore from '../../lib/store';
import { BROADCAST_MODULES, VOICE_PACKAGES, replaceTags } from '../../lib/broadcastModules';
import { BROADCAST_TEMPLATES } from '../../lib/broadcastTemplates';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const VOICE_ROLES = [
  {
    id: 'the-host',
    label: 'The Host',
    icon: Briefcase,
    color: '#FF9A76',
  },
  {
    id: 'fairy-morning',
    label: 'Fairy Morning',
    icon: Clock,
    color: '#5AC8FA',
  },
  {
    id: 'hero',
    label: 'Hero',
    icon: UserCircle,
    color: '#34C759',
  },
];

export default function BroadcastEditor() {
  const router = useRouter();
  const { currentAlarmDraft, updateDraft } = useStore();

  const [broadcastContent, setBroadcastContent] = useState(
    currentAlarmDraft?.broadcastContent || BROADCAST_TEMPLATES[0].content
  );
  const [selectedVoiceRole, setSelectedVoiceRole] = useState(
    currentAlarmDraft?.voicePackage || 'the-host'
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [customModules, setCustomModules] = useState([]);

  const handleContentChange = (text) => {
    setBroadcastContent(text);
  };

  const insertModule = (module) => {
    setBroadcastContent(prev => prev + module.tag + ' ');
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
      voicePackage: selectedVoiceRole,
    });
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Broadcast</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentCard}>
          <TextInput
            style={styles.mainInput}
            value={broadcastContent}
            onChangeText={handleContentChange}
            placeholder="Boot complete. It's {time} {weekday} {date}. Outside is {weather}, temperature around {high-temp}°."
            placeholderTextColor="#999"
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.voiceRoleSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.voiceRoleScroll}
          >
            {VOICE_ROLES.map((role) => {
              const isSelected = selectedVoiceRole === role.id;
              const IconComponent = role.icon;
              return (
                <TouchableOpacity
                  key={role.id}
                  style={styles.voiceRoleCard}
                  onPress={() => setSelectedVoiceRole(role.id)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.voiceRoleIconContainer,
                    isSelected && { backgroundColor: role.color }
                  ]}>
                    <IconComponent
                      size={28}
                      color={isSelected ? "#FFFFFF" : "#999"}
                      strokeWidth={2}
                    />
                  </View>
                  <Text
                    style={[
                      styles.voiceRoleLabel,
                      isSelected && styles.voiceRoleLabelSelected,
                    ]}
                  >
                    {role.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.modulesSection}>
          <Text style={styles.sectionTitle}>Insert Modules</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.modulesScrollContent}
          >
            <View style={styles.modulesGrid}>
              {BROADCAST_MODULES.map((module, index) => {
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
                    <Text style={styles.moduleLabel} numberOfLines={2}>
                      {module.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
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
                        <IconComponent size={14} color="#FF9A76" strokeWidth={2} />
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
    backgroundColor: '#F5F5F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 140,
  },
  mainInput: {
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 22,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  voiceRoleSection: {
    marginBottom: 24,
  },
  voiceRoleScroll: {
    paddingHorizontal: 4,
    gap: 20,
  },
  voiceRoleCard: {
    alignItems: 'center',
    gap: 8,
  },
  voiceRoleIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  voiceRoleLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999',
  },
  voiceRoleLabelSelected: {
    color: '#1C1C1E',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  modulesSection: {
    marginBottom: 24,
  },
  modulesScrollContent: {
    paddingRight: 16,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: SCREEN_WIDTH * 2,
    gap: 12,
  },
  moduleCard: {
    width: (SCREEN_WIDTH - 64) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#FFE5D9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  moduleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleLabel: {
    fontSize: 13,
    color: '#1C1C1E',
    fontWeight: '500',
    flex: 1,
  },
  customAreaSection: {
    marginBottom: 16,
  },
  customAreaContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    minHeight: 100,
    borderWidth: 1.5,
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
    backgroundColor: '#FFF5F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FFE5D9',
  },
  customModuleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFE5D9',
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
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
