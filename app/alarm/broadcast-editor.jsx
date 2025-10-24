import { useState } from 'react';
import {
  View,
  Text,
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
import { BROADCAST_MODULES, VOICE_PACKAGES } from '../../lib/broadcastModules';
import { BROADCAST_TEMPLATES } from '../../lib/broadcastTemplates';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function BroadcastEditor() {
  const router = useRouter();
  const { currentAlarmDraft, updateDraft } = useStore();

  const [selectedModules, setSelectedModules] = useState(
    currentAlarmDraft?.selectedModules || []
  );
  const [selectedVoicePackage, setSelectedVoicePackage] = useState(
    currentAlarmDraft?.voicePackage || VOICE_PACKAGES[0].id
  );

  const parseContentToElements = (text, modules) => {
    const elements = [];
    let lastIndex = 0;
    const regex = /\{([^}]+)\}/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        elements.push({
          type: 'text',
          content: text.substring(lastIndex, match.index),
        });
      }

      const moduleId = match[1];
      const module = BROADCAST_MODULES.find((m) => m.tag === `{${moduleId}}`);

      if (module) {
        elements.push({
          type: 'module',
          module: module,
        });
      } else {
        elements.push({
          type: 'text',
          content: match[0],
        });
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      elements.push({
        type: 'text',
        content: text.substring(lastIndex),
      });
    }

    return elements;
  };

  const toggleModule = (module) => {
    const exists = selectedModules.find((m) => m.id === module.id);
    if (exists) {
      setSelectedModules(selectedModules.filter((m) => m.id !== module.id));
    } else {
      setSelectedModules([...selectedModules, module]);
    }
  };

  const isModuleSelected = (moduleId) => {
    return selectedModules.some((m) => m.id === moduleId);
  };

  const handleComplete = () => {
    updateDraft({
      selectedModules,
      voicePackage: selectedVoicePackage,
    });
    router.back();
  };

  const displayText = BROADCAST_TEMPLATES[0].content;
  const elements = parseContentToElements(displayText, selectedModules);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#5B6FBC', '#8B5FB8', '#E67E5D']}
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

        <View style={styles.fixedDisplaySection}>
          <View style={styles.displayCard}>
            <ScrollView
              style={styles.displayScrollView}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.richTextContainer}>
                {elements.map((element, index) => {
                  if (element.type === 'text') {
                    return (
                      <Text key={index} style={styles.displayText}>
                        {element.content}
                      </Text>
                    );
                  } else {
                    const IconComponent = element.module.icon;
                    const isBlue = ['time', 'date'].includes(element.module.id);
                    return (
                      <View
                        key={index}
                        style={[
                          styles.inlineModulePill,
                          isBlue ? styles.inlineModulePillBlue : styles.inlineModulePillOrange,
                        ]}
                      >
                        <IconComponent
                          size={16}
                          color={isBlue ? '#5B8DD6' : '#E67E5D'}
                          strokeWidth={2}
                        />
                        <Text
                          style={[
                            styles.inlineModuleText,
                            isBlue ? styles.inlineModuleTextBlue : styles.inlineModuleTextOrange,
                          ]}
                        >
                          {element.module.label}
                        </Text>
                      </View>
                    );
                  }
                })}
              </View>
            </ScrollView>
          </View>
        </View>

        <ScrollView
          style={styles.scrollableContent}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.voiceStyleSection}>
            <Text style={styles.sectionTitle}>Voice Style</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.voiceStyleScroll}
            >
              {VOICE_PACKAGES.map((pkg) => {
                const isSelected = selectedVoicePackage === pkg.id;
                return (
                  <TouchableOpacity
                    key={pkg.id}
                    style={[
                      styles.voiceStyleCard,
                      isSelected && styles.voiceStyleCardSelected,
                    ]}
                    onPress={() => setSelectedVoicePackage(pkg.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.voiceStyleAvatar}>
                      <Text style={styles.voiceStyleEmoji}>
                        {pkg.id === 'energetic-girl' ? '🧑' :
                         pkg.id === 'calm-man' ? '🧚' :
                         pkg.id === 'gentle-lady' ? '🦸' : '🐶'}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.voiceStyleLabel,
                        isSelected && styles.voiceStyleLabelSelected,
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

          <View style={styles.modulesSection}>
            <Text style={styles.sectionTitle}>Insert Modules</Text>
            <View style={styles.modulesGrid}>
              {BROADCAST_MODULES.map((module) => {
                const IconComponent = module.icon;
                const isSelected = isModuleSelected(module.id);
                return (
                  <TouchableOpacity
                    key={module.id}
                    style={[
                      styles.moduleCard,
                      isSelected && styles.moduleCardSelected,
                    ]}
                    onPress={() => toggleModule(module)}
                    activeOpacity={0.7}
                  >
                    <IconComponent size={18} color="#E67E5D" strokeWidth={2} />
                    <Text style={styles.moduleLabel} numberOfLines={1}>
                      {module.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.voicePackageSection}>
            <Text style={styles.sectionTitle}>Voice Package</Text>
            <View style={styles.voicePackageButtons}>
              {VOICE_PACKAGES.slice(0, 3).map((pkg) => {
                const isSelected = selectedVoicePackage === pkg.id;
                return (
                  <TouchableOpacity
                    key={pkg.id}
                    style={[
                      styles.voicePackageButton,
                      isSelected && styles.voicePackageButtonSelected,
                    ]}
                    onPress={() => setSelectedVoicePackage(pkg.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.voicePackageButtonText,
                        isSelected && styles.voicePackageButtonTextSelected,
                      ]}
                    >
                      {pkg.label}
                    </Text>
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
    paddingVertical: 16,
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
  fixedDisplaySection: {
    height: '45%',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  displayCard: {
    backgroundColor: '#F5F5F7',
    borderRadius: 24,
    padding: 20,
    flex: 1,
  },
  displayScrollView: {
    flex: 1,
  },
  scrollableContent: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  richTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  displayText: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 28,
    marginRight: 4,
  },
  inlineModulePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 14,
    marginHorizontal: 2,
    marginVertical: 2,
    marginBottom: 2,
    gap: 6,
  },
  inlineModulePillBlue: {
    backgroundColor: '#E3EDFA',
  },
  inlineModulePillOrange: {
    backgroundColor: '#FFE8DC',
  },
  inlineModuleText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  inlineModuleTextBlue: {
    color: '#5B8DD6',
  },
  inlineModuleTextOrange: {
    color: '#E67E5D',
  },
  voiceStyleSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  voiceStyleScroll: {
    gap: 12,
    paddingHorizontal: 4,
  },
  voiceStyleCard: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    minWidth: 90,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  voiceStyleCardSelected: {
    backgroundColor: '#5B8DD6',
    borderColor: '#FFFFFF',
  },
  voiceStyleAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceStyleEmoji: {
    fontSize: 32,
  },
  voiceStyleLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  voiceStyleLabelSelected: {
    fontWeight: '600',
  },
  modulesSection: {
    marginBottom: 24,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE8DC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moduleCardSelected: {
    borderColor: '#E67E5D',
    backgroundColor: '#FFD4C0',
  },
  moduleLabel: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  voicePackageSection: {
    marginBottom: 24,
  },
  voicePackageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  voicePackageButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  voicePackageButtonSelected: {
    backgroundColor: '#FFE8DC',
    borderColor: '#E67E5D',
  },
  voicePackageButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  voicePackageButtonTextSelected: {
    color: '#E67E5D',
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 20,
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
    shadowOpacity: 0.4,
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
