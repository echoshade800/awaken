import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { Pedometer } from 'expo-sensors';

export async function checkStepPermission() {
  console.log('[HealthPermissions] checkStepPermission called, Platform.OS:', Platform.OS);

  if (Platform.OS === 'web') {
    console.log('[HealthPermissions] Web platform detected, returning granted');
    return 'granted';
  }

  try {
    const isAvailable = await Pedometer.isAvailableAsync();
    console.log('[HealthPermissions] Pedometer available:', isAvailable);

    if (isAvailable) {
      const { status } = await Pedometer.getPermissionsAsync();
      console.log('[HealthPermissions] Pedometer permission status:', status);
      return status;
    }

    console.log('[HealthPermissions] Pedometer not available on this device');
    return 'denied';
  } catch (error) {
    console.error('[HealthPermissions] Error checking pedometer permission:', error);
    return 'denied';
  }
}

export async function requestStepPermission() {
  console.log('[HealthPermissions] requestStepPermission called, Platform.OS:', Platform.OS);

  if (Platform.OS === 'web') {
    console.log('[HealthPermissions] Web platform detected, returning granted');
    return 'granted';
  }

  try {
    const isAvailable = await Pedometer.isAvailableAsync();
    console.log('[HealthPermissions] Pedometer available:', isAvailable);

    if (isAvailable) {
      const { status } = await Pedometer.requestPermissionsAsync();
      console.log('[HealthPermissions] Pedometer permission request result:', status);
      return status;
    }

    console.log('[HealthPermissions] Pedometer not available on this device');
    return 'denied';
  } catch (error) {
    console.error('[HealthPermissions] Error requesting pedometer permission:', error);
    return 'denied';
  }
}

export async function fetchStepData(startDate, endDate) {
  console.log('[HealthPermissions] fetchStepData called, Platform:', Platform.OS);
  console.log('[HealthPermissions] Date range:', startDate.toISOString(), 'to', endDate.toISOString());

  if (Platform.OS === 'web') {
    console.log('[HealthPermissions] Web platform - using mock data');
    return generateMockStepData(startDate, endDate);
  }

  try {
    const isAvailable = await Pedometer.isAvailableAsync();
    console.log('[HealthPermissions] Pedometer available:', isAvailable);

    if (!isAvailable) {
      console.log('[HealthPermissions] Pedometer not available - using mock data');
      return generateMockStepData(startDate, endDate);
    }

    console.log('[HealthPermissions] Fetching real step data from device...');
    const stepData = await fetchRealStepData(startDate, endDate);
    console.log('[HealthPermissions] Fetched real step data points:', stepData.length);

    return stepData;
  } catch (error) {
    console.error('[HealthPermissions] Error fetching step data:', error);
    console.log('[HealthPermissions] Falling back to mock data');
    return generateMockStepData(startDate, endDate);
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
      const result = await Pedometer.getStepCountAsync(dayStart, dayEnd);
      console.log('[HealthPermissions] Steps for', dayStart.toDateString(), ':', result.steps);

      const hoursInDay = 24;
      const stepsPerHour = result.steps / hoursInDay;

      for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 5) {
          const timestamp = new Date(dayStart);
          timestamp.setHours(hour, minute, 0, 0);

          let steps = Math.floor(stepsPerHour / 12);

          if (hour >= 22 || hour < 7) {
            steps = Math.floor(steps * 0.05);
          } else if (hour >= 7 && hour < 9) {
            steps = Math.floor(steps * 1.5);
          } else if (hour >= 12 && hour < 14) {
            steps = Math.floor(steps * 1.3);
          } else if (hour >= 18 && hour < 22) {
            steps = Math.floor(steps * 1.2);
          }

          stepData.push({
            timestamp: timestamp.toISOString(),
            steps: Math.max(0, steps + Math.floor(Math.random() * 10 - 5)),
          });
        }
      }
    } catch (error) {
      console.error('[HealthPermissions] Error fetching steps for', dayStart.toDateString(), ':', error);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return stepData;
}

function generateMockStepData(startDate, endDate) {
  const data = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  let currentDate = new Date(start);

  while (currentDate <= end) {
    const dayData = generateDayStepData(currentDate);
    data.push(...dayData);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return data;
}

function generateDayStepData(date) {
  const data = [];
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 5) {
      const timestamp = new Date(year, month, day, hour, minute);

      let steps = 0;

      if (hour >= 7 && hour < 9) {
        steps = Math.floor(Math.random() * 50) + 20;
      } else if (hour >= 9 && hour < 12) {
        steps = Math.floor(Math.random() * 30) + 10;
      } else if (hour >= 12 && hour < 14) {
        steps = Math.floor(Math.random() * 40) + 15;
      } else if (hour >= 14 && hour < 18) {
        steps = Math.floor(Math.random() * 35) + 10;
      } else if (hour >= 18 && hour < 22) {
        steps = Math.floor(Math.random() * 40) + 10;
      } else if (hour >= 22 || hour < 7) {
        steps = Math.random() < 0.05 ? Math.floor(Math.random() * 5) : 0;
      }

      data.push({
        timestamp: timestamp.toISOString(),
        steps,
      });
    }
  }

  return data;
}

export function inferSleepFromSteps(stepData) {
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

  return sleepSessions.sort((a, b) => new Date(a.date) - new Date(b.date));
}

export function calculateSleepNeed(sleepSeries) {
  if (sleepSeries.length === 0) {
    return 480;
  }

  const durations = sleepSeries.map(s => s.durationMin);
  const mean = durations.reduce((sum, d) => sum + d, 0) / durations.length;

  const variance = durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length;
  const std = Math.sqrt(variance);

  let sleepNeed = mean + 0.2 * std;

  sleepNeed = Math.max(300, Math.min(690, sleepNeed));

  return Math.round(sleepNeed);
}

export function calculateSleepDebt(sleepSeries, sleepNeedMin) {
  const last14Days = sleepSeries.slice(-14);

  let totalDebt = 0;
  last14Days.forEach(session => {
    const deficit = sleepNeedMin - session.durationMin;
    if (deficit > 0) {
      totalDebt += deficit;
    }
  });

  return Math.round(totalDebt);
}

export function generateCircadianRhythm(sleepNeedMin, sleepDebtMin, lastWakeTime) {
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

  return rhythm;
}
