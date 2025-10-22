import { Platform } from 'react-native';
import HealthKit, { HKQuantityTypeIdentifier, HKAuthorizationRequestStatus } from '@kingstinct/react-native-healthkit';

export async function checkStepPermission() {
  console.log('[HealthPermissions] checkStepPermission called, Platform.OS:', Platform.OS);

  if (Platform.OS === 'web') {
    console.log('[HealthPermissions] Web platform not supported for real data');
    throw new Error('Step counting is not available on web platform');
  }

  if (Platform.OS !== 'ios') {
    console.log('[HealthPermissions] Android platform - HealthKit not available');
    throw new Error('HealthKit is only available on iOS');
  }

  try {
    const isAvailable = await HealthKit.isHealthDataAvailable();
    console.log('[HealthPermissions] HealthKit available:', isAvailable);

    if (!isAvailable) {
      throw new Error('HealthKit not available on this device');
    }

    const status = await HealthKit.getRequestStatusForAuthorization([HKQuantityTypeIdentifier.stepCount]);
    console.log('[HealthPermissions] HealthKit permission status:', status);

    if (status === HKAuthorizationRequestStatus.unnecessary) {
      return 'granted';
    } else if (status === HKAuthorizationRequestStatus.shouldRequest) {
      return 'undetermined';
    } else {
      return 'denied';
    }
  } catch (error) {
    console.error('[HealthPermissions] Error checking HealthKit permission:', error);
    throw error;
  }
}

export async function requestStepPermission() {
  console.log('[HealthPermissions] requestStepPermission called, Platform.OS:', Platform.OS);

  if (Platform.OS === 'web') {
    console.log('[HealthPermissions] Web platform not supported for real data');
    throw new Error('Step counting is not available on web platform');
  }

  if (Platform.OS !== 'ios') {
    console.log('[HealthPermissions] Android platform - HealthKit not available');
    throw new Error('HealthKit is only available on iOS');
  }

  try {
    const isAvailable = await HealthKit.isHealthDataAvailable();
    console.log('[HealthPermissions] HealthKit available:', isAvailable);

    if (!isAvailable) {
      throw new Error('HealthKit not available on this device');
    }

    await HealthKit.requestAuthorization([HKQuantityTypeIdentifier.stepCount], []);
    console.log('[HealthPermissions] HealthKit authorization requested');

    const status = await HealthKit.getRequestStatusForAuthorization([HKQuantityTypeIdentifier.stepCount]);
    console.log('[HealthPermissions] HealthKit permission status after request:', status);

    if (status === HKAuthorizationRequestStatus.unnecessary) {
      return 'granted';
    } else {
      return 'denied';
    }
  } catch (error) {
    console.error('[HealthPermissions] Error requesting HealthKit permission:', error);
    throw error;
  }
}

export async function fetchStepData(startDate, endDate) {
  console.log('[HealthPermissions] fetchStepData called, Platform:', Platform.OS);
  console.log('[HealthPermissions] Date range:', startDate.toISOString(), 'to', endDate.toISOString());

  if (Platform.OS === 'web') {
    throw new Error('Step counting is not available on web platform');
  }

  if (Platform.OS !== 'ios') {
    throw new Error('HealthKit is only available on iOS');
  }

  try {
    const isAvailable = await HealthKit.isHealthDataAvailable();
    console.log('[HealthPermissions] HealthKit available:', isAvailable);

    if (!isAvailable) {
      throw new Error('HealthKit not available on this device');
    }

    const status = await HealthKit.getRequestStatusForAuthorization([HKQuantityTypeIdentifier.stepCount]);
    if (status !== HKAuthorizationRequestStatus.unnecessary) {
      throw new Error('Step counting permission not granted. Please enable in Health app settings.');
    }

    console.log('[HealthPermissions] Fetching real step data from HealthKit...');
    const stepData = await fetchRealStepData(startDate, endDate);
    console.log('[HealthPermissions] Fetched real step data points:', stepData.length);

    if (stepData.length === 0) {
      throw new Error('No step data available. Please ensure you have been using your device to track steps.');
    }

    return stepData;
  } catch (error) {
    console.error('[HealthPermissions] Error fetching step data:', error);
    throw error;
  }
}

async function fetchRealStepData(startDate, endDate) {
  const stepData = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  let currentDate = new Date(start);

  while (currentDate <= end) {
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    try {
      const samples = await HealthKit.querySamples(
        HKQuantityTypeIdentifier.stepCount,
        {
          from: dayStart.toISOString(),
          to: dayEnd.toISOString(),
        }
      );

      console.log('[HealthPermissions] Fetched', samples.length, 'step samples for', dayStart.toDateString());

      const hourlySteps = {};
      for (let hour = 0; hour < 24; hour++) {
        hourlySteps[hour] = 0;
      }

      samples.forEach(sample => {
        const sampleDate = new Date(sample.startDate);
        const hour = sampleDate.getHours();
        hourlySteps[hour] += sample.quantity;
      });

      for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 5) {
          const timestamp = new Date(dayStart);
          timestamp.setHours(hour, minute, 0, 0);

          const steps = Math.floor(hourlySteps[hour] / 12);

          stepData.push({
            timestamp: timestamp.toISOString(),
            steps: Math.max(0, steps),
          });
        }
      }

      console.log('[HealthPermissions] Total steps for', dayStart.toDateString(), ':', Object.values(hourlySteps).reduce((a, b) => a + b, 0));
    } catch (error) {
      console.error('[HealthPermissions] Error fetching steps for', dayStart.toDateString(), ':', error);
      throw error;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return stepData;
}

export function inferSleepFromSteps(stepData) {
  console.log('[HealthPermissions] inferSleepFromSteps called with', stepData.length, 'data points');

  if (!stepData || stepData.length === 0) {
    throw new Error('No step data available to infer sleep patterns');
  }

  const sleepSessions = [];

  const groupedByDay = {};
  stepData.forEach(point => {
    const date = new Date(point.timestamp);
    const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    if (!groupedByDay[dayKey]) {
      groupedByDay[dayKey] = [];
    }
    groupedByDay[dayKey].push(point);
  });

  Object.keys(groupedByDay).sort().forEach(dayKey => {
    const dayData = groupedByDay[dayKey];

    let inactiveStart = null;
    let lastActiveTime = null;

    for (let i = 0; i < dayData.length; i++) {
      const point = dayData[i];
      const timestamp = new Date(point.timestamp);
      const hour = timestamp.getHours();

      if (hour < 21 && hour >= 11) {
        continue;
      }

      const isActive = point.steps > 0;

      if (!isActive && inactiveStart === null) {
        inactiveStart = timestamp;
      } else if (isActive) {
        lastActiveTime = timestamp;

        if (inactiveStart) {
          const durationMin = (lastActiveTime - inactiveStart) / (1000 * 60);

          if (durationMin >= 180) {
            let sleepStart = new Date(inactiveStart);
            let sleepEnd = new Date(lastActiveTime);

            if (sleepStart.getHours() >= 0 && sleepStart.getHours() < 3) {
              sleepStart.setDate(sleepStart.getDate() - 1);
            }

            const sleepDuration = (sleepEnd - sleepStart) / (1000 * 60);

            if (sleepDuration >= 120 && sleepDuration <= 780) {
              const sleepDate = `${sleepStart.getFullYear()}-${String(sleepStart.getMonth() + 1).padStart(2, '0')}-${String(sleepStart.getDate()).padStart(2, '0')}`;

              const existing = sleepSessions.find(s => s.date === sleepDate);
              if (!existing || sleepDuration > existing.durationMin) {
                if (existing) {
                  const index = sleepSessions.indexOf(existing);
                  sleepSessions.splice(index, 1);
                }

                sleepSessions.push({
                  date: sleepDate,
                  startISO: sleepStart.toISOString(),
                  endISO: sleepEnd.toISOString(),
                  durationMin: Math.round(sleepDuration),
                });
              }
            }
          }

          inactiveStart = null;
        }
      }
    }
  });

  console.log('[HealthPermissions] Detected', sleepSessions.length, 'sleep sessions');

  if (sleepSessions.length === 0) {
    throw new Error('Unable to detect sleep patterns from step data. Ensure you have at least a few days of step tracking data.');
  }

  return sleepSessions.sort((a, b) => new Date(a.date) - new Date(b.date));
}

export function calculateSleepNeed(sleepSeries) {
  console.log('[HealthPermissions] calculateSleepNeed called with', sleepSeries.length, 'sleep sessions');

  if (!sleepSeries || sleepSeries.length === 0) {
    throw new Error('No sleep data available to calculate sleep need');
  }

  if (sleepSeries.length < 3) {
    throw new Error('Need at least 3 days of sleep data to calculate sleep need accurately');
  }

  const durations = sleepSeries.map(s => s.durationMin);
  const mean = durations.reduce((sum, d) => sum + d, 0) / durations.length;

  const variance = durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length;
  const std = Math.sqrt(variance);

  let sleepNeed = mean + 0.2 * std;

  sleepNeed = Math.max(300, Math.min(690, sleepNeed));

  const result = Math.round(sleepNeed);
  console.log('[HealthPermissions] Calculated sleep need:', result, 'minutes');
  return result;
}

export function calculateSleepDebt(sleepSeries, sleepNeedMin) {
  console.log('[HealthPermissions] calculateSleepDebt called');

  if (!sleepSeries || sleepSeries.length === 0) {
    throw new Error('No sleep data available to calculate sleep debt');
  }

  const last14Days = sleepSeries.slice(-14);

  let totalDebt = 0;
  last14Days.forEach(session => {
    const deficit = sleepNeedMin - session.durationMin;
    if (deficit > 0) {
      totalDebt += deficit;
    }
  });

  const result = Math.round(totalDebt);
  console.log('[HealthPermissions] Calculated sleep debt:', result, 'minutes');
  return result;
}

export function generateCircadianRhythm(sleepNeedMin, sleepDebtMin, lastWakeTime) {
  console.log('[HealthPermissions] generateCircadianRhythm called');

  const rhythm = [];
  const hoursSinceWake = lastWakeTime ? (Date.now() - new Date(lastWakeTime).getTime()) / (1000 * 60 * 60) : 8;

  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const timeInHours = hour + minute / 60;

      const circadian = 50 + 40 * Math.sin((timeInHours - 6) * Math.PI / 12);

      const homeostaticPressure = Math.min(50, (timeInHours / 24) * 50);

      const debtFactor = Math.min(20, sleepDebtMin / 30);

      let alertness = circadian - homeostaticPressure - debtFactor;
      alertness = Math.max(0, Math.min(100, alertness));

      rhythm.push({
        t: timeStr,
        value: Math.round(alertness),
      });
    }
  }

  console.log('[HealthPermissions] Generated circadian rhythm with', rhythm.length, 'data points');
  return rhythm;
}
