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
    const sessions = [...get().sleepSessions, session];
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
    const sessions = get().sleepSessions || [];
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const dateMap = {};
    sessions
      .filter((s) => s.date >= sevenDaysAgo && s.date <= today)
      .forEach((s) => {
        if (!dateMap[s.date] || dateMap[s.date].id < s.id) {
          dateMap[s.date] = s;
        }
      });

    const result = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const session = dateMap[dateStr];

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayLabel = i === 0 ? 'Today' : dayNames[date.getDay()];

      if (session) {
        const hours = Math.floor(session.durationMin / 60);
        const minutes = session.durationMin % 60;
        result.push({
          date: dateStr,
          dayLabel,
          sleepTime: session.bedtimeISO,
          wakeTime: session.waketimeISO,
          duration: `${hours}h ${minutes}m`,
        });
      } else {
        result.push({
          date: dateStr,
          dayLabel,
          sleepTime: null,
          wakeTime: null,
          duration: null,
        });
      }
    }

    return result;
  },

  getAllSleepSessions: () => {
    const sessions = get().sleepSessions || [];
    return sessions
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
      .map((s) => {
        const hours = Math.floor(s.durationMin / 60);
        const minutes = s.durationMin % 60;
        return {
          date: s.date,
          sleepTime: s.bedtimeISO,
          wakeTime: s.waketimeISO,
          duration: `${hours}h ${minutes}m`,
          isLastNight: s.date === new Date().toISOString().split('T')[0],
        };
      });
  },
}));

export default useStore;
