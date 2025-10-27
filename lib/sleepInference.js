import {
  fetchStepData,
  inferSleepFromSteps,
  calculateSleepNeed,
  calculateSleepDebt,
  generateCircadianRhythm
} from './healthPermissions';
import { fetchDailySteps14d, fetchStepSamples24h } from './modules/health/healthkit';
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

  // Convert sleep series to sessions format and save
  if (sleepSeries && sleepSeries.length > 0) {
    const sessions = sleepSeries.map(session => ({
      ...session,
      id: `healthkit-inferred-${session.date}`,
      bedtimeISO: session.startISO,
      waketimeISO: session.endISO,
      source: 'healthkit-inferred',
    }));
    console.log('[SleepInference] Saving', sessions.length, 'sleep sessions...');
    await StorageUtils.saveSleepSessions(sessions);
  }

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

/**
 * Infer sleep from recent step samples (24 hours of granular data)
 * This is the NEW primary sleep inference method
 */
export async function inferSleepFromRecentSamples() {
  console.log('[SleepInference] inferSleepFromRecentSamples() start');

  try {
    // Step 1: Fetch 24h step samples
    const samples = await fetchStepSamples24h();
    console.log('[SleepInference] samples (24h):', samples);

    if (!samples || samples.length === 0) {
      console.warn('[SleepInference] No step samples available');
      return {
        ok: false,
        error: 'No step samples available from HealthKit',
        sessions: [],
      };
    }

    // Step 2: Filter to night window only (20:00 - 11:00 local time)
    const nightSegments = samples.filter((sample) => {
      const startDate = new Date(sample.startISO);
      const hour = startDate.getHours();
      // Keep samples from 20:00-23:59 or 00:00-10:59
      return hour >= 20 || hour <= 10;
    });

    console.log('[SleepInference] night-only segments:', nightSegments);

    if (nightSegments.length === 0) {
      console.warn('[SleepInference] No night segments found');
      return {
        ok: false,
        error: 'No night-time step data available',
        sessions: [],
      };
    }

    // Step 3: Sort by time
    nightSegments.sort((a, b) => new Date(a.startISO) - new Date(b.startISO));

    // Step 4: Find low-activity windows (value <= 20 steps/hour)
    const mergedCandidates = [];
    let currentWindow = null;

    for (const segment of nightSegments) {
      if (segment.value <= 20) {
        // Low activity - extend or start window
        if (currentWindow === null) {
          currentWindow = {
            sleepStart: segment.startISO,
            sleepEnd: segment.endISO,
          };
        } else {
          // Extend window
          currentWindow.sleepEnd = segment.endISO;
        }
      } else {
        // High activity - close current window if exists
        if (currentWindow !== null) {
          const durationMin = (new Date(currentWindow.sleepEnd) - new Date(currentWindow.sleepStart)) / (1000 * 60);

          // Filter: must be >= 2 hours and <= 13 hours
          if (durationMin >= 120 && durationMin <= 780) {
            mergedCandidates.push({
              ...currentWindow,
              durationMin,
            });
          }
          currentWindow = null;
        }
      }
    }

    // Don't forget the last window
    if (currentWindow !== null) {
      const durationMin = (new Date(currentWindow.sleepEnd) - new Date(currentWindow.sleepStart)) / (1000 * 60);
      if (durationMin >= 120 && durationMin <= 780) {
        mergedCandidates.push({
          ...currentWindow,
          durationMin,
        });
      }
    }

    console.log('[SleepInference] low-activity windows:', mergedCandidates);

    if (mergedCandidates.length === 0) {
      console.warn('[SleepInference] No valid sleep windows found');
      return {
        ok: false,
        error: 'No valid sleep periods detected',
        sessions: [],
      };
    }

    // Step 5: Choose the longest window as main sleep
    mergedCandidates.sort((a, b) => b.durationMin - a.durationMin);
    const chosenWindow = mergedCandidates[0];

    console.log('[SleepInference] chosen sleep session:', chosenWindow);

    // Step 6: Build session object
    const sleepStartDate = new Date(chosenWindow.sleepStart);
    const dateKey = `${sleepStartDate.getFullYear()}-${String(sleepStartDate.getMonth() + 1).padStart(2, '0')}-${String(sleepStartDate.getDate()).padStart(2, '0')}`;

    const session = {
      id: `healthkit-inferred-${dateKey}`,
      date: dateKey,
      bedtimeISO: chosenWindow.sleepStart,
      waketimeISO: chosenWindow.sleepEnd,
      durationMin: chosenWindow.durationMin,
      source: 'healthkit-inferred',
    };

    console.log('[SleepInference] final session:', session);

    return {
      ok: true,
      sessions: [session],
    };
  } catch (error) {
    console.error('[SleepInference] inferSleepFromRecentSamples FAILED', error);
    return {
      ok: false,
      error: error?.message || String(error),
      sessions: [],
    };
  }
}

/**
 * OLD bootstrap function - kept for fallback/reference
 * NOT USED by default anymore
 */
export async function bootstrapSleepFromHealthKit() {
  console.log('[SleepInference] bootstrap start');

  try {
    // Step 1: Fetch daily steps from HealthKit
    const dailySteps = await fetchDailySteps14d();
    console.log('[SleepInference] raw daily steps count:', dailySteps?.length || 0, 'days');

    if (dailySteps && dailySteps.length > 0) {
      console.log('[SleepInference] raw daily steps sample:', dailySteps.slice(0, 10));
    }

    if (!dailySteps || dailySteps.length === 0) {
      console.warn('[SleepInference] HK_STEPS_EMPTY - No step data returned from HealthKit');
      return {
        ok: false,
        error: 'No step data available from HealthKit',
        sessions: [],
      };
    }

    // Step 2: Convert daily steps to minute-level data
    const minuteStepData = convertDailyStepsToMinuteData(dailySteps);
    console.log('[SleepInference] minute-level stepData total points:', minuteStepData.length);
    console.log('[SleepInference] minute-level stepData sample:', minuteStepData.slice(0, 20));

    // Step 3: Infer sleep sessions from step data
    const inferredSessions = inferSleepFromSteps(minuteStepData);
    console.log('[SleepInference] inferred sleep windows:', inferredSessions);

    if (inferredSessions.length === 0) {
      console.warn('[SleepInference] WARNING: no sleep windows inferred');
      return {
        ok: false,
        error: 'Could not infer sleep from step data',
        sessions: [],
      };
    }

    // Step 4: Add source metadata to sessions
    const finalSessions = inferredSessions.map(session => ({
      ...session,
      id: `healthkit-inferred-${session.date}`,
      bedtimeISO: session.startISO,
      waketimeISO: session.endISO,
      source: 'healthkit-inferred',
    }));

    console.log('[SleepInference] final sessions for store:', finalSessions);

    // Step 5: Calculate sleep metrics
    const sleepNeedMin = calculateSleepNeed(inferredSessions);
    const sleepDebtMin = calculateSleepDebt(inferredSessions, sleepNeedMin);
    const lastSleep = inferredSessions[inferredSessions.length - 1];
    const lastWakeTime = lastSleep ? lastSleep.endISO : null;
    const circadianDay = generateCircadianRhythm(sleepNeedMin, sleepDebtMin, lastWakeTime);

    // Step 6: Save to storage
    await StorageUtils.setSleepData({
      sleepSeries: inferredSessions,
      sleepNeedMin,
      sleepDebtMin,
      circadianDay,
      lastComputedAt: Date.now(),
    });

    console.log('[SleepInference] Successfully bootstrapped sleep data from HealthKit');

    return {
      ok: true,
      sessions: finalSessions,
      sleepNeedMin,
      sleepDebtMin,
      circadianDay,
    };
  } catch (error) {
    console.error('[SleepInference] bootstrap FAILED', error);
    return {
      ok: false,
      error: error?.message || String(error),
      sessions: [],
    };
  }
}
