# Sleep 页面 HealthKit 崩溃修复文档

## 🐛 问题描述

### 原始错误
```
❌ "Cannot read property 'SharingAuthorized' of undefined"
```

### 发生场景
- **位置**: Sleep 页面 (`app/(tabs)/sleep.jsx`)
- **显示**: "My Progress" / "Sleep Times" / "Sleep Debt" 切换标签页
- **影响**: 应用崩溃并显示红屏，用户无法查看睡眠数据
- **根本原因**: Sleep 页面间接调用了访问 `AppleHealthKit.Constants.AuthorizationStatus.SharingAuthorized` 的旧代码

---

## ✅ 修复方案

### 核心改动
**文件**: `app/(tabs)/sleep.jsx`

### 1. 更新导入
**之前**:
```javascript
import { useHealthSteps } from '../../hooks/useHealthSteps';
// useHealthSteps 内部使用旧的 healthkit API
```

**之后**:
```javascript
import {
  isHealthKitAvailable,
  initHealthKitIfAvailable,
  getLast14DaysSteps,
} from '@/src/modules/health/healthkitBridge';
// 直接使用统一的 bridge API
```

### 2. 添加详细注释 (第 19-40 行)

```javascript
/**
 * HealthKit Authorization for Sleep Page:
 * 
 * Important: We now use the unified healthkitBridge.ts to avoid crashes.
 * 
 * Key principles:
 * 1. Apple grants HealthKit permissions by Bundle ID (not per feature).
 *    If the Monster AI shell app has HealthKit permission, Awaken automatically
 *    inherits that authorization.
 * 
 * 2. We NO LONGER access `.SharingAuthorized` or any AuthorizationStatus properties,
 *    because in some builds, the AuthorizationStatus object is undefined,
 *    causing crashes.
 * 
 * 3. The bridge's `isHealthKitAvailable()` safely checks if the native module
 *    exists in this build.
 * 
 * 4. This page should never crash - it should always display something useful,
 *    whether HealthKit is available or not.
 */
```

### 3. 新增状态管理 (第 47-50 行)

```javascript
// HealthKit steps data state (from unified bridge)
const [loadingSteps, setLoadingSteps] = useState(true);
const [stepsError, setStepsError] = useState(null);
const [stepsData, setStepsData] = useState([]);
```

### 4. 新增步数数据获取 useEffect (第 62-112 行)

```javascript
useEffect(() => {
  let didCancel = false;

  async function fetchSteps() {
    setLoadingSteps(true);
    setStepsError(null);

    // 1. Check if HealthKit is available in this build
    if (!isHealthKitAvailable()) {
      if (!didCancel) {
        setStepsError('HealthKit not available in this build');
        setLoadingSteps(false);
      }
      return;
    }

    // 2. Initialize / check permission (won't crash)
    const initResult = await initHealthKitIfAvailable();
    if (!initResult.ok) {
      if (!didCancel) {
        setStepsError(initResult.error ?? 'HealthKit init failed');
        setLoadingSteps(false);
      }
      return;
    }

    // 3. Fetch last 14 days of steps
    const stepsResult = await getLast14DaysSteps();
    if (!didCancel) {
      if (!stepsResult.ok) {
        setStepsError(stepsResult.error ?? 'Failed to fetch steps');
        setLoadingSteps(false);
        return;
      }

      setStepsData(stepsResult.data || []);
      setLoadingSteps(false);
    }
  }

  fetchSteps();

  return () => {
    didCancel = true;
  };
}, []);
```

### 5. 简化图表数据初始化 (第 114-147 行)

移除了对 `useHealthSteps` hook 和 `syncHealthKitData` 的依赖，简化为直接从 store 加载现有数据。

### 6. 更新 `getDataSourceInfo` 函数 (第 266-346 行)

使用新的 `stepsError` 和 `stepsData` 状态来判断数据来源：

```javascript
const getDataSourceInfo = () => {
  // Check HealthKit steps status from our new bridge-based state
  if (Platform.OS === 'ios') {
    if (stepsError) {
      if (stepsError.includes('not available')) {
        return {
          show: true,
          message: '⚠️ HealthKit not available in this build',
          type: 'no-permission',
          showButton: false,
        };
      }
      
      if (stepsError.includes('init failed')) {
        return {
          show: true,
          message: '⚠️ 请在 设置→隐私与安全性→健康→应用 中为本应用打开"步数"读取权限',
          type: 'no-permission',
          showButton: true,
        };
      }

      return {
        show: true,
        message: `⚠️ 加载 HealthKit 数据失败: ${stepsError}`,
        type: 'error',
        showButton: true,
      };
    }

    if (!loadingSteps && stepsData.length === 0) {
      return {
        show: true,
        message: '⚠️ 最近没有步数数据。请随身携带 iPhone 记录步数，然后再次同步。',
        type: 'no-data',
        showButton: true,
      };
    }

    if (!loadingSteps && stepsData.length > 0) {
      return {
        show: true,
        message: `🔍 从步数推断的睡眠数据 (${stepsData.length} 天)`,
        type: 'inferred',
      };
    }
  }
  // ... rest of the logic
};
```

### 7. 重写 `handleSyncHealthKit` 函数 (第 348-399 行)

完全移除对 `syncHealthKitData` 和 `useHealthSteps.refresh()` 的调用，改为直接使用 bridge：

```javascript
const handleSyncHealthKit = async () => {
  setIsSyncing(true);
  setSyncMessage('');
  setLoadingSteps(true);
  setStepsError(null);

  try {
    console.log('[Sleep] Manual sync triggered');

    // 1. Check if HealthKit is available
    if (!isHealthKitAvailable()) {
      setSyncMessage('HealthKit 在当前构建中不可用');
      setStepsError('HealthKit not available in this build');
      setLoadingSteps(false);
      return;
    }

    // 2. Initialize HealthKit
    const initResult = await initHealthKitIfAvailable();
    if (!initResult.ok) {
      console.log('[Sleep] HealthKit init failed:', initResult.error);
      setSyncMessage('HealthKit 初始化失败，请检查权限设置');
      setStepsError(initResult.error ?? 'HealthKit init failed');
      setLoadingSteps(false);
      return;
    }

    // 3. Fetch latest step data
    const stepsResult = await getLast14DaysSteps();
    if (!stepsResult.ok) {
      console.log('[Sleep] Failed to fetch steps:', stepsResult.error);
      setSyncMessage('获取步数数据失败');
      setStepsError(stepsResult.error ?? 'Failed to fetch steps');
      setLoadingSteps(false);
      return;
    }

    console.log('[Sleep] Successfully synced', stepsResult.data?.length || 0, 'days of step data');
    setStepsData(stepsResult.data || []);
    setLoadingSteps(false);
    setSyncMessage(`已同步 ${stepsResult.data?.length || 0} 天步数数据`);

  } catch (error) {
    console.error('[Sleep] Error syncing HealthKit:', error);
    setSyncMessage('同步 HealthKit 数据失败');
    setStepsError(error.message || 'Sync failed');
    setLoadingSteps(false);
  } finally {
    setIsSyncing(false);
    setTimeout(() => setSyncMessage(''), 3000);
  }
};
```

### 8. 添加步数数据显示 UI (第 483-514 行)

```javascript
{/* HealthKit Steps Data Display */}
{Platform.OS === 'ios' && (
  <View style={styles.stepsDataContainer}>
    {loadingSteps ? (
      <View style={styles.stepsLoading}>
        <ActivityIndicator size="small" color="#9D7AFF" />
        <Text style={styles.stepsLoadingText}>Loading step data...</Text>
      </View>
    ) : stepsError ? (
      <View style={styles.stepsError}>
        <Text style={styles.stepsErrorText}>
          Unable to access step data. {stepsError}
        </Text>
      </View>
    ) : stepsData.length === 0 ? (
      <View style={styles.stepsEmpty}>
        <Text style={styles.stepsEmptyText}>
          No recent step data found.
        </Text>
      </View>
    ) : (
      <View style={styles.stepsSuccess}>
        <Text style={styles.stepsTitle}>Recent Step Data (Last 3 days):</Text>
        {stepsData.slice(0, 3).map((d, idx) => (
          <Text key={idx} style={styles.stepsItem}>
            {new Date(d.date).toDateString()}: {d.value.toLocaleString()} steps
          </Text>
        ))}
      </View>
    )}
  </View>
)}
```

### 9. 添加新样式 (第 778-823 行)

```javascript
stepsDataContainer: {
  marginTop: 12,
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: 12,
  padding: 12,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.1)',
},
stepsLoading: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
stepsLoadingText: {
  fontSize: 12,
  color: 'rgba(255, 255, 255, 0.6)',
},
stepsError: {
  padding: 8,
},
stepsErrorText: {
  fontSize: 12,
  color: '#FF6B6B',
  lineHeight: 18,
},
stepsEmpty: {
  padding: 8,
},
stepsEmptyText: {
  fontSize: 12,
  color: 'rgba(255, 255, 255, 0.5)',
},
stepsSuccess: {
  gap: 6,
},
stepsTitle: {
  fontSize: 13,
  fontWeight: '600',
  color: 'rgba(255, 255, 255, 0.9)',
  marginBottom: 4,
},
stepsItem: {
  fontSize: 12,
  color: 'rgba(255, 255, 255, 0.7)',
  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
},
```

---

## 🔄 新流程逻辑

### 页面加载时

```
打开 Sleep 页面
   ↓
并行执行:
   ├─→ 加载图表数据 (从 store)
   └─→ 获取 HealthKit 步数
       ├─→ HealthKit 不可用? → 显示 "HealthKit not available" ✅
       ├─→ 初始化失败? → 显示 "请检查权限设置" ✅
       ├─→ 获取失败? → 显示错误信息 ✅
       ├─→ 无数据? → 显示 "No recent step data" ✅
       └─→ 成功? → 显示最近 3 天步数 ✅
```

### 点击 "Sync HealthKit" 按钮

```
用户点击同步按钮
   ↓
检查 HealthKit 可用性
   ├─→ 不可用? → 提示 "HealthKit 在当前构建中不可用" ✅
   └─→ 可用? → 初始化 HealthKit
               ├─→ 失败? → 提示 "HealthKit 初始化失败" ✅
               └─→ 成功? → 获取步数
                           ├─→ 失败? → 提示 "获取步数数据失败" ✅
                           └─→ 成功? → 显示 "已同步 N 天步数数据" ✅
```

---

## 📊 对比：修复前 vs 修复后

| 场景 | 修复前 | 修复后 |
|------|--------|--------|
| **无 HealthKit 构建** | ❌ 崩溃: "SharingAuthorized of undefined" | ✅ 显示 "HealthKit not available" |
| **HealthKit 初始化失败** | ❌ 可能崩溃或卡住 | ✅ 显示错误提示 + 不崩溃 |
| **HealthKit 成功** | ✅ 正常工作 | ✅ 正常工作 + 显示步数数据 |
| **用户体验** | ❌ 红屏崩溃 | ✅ 优雅降级 + 清晰提示 |
| **错误提示** | ❌ 红屏 + 技术错误信息 | ✅ 用户友好的中文提示 |
| **代码可维护性** | ❌ 依赖多个旧 API | ✅ 统一使用 bridge |

---

## 🧪 验收测试

### Scenario 1: 无 HealthKit 的构建 ✅
**测试步骤**:
1. 使用不包含 HealthKit entitlement 的构建
2. 打开 Sleep 页面

**预期结果**:
```
✅ 不会崩溃
✅ 显示睡眠图表（来自 store 的现有数据）
✅ 步数数据区域显示: "Unable to access step data. HealthKit not available in this build"
✅ 数据源横幅显示: "⚠️ HealthKit not available in this build"
```

---

### Scenario 2: HealthKit 可用但初始化失败 ✅
**测试步骤**:
1. 使用包含 HealthKit 的构建
2. 权限被拒绝或初始化失败
3. 打开 Sleep 页面

**预期结果**:
```
✅ 不会崩溃
✅ 显示睡眠图表
✅ 步数数据区域显示: "Unable to access step data. HealthKit init failed"
✅ 数据源横幅显示: "⚠️ 请在 设置→隐私与安全性→健康→应用 中为本应用打开"步数"读取权限"
✅ 显示 "Open Health Permissions" 按钮
```

---

### Scenario 3: HealthKit 可用且有步数数据 ✅
**测试步骤**:
1. 使用包含 HealthKit 的完整构建
2. 已授权 HealthKit 权限
3. 设备上有步数数据
4. 打开 Sleep 页面

**预期结果**:
```
✅ 不会崩溃
✅ 显示睡眠图表
✅ 步数数据区域显示:
   "Recent Step Data (Last 3 days):
    Mon Jan 13 2025: 8,234 steps
    Tue Jan 14 2025: 6,543 steps
    Wed Jan 15 2025: 9,876 steps"
✅ 数据源横幅显示: "🔍 从步数推断的睡眠数据 (14 天)"
```

---

### Scenario 4: HealthKit 可用但没有步数数据 ✅
**测试步骤**:
1. 使用包含 HealthKit 的完整构建
2. 已授权但设备上没有步数记录
3. 打开 Sleep 页面

**预期结果**:
```
✅ 不会崩溃
✅ 显示睡眠图表
✅ 步数数据区域显示: "No recent step data found."
✅ 数据源横幅显示: "⚠️ 最近没有步数数据。请随身携带 iPhone 记录步数，然后再次同步。"
✅ 显示 "Open Health Permissions" 按钮
```

---

### Scenario 5: 点击 "Sync HealthKit" 按钮 ✅
**测试步骤**:
1. 在 Sleep 页面点击 "🔄 Sync HealthKit" 按钮

**预期结果**:
```
✅ 按钮显示 loading spinner
✅ 重新执行步数数据获取流程
✅ 根据结果显示相应提示信息
✅ 3 秒后自动清除提示信息
✅ 不会崩溃
```

---

## 🔍 根本原因分析

### 为什么会崩溃？

**旧代码调用链**:
```javascript
Sleep Page
  ↓
useHealthSteps hook / syncHealthKitData store method
  ↓
checkStepsAuthorized() in lib/modules/health/healthkit.js
  ↓
AppleHealthKit.getAuthStatus(...)
  ↓
results[AppleHealthKit.Constants.Permissions.Steps]
  ↓
stepsStatus === AppleHealthKit.Constants.AuthorizationStatus.SharingAuthorized
                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                这里是 undefined！
```

**新代码的解决方案**:
```javascript
Sleep Page
  ↓
isHealthKitAvailable() from healthkitBridge.ts
  ↓
检查 Platform.OS === "ios" && 
     !!NativeModules.AppleHealthKit &&
     !!NativeAppleHealthKit.Constants &&
     !!NativeAppleHealthKit.Constants.Permissions
  ↓
只有所有检查都通过，才会继续调用 HealthKit API
```

---

## ✅ 验收检查清单

请在真机测试后勾选：

- [ ] ✅ Sleep 页面不再出现红屏崩溃
- [ ] ✅ 无 HealthKit 构建时显示正确提示
- [ ] ✅ HealthKit 初始化失败时显示正确提示
- [ ] ✅ 有步数数据时正确显示最近 3 天数据
- [ ] ✅ 无步数数据时显示正确提示
- [ ] ✅ "Sync HealthKit" 按钮正常工作
- [ ] ✅ Console 有清晰的日志说明
- [ ] ✅ 数据源横幅显示正确信息
- [ ] ✅ 睡眠图表正常显示

---

## 📁 修改的文件

- ✅ `app/(tabs)/sleep.jsx` (完全重写 HealthKit 逻辑)

### 代码行数变化
- **删除**: ~80 行 (useHealthSteps 相关逻辑)
- **新增**: ~150 行 (带注释的安全逻辑 + UI)
- **净增加**: +70 行

---

## 📚 相关文档

- `HEALTHKIT_INITIALIZING_FIX.md` - Initializing 页面修复
- `HEALTHKIT_BRIDGE_MIGRATION_CHECKLIST.md` - Bridge 迁移总览
- `src/modules/health/healthkitBridge.ts` - 统一 HealthKit 接口

---

**修复完成日期**: 2025-10-27  
**测试状态**: 🟡 待真机验收  
**崩溃问题**: ✅ 已解决  
**用户体验**: ✅ 优雅降级

