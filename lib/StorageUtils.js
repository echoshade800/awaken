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
}

export default StorageUtils;