/**
 * HealthKit Bridge Module
 *
 * 统一的 HealthKit 集成模块，用于整个项目中 HealthKit 的导入和使用。
 *
 * 使用方式：
 * ```typescript
 * import AppleHealthKit, { HealthKitPermissions } from '@/lib/modules/health/healthkitBridge';
 *
 * // 初始化 HealthKit
 * AppleHealthKit.initHealthKit(permissions, (err) => {
 *   if (!err) {
 *     // 权限授予成功
 *   }
 * });
 *
 * // 获取步数数据
 * AppleHealthKit.getDailyStepCountSamples(options, (err, results) => {
 *   // 处理结果
 * });
 * ```
 */

import { Platform, NativeModules } from 'react-native';
import BrokenHealthKit from 'react-native-health';

// 导出权限常量供外部使用
export { HealthKitPermissions } from 'react-native-health';
export type { HealthInputOptions, HealthValue, HealthKitPermissions as HealthKitPermissionsType } from 'react-native-health';

/**
 * 统一的 AppleHealthKit 对象
 *
 * 特点：
 * 1. 兼容当前 react-native-health 库的集成方式
 * 2. 安全处理 NativeModules 不存在的情况
 * 3. 包含 Constants 属性，用于权限配置
 * 4. 如果 HealthKit 不可用，返回空对象但不会崩溃
 */
let AppleHealthKit: any = {};

// 只在 iOS 平台上初始化 HealthKit
if (Platform.OS === 'ios') {
  try {
    // 从 NativeModules 获取原生模块
    const NativeHealthKit = NativeModules.AppleHealthKit;

    if (NativeHealthKit) {
      // 使用 NativeModules 的 AppleHealthKit
      AppleHealthKit = NativeHealthKit;

      // 添加 Constants 属性（从 react-native-health 包中获取）
      if (BrokenHealthKit && BrokenHealthKit.Constants) {
        AppleHealthKit.Constants = BrokenHealthKit.Constants;
      }

      console.log('[HealthKitBridge] AppleHealthKit initialized successfully with Constants');
    } else {
      // NativeModules 中不存在 AppleHealthKit，使用空对象
      console.warn('[HealthKitBridge] AppleHealthKit not found in NativeModules');
      AppleHealthKit = {
        Constants: BrokenHealthKit?.Constants || {},
        isAvailable: (callback: (err: any, available: boolean) => void) => {
          callback(new Error('HealthKit not available'), false);
        },
      };
    }
  } catch (error) {
    console.error('[HealthKitBridge] Error initializing HealthKit:', error);
    // 提供安全的空对象
    AppleHealthKit = {
      Constants: {},
      isAvailable: (callback: (err: any, available: boolean) => void) => {
        callback(error, false);
      },
    };
  }
} else {
  // 非 iOS 平台，提供空对象
  console.log('[HealthKitBridge] Not on iOS platform, HealthKit not available');
  AppleHealthKit = {
    Constants: {},
    isAvailable: (callback: (err: any, available: boolean) => void) => {
      callback(new Error('HealthKit only available on iOS'), false);
    },
  };
}

/**
 * 检查 HealthKit 是否可用
 *
 * @returns {boolean} HealthKit 是否可用
 */
export function isHealthKitAvailable(): boolean {
  return Platform.OS === 'ios' && !!NativeModules.AppleHealthKit;
}

/**
 * 获取 HealthKit 权限常量
 * 安全地返回权限常量，即使 HealthKit 不可用也不会报错
 */
export function getPermissionsConstants() {
  if (AppleHealthKit.Constants) {
    return AppleHealthKit.Constants;
  }

  // 返回空的权限对象，避免访问 undefined
  return {
    Permissions: {},
    AuthorizationStatus: {},
  };
}

// 默认导出 AppleHealthKit 对象
export default AppleHealthKit;
