import {
  fetchStepData,
  inferSleepFromSteps,
  calculateSleepNeed,
  calculateSleepDebt,
  generateCircadianRhythm
} from './healthPermissions';
import { fetchDailySteps14d, fetchStepSamples24h, fetchStepSamples14d } from './modules/health/healthkit';
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
 * Calculate the 25th percentile (Q1) from an array of numbers
 */
function calculateQ1(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor(sorted.length * 0.25);
  return sorted[index];
}

/**
 * Helper to format date/time in local timezone for logging
 */
function formatLocalTime(isoString) {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  // Get timezone offset
  const offset = -date.getTimezoneOffset();
  const offsetHours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const offsetMinutes = String(Math.abs(offset) % 60).padStart(2, '0');
  const offsetSign = offset >= 0 ? '+' : '-';

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} (${offsetSign}${offsetHours}${offsetMinutes})`;
}

/**
 * Infer sleep from recent step samples (48 hours of granular data)
 * This is the ONLY sleep inference method
 * @param {Array} providedSamples - Optional pre-fetched samples to analyze
 * @param {string} dateContext - Optional date context for logging
 */
export async function inferSleepFromRecentSamples(providedSamples = null, dateContext = null) {
  if (dateContext) {
    console.log('[SleepInference] inferSleepFromRecentSamples() start (date:', dateContext + ')');
  } else {
    console.log('[SleepInference] inferSleepFromRecentSamples() start');
  }

  try {
    // Step 1: Fetch and sort step samples (or use provided samples)
    const samples = providedSamples || await fetchStepSamples24h();

    if (!samples || samples.length === 0) {
      console.warn('[SleepInference] No step samples available');
      return {
        ok: false,
        error: 'No step samples available from HealthKit',
        sessions: [],
      };
    }

    // Sort by time
    const sortedSamples = [...samples].sort((a, b) => new Date(a.startISO) - new Date(b.startISO));

    // Log inference time range and raw sample count
    console.log('[SleepInference] 📊 Inference data range:');
    console.log('[SleepInference]   Start:', formatLocalTime(sortedSamples[0].startISO));
    console.log('[SleepInference]   End:  ', formatLocalTime(sortedSamples[sortedSamples.length - 1].endISO));
    console.log('[SleepInference]   Raw samples count:', sortedSamples.length);

    // Step 2: Calculate quiet threshold (Q1, clamped to [20, 60])
    const stepValues = sortedSamples.map(s => s.value);
    const q1 = calculateQ1(stepValues);
    const quietThreshold = Math.max(20, Math.min(60, q1));

    // Step 3: Calculate wake threshold
    const wakeThreshold = Math.min(quietThreshold * 2, 150);

    console.log('[SleepInference] quietThreshold, wakeThreshold:', quietThreshold, wakeThreshold);

    // Step 4: Build continuous sleep blocks
    const blocks = [];
    let currentBlock = null;
    let quietHoursInBlock = 0;

    for (const sample of sortedSamples) {
      if (sample.value <= quietThreshold) {
        // Very quiet hour - add to current block
        if (currentBlock === null) {
          currentBlock = {
            startISO: sample.startISO,
            endISO: sample.endISO,
            hours: [sample],
          };
          quietHoursInBlock = 1;
        } else {
          currentBlock.endISO = sample.endISO;
          currentBlock.hours.push(sample);
          quietHoursInBlock++;
        }
      } else if (sample.value <= wakeThreshold) {
        // Wake-up tolerance (e.g., bathroom trip) - don't break the block
        if (currentBlock !== null) {
          currentBlock.endISO = sample.endISO;
          currentBlock.hours.push(sample);
        }
      } else {
        // High activity - close current block
        if (currentBlock !== null) {
          const durationMin = (new Date(currentBlock.endISO) - new Date(currentBlock.startISO)) / (1000 * 60);
          const quietRatio = quietHoursInBlock / currentBlock.hours.length;

          blocks.push({
            startISO: currentBlock.startISO,
            endISO: currentBlock.endISO,
            durationMin,
            quietRatio,
            hours: currentBlock.hours,
          });

          currentBlock = null;
          quietHoursInBlock = 0;
        }
      }
    }

    // Don't forget the last block
    if (currentBlock !== null) {
      const durationMin = (new Date(currentBlock.endISO) - new Date(currentBlock.startISO)) / (1000 * 60);
      const quietRatio = quietHoursInBlock / currentBlock.hours.length;

      blocks.push({
        startISO: currentBlock.startISO,
        endISO: currentBlock.endISO,
        durationMin,
        quietRatio,
        hours: currentBlock.hours,
      });
    }

    console.log('[SleepInference] 🔍 Candidate blocks found:', blocks.length);
    blocks.forEach((b, idx) => {
      console.log(`[SleepInference]   Block ${idx + 1}:`, {
        start: formatLocalTime(b.startISO),
        end: formatLocalTime(b.endISO),
        duration: `${Math.floor(b.durationMin / 60)}h ${Math.round(b.durationMin % 60)}m`,
        durationMin: b.durationMin,
        quietRatio: b.quietRatio.toFixed(2),
      });
    });

    if (blocks.length === 0) {
      console.warn('[SleepInference] ❌ No sleep blocks detected');
      return {
        ok: false,
        error: 'No sleep blocks detected',
        sessions: [],
      };
    }

    // Step 5: Choose the MOST RECENT long sleep block (>= 3 hours)
    // This ensures we get the latest sleep session, not an old one from yesterday
    let mainBlock = null;

    // Filter blocks >= 3 hours (180 minutes)
    const longBlocks = blocks.filter(b => b.durationMin >= 180);

    if (longBlocks.length > 0) {
      // Sort by end time (most recent first)
      longBlocks.sort((a, b) => new Date(b.endISO) - new Date(a.endISO));
      mainBlock = longBlocks[0];
      console.log('[SleepInference] ✅ Chosen: Most recent long block (>= 3h)');
    } else {
      // Fallback: If no block >= 3h, take the most recent block regardless
      blocks.sort((a, b) => new Date(b.endISO) - new Date(a.endISO));
      mainBlock = blocks[0];
      console.log('[SleepInference] ⚠️ Chosen: Most recent block (fallback, < 3h)');
    }

    console.log('[SleepInference] 🛏️ Selected sleep block:');
    console.log('[SleepInference]   Start:', formatLocalTime(mainBlock.startISO));
    console.log('[SleepInference]   End:  ', formatLocalTime(mainBlock.endISO));
    console.log('[SleepInference]   Duration:', `${Math.floor(mainBlock.durationMin / 60)}h ${Math.round(mainBlock.durationMin % 60)}m (${mainBlock.durationMin} min)`);
    console.log('[SleepInference]   Quiet ratio:', mainBlock.quietRatio.toFixed(2));

    // Step 6: Refine bedtime - find first 2 consecutive hours with <= 10 steps
    let refinedBedtime = mainBlock.startISO;

    for (let i = 0; i < mainBlock.hours.length - 1; i++) {
      const hour1 = mainBlock.hours[i];
      const hour2 = mainBlock.hours[i + 1];

      if (hour1.value <= 10 && hour2.value <= 10) {
        refinedBedtime = hour1.startISO;
        break;
      }
    }

    const refinedWaketime = mainBlock.endISO;
    const finalDurationMin = (new Date(refinedWaketime) - new Date(refinedBedtime)) / (1000 * 60);

    console.log('[SleepInference] 🎯 Final sleep session (after bedtime refinement):');
    console.log('[SleepInference]   Bedtime: ', formatLocalTime(refinedBedtime));
    console.log('[SleepInference]   Waketime:', formatLocalTime(refinedWaketime));
    console.log('[SleepInference]   Duration:', `${Math.floor(finalDurationMin / 60)}h ${Math.round(finalDurationMin % 60)}m (${finalDurationMin} min)`);

    // Step 7: Build final session
    const bedtimeDate = new Date(refinedBedtime);
    const dateKey = `${bedtimeDate.getFullYear()}-${String(bedtimeDate.getMonth() + 1).padStart(2, '0')}-${String(bedtimeDate.getDate()).padStart(2, '0')}`;

    const session = {
      id: `healthkit-inferred-${dateKey}`,
      date: dateKey,
      bedtimeISO: refinedBedtime,
      waketimeISO: refinedWaketime,
      durationMin: finalDurationMin,
      source: 'healthkit-inferred',
    };

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
 * Group hourly step samples by date
 * @param {Array} samples - Array of step samples with startISO
 * @returns {Object} Samples grouped by date (YYYY-MM-DD)
 */
function groupSamplesByDate(samples) {
  const grouped = {};

  samples.forEach(sample => {
    const date = new Date(sample.startISO);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(sample);
  });

  return grouped;
}

/**
 * Perform 14-day initial sleep sync
 * Fetches 14 days of step data and infers sleep for each day
 * @returns {Promise<Object>} Result with ok status and sessions array
 */
export async function perform14DaySleepSync() {
  console.log('[HealthKit][Sync] Starting 14-day sync...');

  try {
    // Fetch 14 days of hourly step samples
    const samples = await fetchStepSamples14d();

    if (!samples || samples.length === 0) {
      console.warn('[HealthKit][Sync] No step data available');
      return {
        ok: false,
        error: 'No step data available',
        sessions: [],
      };
    }

    // Group samples by date
    const samplesByDate = groupSamplesByDate(samples);
    const dates = Object.keys(samplesByDate).sort();

    const actualDays = dates.length;
    if (actualDays < 14) {
      console.log(`[HealthKit][Sync] Only ${actualDays} days of step data available`);
    }

    console.log(`[HealthKit][Sync] Processing ${actualDays} days of data`);

    // Process each day
    const collectedSessions = [];

    for (const date of dates) {
      console.log(`[HealthKit][Sync] Processing date: ${date}`);

      const daySamples = samplesByDate[date];

      // Infer sleep for this day
      const result = await inferSleepFromRecentSamples(daySamples, date);

      if (result.ok && result.sessions.length > 0) {
        const session = result.sessions[0];
        // Override the date to ensure it matches the processing date
        session.date = date;
        session.id = `healthkit-inferred-${date}`;
        collectedSessions.push(session);
      } else {
        console.log(`[HealthKit][Sync] No sleep inferred for ${date}`);
      }
    }

    console.log(`[HealthKit][Sync] Completed 14-day sync, total sessions: ${collectedSessions.length}`);

    return {
      ok: true,
      sessions: collectedSessions,
      daysProcessed: actualDays,
    };
  } catch (error) {
    console.error('[HealthKit][Sync] 14-day sync failed:', error);
    return {
      ok: false,
      error: error?.message || String(error),
      sessions: [],
    };
  }
}
