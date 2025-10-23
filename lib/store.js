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
import {
  fetchSleepData,
  fetchStepData,
  inferSleepFromSteps,
  requestStepPermission,
  checkStepPermission,
} from './healthPermissions';

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

  // Alarm creation conversation state
  currentAlarmDraft: null,
  chatHistory: [],

  initialize: async () => {
    try {
      const [userData, appData, alarms, wakeEvents, sleepData, sessions, tracking] = await Promise.all([
        StorageUtils.getUserData(),
        StorageUtils.getData(),
        StorageUtils.getAlarms(),
        StorageUtils.getWakeEvents(),
        StorageUtils.getSleepData(),
        StorageUtils.getSleepSessions(),
        StorageUtils.getSleepAutoTracking(),
      ]);
      set({
        userData,
        appData: appData || { sleepDebt: '-2' },
        alarms,
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
    const alarms = [...get().alarms, { ...alarm, id: Date.now().toString() }];
    await StorageUtils.saveAlarms(alarms);
    set({ alarms });
  },

  updateAlarm: async (id, updates) => {
    const alarms = get().alarms.map((a) => (a.id === id ? { ...a, ...updates } : a));
    await StorageUtils.saveAlarms(alarms);
    set({ alarms });
  },

  deleteAlarm: async (id) => {
    const alarms = get().alarms.filter((a) => a.id !== id);
    await StorageUtils.saveAlarms(alarms);
    set({ alarms });
  },

  toggleAlarm: async (id) => {
    const alarms = get().alarms.map((a) =>
      a.id === id ? { ...a, enabled: !a.enabled } : a
    );
    await StorageUtils.saveAlarms(alarms);
    set({ alarms });
  },

  addWakeEvent: async (event) => {
    const wakeEvents = [...get().wakeEvents, { ...event, id: Date.now().toString() }];
    await StorageUtils.saveWakeEvents(wakeEvents);
    set({ wakeEvents });
  },

  // Alarm conversation management
  initNewAlarm: () => {
    set({
      currentAlarmDraft: {
        id: null,
        label: null,
        time: null,
        period: null,
        customDays: [],
        wakeMode: null,
        ringtone: null,
        ringtoneName: null,
        ringtoneUrl: null,
        voicePackage: null,
        task: 'none',
        enabled: true,
        broadcastContent: '',
        interactionEnabled: null,
        interactionType: null,
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

  // Deprecated: No longer automatically inserts demo data
  // Users should sync HealthKit or manually add sleep sessions
  insertDemoSleepData: async () => {
    console.log('[Store] insertDemoSleepData called but is now deprecated - no demo data will be added');
    // Do nothing - we want users to use real data
    return;
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

  // Sync HealthKit sleep data (using step inference)
  syncHealthKitData: async () => {
    try {
      console.log('[Store] Starting HealthKit sync...');

      // Check permission first
      const permission = await checkStepPermission();
      if (permission !== 'granted') {
        console.log('[Store] HealthKit permission not granted');
        return { success: false, message: 'Permission not granted' };
      }

      // Fetch data for the last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      console.log('[Store] Fetching step data from', startDate.toISOString(), 'to', endDate.toISOString());

      // Fetch step data
      const stepData = await fetchStepData(startDate, endDate);
      console.log('[Store] Fetched step data points:', stepData?.length || 0);

      let inferredSessions = [];
      if (stepData && stepData.length > 0) {
        // Infer sleep from step data
        console.log('[Store] Inferring sleep from step data...');
        inferredSessions = inferSleepFromSteps(stepData);
        console.log('[Store] Inferred sleep sessions:', inferredSessions.length);

        // Convert inferred sessions to our format with source
        inferredSessions = inferredSessions.map(session => ({
          id: `inferred-${session.startISO}`,
          date: session.date,
          bedtimeISO: session.startISO,
          waketimeISO: session.endISO,
          durationMin: session.durationMin,
          source: 'inferred',
        }));
      }

      // Also try to fetch direct sleep data from HealthKit
      console.log('[Store] Fetching direct sleep data from HealthKit...');
      const directSleepSessions = await fetchSleepData(startDate, endDate);
      console.log('[Store] Fetched direct HealthKit sessions:', directSleepSessions?.length || 0);

      // Combine both sources, preferring direct HealthKit data
      let allNewSessions = [];

      // Add direct HealthKit sessions
      if (directSleepSessions && directSleepSessions.length > 0) {
        allNewSessions = [...directSleepSessions];
      }

      // Add inferred sessions for dates that don't have direct data
      if (inferredSessions.length > 0) {
        inferredSessions.forEach(inferredSession => {
          const dateExists = allNewSessions.some(s => s.date === inferredSession.date);
          if (!dateExists) {
            allNewSessions.push(inferredSession);
          }
        });
      }

      if (allNewSessions.length === 0) {
        console.log('[Store] No sleep data found (neither direct nor inferred)');
        return { success: true, message: 'No sleep data found', count: 0 };
      }

      console.log('[Store] Total new sessions:', allNewSessions.length);

      // Get existing sessions
      const existingSessions = get().sleepSessions || [];

      // Remove demo data if we have real data
      const nonDemoSessions = existingSessions.filter((s) => s.source !== 'demo');

      // Remove old HealthKit and inferred data (we'll replace with fresh data)
      const manualSessions = nonDemoSessions.filter(
        (s) => s.source !== 'healthkit' && s.source !== 'inferred'
      );

      // Combine with new data
      const allSessions = [...manualSessions, ...allNewSessions];

      // Sort by date
      allSessions.sort((a, b) => a.date.localeCompare(b.date));

      // Save to storage
      await StorageUtils.saveSleepSessions(allSessions);
      set({ sleepSessions: allSessions });

      console.log('[Store] Sync completed. Total sessions:', allSessions.length);
      console.log('[Store] - Direct HealthKit:', directSleepSessions?.length || 0);
      console.log('[Store] - Inferred from steps:', inferredSessions.length);
      console.log('[Store] - Manual:', manualSessions.length);

      // Recalculate sleep metrics
      await get().refreshSleepCalculations();

      return {
        success: true,
        message: 'Sync successful',
        count: allNewSessions.length,
        breakdown: {
          direct: directSleepSessions?.length || 0,
          inferred: inferredSessions.length,
          total: allNewSessions.length,
        },
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
      const result = await requestStepPermission();
      console.log('[Store] Permission result:', result);
      return result === 'granted';
    } catch (error) {
      console.error('[Store] Error requesting HealthKit permission:', error);
      return false;
    }
  },

  // Check if HealthKit is available and authorized
  checkHealthKitPermission: async () => {
    try {
      const result = await checkStepPermission();
      return result === 'granted';
    } catch (error) {
      console.error('[Store] Error checking HealthKit permission:', error);
      return false;
    }
  },
}));

export default useStore;
