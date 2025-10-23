import { Platform } from 'react-native';
import * as Device from 'expo-device';

let AppleHealthKit = null;
let healthKitPermissions = null;

// Only import react-native-health on iOS
// For Android, Google Fit API would be integrated here using @react-native-community/google-fit
// requesting TYPE_STEP_COUNT_DELTA permission
if (Platform.OS === 'ios') {
  try {
    AppleHealthKit = require('react-native-health').default;
    healthKitPermissions = {
      permissions: {
        read: [
          AppleHealthKit.Constants.Permissions.Steps,
          AppleHealthKit.Constants.Permissions.SleepAnalysis,
        ],
        write: [],
      },
    };
  } catch (error) {
    console.warn('[HealthKit] react-native-health not available:', error);
  }
} else if (Platform.OS === 'android') {
  console.log('[HealthPermissions] Android detected - Google Fit integration would go here');
}

let isHealthKitInitialized = false;

function initHealthKit() {
  return new Promise((resolve, reject) => {
    if (Platform.OS !== 'ios' || !AppleHealthKit) {
      resolve(false);
      return;
    }

    AppleHealthKit.initHealthKit(healthKitPermissions, (error) => {
      if (error) {
        console.error('[HealthKit] Initialization error:', error);
        resolve(false);
      } else {
        console.log('[HealthKit] Initialized successfully');
        isHealthKitInitialized = true;
        resolve(true);
      }
    });
  });
}

export async function checkStepPermission() {
  console.log('[HealthPermissions] checkStepPermission called, Platform.OS:', Platform.OS);

  if (Platform.OS === 'web') {
    console.log('[HealthPermissions] Web platform detected, returning granted');
    return 'granted';
  }

  if (Platform.OS !== 'ios') {
    console.log('[HealthPermissions] Non-iOS platform, returning denied');
    return 'denied';
  }

  try {
    const initialized = await initHealthKit();
    return initialized ? 'granted' : 'denied';
  } catch (error) {
    console.error('[HealthPermissions] Error checking permission:', error);
    return 'denied';
  }
}

export async function requestStepPermission() {
  console.log('[HealthPermissions] requestStepPermission called, Platform.OS:', Platform.OS);

  if (Platform.OS === 'web') {
    console.log('[HealthPermissions] Web platform detected, returning granted');
    return 'granted';
  }

  if (Platform.OS !== 'ios') {
    console.log('[HealthPermissions] Non-iOS platform, returning denied');
    return 'denied';
  }

  try {
    const initialized = await initHealthKit();
    return initialized ? 'granted' : 'denied';
  } catch (error) {
    console.error('[HealthPermissions] Error requesting permission:', error);
    return 'denied';
  }
}

export async function fetchStepData(startDate, endDate) {
  console.log('[HealthPermissions] fetchStepData called, Platform:', Platform.OS);

  if (Platform.OS !== 'ios' || !isHealthKitInitialized || !AppleHealthKit) {
    console.log('[HealthPermissions] Using mock data');
    const mockData = generateMockStepData(startDate, endDate);
    console.log('[HealthPermissions] Generated mock data points:', mockData.length);
    return mockData;
  }

  try {
    return new Promise((resolve, reject) => {
      const options = {
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        interval: 'minute',
      };

      AppleHealthKit.getStepCount(options, (err, results) => {
        if (err) {
          console.error('[HealthKit] Error fetching step data:', err);
          const mockData = generateMockStepData(startDate, endDate);
          resolve(mockData);
          return;
        }

        console.log('[HealthKit] Fetched step data:', results?.length || 0, 'points');

        // Convert HealthKit format to our format
        const formattedData = results.map(item => ({
          timestamp: item.startDate,
          steps: item.value || 0,
        }));

        resolve(formattedData);
      });
    });
  } catch (error) {
    console.error('[HealthPermissions] Error in fetchStepData:', error);
    const mockData = generateMockStepData(startDate, endDate);
    return mockData;
  }
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
  console.log('[SleepInference] Starting tappigraphy inference with', stepData.length, 'data points');

  if (!stepData || stepData.length === 0) {
    console.log('[SleepInference] No step data available');
    return [];
  }

  const sleepSessions = [];
  const NIGHT_WINDOW_START = 21;
  const NIGHT_WINDOW_END = 11;
  const MIN_SLEEP_DURATION_MIN = 120;
  const MAX_SLEEP_DURATION_MIN = 780;
  const CONTINUOUS_ZERO_THRESHOLD_MIN = 180;
  const MERGE_GAP_THRESHOLD_MIN = 20;

  const groupedByDay = {};
  stepData.forEach(point => {
    const date = new Date(point.timestamp);
    const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    if (!groupedByDay[dayKey]) {
      groupedByDay[dayKey] = [];
    }
    groupedByDay[dayKey].push(point);
  });

  console.log('[SleepInference] Processing', Object.keys(groupedByDay).length, 'days');

  const allDays = Object.keys(groupedByDay).sort();

  for (let dayIdx = 0; dayIdx < allDays.length; dayIdx++) {
    const dayKey = allDays[dayIdx];
    const nextDayKey = allDays[dayIdx + 1];

    const currentDayData = groupedByDay[dayKey];
    const nextDayData = nextDayKey ? groupedByDay[nextDayKey] : [];

    const combinedData = [...currentDayData, ...nextDayData];

    const inactiveBlocks = [];
    let blockStart = null;

    for (let i = 0; i < combinedData.length; i++) {
      const point = combinedData[i];
      const timestamp = new Date(point.timestamp);
      const hour = timestamp.getHours();

      const inNightWindow = hour >= NIGHT_WINDOW_START || hour < NIGHT_WINDOW_END;

      if (!inNightWindow) {
        if (blockStart) {
          inactiveBlocks.push({ start: blockStart, end: timestamp });
          blockStart = null;
        }
        continue;
      }

      const isInactive = point.steps === 0;

      if (isInactive && !blockStart) {
        blockStart = timestamp;
      } else if (!isInactive && blockStart) {
        const durationMin = (timestamp - blockStart) / (1000 * 60);
        if (durationMin >= CONTINUOUS_ZERO_THRESHOLD_MIN) {
          inactiveBlocks.push({ start: blockStart, end: timestamp });
        }
        blockStart = null;
      }
    }

    if (blockStart && combinedData.length > 0) {
      const lastTimestamp = new Date(combinedData[combinedData.length - 1].timestamp);
      const durationMin = (lastTimestamp - blockStart) / (1000 * 60);
      if (durationMin >= CONTINUOUS_ZERO_THRESHOLD_MIN) {
        inactiveBlocks.push({ start: blockStart, end: lastTimestamp });
      }
    }

    const mergedBlocks = [];
    for (let i = 0; i < inactiveBlocks.length; i++) {
      const currentBlock = inactiveBlocks[i];

      if (mergedBlocks.length === 0) {
        mergedBlocks.push({ ...currentBlock });
        continue;
      }

      const lastMerged = mergedBlocks[mergedBlocks.length - 1];
      const gapMin = (currentBlock.start - lastMerged.end) / (1000 * 60);

      if (gapMin <= MERGE_GAP_THRESHOLD_MIN) {
        lastMerged.end = currentBlock.end;
      } else {
        mergedBlocks.push({ ...currentBlock });
      }
    }

    for (const block of mergedBlocks) {
      const durationMin = (block.end - block.start) / (1000 * 60);

      if (durationMin >= MIN_SLEEP_DURATION_MIN && durationMin <= MAX_SLEEP_DURATION_MIN) {
        let sleepDate = new Date(block.start);

        if (sleepDate.getHours() >= NIGHT_WINDOW_START) {
          sleepDate = new Date(sleepDate);
        } else {
          sleepDate.setDate(sleepDate.getDate() - 1);
        }

        const dateKey = `${sleepDate.getFullYear()}-${String(sleepDate.getMonth() + 1).padStart(2, '0')}-${String(sleepDate.getDate()).padStart(2, '0')}`;

        const existing = sleepSessions.find(s => s.date === dateKey);
        if (!existing) {
          sleepSessions.push({
            id: `inferred-${block.start.toISOString()}`,
            date: dateKey,
            bedtimeISO: block.start.toISOString(),
            waketimeISO: block.end.toISOString(),
            durationMin: Math.round(durationMin),
            source: 'inferred',
          });
        } else if (durationMin > existing.durationMin) {
          existing.bedtimeISO = block.start.toISOString();
          existing.waketimeISO = block.end.toISOString();
          existing.durationMin = Math.round(durationMin);
        }
      }
    }
  }

  console.log('[SleepInference] Detected', sleepSessions.length, 'sleep sessions');
  return sleepSessions.sort((a, b) => a.date.localeCompare(b.date));
}

export function calculateSleepNeed(sleepSeries) {
  console.log('[SleepNeed] Calculating sleep need from', sleepSeries.length, 'sessions');

  if (sleepSeries.length === 0) {
    console.log('[SleepNeed] No data, defaulting to 8 hours');
    return 480;
  }

  const last30Days = sleepSeries.slice(-30);
  const durations = last30Days.map(s => s.durationMin);

  const mean = durations.reduce((sum, d) => sum + d, 0) / durations.length;

  const variance = durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length;
  const std = Math.sqrt(variance);

  let sleepNeed = mean + 0.2 * std;

  sleepNeed = Math.max(300, Math.min(690, sleepNeed));

  const rounded = Math.round(sleepNeed);
  console.log('[SleepNeed] Calculated:', rounded, 'min (mean:', Math.round(mean), 'std:', Math.round(std), ')');

  return rounded;
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

// Fetch real sleep data from HealthKit
export async function fetchSleepData(startDate, endDate) {
  console.log('[HealthPermissions] fetchSleepData called, Platform:', Platform.OS);

  if (Platform.OS !== 'ios' || !isHealthKitInitialized || !AppleHealthKit) {
    console.log('[HealthPermissions] HealthKit not available, returning empty array');
    return [];
  }

  try {
    return new Promise((resolve, reject) => {
      const options = {
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      };

      AppleHealthKit.getSleepSamples(options, (err, results) => {
        if (err) {
          console.error('[HealthKit] Error fetching sleep data:', err);
          resolve([]);
          return;
        }

        console.log('[HealthKit] Fetched sleep samples:', results?.length || 0);

        // Filter for ASLEEP samples only (ignore IN_BED)
        const sleepSamples = results.filter(sample => sample.value === 'ASLEEP');

        // Group by date and merge overlapping sessions
        const sleepSessions = processSleepSamples(sleepSamples);

        console.log('[HealthKit] Processed sleep sessions:', sleepSessions.length);
        resolve(sleepSessions);
      });
    });
  } catch (error) {
    console.error('[HealthPermissions] Error in fetchSleepData:', error);
    return [];
  }
}

function processSleepSamples(samples) {
  if (!samples || samples.length === 0) return [];

  // Sort samples by start time
  const sorted = samples.sort((a, b) =>
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const sessions = [];
  let currentSession = null;

  sorted.forEach(sample => {
    const start = new Date(sample.startDate);
    const end = new Date(sample.endDate);

    if (!currentSession) {
      currentSession = {
        startDate: start,
        endDate: end,
      };
    } else {
      // If this sample starts within 30 minutes of the last one ending, merge them
      const gap = (start.getTime() - currentSession.endDate.getTime()) / (1000 * 60);

      if (gap <= 30) {
        currentSession.endDate = end;
      } else {
        // Save current session and start a new one
        sessions.push(currentSession);
        currentSession = {
          startDate: start,
          endDate: end,
        };
      }
    }
  });

  // Don't forget the last session
  if (currentSession) {
    sessions.push(currentSession);
  }

  // Convert to our format
  return sessions
    .filter(session => {
      const durationMin = (session.endDate - session.startDate) / (1000 * 60);
      return durationMin >= 60; // At least 1 hour
    })
    .map(session => {
      const durationMin = Math.round((session.endDate - session.startDate) / (1000 * 60));

      // Determine the date - use the wake date
      const wakeDate = session.endDate;
      const dateStr = `${wakeDate.getFullYear()}-${String(wakeDate.getMonth() + 1).padStart(2, '0')}-${String(wakeDate.getDate()).padStart(2, '0')}`;

      return {
        id: `healthkit-${session.startDate.toISOString()}`,
        date: dateStr,
        bedtimeISO: session.startDate.toISOString(),
        waketimeISO: session.endDate.toISOString(),
        durationMin: durationMin,
        source: 'healthkit',
      };
    });
}

export function generateCircadianRhythm(sleepNeedMin, sleepDebtMin, lastWakeTime) {
  console.log('[CircadianRhythm] Generating rhythm (sleepNeed:', sleepNeedMin, 'debt:', sleepDebtMin, ')');

  const rhythm = [];
  const hoursSinceWake = lastWakeTime
    ? Math.max(0, (Date.now() - new Date(lastWakeTime).getTime()) / (1000 * 60 * 60))
    : 8;

  console.log('[CircadianRhythm] Hours since wake:', Math.round(hoursSinceWake * 10) / 10);

  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const timeInHours = hour + minute / 60;

      const C_t = 50 + 40 * Math.sin((timeInHours - 6) * Math.PI / 12);

      const hoursAwake = (timeInHours + (24 - (hoursSinceWake % 24))) % 24;
      const S_t = Math.min(50, (hoursAwake / 16) * 50);

      const debtFactor = Math.min(25, sleepDebtMin / 40);

      const baseline = 50;
      let alertness = C_t - S_t + baseline - debtFactor;

      alertness = Math.max(0, Math.min(100, alertness));

      rhythm.push({
        t: timeStr,
        value: Math.round(alertness),
      });
    }
  }

  console.log('[CircadianRhythm] Generated', rhythm.length, 'data points');
  return rhythm;
}
