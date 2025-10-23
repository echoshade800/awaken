import {
  fetchStepData,
  inferSleepFromSteps,
  calculateSleepNeed,
  calculateSleepDebt,
  generateCircadianRhythm
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
