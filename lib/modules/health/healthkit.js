import { Platform } from 'react-native';
import AppleHealthKit, { getPermissionsConstants } from './healthkitBridge';

// 获取权限常量
const Constants = getPermissionsConstants();

/**
 * Check if Steps permission is authorized
 * @returns {Promise<boolean>} true if authorized, false otherwise
 */
export async function checkStepsAuthorized() {
  console.log('[HealthKit] checkStepsAuthorized called, Platform:', Platform.OS);

  if (Platform.OS !== 'ios' || !AppleHealthKit) {
    console.log('[HealthKit] Non-iOS platform or HealthKit unavailable');
    return false;
  }

  return new Promise((resolve) => {
    AppleHealthKit.isAvailable((err, available) => {
      if (err || !available) {
        console.error('[HealthKit] HealthKit not available:', err);
        resolve(false);
        return;
      }

      const permissions = {
        permissions: {
          read: [
            Constants.Permissions.Steps,
          ],
          write: [],
        },
      };

      AppleHealthKit.getAuthStatus(permissions, (authErr, results) => {
        if (authErr) {
          console.error('[HealthKit] Error checking auth status:', authErr);
          resolve(false);
          return;
        }

        console.log('[HealthKit] Auth status results:', results);

        const stepsStatus = results[Constants.Permissions.Steps];
        const isAuthorized = stepsStatus === Constants.AuthorizationStatus?.SharingAuthorized ||
                           stepsStatus === 2; // Sometimes returns numeric value

        console.log('[HealthKit] Steps authorized:', isAuthorized);
        resolve(isAuthorized);
      });
    });
  });
}

/**
 * Request Steps permission
 * @returns {Promise<boolean>} true if granted, false otherwise
 */
export async function requestStepsPermission() {
  console.log('[HealthKit] requestStepsPermission called, Platform:', Platform.OS);

  if (Platform.OS !== 'ios' || !AppleHealthKit) {
    console.log('[HealthKit] Non-iOS platform or HealthKit unavailable');
    return false;
  }

  return new Promise((resolve) => {
    AppleHealthKit.isAvailable((err, available) => {
      if (err || !available) {
        console.error('[HealthKit] HealthKit not available:', err);
        resolve(false);
        return;
      }

      const permissions = {
        permissions: {
          read: [
            Constants.Permissions.Steps,
            Constants.Permissions.SleepAnalysis,
          ],
          write: [],
        },
      };

      console.log('[HealthKit] Requesting authorization...');
      AppleHealthKit.initHealthKit(permissions, (initErr) => {
        if (initErr) {
          console.error('[HealthKit] Authorization error:', initErr);
          resolve(false);
          return;
        }

        console.log('[HealthKit] Authorization completed');

        // Check the final authorization status
        AppleHealthKit.getAuthStatus(permissions, (authErr, results) => {
          if (authErr) {
            console.error('[HealthKit] Error checking auth status after init:', authErr);
            // Still resolve true as the init succeeded
            resolve(true);
            return;
          }

          console.log('[HealthKit] Auth status after init:', results);
          const stepsStatus = results[Constants.Permissions.Steps];
          const isAuthorized = stepsStatus === Constants.AuthorizationStatus?.SharingAuthorized ||
                             stepsStatus === 2;

          resolve(isAuthorized);
        });
      });
    });
  });
}

/**
 * Fetch daily step counts for the last 14 days
 * Uses the same bridge-driven approach as the welcome page
 * @returns {Promise<Array>} Array of daily step data: [{ date, value }, ...]
 */
export async function fetchDailySteps14d() {
  console.log('[HealthKit] fetchDailySteps14d(): start');

  if (Platform.OS !== 'ios') {
    console.log('[HealthKit] Non-iOS platform, returning empty array');
    return [];
  }

  if (!AppleHealthKit) {
    console.log('[HealthKit] AppleHealthKit bridge not available');
    return [];
  }

  return new Promise((resolve) => {
    // Step 1: Check if HealthKit is available on this device
    AppleHealthKit.isAvailable((err, available) => {
      if (err || !available) {
        console.error('[HealthKit] HealthKit not available:', err);
        resolve([]);
        return;
      }

      console.log('[HealthKit] HealthKit is available, initializing permissions...');

      // Step 2: Request permissions (same as welcome page)
      const permissions = {
        permissions: {
          read: [
            Constants.Permissions.Steps,
            Constants.Permissions.StepCount,
          ],
          write: [],
        },
      };

      AppleHealthKit.initHealthKit(permissions, (initErr) => {
        if (initErr) {
          console.error('[HealthKit] Permission initialization failed:', initErr);
          resolve([]);
          return;
        }

        console.log('[HealthKit] Permissions granted, fetching step data...');

        // Step 3: Calculate time range (last 14 days, inclusive of today)
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 13); // 14 days total (today + 13 previous days)

        const options = {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          period: 60 * 24, // Daily aggregation (minutes)
          ascending: true,
        };

        console.log('[HealthKit] Fetching daily steps from', start.toISOString(), 'to', end.toISOString());

        // Step 4: Fetch daily step count samples (same call as welcome page)
        AppleHealthKit.getDailyStepCountSamples(options, (stepErr, results) => {
          if (stepErr) {
            console.error('[HealthKit] getDailyStepCountSamples error:', stepErr);
            resolve([]);
            return;
          }

          console.log('[HealthKit] Raw step samples fetched:', results?.length || 0, 'days');

          if (!results || results.length === 0) {
            console.warn('[HealthKit] HK_STEPS_EMPTY - No step data available');
            resolve([]);
            return;
          }

          // Step 5: Format data to match expected structure: [{ date, value }, ...]
          // results is usually array of { startDate, endDate, value }
          const mapped = (results || []).map((item) => ({
            date: item.startDate, // ISO timestamp string
            value: Number(item.value || 0), // Number of steps
          }));

          console.log('[HealthKit] fetchDailySteps14d mapped[0..5]:', mapped.slice(0, 5));
          console.log('[HealthKit] fetchDailySteps14d total days:', mapped.length);

          resolve(mapped);
        });
      });
    });
  });
}

/**
 * Fetch step count samples for a specific date range
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {Promise<Array>} Array of step data points
 */
export async function fetchStepData(startDate, endDate) {
  console.log('[HealthKit] fetchStepData called, Platform:', Platform.OS);

  if (Platform.OS !== 'ios' || !AppleHealthKit) {
    console.log('[HealthKit] HealthKit not available, returning empty array');
    return [];
  }

  try {
    return new Promise((resolve, reject) => {
      const options = {
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        interval: 'minute',
      };

      AppleHealthKit.getStepCount(options, (err, results) => {
        if (err) {
          console.error('[HealthKit] Error fetching step data:', err);
          reject(err);
          return;
        }

        console.log('[HealthKit] Fetched step data:', results?.length || 0, 'points');

        // Convert HealthKit format to our format
        const formattedData = results.map(item => ({
          timestamp: item.startDate,
          steps: item.value || 0,
        }));

        resolve(formattedData);
      });
    });
  } catch (error) {
    console.error('[HealthKit] Error in fetchStepData:', error);
    return [];
  }
}

/**
 * Fetch sleep analysis data
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {Promise<Array>} Array of sleep sessions
 */
export async function fetchSleepData(startDate, endDate) {
  console.log('[HealthKit] fetchSleepData called, Platform:', Platform.OS);

  if (Platform.OS !== 'ios' || !AppleHealthKit) {
    console.log('[HealthKit] HealthKit not available, returning empty array');
    return [];
  }

  try {
    return new Promise((resolve, reject) => {
      const options = {
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      };

      AppleHealthKit.getSleepSamples(options, (err, results) => {
        if (err) {
          console.error('[HealthKit] Error fetching sleep data:', err);
          resolve([]);
          return;
        }

        console.log('[HealthKit] Fetched sleep samples:', results?.length || 0);

        // Filter for ASLEEP samples only (ignore IN_BED)
        const sleepSamples = results.filter(sample => sample.value === 'ASLEEP');

        // Group by date and merge overlapping sessions
        const sleepSessions = processSleepSamples(sleepSamples);

        console.log('[HealthKit] Processed sleep sessions:', sleepSessions.length);
        resolve(sleepSessions);
      });
    });
  } catch (error) {
    console.error('[HealthKit] Error in fetchSleepData:', error);
    return [];
  }
}

function processSleepSamples(samples) {
  if (!samples || samples.length === 0) return [];

  // Sort samples by start time
  const sorted = samples.sort((a, b) =>
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const sessions = [];
  let currentSession = null;

  sorted.forEach(sample => {
    const start = new Date(sample.startDate);
    const end = new Date(sample.endDate);

    if (!currentSession) {
      currentSession = {
        startDate: start,
        endDate: end,
      };
    } else {
      // If this sample starts within 30 minutes of the last one ending, merge them
      const gap = (start.getTime() - currentSession.endDate.getTime()) / (1000 * 60);

      if (gap <= 30) {
        currentSession.endDate = end;
      } else {
        // Save current session and start a new one
        sessions.push(currentSession);
        currentSession = {
          startDate: start,
          endDate: end,
        };
      }
    }
  });

  // Don't forget the last session
  if (currentSession) {
    sessions.push(currentSession);
  }

  // Convert to our format
  return sessions
    .filter(session => {
      const durationMin = (session.endDate - session.startDate) / (1000 * 60);
      return durationMin >= 60; // At least 1 hour
    })
    .map(session => {
      const durationMin = Math.round((session.endDate - session.startDate) / (1000 * 60));

      // Determine the date - use the wake date
      const wakeDate = session.endDate;
      const dateStr = `${wakeDate.getFullYear()}-${String(wakeDate.getMonth() + 1).padStart(2, '0')}-${String(wakeDate.getDate()).padStart(2, '0')}`;

      return {
        id: `healthkit-${session.startDate.toISOString()}`,
        date: dateStr,
        bedtimeISO: session.startDate.toISOString(),
        waketimeISO: session.endDate.toISOString(),
        durationMin: durationMin,
        source: 'healthkit',
      };
    });
}
