import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Play, Pause } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import useStore from '../../lib/store';
import { getAllRingtones } from '../../lib/ringtones';
import { Audio } from 'expo-av';

export default function RingtoneSelector() {
  const router = useRouter();
  const editingAlarm = useStore((state) => state.editingAlarm);
  const updateAlarm = useStore((state) => state.updateAlarm);
  const [selectedRingtone, setSelectedRingtone] = useState(editingAlarm?.ringtoneId || 'lingling');
  const [playingId, setPlayingId] = useState(null);
  const [sound, setSound] = useState(null);

  const ringtones = getAllRingtones();

  const handleSelectRingtone = async (ringtoneId) => {
    setSelectedRingtone(ringtoneId);
    if (editingAlarm) {
      await updateAlarm(editingAlarm.id, { ringtoneId });
    }
  };

  const handlePlayPause = async (ringtone) => {
    try {
      if (playingId === ringtone.id) {
        // Stop playing
        if (sound) {
          await sound.stopAsync();
          await sound.unloadAsync();
          setSound(null);
        }
        setPlayingId(null);
      } else {
        // Stop previous sound if any
        if (sound) {
          await sound.stopAsync();
          await sound.unloadAsync();
        }

        // Play new sound
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: ringtone.url },
          { shouldPlay: true }
        );
        setSound(newSound);
        setPlayingId(ringtone.id);

        // Auto-stop when finished
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setPlayingId(null);
            newSound.unloadAsync();
            setSound(null);
          }
        });
      }
    } catch (error) {
      console.error('Error playing ringtone:', error);
    }
  };

  const handleBack = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#3D5A80', '#5A7BA5', '#7A9BC4', '#FFB88C', '#E8F4FF', '#F0F8FF', '#FAFCFF']}
        locations={[0, 0.25, 0.4, 0.5, 0.65, 0.82, 1]}
        style={styles.backgroundGradient}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>选择铃声</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.ringtoneList}>
            {ringtones.map((ringtone) => (
              <TouchableOpacity
                key={ringtone.id}
                style={[
                  styles.ringtoneCard,
                  selectedRingtone === ringtone.id && styles.ringtoneCardSelected
                ]}
                onPress={() => handleSelectRingtone(ringtone.id)}
                activeOpacity={0.7}
              >
                <View style={styles.ringtoneInfo}>
                  <View style={styles.ringtoneTextContainer}>
                    <Text style={[
                      styles.ringtoneName,
                      selectedRingtone === ringtone.id && styles.ringtoneNameSelected
                    ]}>
                      {ringtone.name}
                    </Text>
                    <Text style={styles.ringtoneDescription}>{ringtone.description}</Text>
                  </View>

                  {selectedRingtone === ringtone.id && (
                    <View style={styles.checkBadge}>
                      <Check size={16} color="#FFF" />
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() => handlePlayPause(ringtone)}
                  activeOpacity={0.7}
                >
                  {playingId === ringtone.id ? (
                    <Pause size={20} color="#FF9A76" />
                  ) : (
                    <Play size={20} color="#FF9A76" />
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>更多铃声即将推出</Text>
          </View>
        </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  ringtoneList: {
    gap: 12,
  },
  ringtoneCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    gap: 12,
  },
  ringtoneCardSelected: {
    backgroundColor: 'rgba(255, 154, 118, 0.2)',
    borderColor: '#FF9A76',
  },
  ringtoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ringtoneTextContainer: {
    flex: 1,
    gap: 4,
  },
  ringtoneName: {
    fontSize: 17,
    fontWeight: '500',
    color: '#4A5F8F',
  },
  ringtoneNameSelected: {
    color: '#FF9A76',
    fontWeight: '600',
  },
  ringtoneDescription: {
    fontSize: 14,
    color: '#8B7355',
    opacity: 0.8,
  },
  checkBadge: {
    backgroundColor: '#FF9A76',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 154, 118, 0.15)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 154, 118, 0.3)',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
  },
});
