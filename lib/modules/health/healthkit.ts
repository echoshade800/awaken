import { Platform } from 'react-native';
import AppleHealthKit, { getPermissionsConstants } from './healthkitBridge';

export type StepPoint = { date: string; value: number };

const permissions = {
  permissions: {
    read: AppleHealthKit ? [AppleHealthKit.Constants.Permissions.Steps] : [],
    write: [],
  },
};

/**
 * 检查步数授权状态
 * 在已授权情况下不会弹出系统授权窗
 * 注意：awaken 与壳 app 共用同一 Bundle ID，权限在系统层面已开启
 */
export async function checkStepsAuthorized(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    console.log('[HealthKit] Not iOS platform, steps authorization unavailable');
    return false;
  }

  if (!AppleHealthKit) {
    console.error('[HealthKit] AppleHealthKit module not available');
    return false;
  }

  return new Promise((resolve) => {
    // 检查 HealthKit 是否可用
    AppleHealthKit.isAvailable((err: any, available: boolean) => {
      if (err || !available) {
        console.error('[HealthKit] HealthKit not available:', err);
        resolve(false);
        return;
      }

      // initHealthKit 在已授权情况下不会重复弹窗，相当于一次能力/权限可用性检查
      AppleHealthKit.initHealthKit(permissions, (initErr: any) => {
        if (initErr) {
          console.error('[HealthKit] Authorization check failed:', initErr);
          resolve(false);
          return;
        }

        // 检查具体的步数读取权限
        AppleHealthKit.getAuthStatus(permissions, (authErr: any, results: any) => {
          if (authErr) {
            console.error('[HealthKit] Error checking auth status:', authErr);
            resolve(false);
            return;
          }

          console.log('[HealthKit] Auth status results:', results);

          const stepsStatus = results[AppleHealthKit.Constants.Permissions.Steps];
          // AuthorizationStatus.SharingAuthorized = 2
          const isAuthorized = stepsStatus === 2 ||
                             stepsStatus === AppleHealthKit.Constants.AuthorizationStatus?.SharingAuthorized;

          console.log('[HealthKit] Steps authorization status:', isAuthorized ? 'granted' : 'denied');
          resolve(isAuthorized);
        });
      });
    });
  });
}

/**
 * 获取最近 N 天的每日步数（含今天）
 * @param days - 天数，默认 14 天
 * @returns 返回每日步数数组，按日期聚合
 */
export async function getRecentSteps(days = 14): Promise<StepPoint[]> {
  console.log('[HealthKit] getRecentSteps(): start, days =', days);
  console.log('[HealthKit] Device timezone:', getTimezoneInfo());

  if (Platform.OS !== 'ios') {
    console.log('[HealthKit] Not iOS platform, returning empty steps');
    return [];
  }

  if (!AppleHealthKit) {
    console.error('[HealthKit] AppleHealthKit module not available');
    throw new Error('HealthKit module not available on this device');
  }

  // ✅ 使用本地时区的日期边界
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);  // 本地时间 00:00:00
  end.setHours(23, 59, 59, 999); // 本地时间 23:59:59

  console.log('[HealthKit] ⏰ Fetching recent steps:');
  console.log('[HealthKit]   Start:', formatLocalDateTime(start));
  console.log('[HealthKit]   End:  ', formatLocalDateTime(end));

  return new Promise((resolve, reject) => {
    // ✅ 使用保留本地时区的 ISO 字符串
    const options = {
      startDate: toLocalISOString(start),
      endDate: toLocalISOString(end),
      includeManuallyAdded: false, // 不包括手动添加的步数
      period: 60 * 24, // 按天聚合（分钟数）
      ascending: true,
    };

    console.log('[HealthKit]   Start ISO:', options.startDate);
    console.log('[HealthKit]   End ISO:  ', options.endDate);

    AppleHealthKit.getDailyStepCountSamples(
      options,
      (err: any, results: any[]) => {
        if (err) {
          console.error('[HealthKit] Error fetching daily steps:', err);
          reject(new Error(`Failed to fetch steps: ${err.message || err}`));
          return;
        }

        if (!results || results.length === 0) {
          console.log('[HealthKit] No step data found for the specified period');
          resolve([]);
          return;
        }

        // 转换为标准格式
        const data: StepPoint[] = results.map((r) => {
          const date = new Date(r.startDate);
          const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          return {
            date: dateStr,
            value: Number(r.value || 0),
          };
        });

        console.log(
          '[HealthKit] Steps fetched successfully:',
          data.length,
          'days, from',
          data[0]?.date,
          'to',
          data[data.length - 1]?.date
        );
        console.log('[HealthKit] Total steps:', data.reduce((sum, d) => sum + d.value, 0));

        resolve(data);
      }
    );
  });
}

/**
 * Fetch daily step counts for the last 14 days
 * Alias for getRecentSteps with consistent naming for sleepInference
 * @returns {Promise<Array>} Array of daily step data: [{ date, value }, ...]
 */
export async function fetchDailySteps14d(): Promise<StepPoint[]> {
  console.log('[HealthKit] fetchDailySteps14d(): start');
  console.log('[HealthKit] Device timezone:', getTimezoneInfo());

  // prepare permissions constants from bridge
  const Constants = getPermissionsConstants?.();
  if (!Constants) {
    console.error('[HealthKit] Missing Constants from getPermissionsConstants()');
  }

  if (Platform.OS !== 'ios') {
    console.log('[HealthKit] Non-iOS platform, returning empty array');
    return [];
  }

  if (!AppleHealthKit) {
    console.log('[HealthKit] AppleHealthKit bridge not available');
    return [];
  }

  return new Promise((resolve) => {
    // Step 1: check if HealthKit is available
    if (typeof AppleHealthKit.isAvailable === 'function') {
      AppleHealthKit.isAvailable((err: any, available: boolean) => {
        if (err || !available) {
          console.error('[HealthKit] HealthKit not available:', err);
          resolve([]);
          return;
        }

        console.log('[HealthKit] HealthKit is available, initializing permissions...');

        // Step 2: request/read permissions
        const permissionsToRequest = {
          permissions: {
            read: [
              Constants?.Permissions?.Steps,
              Constants?.Permissions?.StepCount,
            ].filter(Boolean),
            write: [],
          },
        };

        AppleHealthKit.initHealthKit(permissionsToRequest, (initErr: any) => {
          if (initErr) {
            console.error('[HealthKit] Permission initialization failed:', initErr);
            resolve([]);
            return;
          }

          console.log('[HealthKit] Permissions granted, fetching step data...');

          // Step 3: time range (last 14 days) - using LOCAL timezone boundaries
          // ✅ 使用本地时区的日期边界
          const now = new Date();
          const endDate = new Date(now);
          const startDate = new Date(now);
          startDate.setDate(now.getDate() - 13);
          // ✅ 确保是本地时间 00:00
          startDate.setHours(0, 0, 0, 0);
          // ✅ 确保是本地时间 23:59:59
          endDate.setHours(23, 59, 59, 999);

          // ✅ 使用保留本地时区的 ISO 字符串
          const options = {
            startDate: toLocalISOString(startDate),
            endDate: toLocalISOString(endDate),
            period: 1440, // daily (60 * 24 minutes)
          };

          console.log('[HealthKit] ⏰ Fetching 14 days of daily steps:');
          console.log('[HealthKit]   Start:', formatLocalDateTime(startDate));
          console.log('[HealthKit]   End:  ', formatLocalDateTime(endDate));
          console.log('[HealthKit]   Start ISO:', options.startDate);
          console.log('[HealthKit]   End ISO:  ', options.endDate);

          // Step 4: fetch step data
          AppleHealthKit.getDailyStepCountSamples(options, (stepErr: any, results: any[]) => {
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

            // normalize shape
            const mapped: StepPoint[] = results.map((item: any) => ({
              date: item.startDate,
              value: Number(item.value || 0),
            }));

            console.log('[HealthKit] fetchDailySteps14d mapped[0..5]:', mapped.slice(0, 5));
            console.log('[HealthKit] fetchDailySteps14d total days:', mapped.length);

            // Debug table for easy comparison with Health app
            console.table(mapped.map(i => ({
              date: new Date(i.date).toLocaleDateString(),
              steps: i.value
            })));

            resolve(mapped);
          });
        });
      });
    } else {
      console.error('[HealthKit] AppleHealthKit.isAvailable is not a function');
      resolve([]);
    }
  });
}

/**
 * Fetch hourly step samples for the last 14 days
 * Used for initial sleep data sync
 * @returns {Promise<Array>} Array of step samples: [{ startISO, endISO, value }, ...]
 */
export async function fetchStepSamples14d(): Promise<Array<{ startISO: string; endISO: string; value: number }>> {
  console.log('[HealthKit][StepSamples] fetchStepSamples14d(): start');

  if (Platform.OS !== 'ios') {
    console.log('[HealthKit][StepSamples] Not iOS platform, returning empty array');
    return [];
  }

  if (!AppleHealthKit) {
    console.log('[HealthKit][StepSamples] AppleHealthKit bridge not available');
    return [];
  }

  return new Promise((resolve) => {
    if (typeof AppleHealthKit.isAvailable !== 'function') {
      console.error('[HealthKit][StepSamples] AppleHealthKit.isAvailable is not a function');
      resolve([]);
      return;
    }

    AppleHealthKit.isAvailable((err: any, available: boolean) => {
      if (err || !available) {
        console.error('[HealthKit][StepSamples] HealthKit not available:', err);
        resolve([]);
        return;
      }

      console.log('[HealthKit][StepSamples] HealthKit is available');

      const Constants = getPermissionsConstants?.();
      const permissionsToRequest = {
        permissions: {
          read: [
            Constants?.Permissions?.Steps,
            Constants?.Permissions?.StepCount,
          ].filter(Boolean),
          write: [],
        },
      };

      AppleHealthKit.initHealthKit(permissionsToRequest, (initErr: any) => {
        if (initErr) {
          console.error('[HealthKit][StepSamples] Permission initialization failed:', initErr);
          resolve([]);
          return;
        }

        const now = new Date();
        const endDate = new Date(now);
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 14);

        const options = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          ascending: true,
        };

        console.log('[HealthKit][StepSamples] Fetching 14 days from', options.startDate, 'to', options.endDate);

        if (typeof AppleHealthKit.getDailyStepCountSamples !== 'function') {
          console.error('[HealthKit][StepSamples] getDailyStepCountSamples is not available');
          resolve([]);
          return;
        }

        AppleHealthKit.getDailyStepCountSamples(options, (stepErr: any, results: any[]) => {
          if (stepErr) {
            console.error('[HealthKit][StepSamples] getDailyStepCountSamples error:', stepErr);
            resolve([]);
            return;
          }

          if (!results || results.length === 0) {
            console.warn('[HealthKit][StepSamples] No step samples available for 14 days');
            resolve([]);
            return;
          }

          console.log('[HealthKit][StepSamples] Fetched 14d samples:', results.length, 'samples');

          const mapped = results.map((item: any) => ({
            startISO: item.startDate,
            endISO: item.endDate,
            value: Number(item.value || 0),
          }));

          resolve(mapped);
        });
      });
    });
  });
}

/**
 * Helper function to format date in local timezone with offset
 * @param date - Date object
 * @returns Formatted string like "2025-10-26 23:00:00 (+0800)"
 */
function formatLocalDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  // Get timezone offset in format like +0800 or -0500
  const offset = -date.getTimezoneOffset();
  const offsetHours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const offsetMinutes = String(Math.abs(offset) % 60).padStart(2, '0');
  const offsetSign = offset >= 0 ? '+' : '-';
  const offsetStr = `${offsetSign}${offsetHours}${offsetMinutes}`;

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} (${offsetStr})`;
}

/**
 * Helper function to convert Date to ISO string with local timezone offset
 * This preserves the local time instead of converting to UTC
 * @param date - Date object
 * @returns ISO 8601 string with timezone offset like "2025-10-26T23:00:00.000+08:00"
 */
function toLocalISOString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

  // Get timezone offset in ISO format like +08:00 or -05:00
  const offset = -date.getTimezoneOffset();
  const offsetHours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const offsetMinutes = String(Math.abs(offset) % 60).padStart(2, '0');
  const offsetSign = offset >= 0 ? '+' : '-';
  const offsetStr = `${offsetSign}${offsetHours}:${offsetMinutes}`;

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${offsetStr}`;
}

/**
 * Get timezone information for logging
 * @returns Timezone info string like "Asia/Shanghai (UTC+8)"
 */
function getTimezoneInfo(): string {
  const date = new Date();
  const offset = -date.getTimezoneOffset();
  const offsetHours = offset / 60;
  const offsetSign = offset >= 0 ? '+' : '-';
  const offsetStr = `UTC${offsetSign}${Math.abs(offsetHours)}`;

  // Try to get timezone name
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return `${timeZone} (${offsetStr})`;
  } catch {
    return offsetStr;
  }
}

/**
 * Fetch fine-grained step samples for the last 48 hours
 * Used to determine sleep periods based on step activity patterns
 * Extended to 48 hours to ensure we capture the most recent sleep session,
 * even if it occurred in the early morning hours (e.g., 1AM-7AM)
 * @returns {Promise<Array>} Array of step samples: [{ startISO, endISO, value }, ...]
 */
export async function fetchStepSamples24h(): Promise<Array<{ startISO: string; endISO: string; value: number }>> {
  console.log('[HealthKit][StepSamples] fetchStepSamples24h(): start (fetching 48h data)');
  console.log('[HealthKit][StepSamples] Device timezone:', getTimezoneInfo());

  if (Platform.OS !== 'ios') {
    console.log('[HealthKit][StepSamples] Not iOS platform, returning empty array');
    return [];
  }

  if (!AppleHealthKit) {
    console.log('[HealthKit][StepSamples] AppleHealthKit bridge not available');
    return [];
  }

  return new Promise((resolve) => {
    // Step 1: Check if HealthKit is available
    if (typeof AppleHealthKit.isAvailable !== 'function') {
      console.error('[HealthKit][StepSamples] AppleHealthKit.isAvailable is not a function');
      resolve([]);
      return;
    }

    AppleHealthKit.isAvailable((err: any, available: boolean) => {
      if (err || !available) {
        console.error('[HealthKit][StepSamples] HealthKit not available:', err);
        resolve([]);
        return;
      }

      console.log('[HealthKit][StepSamples] HealthKit is available');

      // Step 2: Initialize HealthKit with step permissions
      const Constants = getPermissionsConstants?.();
      const permissionsToRequest = {
        permissions: {
          read: [
            Constants?.Permissions?.Steps,
            Constants?.Permissions?.StepCount,
          ].filter(Boolean),
          write: [],
        },
      };

      AppleHealthKit.initHealthKit(permissionsToRequest, (initErr: any) => {
        if (initErr) {
          console.error('[HealthKit][StepSamples] Permission initialization failed:', initErr);
          resolve([]);
          return;
        }

        // Step 3: Time range (last 48 hours in local timezone)
        // ✅ 使用本地时间，从当前时刻往前推 48 小时（扩展以捕获凌晨睡眠）
        const now = new Date();
        const endDate = new Date(now);
        const startDate = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 精确的 48 小时前

        // ✅ 使用保留本地时区的 ISO 字符串
        const options = {
          startDate: toLocalISOString(startDate),
          endDate: toLocalISOString(endDate),
          ascending: true,
          // Don't specify period to get individual samples instead of daily aggregation
        };

        console.log('[HealthKit][StepSamples] ⏰ Fetching 48h samples (for sleep inference):');
        console.log('[HealthKit][StepSamples]   Start:', formatLocalDateTime(startDate));
        console.log('[HealthKit][StepSamples]   End:  ', formatLocalDateTime(endDate));
        console.log('[HealthKit][StepSamples]   Start ISO:', options.startDate);
        console.log('[HealthKit][StepSamples]   End ISO:  ', options.endDate);

        // Step 4: Fetch fine-grained step samples
        // react-native-health: getDailyStepCountSamples without period gives raw samples
        if (typeof AppleHealthKit.getDailyStepCountSamples !== 'function') {
          console.error('[HealthKit][StepSamples] getDailyStepCountSamples is not available');
          resolve([]);
          return;
        }

        AppleHealthKit.getDailyStepCountSamples(options, (stepErr: any, results: any[]) => {
          if (stepErr) {
            console.error('[HealthKit][StepSamples] getDailyStepCountSamples error:', stepErr);
            resolve([]);
            return;
          }

          if (!results || results.length === 0) {
            console.warn('[HealthKit][StepSamples] No step samples available');
            resolve([]);
            return;
          }

          console.log('[HealthKit][StepSamples] Raw samples fetched:', results.length, 'samples');

          // Normalize shape
          const mapped = results.map((item: any) => ({
            startISO: item.startDate,
            endISO: item.endDate,
            value: Number(item.value || 0),
          }));

          // Log first 20 samples for debugging
          console.log('[HealthKit][StepSamples] sample[0..20]:', mapped.slice(0, 20));

          resolve(mapped);
        });
      });
    });
  });
}
