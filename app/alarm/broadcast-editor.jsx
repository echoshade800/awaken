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
import { BROADCAST_MODULES, VOICE_PACKAGES, generateMockData, replaceTags } from '../../lib/broadcastModules';

export default function BroadcastEditor() {
  const router = useRouter();
  const { currentAlarmDraft, updateDraft } = useStore();
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
      if (inputRef.current) {
        inputRef.current.focus();

        if (Platform.OS === 'web') {
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        } else {
          inputRef.current.setNativeProps({
            selection: { start: newCursorPos, end: newCursorPos }
          });
        }
      }
    }, 100);
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
      {/* Header - fixed */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Broadcast</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Input area - fixed at top */}
      <View style={styles.editorCard}>
        <Text style={styles.sectionTitle}>Broadcast Content</Text>
        <Text style={styles.sectionDescription}>
          Enter text below, click module buttons to insert dynamic info at cursor
        </Text>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={broadcastContent}
            onChangeText={setBroadcastContent}
            onSelectionChange={handleSelectionChange}
            placeholder="Example: Good morning! It's {time}, today is {date}, weather is {weather}"
            placeholderTextColor="#999"
            multiline
            textAlignVertical="top"
          />
        </View>
      </View>

      {/* Middle scroll area - modules and voice packages */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Insert modules area */}
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
                  <IconComponent size={20} color="#007AFF" strokeWidth={2} />
                  <Text style={styles.moduleLabel}>{module.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Voice package selection area */}
        <View style={styles.voicePackageCard}>
          <Text style={styles.sectionTitle}>Select Voice</Text>
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

      {/* Bottom actions - fixed */}
      <View style={styles.bottomActions}>
        {/* Voice preview button */}
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
              {isPlaying ? 'Stop' : 'Preview'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Complete button */}
        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleComplete}
          activeOpacity={0.8}
        >
          <Text style={styles.completeButtonText}>Complete</Text>
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  inputWrapper: {
    height: 100,
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
  modulesCard: {
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
