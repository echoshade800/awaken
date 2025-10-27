import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageUtils {
  static miniAppName = 'awaken_';

  static async getUserData() {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  static async saveUserData(userData) {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Failed to save user data:', error);
      return false;
    }
  }

  static async getData() {
    try {
      const infoData = await AsyncStorage.getItem(`${this.miniAppName}info`);
      return infoData ? JSON.parse(infoData) : null;
    } catch (error) {
      console.error('Failed to get info data:', error);
      return null;
    }
  }

  static async setData(newData) {
    try {
      const oldData = await this.getData();
      const mergedData = oldData ? { ...oldData, ...newData } : newData;
      await AsyncStorage.setItem(`${this.miniAppName}info`, JSON.stringify(mergedData));
      return true;
    } catch (error) {
      console.error('Failed to set info data:', error);
      return false;
    }
  }

  static async getAlarms() {
    try {
      const alarms = await AsyncStorage.getItem(`${this.miniAppName}alarms`);
      return alarms ? JSON.parse(alarms) : [];
    } catch (error) {
      console.error('Failed to get alarms:', error);
      return [];
    }
  }

  static async saveAlarms(alarms) {
    try {
      await AsyncStorage.setItem(`${this.miniAppName}alarms`, JSON.stringify(alarms));
      return true;
    } catch (error) {
      console.error('Failed to save alarms:', error);
      return false;
    }
  }

  static async getWakeEvents() {
    try {
      const events = await AsyncStorage.getItem(`${this.miniAppName}wakeEvents`);
      return events ? JSON.parse(events) : [];
    } catch (error) {
      console.error('Failed to get wake events:', error);
      return [];
    }
  }

  static async saveWakeEvents(events) {
    try {
      await AsyncStorage.setItem(`${this.miniAppName}wakeEvents`, JSON.stringify(events));
      return true;
    } catch (error) {
      console.error('Failed to save wake events:', error);
      return false;
    }
  }

  static async getSleepData() {
    try {
      const sleepData = await AsyncStorage.getItem(`${this.miniAppName}sleepData`);
      return sleepData ? JSON.parse(sleepData) : null;
    } catch (error) {
      console.error('Failed to get sleep data:', error);
      return null;
    }
  }

  static async setSleepData(sleepData) {
    try {
      const existingData = await this.getSleepData();
      const mergedData = existingData ? { ...existingData, ...sleepData } : sleepData;
      await AsyncStorage.setItem(`${this.miniAppName}sleepData`, JSON.stringify(mergedData));
      return true;
    } catch (error) {
      console.error('Failed to save sleep data:', error);
      return false;
    }
  }

  static async getSleepSessions() {
    try {
      const sessions = await AsyncStorage.getItem(`${this.miniAppName}sleepSessions`);
      return sessions ? JSON.parse(sessions) : [];
    } catch (error) {
      console.error('Failed to get sleep sessions:', error);
      return [];
    }
  }

  static async saveSleepSessions(sessions) {
    try {
      await AsyncStorage.setItem(`${this.miniAppName}sleepSessions`, JSON.stringify(sessions));
      return true;
    } catch (error) {
      console.error('Failed to save sleep sessions:', error);
      return false;
    }
  }

  static async getSleepAutoTracking() {
    try {
      const tracking = await AsyncStorage.getItem(`${this.miniAppName}sleepAutoTracking`);
      return tracking !== null ? JSON.parse(tracking) : true;
    } catch (error) {
      console.error('Failed to get sleep auto tracking:', error);
      return true;
    }
  }

  static async setSleepAutoTracking(value) {
    try {
      await AsyncStorage.setItem(`${this.miniAppName}sleepAutoTracking`, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Failed to save sleep auto tracking:', error);
      return false;
    }
  }

  static async getHealthKitAuthorized() {
    try {
      const authorized = await AsyncStorage.getItem(`${this.miniAppName}healthKitAuthorized`);
      return authorized !== null ? JSON.parse(authorized) : false;
    } catch (error) {
      console.error('Failed to get HealthKit authorization status:', error);
      return false;
    }
  }

  static async setHealthKitAuthorized(value) {
    try {
      await AsyncStorage.setItem(`${this.miniAppName}healthKitAuthorized`, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Failed to save HealthKit authorization status:', error);
      return false;
    }
  }

  static async getLastHealthKitSync() {
    try {
      const lastSync = await AsyncStorage.getItem(`${this.miniAppName}lastHealthKitSync`);
      return lastSync ? JSON.parse(lastSync) : null;
    } catch (error) {
      console.error('Failed to get last HealthKit sync time:', error);
      return null;
    }
  }

  static async setLastHealthKitSync(timestamp) {
    try {
      await AsyncStorage.setItem(`${this.miniAppName}lastHealthKitSync`, JSON.stringify(timestamp));
      return true;
    } catch (error) {
      console.error('Failed to save last HealthKit sync time:', error);
      return false;
    }
  }

  static async getHasRunInitialHealthSync() {
    try {
      const hasRun = await AsyncStorage.getItem(`${this.miniAppName}hasRunInitialHealthSync`);
      return hasRun !== null ? JSON.parse(hasRun) : false;
    } catch (error) {
      console.error('Failed to get initial health sync status:', error);
      return false;
    }
  }

  static async setHasRunInitialHealthSync(value) {
    try {
      await AsyncStorage.setItem(`${this.miniAppName}hasRunInitialHealthSync`, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Failed to save initial health sync status:', error);
      return false;
    }
  }
}

export default StorageUtils;