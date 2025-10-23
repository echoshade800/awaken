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

  insertDemoSleepData: async () => {
    try {
      const existingSessions = get().sleepSessions || [];
      const hasDemoData = existingSessions.some((s) => s && s.source === 'demo');
      const hasRealData = existingSessions.some((s) => s && s.source !== 'demo');

      if (hasDemoData || hasRealData) {
        return;
      }

      const demoSessions = convertDemoToSleepSessions();
      if (!demoSessions || demoSessions.length === 0) {
        console.warn('No demo sessions generated');
        return;
      }

      await StorageUtils.saveSleepSessions(demoSessions);
      set({ sleepSessions: demoSessions });
    } catch (error) {
      console.error('Error inserting demo sleep data:', error);
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
}));

export default useStore;
