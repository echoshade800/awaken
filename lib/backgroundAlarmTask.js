import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKGROUND_ALARM_CHECK_TASK = 'background-alarm-check';
const ALARM_CHECK_INTERVAL = 60;

let notificationSubscription = null;
let responseSubscription = null;

export async function setupNotificationListeners(router) {
  if (notificationSubscription || responseSubscription) {
    console.log('[BackgroundAlarm] Notification listeners already set up');
    return;
  }

  notificationSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('[BackgroundAlarm] Notification received:', notification);

    const { alarmId, type } = notification.request.content.data || {};

    if (type === 'alarm' || type === 'snooze') {
      console.log('[BackgroundAlarm] Alarm notification received:', alarmId);
    }
  });

  responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('[BackgroundAlarm] Notification response received:', response);

    const { notification } = response;
    const { alarmId, type, task } = notification.request.content.data || {};
    const actionIdentifier = response.actionIdentifier;

    if (actionIdentifier === 'stop') {
      console.log('[BackgroundAlarm] Stop action triggered for alarm:', alarmId);
      handleStopAlarm(alarmId);
    } else if (actionIdentifier === 'snooze') {
      console.log('[BackgroundAlarm] Snooze action triggered for alarm:', alarmId);
      handleSnoozeAlarm(alarmId);
    } else if (actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      console.log('[BackgroundAlarm] Opening wake-up screen for alarm:', alarmId);

      if (router) {
        router.push({
          pathname: '/alarm/wake-up',
          params: {
            alarmId,
            type: type || 'alarm',
            task: task || 'shake',
          },
        });
      }
    }
  });

  console.log('[BackgroundAlarm] Notification listeners set up successfully');
}

export function removeNotificationListeners() {
  if (notificationSubscription) {
    notificationSubscription.remove();
    notificationSubscription = null;
  }

  if (responseSubscription) {
    responseSubscription.remove();
    responseSubscription = null;
  }

  console.log('[BackgroundAlarm] Notification listeners removed');
}

async function handleStopAlarm(alarmId) {
  try {
    console.log('[BackgroundAlarm] Stopping alarm:', alarmId);

    const alarmsData = await AsyncStorage.getItem('alarms');
    if (!alarmsData) return;

    const alarms = JSON.parse(alarmsData);
    const alarm = alarms.find(a => a.id === alarmId);

    if (!alarm) {
      console.warn('[BackgroundAlarm] Alarm not found:', alarmId);
      return;
    }

    if (!alarm.repeat) {
      alarm.enabled = false;
      await AsyncStorage.setItem('alarms', JSON.stringify(alarms));
      console.log('[BackgroundAlarm] One-time alarm disabled');
    }

    await AsyncStorage.setItem('lastAlarmStop', JSON.stringify({
      alarmId,
      timestamp: new Date().toISOString(),
      action: 'stop',
    }));

  } catch (error) {
    console.error('[BackgroundAlarm] Error handling stop alarm:', error);
  }
}

async function handleSnoozeAlarm(alarmId) {
  try {
    console.log('[BackgroundAlarm] Snoozing alarm:', alarmId);

    const alarmsData = await AsyncStorage.getItem('alarms');
    if (!alarmsData) return;

    const alarms = JSON.parse(alarmsData);
    const alarm = alarms.find(a => a.id === alarmId);

    if (!alarm) {
      console.warn('[BackgroundAlarm] Alarm not found:', alarmId);
      return;
    }

    const { scheduleSnooze } = await import('./alarmScheduler');
    await scheduleSnooze(alarm, 5);

    await AsyncStorage.setItem('lastAlarmSnooze', JSON.stringify({
      alarmId,
      timestamp: new Date().toISOString(),
      action: 'snooze',
    }));

    console.log('[BackgroundAlarm] Alarm snoozed successfully');
  } catch (error) {
    console.error('[BackgroundAlarm] Error handling snooze alarm:', error);
  }
}

TaskManager.defineTask(BACKGROUND_ALARM_CHECK_TASK, async () => {
  try {
    console.log('[BackgroundAlarm] Background task triggered');

    const now = Date.now();
    const alarmsData = await AsyncStorage.getItem('alarms');

    if (!alarmsData) {
      console.log('[BackgroundAlarm] No alarms found');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const alarms = JSON.parse(alarmsData);
    const enabledAlarms = alarms.filter(alarm => alarm.enabled);

    if (enabledAlarms.length === 0) {
      console.log('[BackgroundAlarm] No enabled alarms');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    let hasUpcomingAlarms = false;

    for (const alarm of enabledAlarms) {
      const { calculateNextAlarmDate } = await import('./alarmScheduler');
      const nextTrigger = calculateNextAlarmDate(alarm);

      const timeUntilAlarm = nextTrigger.getTime() - now;
      const minutesUntilAlarm = Math.floor(timeUntilAlarm / (1000 * 60));

      if (minutesUntilAlarm <= 30 && minutesUntilAlarm > 0) {
        hasUpcomingAlarms = true;
        console.log('[BackgroundAlarm] Upcoming alarm detected:', {
          id: alarm.id,
          label: alarm.label,
          minutesUntilAlarm,
        });
      }
    }

    await AsyncStorage.setItem('lastBackgroundCheck', JSON.stringify({
      timestamp: new Date().toISOString(),
      alarmsChecked: enabledAlarms.length,
      hasUpcomingAlarms,
    }));

    return hasUpcomingAlarms
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('[BackgroundAlarm] Background task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundTask() {
  try {
    if (Platform.OS === 'web') {
      console.log('[BackgroundAlarm] Background tasks not supported on web');
      return { success: false, error: 'Not supported on web' };
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_ALARM_CHECK_TASK);

    if (isRegistered) {
      console.log('[BackgroundAlarm] Background task already registered');
      return { success: true, alreadyRegistered: true };
    }

    await BackgroundFetch.registerTaskAsync(BACKGROUND_ALARM_CHECK_TASK, {
      minimumInterval: ALARM_CHECK_INTERVAL,
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log('[BackgroundAlarm] Background task registered successfully');
    return { success: true };
  } catch (error) {
    console.error('[BackgroundAlarm] Failed to register background task:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function unregisterBackgroundTask() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_ALARM_CHECK_TASK);

    if (!isRegistered) {
      console.log('[BackgroundAlarm] Background task not registered');
      return { success: true };
    }

    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_ALARM_CHECK_TASK);
    console.log('[BackgroundAlarm] Background task unregistered');
    return { success: true };
  } catch (error) {
    console.error('[BackgroundAlarm] Failed to unregister background task:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function getBackgroundTaskStatus() {
  try {
    if (Platform.OS === 'web') {
      return {
        supported: false,
        registered: false,
        status: 'not-supported',
      };
    }

    const status = await BackgroundFetch.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_ALARM_CHECK_TASK);

    const statusMap = {
      [BackgroundFetch.BackgroundFetchStatus.Restricted]: 'restricted',
      [BackgroundFetch.BackgroundFetchStatus.Denied]: 'denied',
      [BackgroundFetch.BackgroundFetchStatus.Available]: 'available',
    };

    return {
      supported: true,
      registered: isRegistered,
      status: statusMap[status] || 'unknown',
      rawStatus: status,
    };
  } catch (error) {
    console.error('[BackgroundAlarm] Failed to get background task status:', error);
    return {
      supported: false,
      registered: false,
      status: 'error',
      error: error.message,
    };
  }
}

export async function testBackgroundTask() {
  try {
    if (Platform.OS === 'web') {
      return { success: false, error: 'Not supported on web' };
    }

    console.log('[BackgroundAlarm] Testing background task...');
    await TaskManager.unregisterAllTasksAsync();
    await registerBackgroundTask();

    return { success: true };
  } catch (error) {
    console.error('[BackgroundAlarm] Failed to test background task:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function getLastBackgroundCheckInfo() {
  try {
    const data = await AsyncStorage.getItem('lastBackgroundCheck');
    if (!data) return null;

    return JSON.parse(data);
  } catch (error) {
    console.error('[BackgroundAlarm] Failed to get last background check info:', error);
    return null;
  }
}
