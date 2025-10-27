import { Platform } from 'react-native';
import AppleHealthKit from './healthkitBridge';

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
  if (Platform.OS !== 'ios') {
    console.log('[HealthKit] Not iOS platform, returning empty steps');
    return [];
  }

  if (!AppleHealthKit) {
    console.error('[HealthKit] AppleHealthKit module not available');
    throw new Error('HealthKit module not available on this device');
  }

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  console.log('[HealthKit] Fetching steps from', start.toISOString(), 'to', end.toISOString());

  return new Promise((resolve, reject) => {
    const options = {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      includeManuallyAdded: false, // 不包括手动添加的步数
      period: 60 * 24, // 按天聚合（分钟数）
      ascending: true,
    };

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
