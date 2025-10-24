import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';
import useStore from '../../lib/store';
import { BROADCAST_MODULES, VOICE_PACKAGES } from '../../lib/broadcastModules';
import { BROADCAST_TEMPLATES } from '../../lib/broadcastTemplates';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MODULE_CARD_WIDTH = (SCREEN_WIDTH - 60) / 2;

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
    Keyboard.dismiss();

    const beforeCursor = broadcastContent.substring(0, cursorPosition);
    const afterCursor = broadcastContent.substring(cursorPosition);
    const newText = beforeCursor + module.tag + ' ' + afterCursor;

    setBroadcastContent(newText);

    const newCursorPos = cursorPosition + module.tag.length + 1;
    setCursorPosition(newCursorPos);
  };

  const handleComplete = () => {
    updateDraft({
      broadcastContent,
      voicePackage: selectedVoicePackage,
    });
    router.back();
  };

  const getUsedModules = () => {
    const usedModuleIds = [];
    BROADCAST_MODULES.forEach(module => {
      if (broadcastContent.includes(module.tag)) {
        usedModuleIds.push(module);
      }
    });
    return usedModuleIds;
  };

  const renderModuleRow = (modules, startIndex) => {
    return modules.slice(startIndex, startIndex + 2).map((module) => {
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
          <Text style={styles.moduleLabel} numberOfLines={1}>
            {module.label}
          </Text>
        </TouchableOpacity>
      );
    });
  };

  const renderModulesGrid = () => {
    const rows = [];
    for (let i = 0; i < BROADCAST_MODULES.length; i += 2) {
      rows.push(
        <View key={`row-${i}`} style={styles.moduleRow}>
          {renderModuleRow(BROADCAST_MODULES, i)}
        </View>
      );
    }
    return rows;
  };

  const usedModules = getUsedModules();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <LinearGradient
        colors={['#E8F0FB', '#F5F3ED', '#FFF4E6']}
        style={styles.backgroundGradient}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#1C1C1E" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Voice Broadcast</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.fixedTop}>
          <View style={styles.inputCard}>
            <TextInput
              ref={inputRef}
              style={styles.mainInput}
              value={broadcastContent}
              onChangeText={handleContentChange}
              onSelectionChange={handleSelectionChange}
              placeholder="Boot complete. It's {time} {weekday} {date}. Outside is {weather}, temperature around {high-temp}°."
              placeholderTextColor="#999"
              multiline
              textAlignVertical="top"
            />
          </View>

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
                  style={[
                    styles.voiceRoleCard,
                    isSelected && styles.voiceRoleCardSelected
                  ]}
                  onPress={() => setSelectedVoicePackage(pkg.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.voiceRoleIcon}>
                    <Text style={styles.voiceRoleEmoji}>
                      {pkg.id === 'energetic-girl' ? '🎀' :
                       pkg.id === 'calm-man' ? '🎩' :
                       pkg.id === 'gentle-lady' ? '🌸' : '🎯'}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.voiceRoleLabel,
                      isSelected && styles.voiceRoleLabelSelected,
                    ]}
                    numberOfLines={1}
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
          <Text style={styles.sectionTitle}>Insert Modules</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.modulesScrollContent}
          >
            <View style={styles.modulesContainer}>
              {renderModulesGrid()}
            </View>
          </ScrollView>

          <Text style={styles.sectionTitle}>Voice Package</Text>
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
                  <View style={[
                    styles.voicePackageContainer,
                    isSelected && styles.voicePackageSelected
                  ]}>
                    <Text style={styles.voicePackageTitle}>{pkg.label}</Text>
                    <Text style={styles.voicePackageDesc}>{pkg.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {usedModules.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Selected Modules</Text>
              <View style={styles.selectedModulesContainer}>
                {usedModules.map((module) => {
                  const IconComponent = module.icon;
                  return (
                    <View key={module.id} style={styles.selectedModuleTag}>
                      <IconComponent size={14} color="#FF9A76" strokeWidth={2} />
                      <Text style={styles.selectedModuleText}>{module.label}</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}

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
    </KeyboardAvoidingView>
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
    color: '#1C1C1E',
    letterSpacing: 0.3,
  },
  fixedTop: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    height: 120,
  },
  mainInput: {
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 22,
    height: 80,
  },
  voiceRoleScroll: {
    paddingHorizontal: 4,
    gap: 12,
  },
  voiceRoleCard: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  voiceRoleCardSelected: {
    borderColor: '#FF9A76',
    backgroundColor: '#FFF5F0',
  },
  voiceRoleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceRoleEmoji: {
    fontSize: 24,
  },
  voiceRoleLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  voiceRoleLabelSelected: {
    color: '#FF9A76',
    fontWeight: '600',
  },
  scrollableContent: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
    marginTop: 8,
  },
  modulesScrollContent: {
    paddingRight: 20,
  },
  modulesContainer: {
    gap: 12,
  },
  moduleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  moduleCard: {
    width: MODULE_CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FFE5D9',
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
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
    flex: 1,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    minHeight: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  voicePackageSelected: {
    borderColor: '#FF9A76',
    backgroundColor: '#FFF5F0',
  },
  voicePackageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  voicePackageDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  selectedModulesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    minHeight: 80,
    alignItems: 'flex-start',
    alignContent: 'flex-start',
  },
  selectedModuleTag: {
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
  selectedModuleText: {
    fontSize: 13,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 40,
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
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
    letterSpacing: 0.3,
  },
});
