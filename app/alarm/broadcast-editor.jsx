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
import { ArrowLeft, Mic } from 'lucide-react-native';
import useStore from '../../lib/store';
import { BROADCAST_MODULES, VOICE_PACKAGES } from '../../lib/broadcastModules';
import { BROADCAST_TEMPLATES } from '../../lib/broadcastTemplates';
import StarBackground from '../../components/StarBackground';
import UnifiedPanelBorder from '../../components/UnifiedPanelBorder';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function BroadcastEditor() {
  const router = useRouter();
  const { currentAlarmDraft, updateDraft } = useStore();
  const inputRef = useRef(null);

  const [broadcastContent, setBroadcastContent] = useState(
    currentAlarmDraft?.broadcastContent || BROADCAST_TEMPLATES[0].content
  );
  const [selectedVoicePackage, setSelectedVoicePackage] = useState(
    currentAlarmDraft?.voicePackage || VOICE_PACKAGES[0].id
  );
  const [cursorPosition, setCursorPosition] = useState(0);

  const handleContentChange = (text) => {
    setBroadcastContent(text);
  };

  const handleSelectionChange = (event) => {
    setCursorPosition(event.nativeEvent.selection.start);
  };

  const insertModule = (module) => {
    const beforeCursor = broadcastContent.substring(0, cursorPosition);
    const afterCursor = broadcastContent.substring(cursorPosition);
    const newText = beforeCursor + module.tag + ' ' + afterCursor;

    setBroadcastContent(newText);

    const newCursorPos = cursorPosition + module.tag.length + 1;
    setCursorPosition(newCursorPos);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleComplete = () => {
    updateDraft({
      broadcastContent,
      voicePackage: selectedVoicePackage,
    });
    router.back();
  };

  const renderModuleTag = (text) => {
    const parts = [];
    let lastIndex = 0;

    const tagIds = BROADCAST_MODULES.map(m => m.id).join('|');
    const regex = new RegExp(`\\{(${tagIds})\\}`, 'g');
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
    const module = BROADCAST_MODULES.find(m => m.id === label);
    return module?.icon || BROADCAST_MODULES[0].icon;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E8F4FD', '#D6EEFF', '#A8D8F0', '#6BA8D0', '#4A6B8A', '#2B4164', '#1A2845', '#0D1525']}
        style={styles.backgroundGradient}
      />
      <StarBackground />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="rgba(255, 255, 255, 0.9)" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Voice Broadcast</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.fixedTop}>
          <UnifiedPanelBorder style={styles.inputCard}>
            <TextInput
              ref={inputRef}
              style={styles.mainInput}
              value={broadcastContent}
              onChangeText={handleContentChange}
              onSelectionChange={handleSelectionChange}
              placeholder="Boot complete. It's {time} {weekday} {date}..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              multiline
              textAlignVertical="top"
            />
          </UnifiedPanelBorder>

          {broadcastContent.length > 0 && (
            <ScrollView
              style={styles.previewContainer}
              contentContainerStyle={styles.previewContent}
              horizontal={false}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.previewWrapper}>
                {renderModuleTag(broadcastContent).map((part, index) => {
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
                        <IconComponent size={12} color="rgba(200, 230, 255, 0.9)" strokeWidth={2} />
                        <Text style={styles.previewTagText}>{part.label}</Text>
                      </View>
                    );
                  }
                })}
              </View>
            </ScrollView>
          )}

          <Text style={styles.sectionLabel}>Voice Role</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.voiceRoleScroll}
          >
            {VOICE_PACKAGES.map((pkg) => {
              const isSelected = selectedVoicePackage === pkg.id;
              return (
                <TouchableOpacity
                  key={pkg.id}
                  style={styles.voiceRoleCard}
                  onPress={() => setSelectedVoicePackage(pkg.id)}
                  activeOpacity={0.7}
                >
                  <UnifiedPanelBorder style={[
                    styles.voiceRoleIconContainer,
                    isSelected && styles.voiceRoleSelected
                  ]}>
                    <Mic
                      size={24}
                      color={isSelected ? "rgba(200, 230, 255, 1)" : "rgba(255, 255, 255, 0.5)"}
                      strokeWidth={2}
                    />
                  </UnifiedPanelBorder>
                  <Text
                    style={[
                      styles.voiceRoleLabel,
                      isSelected && styles.voiceRoleLabelSelected,
                    ]}
                  >
                    {pkg.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          style={styles.scrollableContent}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>Voice Package</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.voicePackageScroll}
          >
            {VOICE_PACKAGES.map((pkg) => {
              const isSelected = selectedVoicePackage === pkg.id;
              return (
                <TouchableOpacity
                  key={pkg.id}
                  style={styles.voicePackageCard}
                  onPress={() => setSelectedVoicePackage(pkg.id)}
                  activeOpacity={0.7}
                >
                  <UnifiedPanelBorder style={[
                    styles.voicePackageContainer,
                    isSelected && styles.voicePackageSelected
                  ]}>
                    <Text style={styles.voicePackageTitle}>{pkg.label}</Text>
                    <Text style={styles.voicePackageDesc}>{pkg.description}</Text>
                  </UnifiedPanelBorder>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.sectionLabel}>Insert Modules</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.modulesScrollContent}
          >
            <View style={styles.modulesGrid}>
              {BROADCAST_MODULES.map((module) => {
                const IconComponent = module.icon;
                return (
                  <TouchableOpacity
                    key={module.id}
                    style={styles.moduleCard}
                    onPress={() => insertModule(module)}
                    activeOpacity={0.7}
                  >
                    <UnifiedPanelBorder style={styles.moduleContainer}>
                      <View style={styles.moduleIconWrapper}>
                        <IconComponent size={18} color="rgba(200, 230, 255, 0.9)" strokeWidth={2} />
                      </View>
                      <Text style={styles.moduleLabel} numberOfLines={2}>
                        {module.label}
                      </Text>
                    </UnifiedPanelBorder>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleComplete}
            activeOpacity={0.8}
          >
            <Text style={styles.completeButtonText}>Confirm</Text>
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
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 0.5,
  },
  fixedTop: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  inputCard: {
    minHeight: 120,
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  mainInput: {
    flex: 1,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 22,
    minHeight: 88,
  },
  previewContainer: {
    maxHeight: 60,
    marginBottom: 12,
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
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 20,
  },
  previewTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(200, 230, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(200, 230, 255, 0.2)',
  },
  previewTagText: {
    fontSize: 11,
    color: 'rgba(200, 230, 255, 0.9)',
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(200, 230, 255, 0.95)',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  voiceRoleScroll: {
    paddingHorizontal: 4,
    gap: 16,
    marginBottom: 12,
  },
  voiceRoleCard: {
    alignItems: 'center',
    gap: 8,
  },
  voiceRoleIconContainer: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceRoleSelected: {
    backgroundColor: 'rgba(200, 230, 255, 0.2)',
    borderColor: 'rgba(200, 230, 255, 0.4)',
  },
  voiceRoleLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  voiceRoleLabelSelected: {
    color: 'rgba(200, 230, 255, 0.95)',
    fontWeight: '600',
  },
  scrollableContent: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  voicePackageScroll: {
    paddingHorizontal: 4,
    gap: 12,
    marginBottom: 20,
  },
  voicePackageCard: {
    width: SCREEN_WIDTH * 0.7,
  },
  voicePackageContainer: {
    width: '100%',
    minHeight: 80,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  voicePackageSelected: {
    backgroundColor: 'rgba(200, 230, 255, 0.2)',
    borderColor: 'rgba(200, 230, 255, 0.4)',
  },
  voicePackageTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 6,
  },
  voicePackageDesc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  modulesScrollContent: {
    paddingRight: 16,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: SCREEN_WIDTH * 2.2,
    gap: 10,
  },
  moduleCard: {
    width: (SCREEN_WIDTH - 60) / 2,
  },
  moduleContainer: {
    width: '100%',
    minHeight: 70,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  moduleIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(200, 230, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200, 230, 255, 0.2)',
  },
  moduleLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 40,
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 20,
    backgroundColor: 'rgba(13, 21, 37, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  completeButton: {
    backgroundColor: 'rgba(200, 230, 255, 0.25)',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200, 230, 255, 0.3)',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 0.5,
  },
});
