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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function BroadcastEditor() {
  const router = useRouter();
  const { currentAlarmDraft, updateDraft } = useStore();

  const [customModules, setCustomModules] = useState(
    currentAlarmDraft?.customModules || [
      BROADCAST_MODULES[0],
      BROADCAST_MODULES[1],
      BROADCAST_MODULES[3],
    ]
  );
  const [selectedVoicePackage, setSelectedVoicePackage] = useState(
    currentAlarmDraft?.voicePackage || VOICE_PACKAGES[2].id
  );

  const addModule = (module) => {
    if (!customModules.find((m) => m.id === module.id)) {
      setCustomModules([...customModules, module]);
    }
  };

  const removeModule = (moduleId) => {
    setCustomModules(customModules.filter((m) => m.id !== moduleId));
  };

  const handleComplete = () => {
    updateDraft({
      customModules,
      voicePackage: selectedVoicePackage,
    });
    router.back();
  };

  const renderPreviewContent = () => {
    const content = [];
    content.push({ type: 'text', value: "Boot complete. It's " });

    customModules.forEach((module, index) => {
      content.push({ type: 'tag', module });
      if (index < customModules.length - 1) {
        content.push({ type: 'text', value: '. ' });
      } else {
        content.push({ type: 'text', value: '. Outside is ' });
      }
    });

    return content;
  };

  const previewContent = renderPreviewContent();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#5B7BC4', '#9B6FB8', '#E67E5D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
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

        <ScrollView
          style={styles.scrollableContent}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.previewCard}>
            <View style={styles.previewTextWrapper}>
              {previewContent.map((item, index) => {
                if (item.type === 'text') {
                  return (
                    <Text key={`text-${index}`} style={styles.previewText}>
                      {item.value}
                    </Text>
                  );
                } else {
                  const IconComponent = item.module.icon;
                  return (
                    <View key={`tag-${index}`} style={styles.previewTag}>
                      <IconComponent size={16} color="#E67E5D" strokeWidth={2} />
                      <Text style={styles.previewTagText}>{item.module.label}</Text>
                    </View>
                  );
                }
              })}
            </View>
          </View>

          <View style={styles.voiceStyleCard}>
            <Text style={styles.sectionTitle}>Voice Style</Text>
            <View style={styles.voiceStyleGrid}>
              {VOICE_PACKAGES.map((pkg) => {
                const isSelected = selectedVoicePackage === pkg.id;
                return (
                  <TouchableOpacity
                    key={pkg.id}
                    style={[
                      styles.voiceStyleOption,
                      isSelected && styles.voiceStyleOptionSelected,
                    ]}
                    onPress={() => setSelectedVoicePackage(pkg.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.voiceStyleEmoji}>{pkg.emoji}</Text>
                    <Text style={styles.voiceStyleLabel}>{pkg.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.modulesCard}>
            <Text style={styles.sectionTitle}>Insert Modules</Text>
            <View style={styles.modulesGrid}>
              {BROADCAST_MODULES.map((module) => {
                const IconComponent = module.icon;
                return (
                  <TouchableOpacity
                    key={module.id}
                    style={styles.moduleButton}
                    onPress={() => addModule(module)}
                    activeOpacity={0.7}
                  >
                    <IconComponent size={16} color="#E67E5D" strokeWidth={2} />
                    <Text style={styles.moduleLabel}>{module.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.customVoiceCard}>
            <Text style={styles.sectionTitle}>Custom Voice Area</Text>
            <View style={styles.customModulesArea}>
              {customModules.length > 0 ? (
                <View style={styles.customModulesWrapper}>
                  {customModules.map((module) => {
                    const IconComponent = module.icon;
                    return (
                      <TouchableOpacity
                        key={module.id}
                        style={styles.customModuleTag}
                        onPress={() => removeModule(module.id)}
                        activeOpacity={0.7}
                      >
                        <IconComponent size={16} color="#E67E5D" strokeWidth={2} />
                        <Text style={styles.customModuleText}>{module.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}
              <Text style={styles.dragPlaceholder}>+ Drag modules here</Text>
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
    paddingVertical: 12,
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
  scrollableContent: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  previewCard: {
    backgroundColor: '#F5F5F7',
    borderRadius: 24,
    padding: 24,
    minHeight: 180,
  },
  previewTextWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  previewText: {
    fontSize: 18,
    color: '#1C1C1E',
    lineHeight: 32,
    fontWeight: '400',
  },
  previewTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE8DC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#FFD4C0',
  },
  previewTagText: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  voiceStyleCard: {
    backgroundColor: '#F5F5F7',
    borderRadius: 24,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  voiceStyleGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  voiceStyleOption: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 8,
    borderRadius: 16,
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  voiceStyleOptionSelected: {
    backgroundColor: '#5B8DD6',
    borderColor: '#5B8DD6',
  },
  voiceStyleEmoji: {
    fontSize: 36,
  },
  voiceStyleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  modulesCard: {
    backgroundColor: '#F5F5F7',
    borderRadius: 24,
    padding: 20,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE8DC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 6,
  },
  moduleLabel: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  customVoiceCard: {
    backgroundColor: '#F5F5F7',
    borderRadius: 24,
    padding: 20,
  },
  customModulesArea: {
    minHeight: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  customModulesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  customModuleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE8DC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#E67E5D',
  },
  customModuleText: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  dragPlaceholder: {
    fontSize: 15,
    color: '#999999',
    textAlign: 'center',
    fontWeight: '400',
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    shadowOpacity: 0.3,
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
