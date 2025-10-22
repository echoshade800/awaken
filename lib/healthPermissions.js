import { Platform } from 'react-native';
import AppleHealthKit from 'react-native-health';
import {
  initialize,
  requestPermission,
  readRecords,
  SdkAvailabilityStatus
} from 'react-native-health-connect';

const HEALTH_PERMISSIONS = {
  ios: {
    permissions: {
      read: [AppleHealthKit.Constants.Permissions.StepCount],
    },
  },
  android: [
    { accessType: 'read', recordType: 'Steps' },
  ],
};

export const checkHealthPermission = async () => {
  if (Platform.OS === 'ios') {
    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(HEALTH_PERMISSIONS.ios, (error) => {
        if (error) {
          resolve(false);
          return;
        }
        resolve(true);
      });
    });
  } else if (Platform.OS === 'android') {
    try {
      const isAvailable = await initialize();
      if (isAvailable !== SdkAvailabilityStatus.SDK_AVAILABLE) {
        return false;
      }

      const granted = await requestPermission(HEALTH_PERMISSIONS.android);
      return granted;
    } catch (error) {
      console.error('Android Health Connect error:', error);
      return false;
    }
  }

  return false;
};

export const requestHealthPermission = async () => {
  if (Platform.OS === 'ios') {
    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(HEALTH_PERMISSIONS.ios, (error) => {
        if (error) {
          console.error('HealthKit init error:', error);
          resolve(false);
          return;
        }
        resolve(true);
      });
    });
  } else if (Platform.OS === 'android') {
    try {
      const isAvailable = await initialize();
      if (isAvailable !== SdkAvailabilityStatus.SDK_AVAILABLE) {
        return false;
      }

      const granted = await requestPermission(HEALTH_PERMISSIONS.android);
      return granted;
    } catch (error) {
      console.error('Android Health Connect request error:', error);
      return false;
    }
  }

  return false;
};

export const fetchStepData = async (startDate, endDate) => {
  if (Platform.OS === 'ios') {
    return new Promise((resolve, reject) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: true,
      };

      AppleHealthKit.getDailyStepCountSamples(options, (error, results) => {
        if (error) {
          reject(error);
          return;
        }

        const formattedResults = results.map(sample => ({
          startDate: new Date(sample.startDate),
          endDate: new Date(sample.endDate),
          value: sample.value,
        }));

        resolve(formattedResults);
      });
    });
  } else if (Platform.OS === 'android') {
    try {
      const result = await readRecords('Steps', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });

      const formattedResults = result.records.map(record => ({
        startDate: new Date(record.startTime),
        endDate: new Date(record.endTime),
        value: record.count,
      }));

      return formattedResults;
    } catch (error) {
      console.error('Android Health Connect fetch error:', error);
      throw error;
    }
  }

  return [];
};

export const fetchMinuteStepData = async (startDate, endDate) => {
  const rawData = await fetchStepData(startDate, endDate);

  const minuteData = [];
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  for (let time = startTime; time < endTime; time += 60000) {
    const minuteStart = new Date(time);
    const minuteEnd = new Date(time + 60000);

    let steps = 0;
    for (const sample of rawData) {
      const sampleStart = sample.startDate.getTime();
      const sampleEnd = sample.endDate.getTime();

      const overlapStart = Math.max(sampleStart, minuteStart.getTime());
      const overlapEnd = Math.min(sampleEnd, minuteEnd.getTime());

      if (overlapStart < overlapEnd) {
        const sampleDuration = sampleEnd - sampleStart;
        const overlapDuration = overlapEnd - overlapStart;
        const fraction = overlapDuration / sampleDuration;

        steps += Math.round(sample.value * fraction);
      }
    }

    minuteData.push({
      timestamp: minuteStart,
      steps,
    });
  }

  return minuteData;
};
