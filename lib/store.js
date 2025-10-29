import { create } from 'zustand';
import StorageUtils from './StorageUtils';
import {
  calculateSleepNeed,
  calculateSleepDebt,
  generateCircadianCurve,
  findPeakAndValley,
  getCurrentEnergy,
  getDynamicMonsterTip,
  getSleepDebtInfo,
} from './sleepCalculations';
import { convertDemoToSleepSessions } from './demoSleepData';
import { fetchSleepData } from './healthPermissions';
import {
  requestStepsPermission,
  checkStepsAuthorized,
} from './modules/health/healthkit';
import { inferSleepFromRecentSamples, perform14DaySleepSync } from './sleepInference';

const useStore = create((set, get) => ({
  userData: null,
  appData: null,
  alarms: [],
  wakeEvents: [],
  isLoading: true,
  hasOnboarded: false,
  chronotype: 'neutral',

  // Sleep data
  sleepNeed: 8,
  sleepDebt: 0,
  circadianCurve: [],
  sleepHistory: [],
  lastCalculated: null,
  sleepSessions: [],
  sleepAutoTracking: true,
  healthKitAuthorized: false,
  lastHealthKitSync: null,
  hasRunInitialHealthSync: false,

  // Alarm creation conversation state
  currentAlarmDraft: null,
  chatHistory: [],

  initialize: async () => {
    try {
      const [userData, appData, alarms, wakeEvents, sleepData, sessions, tracking, healthKitAuth, lastSync, hasInitialSync] = await Promise.all([
        StorageUtils.getUserData(),
        StorageUtils.getData(),
        StorageUtils.getAlarms(),
        StorageUtils.getWakeEvents(),
        StorageUtils.getSleepData(),
        StorageUtils.getSleepSessions(),
        StorageUtils.getSleepAutoTracking(),
        StorageUtils.getHealthKitAuthorized(),
        StorageUtils.getLastHealthKitSync(),
        StorageUtils.getHasRunInitialHealthSync(),
      ]);

      // Migrate old alarms to include wakeMode if missing
      const migratedAlarms = alarms.map(alarm => {
        if (!alarm.wakeMode) {
          return { ...alarm, wakeMode: 'voice' };
        }
        return alarm;
      });

      // Save migrated alarms if any were updated
      if (migratedAlarms.some((a, i) => a.wakeMode !== alarms[i]?.wakeMode)) {
        await StorageUtils.saveAlarms(migratedAlarms);
      }

      set({
        userData,
        appData: appData || { sleepDebt: '-2' },
        alarms: migratedAlarms,
        wakeEvents,
        hasOnboarded: appData?.hasOnboarded || false,
        chronotype: appData?.chronotype || 'neutral',
        sleepNeed: sleepData?.sleepNeed || 8,
        sleepDebt: sleepData?.sleepDebt || 0,
        circadianCurve: sleepData?.circadianCurve || [],
        sleepHistory: sleepData?.sleepHistory || [],
        lastCalculated: sleepData?.lastCalculated,
        sleepSessions: sessions || [],
        sleepAutoTracking: tracking !== null ? tracking : true,
        healthKitAuthorized: healthKitAuth || false,
        lastHealthKitSync: lastSync,
        hasRunInitialHealthSync: hasInitialSync || false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to initialize app:', error);
      set({ isLoading: false });
    }
  },

  completeOnboarding: async (chronotype = 'neutral') => {
    await StorageUtils.setData({ hasOnboarded: true, chronotype });
    set({ hasOnboarded: true, chronotype });
  },

  updateAppData: async (newData) => {
    const currentData = get().appData || {};
    const mergedData = { ...currentData, ...newData };
    await StorageUtils.setData(mergedData);
    set({ appData: mergedData });
  },

  addAlarm: async (alarm) => {
    const newAlarm = {
      ...alarm,
      id: Date.now().toString(),
      enabled: true,
      wakeMode: alarm.wakeMode || 'voice'
    };
    const alarms = [...get().alarms, newAlarm];
    await StorageUtils.saveAlarms(alarms);
    set({ alarms });

    if (newAlarm.enabled) {
      const { scheduleAlarm } = await import('./alarmScheduler');
      const result = await scheduleAlarm(newAlarm);

      if (result.success && result.notificationId) {
        const updatedAlarms = alarms.map((a) =>
          a.id === newAlarm.id ? { ...a, notificationId: result.notificationId } : a
        );
        await StorageUtils.saveAlarms(updatedAlarms);
        set({ alarms: updatedAlarms });
      }
    }
  },

  updateAlarm: async (id, updates) => {
    const currentAlarm = get().alarms.find((a) => a.id === id);
    const updatedAlarm = { ...currentAlarm, ...updates };
    const alarms = get().alarms.map((a) => (a.id === id ? updatedAlarm : a));
    await StorageUtils.saveAlarms(alarms);
    set({ alarms });

    if (currentAlarm?.notificationId) {
      const { cancelAlarm } = await import('./alarmScheduler');
      await cancelAlarm(currentAlarm.notificationId);
    }

    if (updatedAlarm.enabled) {
      const { scheduleAlarm } = await import('./alarmScheduler');
      const result = await scheduleAlarm(updatedAlarm);

      if (result.success && result.notificationId) {
        const alarmsWithNotification = alarms.map((a) =>
          a.id === id ? { ...a, notificationId: result.notificationId } : a
        );
        await StorageUtils.saveAlarms(alarmsWithNotification);
        set({ alarms: alarmsWithNotification });
      }
    }
  },

  deleteAlarm: async (id) => {
    const alarm = get().alarms.find((a) => a.id === id);

    if (alarm?.notificationId) {
      const { cancelAlarm } = await import('./alarmScheduler');
      await cancelAlarm(alarm.notificationId);
    }

    const alarms = get().alarms.filter((a) => a.id !== id);
    await StorageUtils.saveAlarms(alarms);
    set({ alarms });
  },

  toggleAlarm: async (id) => {
    const currentAlarm = get().alarms.find((a) => a.id === id);
    const enabled = !currentAlarm.enabled;
    const alarms = get().alarms.map((a) =>
      a.id === id ? { ...a, enabled } : a
    );
    await StorageUtils.saveAlarms(alarms);
    set({ alarms });

    if (currentAlarm?.notificationId) {
      const { cancelAlarm } = await import('./alarmScheduler');
      await cancelAlarm(currentAlarm.notificationId);
    }

    if (enabled) {
      const updatedAlarm = { ...currentAlarm, enabled };
      const { scheduleAlarm } = await import('./alarmScheduler');
      const result = await scheduleAlarm(updatedAlarm);

      if (result.success && result.notificationId) {
        const alarmsWithNotification = alarms.map((a) =>
          a.id === id ? { ...a, notificationId: result.notificationId } : a
        );
        await StorageUtils.saveAlarms(alarmsWithNotification);
        set({ alarms: alarmsWithNotification });
      }
    }
  },

  addWakeEvent: async (event) => {
    const wakeEvents = [...get().wakeEvents, { ...event, id: Date.now().toString() }];
    await StorageUtils.saveWakeEvents(wakeEvents);
    set({ wakeEvents });
  },

  // Alarm conversation management
  initNewAlarm: () => {
    const { getDefaultRingtone } = require('./ringtones');
    const defaultRingtone = getDefaultRingtone();

    set({
      currentAlarmDraft: {
        id: null,
        label: null,
        time: null,
        period: null,
        customDays: [],
        wakeMode: null,
        ringtone: defaultRingtone.url,
        ringtoneName: defaultRingtone.name,
        ringtoneUrl: defaultRingtone.url,
        voicePackage: null,
        task: 'shake',
        enabled: true,
        broadcastContent: '',
        interactionEnabled: true,
        interactionType: 'shake',
      },
      chatHistory: [],
    });
  },

  loadAlarmForEdit: (alarmId) => {
    const alarm = get().alarms.find((a) => a.id === alarmId);
    if (alarm) {
      set({
        currentAlarmDraft: { ...alarm },
        chatHistory: [],
      });
    }
  },

  updateDraft: (updates) => {
    set((state) => ({
      currentAlarmDraft: { ...state.currentAlarmDraft, ...updates },
    }));
  },

  addChatMessage: (message) => {
    set((state) => ({
      chatHistory: [
        ...state.chatHistory,
        {
          id: Date.now(),
          role: message.role,
          content: message.content,
          timestamp: new Date(),
        },
      ],
    }));
  },

  saveAlarmFromDraft: async () => {
    const { currentAlarmDraft } = get();
    if (!currentAlarmDraft) return;

    if (currentAlarmDraft.id) {
      await get().updateAlarm(currentAlarmDraft.id, currentAlarmDraft);
    } else {
      await get().addAlarm(currentAlarmDraft);
    }

    set({
      currentAlarmDraft: null,
      chatHistory: [],
    });
  },

  clearAlarmDraft: () => {
    set({
      currentAlarmDraft: null,
      chatHistory: [],
    });
  },

  // Sleep data management
  calculateAndStoreSleepData: async (routineData) => {
    const {
      bedtime = '23:00',
      wakeTime = '07:00',
      energyType = 'balanced',
      alertnessLevel = 'moderate',
    } = routineData;

    // Calculate sleep need
    const sleepNeed = calculateSleepNeed({
      bedtime,
      wakeTime,
      energyType,
      alertnessLevel,
    });

    // Get sleep history
    const sleepHistory = get().sleepHistory || [];

    // Calculate sleep debt
    const sleepDebt = calculateSleepDebt(sleepNeed, sleepHistory);

    // Generate circadian curve
    const circadianCurve = generateCircadianCurve({
      wakeTime,
      sleepTime: bedtime,
      sleepNeed,
      sleepDebt,
      energyType,
    });

    // Store data
    const sleepData = {
      sleepNeed,
      sleepDebt,
      circadianCurve,
      lastCalculated: new Date().toISOString(),
      routineData: { bedtime, wakeTime, energyType, alertnessLevel },
    };

    await StorageUtils.setSleepData(sleepData);

    set({
      sleepNeed,
      sleepDebt,
      circadianCurve,
      lastCalculated: new Date().toISOString(),
    });

    return sleepData;
  },

  loadSleepData: async () => {
    const sleepData = await StorageUtils.getSleepData();
    if (sleepData) {
      set({
        sleepNeed: sleepData.sleepNeed || 8,
        sleepDebt: sleepData.sleepDebt || 0,
        circadianCurve: sleepData.circadianCurve || [],
        sleepHistory: sleepData.sleepHistory || [],
        lastCalculated: sleepData.lastCalculated,
      });
    }
  },

  updateSleepHistory: async (newEntry) => {
    const sleepHistory = [...get().sleepHistory, newEntry];
    await StorageUtils.setSleepData({ ...get(), sleepHistory });
    set({ sleepHistory });
  },

  refreshSleepCalculations: async () => {
    const appData = get().appData;
    if (!appData?.routineData) return;

    await get().calculateAndStoreSleepData(appData.routineData);
  },

  getEnergyRhythmData: () => {
    const { circadianCurve, sleepDebt } = get();
    if (!circadianCurve || circadianCurve.length === 0) {
      return null;
    }

    const currentEnergy = getCurrentEnergy(circadianCurve);
    const { peak, valley } = findPeakAndValley(circadianCurve);
    const monsterTip = getDynamicMonsterTip(currentEnergy, sleepDebt);
    const debtInfo = getSleepDebtInfo(sleepDebt);

    return {
      energyScore: currentEnergy,
      peak: { time: peak.time, energy: peak.energy },
      valley: { time: valley.time, energy: valley.energy },
      curve: circadianCurve,
      monsterTip,
      debtInfo,
    };
  },

  addSleepSession: async (session) => {
    let sessions = get().sleepSessions || [];

    const hasDemoData = sessions.some((s) => s.source === 'demo');
    if (hasDemoData && session.source !== 'demo') {
      sessions = sessions.filter((s) => s.source !== 'demo');
    }

    sessions = [...sessions, session];
    await StorageUtils.saveSleepSessions(sessions);
    set({ sleepSessions: sessions });
    await get().refreshSleepCalculations();
  },

  toggleAutoTracking: async () => {
    const newValue = !get().sleepAutoTracking;
    await StorageUtils.setSleepAutoTracking(newValue);
    set({ sleepAutoTracking: newValue });
  },

  getSleepSessionsForChart: () => {
    try {
      const sessions = get().sleepSessions || [];
      const today = new Date().toISOString().split('T')[0];
      const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const dateMap = {};
      sessions
        .filter((s) => s && s.date && s.date >= sevenDaysAgo && s.date <= today)
        .forEach((s) => {
          if (!dateMap[s.date] || dateMap[s.date].id < s.id) {
            dateMap[s.date] = s;
          }
        });

      const formatISOToTime = (iso) => {
        if (!iso) return null;
        try {
          const d = new Date(iso);
          if (isNaN(d.getTime())) return null;
          const h = d.getHours().toString().padStart(2, '0');
          const m = d.getMinutes().toString().padStart(2, '0');
          return `${h}:${m}`;
        } catch (error) {
          return null;
        }
      };

      const result = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const session = dateMap[dateStr];

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayLabel = i === 0 ? 'Today' : dayNames[date.getDay()];

        if (session && typeof session.durationMin === 'number') {
          const hours = Math.floor(session.durationMin / 60);
          const minutes = session.durationMin % 60;

          result.push({
            date: dateStr,
            dayLabel,
            sleepTime: formatISOToTime(session.bedtimeISO),
            wakeTime: formatISOToTime(session.waketimeISO),
            duration: `${hours}h ${minutes}m`,
            slept: session.durationMin / 60,
          });
        } else {
          result.push({
            date: dateStr,
            dayLabel,
            sleepTime: null,
            wakeTime: null,
            duration: null,
            slept: 0,
          });
        }
      }

      return result;
    } catch (error) {
      console.error('Error in getSleepSessionsForChart:', error);
      return [];
    }
  },

  getSleepSessionsForDebtChart: () => {
    try {
      const sessions = get().sleepSessions || [];
      const today = new Date().toISOString().split('T')[0];
      const fourteenDaysAgo = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const dateMap = {};
      sessions
        .filter((s) => s && s.date && s.date >= fourteenDaysAgo && s.date <= today)
        .forEach((s) => {
          if (!dateMap[s.date] || dateMap[s.date].id < s.id) {
            dateMap[s.date] = s;
          }
        });

      const formatISOToTime = (iso) => {
        if (!iso) return null;
        try {
          const d = new Date(iso);
          if (isNaN(d.getTime())) return null;
          const h = d.getHours().toString().padStart(2, '0');
          const m = d.getMinutes().toString().padStart(2, '0');
          return `${h}:${m}`;
        } catch (error) {
          return null;
        }
      };

      const result = [];
      for (let i = 13; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const session = dateMap[dateStr];

        if (session && typeof session.durationMin === 'number') {
          const hours = Math.floor(session.durationMin / 60);
          const minutes = session.durationMin % 60;

          result.push({
            date: dateStr,
            sleepTime: formatISOToTime(session.bedtimeISO),
            wakeTime: formatISOToTime(session.waketimeISO),
            duration: `${hours}h ${minutes}m`,
            slept: session.durationMin / 60,
          });
        } else {
          result.push({
            date: dateStr,
            sleepTime: null,
            wakeTime: null,
            duration: null,
            slept: 0,
          });
        }
      }

      return result;
    } catch (error) {
      console.error('Error in getSleepSessionsForDebtChart:', error);
      return [];
    }
  },

  getAllSleepSessions: () => {
    try {
      const sessions = get().sleepSessions || [];

      const formatISOToTime = (iso) => {
        if (!iso) return null;
        try {
          const d = new Date(iso);
          if (isNaN(d.getTime())) return null;
          const h = d.getHours().toString().padStart(2, '0');
          const m = d.getMinutes().toString().padStart(2, '0');
          return `${h}:${m}`;
        } catch (error) {
          return null;
        }
      };

      return sessions
        .filter(s => s && s.date && typeof s.durationMin === 'number')
        .sort((a, b) => {
          try {
            return b.date.localeCompare(a.date) || (b.id || '').localeCompare(a.id || '');
          } catch (error) {
            return 0;
          }
        })
        .map((s) => {
          try {
            const hours = Math.floor(s.durationMin / 60);
            const minutes = s.durationMin % 60;
            return {
              date: s.date,
              sleepTime: formatISOToTime(s.bedtimeISO),
              wakeTime: formatISOToTime(s.waketimeISO),
              duration: `${hours}h ${minutes}m`,
              isLastNight: s.date === new Date().toISOString().split('T')[0],
            };
          } catch (error) {
            console.error('Error mapping session:', error);
            return null;
          }
        })
        .filter(s => s !== null);
    } catch (error) {
      console.error('Error in getAllSleepSessions:', error);
      return [];
    }
  },

  insertDemoSleepData: async () => {
    try {
      const existingSessions = get().sleepSessions || [];
      const hasDemoData = existingSessions.some((s) => s && s.source === 'demo');
      const hasRealData = existingSessions.some((s) => s && s.source !== 'demo');

      console.log('[Store] insertDemoSleepData - existing sessions:', existingSessions.length);
      console.log('[Store] Has demo data:', hasDemoData, 'Has real data:', hasRealData);

      // Never insert demo data if we have real HealthKit data
      if (hasDemoData || hasRealData) {
        console.log('[Store] Skipping demo data insertion - already have data');
        return;
      }

      console.log('[Store] No existing data, inserting demo data...');
      const demoSessions = convertDemoToSleepSessions();
      if (!demoSessions || demoSessions.length === 0) {
        console.warn('[Store] No demo sessions generated');
        return;
      }

      await StorageUtils.saveSleepSessions(demoSessions);
      set({ sleepSessions: demoSessions });
      console.log('[Store] Demo data inserted:', demoSessions.length, 'sessions');
    } catch (error) {
      console.error('[Store] Error inserting demo sleep data:', error);
    }
  },

  clearDemoDataIfRealDataExists: async () => {
    const sessions = get().sleepSessions || [];
    const hasRealData = sessions.some((s) => s.source !== 'demo');

    if (hasRealData) {
      const realSessions = sessions.filter((s) => s.source !== 'demo');
      await StorageUtils.saveSleepSessions(realSessions);
      set({ sleepSessions: realSessions });
    }
  },

  // Sync HealthKit sleep data
  syncHealthKitData: async () => {
    try {
      console.log('[Store] Starting HealthKit sync...');

      // Check permission first
      const permission = await checkStepsAuthorized();
      if (!permission) {
        console.log('[Store] HealthKit permission not granted');
        return { success: false, message: 'Permission not granted' };
      }

      // First try to get direct sleep data from HealthKit
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const healthKitSessions = await fetchSleepData(startDate, endDate);

      let sessionsToUse = [];
      let dataSource = 'unknown';

      // If we have direct sleep data, use it
      if (healthKitSessions && healthKitSessions.length > 0) {
        console.log('[Store] Using direct HealthKit sleep data:', healthKitSessions.length);
        sessionsToUse = healthKitSessions;
        dataSource = 'healthkit';
      } else {
        // Otherwise, infer from recent step samples
        console.log('[Store] No direct sleep data, inferring from step samples...');
        const inferenceResult = await inferSleepFromRecentSamples();

        if (inferenceResult.ok && inferenceResult.sessions.length > 0) {
          console.log('[Store] Sleep inferred successfully:', inferenceResult.sessions.length, 'session(s)');
          sessionsToUse = inferenceResult.sessions;
          dataSource = 'healthkit-inferred';
        } else {
          console.log('[Store] Sleep inference failed:', inferenceResult.error);
          return {
            success: false,
            message: inferenceResult.error || 'No sleep could be inferred',
            count: 0,
          };
        }
      }

      // Get existing sessions
      const existingSessions = get().sleepSessions || [];

      // Remove demo data if we have real data
      const nonDemoSessions = existingSessions.filter((s) => s.source !== 'demo');

      // Remove old HealthKit data (we'll replace it with fresh data)
      const nonHealthKitSessions = nonDemoSessions.filter(
        (s) => s.source !== 'healthkit' && s.source !== 'healthkit-inferred'
      );

      // Combine with new HealthKit data
      const allSessions = [...nonHealthKitSessions, ...sessionsToUse];

      // Sort by date
      allSessions.sort((a, b) => a.date.localeCompare(b.date));

      // Save to storage
      await StorageUtils.saveSleepSessions(allSessions);
      set({ sleepSessions: allSessions });

      console.log('[Store] HealthKit sync completed:', sessionsToUse.length, 'sessions from', dataSource);

      // Update last sync time
      const syncTime = Date.now();
      await StorageUtils.setLastHealthKitSync(syncTime);
      set({ lastHealthKitSync: syncTime });

      // Recalculate sleep metrics
      await get().refreshSleepCalculations();

      return {
        success: true,
        message: `Synced ${dataSource === 'healthkit' ? 'sleep data' : 'inferred from steps'}`,
        count: sessionsToUse.length,
      };
    } catch (error) {
      console.error('[Store] Error syncing HealthKit data:', error);
      return {
        success: false,
        message: error.message || 'Sync failed',
      };
    }
  },

  // Request HealthKit permission
  requestHealthKitPermission: async () => {
    try {
      console.log('[Store] Requesting HealthKit permission...');
      const result = await requestStepsPermission();
      console.log('[Store] Permission result:', result);

      const granted = result;
      if (granted) {
        await StorageUtils.setHealthKitAuthorized(true);
        set({ healthKitAuthorized: true });
      }

      return granted;
    } catch (error) {
      console.error('[Store] Error requesting HealthKit permission:', error);
      return false;
    }
  },

  // Check if HealthKit is available and authorized
  checkHealthKitPermission: async () => {
    try {
      const result = await checkStepsAuthorized();
      const granted = result;

      if (granted) {
        await StorageUtils.setHealthKitAuthorized(true);
        set({ healthKitAuthorized: true });
      }

      return granted;
    } catch (error) {
      console.error('[Store] Error checking HealthKit permission:', error);
      return false;
    }
  },

  // Perform initial 14-day sleep sync (only runs once)
  performInitial14DaySync: async () => {
    try {
      console.log('[Store] Starting initial 14-day sleep sync...');

      // Check if already done
      const hasRun = get().hasRunInitialHealthSync;
      if (hasRun) {
        console.log('[Store] Initial sync already completed, skipping');
        return { success: true, message: 'Already synced', count: 0 };
      }

      // Check permission
      const permission = await checkStepsAuthorized();
      if (!permission) {
        console.log('[Store] HealthKit permission not granted');
        return { success: false, message: 'Permission not granted' };
      }

      // Perform 14-day sync
      const result = await perform14DaySleepSync();

      if (result.ok && result.sessions.length > 0) {
        console.log('[Store] 14-day sync successful:', result.sessions.length, 'sessions');

        // Clear any existing data
        await StorageUtils.saveSleepSessions(result.sessions);
        set({ sleepSessions: result.sessions });

        // Mark as completed
        await StorageUtils.setHasRunInitialHealthSync(true);
        set({ hasRunInitialHealthSync: true });

        // Update last sync time
        const syncTime = Date.now();
        await StorageUtils.setLastHealthKitSync(syncTime);
        set({ lastHealthKitSync: syncTime });

        return {
          success: true,
          message: `Synced ${result.daysProcessed} days`,
          count: result.sessions.length,
        };
      } else {
        console.log('[Store] 14-day sync failed:', result.error);
        return {
          success: false,
          message: result.error || 'Sync failed',
          count: 0,
        };
      }
    } catch (error) {
      console.error('[Store] Error in initial 14-day sync:', error);
      return {
        success: false,
        message: error.message || 'Sync failed',
      };
    }
  },
}));

export default useStore;
