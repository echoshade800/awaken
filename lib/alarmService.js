import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDefaultRingtone } from './ringtones';

const ALARM_TASK_NAME = 'ALARM_BACKGROUND_TASK';
const ACTIVE_ALARM_KEY = 'active_alarm_audio';

let globalAudioPlayer = null;
let audioSession = null;

export async function initializeAlarmService() {
  console.log('[AlarmService] Initializing alarm service');

  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
    });

    audioSession = Audio;
    console.log('[AlarmService] Audio session configured for background playback');

    setupNotificationHandler();
    setupNotificationListeners();

    return { success: true };
  } catch (error) {
    console.error('[AlarmService] Failed to initialize:', error);
    return { success: false, error: error.message };
  }
}

function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const { data } = notification.request.content;

      if (data.type === 'alarm' || data.type === 'snooze') {
        console.log('[AlarmService] Alarm notification received, starting ringtone');
        await startBackgroundAlarmAudio(data);

        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          priority: Notifications.AndroidNotificationPriority.MAX,
        };
      }

      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      };
    },
  });
}

function setupNotificationListeners() {
  Notifications.addNotificationReceivedListener(async (notification) => {
    const { data } = notification.request.content;

    if (data.type === 'alarm' || data.type === 'snooze') {
      console.log('[AlarmService] Notification received, triggering alarm audio');
      await startBackgroundAlarmAudio(data);
    }
  });
}

async function startBackgroundAlarmAudio(alarmData) {
  try {
    console.log('[AlarmService] Starting background alarm audio for:', alarmData.alarmId);

    const alarmsData = await AsyncStorage.getItem('alarms');
    if (!alarmsData) {
      console.warn('[AlarmService] No alarms found in storage');
      return;
    }

    const alarms = JSON.parse(alarmsData);
    const alarm = alarms.find(a => a.id === alarmData.alarmId);

    if (!alarm) {
      console.warn('[AlarmService] Alarm not found:', alarmData.alarmId);
      return;
    }

    const ringtoneUrl = alarm.ringtone || getDefaultRingtone().url;

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
    });

    if (globalAudioPlayer) {
      try {
        await globalAudioPlayer.unloadAsync();
      } catch (e) {
        console.log('[AlarmService] Error unloading previous player:', e);
      }
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri: ringtoneUrl },
      {
        shouldPlay: true,
        isLooping: true,
        volume: 1.0,
      }
    );

    globalAudioPlayer = sound;

    await AsyncStorage.setItem(ACTIVE_ALARM_KEY, JSON.stringify({
      alarmId: alarmData.alarmId,
      startedAt: Date.now(),
    }));

    console.log('[AlarmService] Background alarm audio started successfully');

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish && !status.isLooping) {
        console.log('[AlarmService] Alarm ringtone finished');
      }
    });

  } catch (error) {
    console.error('[AlarmService] Failed to start background alarm audio:', error);
  }
}

export async function stopBackgroundAlarmAudio() {
  try {
    if (globalAudioPlayer) {
      await globalAudioPlayer.stopAsync();
      await globalAudioPlayer.unloadAsync();
      globalAudioPlayer = null;
      console.log('[AlarmService] Background alarm audio stopped');
    }

    await AsyncStorage.removeItem(ACTIVE_ALARM_KEY);

    return { success: true };
  } catch (error) {
    console.error('[AlarmService] Failed to stop background alarm audio:', error);
    return { success: false, error: error.message };
  }
}

export async function isAlarmAudioActive() {
  try {
    const activeAlarm = await AsyncStorage.getItem(ACTIVE_ALARM_KEY);
    return !!activeAlarm;
  } catch (error) {
    console.error('[AlarmService] Failed to check alarm audio status:', error);
    return false;
  }
}

export async function checkAndResumeAlarmAudio() {
  try {
    const activeAlarmData = await AsyncStorage.getItem(ACTIVE_ALARM_KEY);

    if (activeAlarmData) {
      const { alarmId, startedAt } = JSON.parse(activeAlarmData);
      const elapsedMinutes = (Date.now() - startedAt) / 1000 / 60;

      if (elapsedMinutes < 10) {
        console.log('[AlarmService] Resuming alarm audio for:', alarmId);

        const alarmsData = await AsyncStorage.getItem('alarms');
        if (alarmsData) {
          const alarms = JSON.parse(alarmsData);
          const alarm = alarms.find(a => a.id === alarmId);

          if (alarm) {
            await startBackgroundAlarmAudio({ alarmId: alarm.id, type: 'alarm' });
          }
        }
      } else {
        await AsyncStorage.removeItem(ACTIVE_ALARM_KEY);
        console.log('[AlarmService] Alarm expired, cleared active alarm');
      }
    }
  } catch (error) {
    console.error('[AlarmService] Failed to check/resume alarm audio:', error);
  }
}
