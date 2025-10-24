# HealthKit 真实步数集成实施文档

## 概述

本次改造实现了在 iOS 上直接读取 HealthKit 的真实步数数据，并替换 Sleep 页的 demo 数据。已授权用户在 Onboarding 时会自动跳过"获取步数权限"步骤。

## 实施内容

### 1. 新增模块

#### `lib/modules/health/healthkit.ts`
新的 HealthKit 封装模块，提供：
- `checkStepsAuthorized(): Promise<boolean>` - 检查步数授权状态（不弹窗）
- `getRecentSteps(days = 14): Promise<StepPoint[]>` - 获取最近 N 天的每日步数

**关键特性：**
- 仅在 iOS 平台调用 `react-native-health`
- 在已授权情况下不会重复弹出系统授权窗
- `includeManuallyAdded: false` - 不包括手动添加的步数
- 按天聚合步数数据，返回 `{date: 'YYYY-MM-DD', value: number}[]` 格式

#### `hooks/useHealthSteps.ts`
新的 React Hook，管理 HealthKit 步数数据的获取和状态。

**状态机：**
- `idle` - 初始状态
- `checking` - 正在检查授权
- `loading` - 正在加载数据
- `ready` - 数据已就绪
- `empty` - 无数据（已授权但无步数记录）
- `denied` - 权限被拒绝
- `error` - 发生错误

**暴露接口：**
```typescript
{
  state: HealthStepsState;
  steps: StepPoint[];
  error: string | null;
  refresh: () => Promise<void>;
  isAuthorized: boolean;
}
```

### 2. 更新现有组件

#### Sleep 页面 (`app/(tabs)/sleep.jsx`)
**主要改动：**
- 集成 `useHealthSteps` hook
- 优先使用真实 HealthKit 步数数据
- **移除 demo 数据 fallback** - 不再使用 `insertDemoSleepData()`
- 根据 `useHealthSteps` 状态显示不同提示信息：
  - `denied` - 显示权限设置指引
  - `empty` - 显示"最近没有步数数据"
  - `error` - 显示错误信息与重试按钮
  - Android - 显示"HealthKit 功能仅支持 iOS 设备"

**数据加载逻辑：**
1. 检查是否已有真实睡眠数据，有则直接显示
2. 检查 `useHealthSteps` 状态
3. 如果有步数数据 (`ready`)，同步睡眠会话
4. 如果权限被拒绝或无数据，显示相应状态（**不使用 demo**）

#### Onboarding 步骤 (`app/onboarding/step-permission.jsx`)
**自动跳过逻辑：**
- 组件 `mount` 时调用 `checkStepsAuthorized()`
- 如果返回 `true`，**自动跳过该步骤**，直接进入下一步
- 如果返回 `false`，显示原有的权限请求 UI

**代码注释说明：**
```javascript
// 组件 mount 时自动检查权限，如果已授权则自动跳过
// 注意：授权是"系统按 Bundle ID"，awaken 与壳 app 共用同一权限
// 因此只需读取系统状态并跳过 UI 卡点
```

### 3. Android 安全兜底

**实现方式：**
- `healthkit.ts` 中：`Platform.OS !== 'ios'` 时返回空数组或 `false`
- `useHealthSteps` 中：Android 平台直接进入 `denied` 状态，并设置错误信息
- Sleep 页面：Android 平台显示"HealthKit 功能仅支持 iOS 设备"

**日志输出：**
- `[HealthKit] Not iOS platform, steps authorization unavailable`
- `[useHealthSteps] Android platform - HealthKit only available on iOS`

### 4. 日志与可观测性

**关键日志点：**
- 授权检测结果：`[HealthKit] Steps authorization status: granted/denied`
- 步数拉取：`[HealthKit] Steps fetched successfully: N days, from YYYY-MM-DD to YYYY-MM-DD`
- 总步数：`[HealthKit] Total steps: XXXXX`
- Hook 状态：`[useHealthSteps] Steps data loaded successfully: N days`
- 自动跳过：`[StepPermission] Already authorized - auto-skipping this step`

## 验收用例

### iOS - 已授权场景
✅ **测试步骤：**
1. 在 iPhone 的"设置 → 隐私与安全性 → 健康 → MonsterAI"中确保"步数"读取已开启
2. 打开 awaken 应用，进入 Onboarding 流程
3. **预期结果：** "获取步数权限"步骤被自动跳过，不显示该页面
4. 进入 Sleep 页面
5. **预期结果：** 显示最近 14 天的真实步数推断的睡眠数据，不出现 demo 数据
6. 查看数据来源标识
7. **预期结果：** 显示"🔍 从步数推断的睡眠数据"或"📊 来自 HealthKit 的真实数据"

### iOS - 未授权场景
✅ **测试步骤：**
1. 在 iPhone 的"设置 → 隐私与安全性 → 健康 → MonsterAI"中关闭"步数"读取权限
2. 打开 awaken 应用，进入 Onboarding 流程
3. **预期结果：** 显示"获取步数权限"页面（不自动跳过）
4. 进入 Sleep 页面
5. **预期结果：** 显示权限提示："⚠️ 请在 设置→隐私与安全性→健康→应用 中为本应用打开'步数'读取权限"
6. 点击"重试刷新"按钮
7. **预期结果：** 重新检查权限状态，如果仍未授权则继续显示提示

### iOS - 已授权但无步数数据
✅ **测试步骤：**
1. 确保 HealthKit 权限已开启
2. 清空最近 14 天的步数数据（或使用新设备）
3. 打开 awaken 应用
4. **预期结果：** 显示"⚠️ 最近没有步数数据。请随身携带 iPhone 记录步数，然后再次同步。"
5. **预期结果：** 不显示 demo 数据

### Android 场景
✅ **测试步骤：**
1. 在 Android 设备上构建并运行应用
2. **预期结果：** 应用不崩溃
3. 进入 Sleep 页面
4. **预期结果：** 显示"📱 HealthKit 功能仅支持 iOS 设备"
5. **预期结果：** 不显示 demo 数据，不尝试访问 HealthKit API

## 技术细节

### 依赖检查
- ✅ `react-native-health: ^1.19.0` 已在 package.json 中
- ✅ iOS HealthKit entitlements 已配置在 `ios/boltexponativewind/boltexponativewind.entitlements`
- ✅ Info.plist 中 `NSHealthShareUsageDescription` 已设置

### 权限说明
```xml
<key>NSHealthShareUsageDescription</key>
<string>We read step counts to infer past sleep and personalize your rhythm.</string>
```

### 幂等性
所有新增文件和修改都按幂等方式实现，可安全重复执行：
- 新模块使用独立路径，不影响现有代码
- 现有组件通过新增导入和逻辑扩展，保留原有功能
- 错误处理健壮，不会因权限问题导致崩溃

## 注意事项

1. **不需要手动构建：** 项目已包含 `react-native-health` 依赖，使用 Dev Client 或 TestFlight 构建时会自动包含
2. **Bundle ID 共享：** awaken mini-app 与壳 app 共用同一 Bundle ID，因此 HealthKit 权限是共享的
3. **不弹窗设计：** `checkStepsAuthorized()` 在已授权情况下不会重复弹出系统授权窗
4. **数据来源：** 步数数据通过 `getDailyStepCountSamples` API 获取，按天聚合，不包括手动添加
5. **睡眠推断：** 从步数推断睡眠会话使用现有的 `inferSleepFromSteps` 逻辑

## 代码示例

### 使用新的 healthkit 模块
```typescript
import { checkStepsAuthorized, getRecentSteps } from '../lib/modules/health/healthkit';

// 检查授权（不弹窗）
const isAuthorized = await checkStepsAuthorized();

// 获取 14 天步数
const steps = await getRecentSteps(14);
// 返回: [{date: '2025-10-10', value: 8532}, ...]
```

### 使用 useHealthSteps Hook
```typescript
import { useHealthSteps } from '../hooks/useHealthSteps';

function MyComponent() {
  const { state, steps, error, refresh, isAuthorized } = useHealthSteps(14);

  if (state === 'denied') {
    return <Text>请授予步数读取权限</Text>;
  }

  if (state === 'ready') {
    return <Text>已加载 {steps.length} 天的步数数据</Text>;
  }

  // ...
}
```

## 构建说明

开发者下次构建时（Dev Client / TestFlight / Adhoc）会自动包含 HealthKit 支持。无需额外配置。

如需在本地测试：
```bash
npm run ios
# 或
npm run build:ios
sh deploy_ios.sh
```

---

**实施完成时间：** 2025-10-24
**技术栈：** React Native / Expo / TypeScript / HealthKit
**测试状态：** TypeScript 编译通过 ✅
