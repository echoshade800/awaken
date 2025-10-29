import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const NOTIFICATION_CATEGORIES = {
  ALARM: 'alarm',
};

export const NOTIFICATION_ACTIONS = {
  STOP: 'stop',
  SNOOZE: 'snooze',
};

export async function initializeNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      priority: Notifications.AndroidNotificationPriority.MAX,
    }),
  });

  console.log('[AlarmScheduler] Notification handler initialized');
}

export async function registerNotificationCategories() {
  try {
    if (Platform.OS === 'ios') {
      await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.ALARM, [
        {
          identifier: NOTIFICATION_ACTIONS.STOP,
          buttonTitle: 'Stop',
          options: {
            opensAppToForeground: true,
          },
        },
        {
          identifier: NOTIFICATION_ACTIONS.SNOOZE,
          buttonTitle: 'Snooze 5 min',
          options: {
            opensAppToForeground: false,
          },
        },
      ]);
      console.log('[AlarmScheduler] iOS notification categories registered');
    }
  } catch (error) {
    console.error('[AlarmScheduler] Failed to register notification categories:', error);
  }
}

export function calculateNextAlarmDate(alarm) {
  const now = new Date();
  const [hours, minutes] = alarm.time.split(':').map(Number);

  const alarmDate = new Date();
  alarmDate.setHours(hours, minutes, 0, 0);

  if (alarmDate <= now) {
    alarmDate.setDate(alarmDate.getDate() + 1);
  }

  if (alarm.repeat && alarm.days?.length > 0) {
    const currentDay = alarmDate.getDay();
    const sortedDays = [...alarm.days].sort((a, b) => a - b);

    let nextDay = sortedDays.find(day => day > currentDay);

    if (!nextDay) {
      nextDay = sortedDays[0];
      alarmDate.setDate(alarmDate.getDate() + 7);
    }

    const daysToAdd = (nextDay - currentDay + 7) % 7;
    alarmDate.setDate(alarmDate.getDate() + daysToAdd);
  }

  return alarmDate;
}

export function getSmartAlarmWindow(alarm) {
  const alarmDate = calculateNextAlarmDate(alarm);

  if (!alarm.smartWake || !alarm.smartWakeWindow) {
    return {
      earliest: alarmDate,
      latest: alarmDate,
      window: 0,
    };
  }

  const windowMinutes = alarm.smartWakeWindow;
  const earliest = new Date(alarmDate.getTime() - windowMinutes * 60 * 1000);

  return {
    earliest,
    latest: alarmDate,
    window: windowMinutes,
  };
}

export async function scheduleAlarm(alarm) {
  try {
    const alarmDate = calculateNextAlarmDate(alarm);
    const smartWindow = getSmartAlarmWindow(alarm);

    console.log('[AlarmScheduler] Scheduling alarm:', {
      id: alarm.id,
      time: alarm.time,
      scheduledFor: alarmDate.toISOString(),
      smartWindow: alarm.smartWake ? `${smartWindow.window} min` : 'disabled',
    });

    const trigger = {
      date: alarmDate,
      channelId: 'alarms',
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: alarm.label || 'Alarm',
        body: alarm.voiceBroadcast?.content || 'Time to wake up!',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        categoryIdentifier: NOTIFICATION_CATEGORIES.ALARM,
        data: {
          alarmId: alarm.id,
          type: 'alarm',
          smartWake: alarm.smartWake,
          smartWakeWindow: smartWindow.window,
          task: alarm.task,
        },
      },
      trigger,
    });

    console.log('[AlarmScheduler] Alarm scheduled successfully:', {
      notificationId,
      triggersAt: alarmDate.toISOString(),
    });

    return {
      success: true,
      notificationId,
      triggersAt: alarmDate,
    };
  } catch (error) {
    console.error('[AlarmScheduler] Failed to schedule alarm:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function cancelAlarm(notificationId) {
  try {
    if (!notificationId) {
      console.warn('[AlarmScheduler] No notification ID provided for cancellation');
      return { success: false, error: 'No notification ID' };
    }

    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('[AlarmScheduler] Alarm cancelled:', notificationId);

    return { success: true };
  } catch (error) {
    console.error('[AlarmScheduler] Failed to cancel alarm:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function scheduleSnooze(alarm, snoozeMinutes = 5) {
  try {
    const snoozeDate = new Date(Date.now() + snoozeMinutes * 60 * 1000);

    console.log('[AlarmScheduler] Scheduling snooze:', {
      alarmId: alarm.id,
      snoozeFor: `${snoozeMinutes} min`,
      triggersAt: snoozeDate.toISOString(),
    });

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${alarm.label || 'Alarm'} (Snoozed)`,
        body: alarm.voiceBroadcast?.content || 'Time to wake up!',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        categoryIdentifier: NOTIFICATION_CATEGORIES.ALARM,
        data: {
          alarmId: alarm.id,
          type: 'snooze',
          task: alarm.task,
        },
      },
      trigger: {
        date: snoozeDate,
        channelId: 'alarms',
      },
    });

    console.log('[AlarmScheduler] Snooze scheduled:', notificationId);

    return {
      success: true,
      notificationId,
      triggersAt: snoozeDate,
    };
  } catch (error) {
    console.error('[AlarmScheduler] Failed to schedule snooze:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function rescheduleAlarm(alarm, oldNotificationId) {
  try {
    if (oldNotificationId) {
      await cancelAlarm(oldNotificationId);
    }

    return await scheduleAlarm(alarm);
  } catch (error) {
    console.error('[AlarmScheduler] Failed to reschedule alarm:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function getAllScheduledNotifications() {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications;
  } catch (error) {
    console.error('[AlarmScheduler] Failed to get scheduled notifications:', error);
    return [];
  }
}

export async function cancelAllAlarmNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[AlarmScheduler] All alarm notifications cancelled');
    return { success: true };
  } catch (error) {
    console.error('[AlarmScheduler] Failed to cancel all notifications:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export function formatNextAlarmTime(alarm) {
  const nextDate = calculateNextAlarmDate(alarm);
  const now = new Date();
  const diffMs = nextDate.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours < 24) {
    return `in ${diffHours}h ${diffMinutes}m`;
  }

  const days = Math.floor(diffHours / 24);
  const hours = diffHours % 24;
  return `in ${days}d ${hours}h`;
}

export function getAlarmStatus(alarm) {
  if (!alarm.enabled) {
    return {
      status: 'disabled',
      text: 'Disabled',
    };
  }

  const nextDate = calculateNextAlarmDate(alarm);
  const now = new Date();

  if (nextDate > now) {
    return {
      status: 'scheduled',
      text: formatNextAlarmTime(alarm),
      nextTrigger: nextDate,
    };
  }

  return {
    status: 'pending',
    text: 'Scheduling...',
  };
}
