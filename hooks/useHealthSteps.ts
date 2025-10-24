import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { checkStepsAuthorized, getRecentSteps, StepPoint } from '../lib/modules/health/healthkit';

export type HealthStepsState =
  | 'idle'       // 初始状态
  | 'checking'   // 正在检查授权
  | 'loading'    // 正在加载数据
  | 'ready'      // 数据已就绪
  | 'empty'      // 无数据（已授权但无步数记录）
  | 'denied'     // 权限被拒绝
  | 'error';     // 发生错误

export interface UseHealthStepsResult {
  state: HealthStepsState;
  steps: StepPoint[];
  error: string | null;
  refresh: () => Promise<void>;
  isAuthorized: boolean;
}

/**
 * useHealthSteps Hook
 * 管理 HealthKit 步数数据的获取和状态
 *
 * 状态机流程：
 * idle -> checking -> (loading -> ready/empty) | denied
 *
 * Android 安全兜底：直接返回 denied 状态，不会崩溃
 */
export function useHealthSteps(days = 14): UseHealthStepsResult {
  const [state, setState] = useState<HealthStepsState>('idle');
  const [steps, setSteps] = useState<StepPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const loadStepsData = useCallback(async () => {
    // Android 安全兜底
    if (Platform.OS !== 'ios') {
      console.log('[useHealthSteps] Android platform - HealthKit only available on iOS');
      setState('denied');
      setError('HealthKit is only available on iOS devices');
      return;
    }

    setState('checking');
    setError(null);

    try {
      // 检查授权状态
      console.log('[useHealthSteps] Checking steps authorization...');
      const authorized = await checkStepsAuthorized();
      setIsAuthorized(authorized);

      if (!authorized) {
        console.log('[useHealthSteps] Steps authorization denied');
        setState('denied');
        return;
      }

      // 已授权，开始加载数据
      console.log('[useHealthSteps] Authorization granted, loading steps data...');
      setState('loading');

      const stepsData = await getRecentSteps(days);

      if (!stepsData || stepsData.length === 0) {
        console.log('[useHealthSteps] No steps data found');
        setState('empty');
        setSteps([]);
      } else {
        console.log('[useHealthSteps] Steps data loaded successfully:', stepsData.length, 'days');
        setState('ready');
        setSteps(stepsData);
      }
    } catch (err: any) {
      console.error('[useHealthSteps] Error loading steps data:', err);
      setState('error');
      setError(err?.message || 'Failed to load steps data');
      setSteps([]);
    }
  }, [days]);

  // 首次加载
  useEffect(() => {
    loadStepsData();
  }, [loadStepsData]);

  // 手动刷新方法
  const refresh = useCallback(async () => {
    console.log('[useHealthSteps] Manual refresh triggered');
    await loadStepsData();
  }, [loadStepsData]);

  return {
    state,
    steps,
    error,
    refresh,
    isAuthorized,
  };
}
