import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Volume2 } from 'lucide-react-native';
import useStore from '../../lib/store';
import VoiceBroadcastEditor from '../../components/VoiceBroadcastEditor';

export default function BroadcastEditor() {
  const router = useRouter();
  const { currentAlarmDraft, updateDraft } = useStore();

  const [broadcastContent, setBroadcastContent] = useState(
    currentAlarmDraft?.broadcastContent || ''
  );

  const handleComplete = () => {
    updateDraft({
      broadcastContent,
    });
    router.back();
  };

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

        <View style={styles.content}>
          <VoiceBroadcastEditor
            value={broadcastContent}
            onChange={setBroadcastContent}
          />
        </View>

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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
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
