import { create } from 'zustand';
import StorageUtils from './StorageUtils';

const useStore = create((set, get) => ({
  userData: null,
  appData: null,
  alarms: [],
  wakeEvents: [],
  isLoading: true,
  hasOnboarded: false,
  chronotype: 'neutral',

  // Alarm creation conversation state
  currentAlarmDraft: null,
  chatHistory: [],
  currentStep: 0,

  initialize: async () => {
    try {
      const [userData, appData, alarms, wakeEvents] = await Promise.all([
        StorageUtils.getUserData(),
        StorageUtils.getData(),
        StorageUtils.getAlarms(),
        StorageUtils.getWakeEvents(),
      ]);
      set({
        userData,
        appData: appData || { sleepDebt: '-2' },
        alarms,
        wakeEvents,
        hasOnboarded: appData?.hasOnboarded || false,
        chronotype: appData?.chronotype || 'neutral',
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
        voiceModules: [
          { type: 'time', enabled: true, order: 0 },
          { type: 'date', enabled: true, order: 1 },
          { type: 'weather', enabled: false, order: 2 },
          { type: 'schedule', enabled: false, order: 3 },
          { type: 'lucky', enabled: false, order: 4 },
        ],
        voicePackage: 'energetic-girl',
        task: 'none',
        enabled: true,
        broadcastText: '',
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
}));

export default useStore;
