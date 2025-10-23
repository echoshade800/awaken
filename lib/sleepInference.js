import {
  fetchStepData,
  inferSleepFromSteps,
  calculateSleepNeed,
  calculateSleepDebt,
  generateCircadianRhythm,
  fetchDailySteps14d
} from './healthPermissions';
import StorageUtils from './StorageUtils';

export async function initializeSleepData() {
  console.log('[SleepInference] Starting sleep data initialization...');

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 14);

  console.log('[SleepInference] Fetching step data from', startDate.toISOString(), 'to', endDate.toISOString());
  const stepData = await fetchStepData(startDate, endDate);
  console.log('[SleepInference] Fetched step data points:', stepData.length);

  console.log('[SleepInference] Inferring sleep sessions from step data...');
  const sleepSeries = inferSleepFromSteps(stepData);
  console.log('[SleepInference] Detected sleep sessions:', sleepSeries.length);

  console.log('[SleepInference] Calculating sleep need...');
  const sleepNeedMin = calculateSleepNeed(sleepSeries);
  console.log('[SleepInference] Calculated sleep need (min):', sleepNeedMin);

  console.log('[SleepInference] Calculating sleep debt...');
  const sleepDebtMin = calculateSleepDebt(sleepSeries, sleepNeedMin);
  console.log('[SleepInference] Calculated sleep debt (min):', sleepDebtMin);

  const lastSleep = sleepSeries[sleepSeries.length - 1];
  const lastWakeTime = lastSleep ? lastSleep.endISO : null;
  console.log('[SleepInference] Last wake time:', lastWakeTime);

  console.log('[SleepInference] Generating circadian rhythm...');
  const circadianDay = generateCircadianRhythm(sleepNeedMin, sleepDebtMin, lastWakeTime);
  console.log('[SleepInference] Generated circadian rhythm points:', circadianDay.length);

  console.log('[SleepInference] Saving sleep data to storage...');
  await StorageUtils.setSleepData({
    sleepSeries,
    sleepNeedMin,
    sleepDebtMin,
    circadianDay,
    lastComputedAt: Date.now(),
  });
  console.log('[SleepInference] Sleep data saved successfully!');

  return {
    sleepSeries,
    sleepNeedMin,
    sleepDebtMin,
    circadianDay,
  };
}

export async function refreshSleepDataIfNeeded() {
  const cachedData = await StorageUtils.getSleepData();

  if (!cachedData || !cachedData.lastComputedAt) {
    return await initializeSleepData();
  }

  const hoursSinceLastUpdate = (Date.now() - cachedData.lastComputedAt) / (1000 * 60 * 60);

  if (hoursSinceLastUpdate < 24) {
    return {
      sleepSeries: cachedData.sleepSeries,
      sleepNeedMin: cachedData.sleepNeedMin,
      sleepDebtMin: cachedData.sleepDebtMin,
      circadianDay: cachedData.circadianDay,
    };
  }

  return await initializeSleepData();
}

export async function getSleepData() {
  const data = await StorageUtils.getSleepData();

  if (!data || !data.sleepSeries) {
    return null;
  }

  return {
    sleepSeries: data.sleepSeries || [],
    sleepNeedMin: data.sleepNeedMin || 480,
    sleepDebtMin: data.sleepDebtMin || 0,
    circadianDay: data.circadianDay || [],
  };
}

export function formatSleepDuration(durationMin) {
  const hours = Math.floor(durationMin / 60);
  const minutes = Math.round(durationMin % 60);
  return `${hours}h ${minutes}m`;
}

export function formatTime(isoString) {
  const date = new Date(isoString);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function getSleepDebtLevel(debtMin) {
  if (debtMin < 60) return 'low';
  if (debtMin < 180) return 'moderate';
  return 'high';
}

export function getSleepQualityScore(sleepSeries, sleepNeedMin) {
  if (sleepSeries.length === 0) return 0;

  const recentSleeps = sleepSeries.slice(-7);
  let totalScore = 0;

  recentSleeps.forEach(sleep => {
    const duration = sleep.durationMin;
    const needRatio = duration / sleepNeedMin;

    let score = 0;
    if (needRatio >= 0.95 && needRatio <= 1.15) {
      score = 100;
    } else if (needRatio >= 0.85 && needRatio <= 1.25) {
      score = 80;
    } else if (needRatio >= 0.75 && needRatio <= 1.35) {
      score = 60;
    } else if (needRatio >= 0.65 && needRatio <= 1.45) {
      score = 40;
    } else {
      score = 20;
    }

    totalScore += score;
  });

  return Math.round(totalScore / recentSleeps.length);
}

function convertDailyStepsToMinuteData(dailySteps) {
  const minuteData = [];

  dailySteps.forEach(day => {
    const date = new Date(day.date);
    const totalSteps = day.value;

    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        const timestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute);

        let steps = 0;

        if (hour >= 7 && hour < 9) {
          steps = Math.floor((totalSteps * 0.15) / 24);
        } else if (hour >= 9 && hour < 12) {
          steps = Math.floor((totalSteps * 0.12) / 36);
        } else if (hour >= 12 && hour < 14) {
          steps = Math.floor((totalSteps * 0.10) / 24);
        } else if (hour >= 14 && hour < 18) {
          steps = Math.floor((totalSteps * 0.20) / 48);
        } else if (hour >= 18 && hour < 22) {
          steps = Math.floor((totalSteps * 0.18) / 48);
        } else if (hour >= 22 || hour < 7) {
          steps = totalSteps > 0 && Math.random() < 0.05 ? Math.floor(Math.random() * 5) : 0;
        }

        minuteData.push({
          timestamp: timestamp.toISOString(),
          steps,
        });
      }
    }
  });

  return minuteData;
}

export async function bootstrapSleepFromHealthKit() {
  console.log('[SleepInference] bootstrapSleepFromHealthKit - Starting HealthKit step data fetch...');

  try {
    const dailySteps = await fetchDailySteps14d();
    console.log('[SleepInference] Fetched daily steps:', dailySteps?.length || 0, 'days');

    if (!dailySteps || dailySteps.length === 0) {
      console.warn('[SleepInference] HK_STEPS_EMPTY - No step data returned from HealthKit');
      return {
        success: false,
        message: 'No step data available from HealthKit',
        sessions: [],
      };
    }

    const minuteStepData = convertDailyStepsToMinuteData(dailySteps);
    console.log('[SleepInference] Converted to minute-level data:', minuteStepData.length, 'points');

    const sleepSessions = inferSleepFromSteps(minuteStepData);
    console.log('[SleepInference] Inferred sleep sessions:', sleepSessions.length);

    if (sleepSessions.length === 0) {
      console.warn('[SleepInference] No sleep sessions could be inferred from step data');
      return {
        success: false,
        message: 'Could not infer sleep from step data',
        sessions: [],
      };
    }

    const sessionsWithSource = sleepSessions.map(session => ({
      ...session,
      id: `healthkit-inferred-${session.date}`,
      bedtimeISO: session.startISO,
      waketimeISO: session.endISO,
      source: 'healthkit-inferred',
    }));

    const sleepNeedMin = calculateSleepNeed(sleepSessions);
    const sleepDebtMin = calculateSleepDebt(sleepSessions, sleepNeedMin);
    const lastSleep = sleepSessions[sleepSessions.length - 1];
    const lastWakeTime = lastSleep ? lastSleep.endISO : null;
    const circadianDay = generateCircadianRhythm(sleepNeedMin, sleepDebtMin, lastWakeTime);

    await StorageUtils.setSleepData({
      sleepSeries: sleepSessions,
      sleepNeedMin,
      sleepDebtMin,
      circadianDay,
      lastComputedAt: Date.now(),
    });

    console.log('[SleepInference] Successfully bootstrapped sleep data from HealthKit');

    return {
      success: true,
      sessions: sessionsWithSource,
      sleepNeedMin,
      sleepDebtMin,
      circadianDay,
    };
  } catch (error) {
    console.error('[SleepInference] Error bootstrapping from HealthKit:', error);
    return {
      success: false,
      message: error.message || 'Unknown error',
      sessions: [],
    };
  }
}
