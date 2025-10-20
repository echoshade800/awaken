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

  // Alarm creation conversation state
  currentAlarmDraft: null,
  chatHistory: [],
  currentStep: 0,

  initialize: async () => {
    try {
      const [userData, appData, alarms, wakeEvents, sleepData] = await Promise.all([
        StorageUtils.getUserData(),
        StorageUtils.getData(),
        StorageUtils.getAlarms(),
        StorageUtils.getWakeEvents(),
        StorageUtils.getSleepData(),
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
        time: '07:00',
        period: 'workday',
        customDays: [],
        wakeMode: 'voice',
        ringtone: null,
        voicePackage: 'energetic-girl',
        task: 'none',
        enabled: true,
        broadcastContent: '',
        label: '',
      },
      chatHistory: [],
      currentStep: 0,
    });
  },

  loadAlarmForEdit: (alarmId) => {
    const alarm = get().alarms.find((a) => a.id === alarmId);
    if (alarm) {
      set({
        currentAlarmDraft: { ...alarm },
        chatHistory: [],
        currentStep: 0,
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

  nextStep: () => {
    set((state) => ({
      currentStep: state.currentStep + 1,
    }));
  },

  prevStep: () => {
    set((state) => ({
      currentStep: Math.max(0, state.currentStep - 1),
    }));
  },

  setStep: (step) => {
    set({ currentStep: step });
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
      currentStep: 0,
    });
  },

  clearAlarmDraft: () => {
    set({
      currentAlarmDraft: null,
      chatHistory: [],
      currentStep: 0,
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
}));

export default useStore;
