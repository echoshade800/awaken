/**
 * Background Tasks for Sleep Data Updates
 * Handles periodic recalculation of sleep metrics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import StorageUtils from './StorageUtils';
import { calculateSleepNeed, calculateSleepDebt, generateCircadianCurve } from './sleepCalculations';

const STORAGE_KEY_LAST_UPDATE = 'awaken_lastBackgroundUpdate';
const UPDATE_INTERVAL_HOURS = 24;

/**
 * Check if background update is needed
 * @returns {Promise<boolean>}
 */
export async function shouldUpdateSleepData() {
  try {
    const lastUpdate = await AsyncStorage.getItem(STORAGE_KEY_LAST_UPDATE);
    if (!lastUpdate) return true;

    const lastUpdateTime = new Date(lastUpdate);
    const now = new Date();
    const hoursSinceUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);

    return hoursSinceUpdate >= UPDATE_INTERVAL_HOURS;
  } catch (error) {
    console.error('Error checking update time:', error);
    return true;
  }
}

/**
 * Perform background sleep data update
 * @returns {Promise<Object>} Updated sleep data
 */
export async function performBackgroundUpdate() {
  try {
    console.log('[Background] Starting sleep data update...');

    // Get existing data
    const appData = await StorageUtils.getData();
    const sleepData = await StorageUtils.getSleepData();

    if (!appData?.routineData) {
      console.warn('[Background] No routine data found, skipping update');
      return null;
    }

    const { bedtime, wakeTime, energyType, alertnessLevel } = appData.routineData;

    // Recalculate sleep need
    const sleepNeed = calculateSleepNeed({
      bedtime,
      wakeTime,
      energyType,
      alertnessLevel,
    });

    // Get sleep history
    const sleepHistory = sleepData?.sleepHistory || [];

    // Recalculate sleep debt
    const sleepDebt = calculateSleepDebt(sleepNeed, sleepHistory);

    // Regenerate circadian curve
    const circadianCurve = generateCircadianCurve({
      wakeTime,
      sleepTime: bedtime,
      sleepNeed,
      sleepDebt,
      energyType,
    });

    // Store updated data
    const updatedSleepData = {
      sleepNeed,
      sleepDebt,
      circadianCurve,
      lastCalculated: new Date().toISOString(),
      routineData: { bedtime, wakeTime, energyType, alertnessLevel },
      sleepHistory,
    };

    await StorageUtils.setSleepData(updatedSleepData);
    await AsyncStorage.setItem(STORAGE_KEY_LAST_UPDATE, new Date().toISOString());

    console.log('[Background] Sleep data updated successfully', {
      sleepNeed: sleepNeed.toFixed(1),
      sleepDebt: sleepDebt.toFixed(1),
    });

    return updatedSleepData;
  } catch (error) {
    console.error('[Background] Error performing update:', error);
    return null;
  }
}

/**
 * Schedule next background update (for future use with native modules)
 */
export function scheduleNextUpdate() {
  // This would integrate with native background task APIs
  // For now, we rely on app foreground checks
  console.log('[Background] Next update scheduled for 24h from now');
}

/**
 * Initialize background task system
 */
export async function initializeBackgroundTasks() {
  try {
    // Check if update is needed on app start
    const needsUpdate = await shouldUpdateSleepData();

    if (needsUpdate) {
      console.log('[Background] Performing initial update...');
      await performBackgroundUpdate();
    } else {
      console.log('[Background] Data is up to date');
    }

    scheduleNextUpdate();
  } catch (error) {
    console.error('[Background] Initialization error:', error);
  }
}

/**
 * Add sleep record to history
 * @param {Object} record - {date, duration, quality}
 */
export async function addSleepRecord(record) {
  try {
    const sleepData = await StorageUtils.getSleepData();
    const sleepHistory = sleepData?.sleepHistory || [];

    // Add new record
    sleepHistory.push({
      ...record,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 30 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const filteredHistory = sleepHistory.filter(
      (r) => new Date(r.date) >= cutoffDate
    );

    // Save and trigger recalculation
    await StorageUtils.setSleepData({ sleepHistory: filteredHistory });
    await performBackgroundUpdate();

    return true;
  } catch (error) {
    console.error('Error adding sleep record:', error);
    return false;
  }
}

/**
 * Get sleep statistics summary
 * @returns {Promise<Object>}
 */
export async function getSleepStatistics() {
  try {
    const sleepData = await StorageUtils.getSleepData();
    if (!sleepData) return null;

    const { sleepHistory = [], sleepNeed, sleepDebt } = sleepData;

    // Calculate averages for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSleep = sleepHistory.filter(
      (r) => new Date(r.date) >= sevenDaysAgo
    );

    const avgDuration =
      recentSleep.length > 0
        ? recentSleep.reduce((sum, r) => sum + r.duration, 0) / recentSleep.length
        : 0;

    const consistency =
      recentSleep.length > 1
        ? calculateConsistency(recentSleep)
        : 0;

    return {
      sleepNeed,
      sleepDebt,
      avgDuration,
      consistency,
      recordCount: sleepHistory.length,
      recentRecordCount: recentSleep.length,
    };
  } catch (error) {
    console.error('Error getting sleep statistics:', error);
    return null;
  }
}

/**
 * Calculate sleep consistency score
 * @param {Array} records - Sleep records
 * @returns {number} Consistency score (0-100)
 */
function calculateConsistency(records) {
  if (records.length < 2) return 0;

  const durations = records.map((r) => r.duration);
  const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
  const variance =
    durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length;
  const stdDev = Math.sqrt(variance);

  // Convert to 0-100 score (lower std dev = higher consistency)
  const consistencyScore = Math.max(0, 100 - stdDev * 20);

  return Math.round(consistencyScore);
}
