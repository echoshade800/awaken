import { Platform } from 'react-native';
import StorageUtils from './StorageUtils';
import { fetchMinuteStepData } from './healthPermissions';
import {
  inferSleepForPeriod,
  calculateSleepNeed,
  calculateSleepDebt,
  calculateCircadianRhythm,
} from './sleepInference';

const DAYS_TO_FETCH = 14;

export const fetchAndProcessHealthData = async () => {
  try {
    console.log('[Health] Starting data fetch and processing...');

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - DAYS_TO_FETCH);

    console.log('[Health] Fetching step data from', startDate, 'to', endDate);

    const minuteSteps = await fetchMinuteStepData(startDate, endDate);

    console.log('[Health] Fetched', minuteSteps.length, 'minutes of step data');

    console.log('[Health] Inferring sleep from step patterns...');
    const sleepRecords = await inferSleepForPeriod(minuteSteps);

    console.log('[Health] Inferred', sleepRecords.length, 'sleep sessions');

    if (sleepRecords.length === 0) {
      console.warn('[Health] No sleep sessions detected');
      return null;
    }

    console.log('[Health] Calculating sleep need...');
    const sleepNeedMin = calculateSleepNeed(sleepRecords);

    console.log('[Health] Calculating sleep debt...');
    const sleepDebtMin = calculateSleepDebt(sleepRecords, sleepNeedMin);

    console.log('[Health] Calculating circadian rhythm...');
    const circadianDay = calculateCircadianRhythm(sleepDebtMin);

    const existingSessions = await StorageUtils.getSleepSessions() || [];

    const newSessions = sleepRecords.map((record, index) => ({
      id: `inferred_${record.date}_${Date.now()}_${index}`,
      date: record.date,
      bedtimeISO: record.startISO,
      waketimeISO: record.endISO,
      durationMin: record.durationMin,
      source: 'health_inference',
    }));

    const mergedSessions = [...existingSessions];
    for (const newSession of newSessions) {
      const existingIndex = mergedSessions.findIndex(
        s => s.date === newSession.date && s.source === 'health_inference'
      );

      if (existingIndex >= 0) {
        mergedSessions[existingIndex] = newSession;
      } else {
        mergedSessions.push(newSession);
      }
    }

    await StorageUtils.saveSleepSessions(mergedSessions);

    await StorageUtils.setData({
      sleepNeedMin,
      sleepDebtMin,
      circadianDay,
      lastHealthSync: new Date().toISOString(),
      healthDataAvailable: true,
    });

    console.log('[Health] Successfully processed and stored health data');
    console.log('[Health] Sleep Need:', Math.round(sleepNeedMin / 60 * 10) / 10, 'hours');
    console.log('[Health] Sleep Debt:', Math.round(sleepDebtMin / 60 * 10) / 10, 'hours');

    return {
      sleepRecords,
      sleepNeedMin,
      sleepDebtMin,
      circadianDay,
      sessions: mergedSessions,
    };
  } catch (error) {
    console.error('[Health] Error processing health data:', error);
    throw error;
  }
};

export const shouldRefreshHealthData = async () => {
  try {
    const appData = await StorageUtils.getData();
    if (!appData?.lastHealthSync) {
      return true;
    }

    const lastSync = new Date(appData.lastHealthSync);
    const now = new Date();
    const hoursSinceLastSync = (now - lastSync) / (1000 * 60 * 60);

    return hoursSinceLastSync >= 12;
  } catch (error) {
    console.error('[Health] Error checking refresh status:', error);
    return true;
  }
};

export const getHealthDataFromStorage = async () => {
  try {
    const appData = await StorageUtils.getData();

    return {
      sleepNeedMin: appData?.sleepNeedMin || 8 * 60,
      sleepDebtMin: appData?.sleepDebtMin || 0,
      circadianDay: appData?.circadianDay || [],
      lastHealthSync: appData?.lastHealthSync,
      healthDataAvailable: appData?.healthDataAvailable || false,
    };
  } catch (error) {
    console.error('[Health] Error loading health data from storage:', error);
    return null;
  }
};
