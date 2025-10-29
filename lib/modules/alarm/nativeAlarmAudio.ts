import { NativeModules, Platform } from 'react-native';

interface AlarmAudioModule {
  startAlarmRingtone: (ringtoneUrl: string) => Promise<boolean>;
  stopAlarmRingtone: () => Promise<boolean>;
  isAlarmPlaying: () => Promise<boolean>;
}

const { AlarmAudio } = NativeModules as { AlarmAudio: AlarmAudioModule };

export const nativeAlarmAudio = {
  async startAlarmRingtone(ringtoneUrl: string): Promise<boolean> {
    if (Platform.OS !== 'ios' || !AlarmAudio) {
      console.warn('[NativeAlarmAudio] Native module not available on this platform');
      return false;
    }

    try {
      const result = await AlarmAudio.startAlarmRingtone(ringtoneUrl);
      console.log('[NativeAlarmAudio] Start result:', result);
      return result;
    } catch (error) {
      console.error('[NativeAlarmAudio] Failed to start alarm ringtone:', error);
      return false;
    }
  },

  async stopAlarmRingtone(): Promise<boolean> {
    if (Platform.OS !== 'ios' || !AlarmAudio) {
      return false;
    }

    try {
      const result = await AlarmAudio.stopAlarmRingtone();
      console.log('[NativeAlarmAudio] Stop result:', result);
      return result;
    } catch (error) {
      console.error('[NativeAlarmAudio] Failed to stop alarm ringtone:', error);
      return false;
    }
  },

  async isAlarmPlaying(): Promise<boolean> {
    if (Platform.OS !== 'ios' || !AlarmAudio) {
      return false;
    }

    try {
      return await AlarmAudio.isAlarmPlaying();
    } catch (error) {
      console.error('[NativeAlarmAudio] Failed to check alarm status:', error);
      return false;
    }
  },

  isAvailable(): boolean {
    return Platform.OS === 'ios' && !!AlarmAudio;
  },
};
