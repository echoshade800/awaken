import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';

const STORAGE_KEY = 'awaken_deviceUsageData';
const MAX_HISTORY_DAYS = 365;

let ScreenTimeModule = null;
try {
  ScreenTimeModule = require('../modules/screen-time').default;
} catch (e) {
  console.log('[UsageTracking] Screen Time module not available:', e.message);
}

export async function checkScreenTimePermission() {
  if (Platform.OS === 'web') {
    return false;
  }

  if (Platform.OS === 'ios') {
    try {
      if (ScreenTimeModule && ScreenTimeModule.checkPermission) {
        const status = await ScreenTimeModule.checkPermission();
        return status === 'authorized';
      }
      console.log('[UsageTracking] Screen Time module not available on this device');
      return false;
    } catch (error) {
      console.error('[UsageTracking] Error checking permission:', error);
      return false;
    }
  }

  if (Platform.OS === 'android') {
    try {
      if (ScreenTimeModule && ScreenTimeModule.checkUsageStatsPermission) {
        return await ScreenTimeModule.checkUsageStatsPermission();
      }
      console.log('[UsageTracking] Usage Stats module not available');
      return false;
    } catch (error) {
      console.error('[UsageTracking] Error checking permission:', error);
      return false;
    }
  }

  return false;
}

export async function requestScreenTimePermission() {
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      Alert.alert(
        'Screen Time Data Permission',
        'Monster needs to analyze your device usage patterns to calculate:\n\n' +
        '• Personalized Sleep Need\n' +
        '• Sleep Debt\n' +
        '• Circadian Rhythm\n\n' +
        '🔒 Privacy: Only usage timestamps are analyzed. No app content or personal data is accessed.\n\n' +
        '📱 Demo Mode: Since we\'re on web, we\'ll generate 30 days of sample data to demonstrate the feature.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Allow & Generate Sample Data',
            onPress: () => resolve(true),
          },
        ]
      );
    });
  }

  if (Platform.OS === 'ios') {
    try {
      if (ScreenTimeModule && ScreenTimeModule.requestAuthorization) {
        const granted = await new Promise((resolve) => {
          Alert.alert(
            'Screen Time Permission',
            'Monster needs access to Screen Time data to:\n\n' +
            '• Calculate your personalized sleep need\n' +
            '• Track sleep debt over 14 days\n' +
            '• Model your circadian rhythm\n\n' +
            '🔒 Privacy: Only screen on/off timestamps are used. No app names or content are accessed.\n\n' +
            'You\'ll be redirected to Settings to grant permission.',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => resolve(false),
              },
              {
                text: 'Open Settings',
                onPress: async () => {
                  try {
                    await ScreenTimeModule.requestAuthorization();
                    const hasPermission = await checkScreenTimePermission();
                    resolve(hasPermission);
                  } catch (err) {
                    console.error('[UsageTracking] Error opening settings:', err);
                    resolve(false);
                  }
                },
              },
            ]
          );
        });
        return granted;
      } else {
        return await new Promise((resolve) => {
          Alert.alert(
            'Feature Not Available',
            'Screen Time analysis requires iOS 15+ and the Family Controls framework.\n\nWe\'ll use demo data to demonstrate the feature instead.',
            [
              {
                text: 'Use Demo Data',
                onPress: () => resolve(true)
              }
            ]
          );
        });
      }
    } catch (error) {
      console.error('[UsageTracking] Error requesting iOS permission:', error);
      return new Promise((resolve) => {
        Alert.alert(
          'Permission Error',
          'Unable to request Screen Time permission. We\'ll use demo data instead.',
          [{ text: 'OK', onPress: () => resolve(true) }]
        );
      });
    }
  }

  if (Platform.OS === 'android') {
    try {
      if (ScreenTimeModule && ScreenTimeModule.requestUsageStatsPermission) {
        const granted = await new Promise((resolve) => {
          Alert.alert(
            'Usage Access Permission',
            'Monster needs access to Usage Stats to:\n\n' +
            '• Calculate your personalized sleep need\n' +
            '• Track sleep debt\n' +
            '• Model your circadian rhythm\n\n' +
            '🔒 Privacy: Only screen unlock timestamps are used.\n\n' +
            'You\'ll be redirected to Settings to grant permission.',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => resolve(false),
              },
              {
                text: 'Open Settings',
                onPress: async () => {
                  try {
                    await ScreenTimeModule.requestUsageStatsPermission();
                    const hasPermission = await checkScreenTimePermission();
                    resolve(hasPermission);
                  } catch (err) {
                    console.error('[UsageTracking] Error opening settings:', err);
                    resolve(false);
                  }
                },
              },
            ]
          );
        });
        return granted;
      } else {
        return await new Promise((resolve) => {
          Alert.alert(
            'Feature Not Available',
            'Usage Stats analysis is not available on this device. We\'ll use demo data instead.',
            [{ text: 'Use Demo Data', onPress: () => resolve(true) }]
          );
        });
      }
    } catch (error) {
      console.error('[UsageTracking] Error requesting Android permission:', error);
      return true;
    }
  }

  return false;
}

export async function startUsageTracking() {
  if (Platform.OS === 'web') {
    console.log('[UsageTracking] Web platform - simulating usage tracking');
    return true;
  }

  const hasPermission = await checkScreenTimePermission();
  if (!hasPermission) {
    console.log('[UsageTracking] No permission - will use demo data');
    return false;
  }

  console.log('[UsageTracking] Started tracking device usage patterns');

  if (Platform.OS === 'ios' && ScreenTimeModule && ScreenTimeModule.startMonitoring) {
    try {
      await ScreenTimeModule.startMonitoring();
    } catch (error) {
      console.error('[UsageTracking] Error starting iOS monitoring:', error);
    }
  }

  if (Platform.OS === 'android' && ScreenTimeModule && ScreenTimeModule.startMonitoring) {
    try {
      await ScreenTimeModule.startMonitoring();
    } catch (error) {
      console.error('[UsageTracking] Error starting Android monitoring:', error);
    }
  }

  return true;
}

export async function stopUsageTracking() {
  console.log('[UsageTracking] Stopped tracking');

  if (Platform.OS === 'ios' && ScreenTimeModule && ScreenTimeModule.stopMonitoring) {
    try {
      await ScreenTimeModule.stopMonitoring();
    } catch (error) {
      console.error('[UsageTracking] Error stopping iOS monitoring:', error);
    }
  }

  if (Platform.OS === 'android' && ScreenTimeModule && ScreenTimeModule.stopMonitoring) {
    try {
      await ScreenTimeModule.stopMonitoring();
    } catch (error) {
      console.error('[UsageTracking] Error stopping Android monitoring:', error);
    }
  }
}

export async function fetchRealUsageData(days = 30) {
  if (Platform.OS === 'ios' && ScreenTimeModule && ScreenTimeModule.getUsageData) {
    try {
      const data = await ScreenTimeModule.getUsageData(days);
      return data || [];
    } catch (error) {
      console.error('[UsageTracking] Error fetching iOS usage data:', error);
      return [];
    }
  }

  if (Platform.OS === 'android' && ScreenTimeModule && ScreenTimeModule.getUsageEvents) {
    try {
      const data = await ScreenTimeModule.getUsageEvents(days);
      return data || [];
    } catch (error) {
      console.error('[UsageTracking] Error fetching Android usage data:', error);
      return [];
    }
  }

  return [];
}

export async function getUsageData(days = 30) {
  const hasPermission = await checkScreenTimePermission();

  if (hasPermission && Platform.OS !== 'web') {
    const realData = await fetchRealUsageData(days);
    if (realData && realData.length > 0) {
      console.log(`[UsageTracking] Using ${realData.length} real usage events`);
      return realData;
    }
  }

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const data = JSON.parse(stored);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return data.filter((entry) => new Date(entry.date) >= cutoffDate);
  } catch (error) {
    console.error('[UsageTracking] Failed to get usage data:', error);
    return [];
  }
}

export async function saveUsageEvent(event) {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : [];

    data.push({
      ...event,
      timestamp: new Date().toISOString(),
    });

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_HISTORY_DAYS);
    const filtered = data.filter((e) => new Date(e.timestamp) >= cutoffDate);

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('[UsageTracking] Failed to save usage event:', error);
    return false;
  }
}

export function inferSleepFromUsage(usageData) {
  if (!usageData || usageData.length === 0) return [];

  const sleepSessions = [];
  const dayGroups = {};

  usageData.forEach((event) => {
    const date = event.date || new Date(event.timestamp).toISOString().split('T')[0];
    if (!dayGroups[date]) {
      dayGroups[date] = [];
    }
    dayGroups[date].push(event);
  });

  Object.keys(dayGroups)
    .sort()
    .forEach((date) => {
      const events = dayGroups[date].sort((a, b) =>
        new Date(a.timestamp) - new Date(b.timestamp)
      );

      if (events.length < 2) return;

      const firstEvent = events[0];
      const lastEvent = events[events.length - 1];

      const firstTime = new Date(firstEvent.timestamp);
      const lastTime = new Date(lastEvent.timestamp);

      let bedtime, waketime;

      if (lastTime.getHours() >= 20 || lastTime.getHours() <= 4) {
        bedtime = lastTime;
      } else {
        const estimatedBedtime = new Date(lastTime);
        estimatedBedtime.setHours(23, 0, 0, 0);
        bedtime = estimatedBedtime;
      }

      if (firstTime.getHours() >= 5 && firstTime.getHours() <= 11) {
        waketime = firstTime;
      } else {
        const estimatedWaketime = new Date(firstTime);
        estimatedWaketime.setHours(7, 0, 0, 0);
        waketime = estimatedWaketime;
      }

      let durationMs = waketime - bedtime;
      if (durationMs < 0) {
        durationMs += 24 * 60 * 60 * 1000;
      }

      const durationMin = Math.floor(durationMs / (1000 * 60));

      if (durationMin >= 180 && durationMin <= 960) {
        sleepSessions.push({
          date,
          bedtime: bedtime.toISOString(),
          waketime: waketime.toISOString(),
          durationMin,
          source: 'inferred',
        });
      }
    });

  return sleepSessions;
}

export async function generateMockUsageData(days = 30) {
  const mockData = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const bedtimeHour = 22 + Math.floor(Math.random() * 3);
    const bedtimeMinute = Math.floor(Math.random() * 60);
    const waketimeHour = 6 + Math.floor(Math.random() * 3);
    const waketimeMinute = Math.floor(Math.random() * 60);

    const bedtime = new Date(date);
    bedtime.setHours(bedtimeHour, bedtimeMinute, 0, 0);

    const waketime = new Date(date);
    waketime.setDate(waketime.getDate() + 1);
    waketime.setHours(waketimeHour, waketimeMinute, 0, 0);

    mockData.push({
      date: dateStr,
      timestamp: bedtime.toISOString(),
      type: 'screen_off',
    });

    mockData.push({
      date: dateStr,
      timestamp: waketime.toISOString(),
      type: 'screen_on',
    });

    const numDaytimeEvents = 8 + Math.floor(Math.random() * 12);
    for (let j = 0; j < numDaytimeEvents; j++) {
      const eventTime = new Date(date);
      eventTime.setHours(
        waketimeHour + Math.floor(Math.random() * (bedtimeHour - waketimeHour)),
        Math.floor(Math.random() * 60),
        0,
        0
      );
      mockData.push({
        date: dateStr,
        timestamp: eventTime.toISOString(),
        type: Math.random() > 0.5 ? 'screen_on' : 'app_usage',
      });
    }
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mockData));
  return mockData;
}

export async function calculateSleepNeedFromUsage(days = 30) {
  const usageData = await getUsageData(days);
  const sleepSessions = inferSleepFromUsage(usageData);

  if (sleepSessions.length === 0) {
    return 8.0;
  }

  const durations = sleepSessions.map((s) => s.durationMin / 60);
  const mean = durations.reduce((sum, d) => sum + d, 0) / durations.length;

  const variance =
    durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length;
  const stdDev = Math.sqrt(variance);

  const alpha = 0.15;
  const adjustedNeed = mean + alpha * stdDev;

  return Math.max(5, Math.min(11.5, adjustedNeed));
}
