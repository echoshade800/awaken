# HealthKit Bridge 统一集成

本文档说明项目中 HealthKit 的统一集成方式。

## 概述

为了避免在多个文件中重复 HealthKit 的导入和初始化逻辑，我们创建了一个统一的 HealthKit bridge 模块。

## 核心模块

### `lib/modules/health/healthkitBridge.ts`

这是项目中唯一处理 HealthKit 原生模块导入的地方。

**特点：**
1. 兼容 `react-native-health` 库的集成方式
2. 安全处理 NativeModules 不存在的情况
3. 包含 Constants 属性，用于权限配置
4. 如果 HealthKit 不可用，返回空对象但不会崩溃
5. 只在 iOS 平台上初始化 HealthKit

**导出内容：**
- `AppleHealthKit` (default export) - 原生 HealthKit 模块对象
- `HealthKitPermissions` - 权限常量类型
- `isHealthKitAvailable()` - 检查 HealthKit 是否可用
- `getPermissionsConstants()` - 获取权限常量

## 使用方式

### 基本导入

```typescript
// 导入 AppleHealthKit 对象
import AppleHealthKit from '@/lib/modules/health/healthkitBridge';

// 或使用相对路径
import AppleHealthKit from '../../lib/modules/health/healthkitBridge';
```

### 导入权限常量

```typescript
import AppleHealthKit, { HealthKitPermissions, getPermissionsConstants } from '@/lib/modules/health/healthkitBridge';

const Constants = getPermissionsConstants();
```

### 检查 HealthKit 可用性

```typescript
import { isHealthKitAvailable } from '@/lib/modules/health/healthkitBridge';

if (isHealthKitAvailable()) {
  // HealthKit 可用
}
```

### 完整示例

```typescript
import AppleHealthKit, { getPermissionsConstants } from '@/lib/modules/health/healthkitBridge';

const Constants = getPermissionsConstants();

// 配置权限
const permissions = {
  permissions: {
    read: [
      Constants.Permissions.Steps,
      Constants.Permissions.SleepAnalysis,
    ],
    write: [],
  },
};

// 初始化 HealthKit
AppleHealthKit.initHealthKit(permissions, (err) => {
  if (err) {
    console.error('HealthKit 初始化失败:', err);
    return;
  }
  console.log('HealthKit 初始化成功');
});

// 获取步数数据
const options = {
  startDate: new Date().toISOString(),
  endDate: new Date().toISOString(),
  period: 60 * 24, // 按天聚合
  ascending: true,
};

AppleHealthKit.getDailyStepCountSamples(options, (err, results) => {
  if (err) {
    console.error('获取步数失败:', err);
    return;
  }
  console.log('步数数据:', results);
});
```

## 已更新的文件

以下文件已更新为使用统一的 HealthKit bridge：

1. **app/onboarding/welcome.jsx** - 欢迎页面，包含 HealthKit 测试按钮
2. **lib/modules/health/healthkit.ts** - TypeScript HealthKit 工具函数
3. **lib/modules/health/healthkit.js** - JavaScript HealthKit 工具函数
4. **lib/healthPermissions.js** - HealthKit 权限管理

## 路径别名配置

项目已配置路径别名 `@/`，可以从项目根目录导入模块：

```typescript
// 这两种导入方式等效
import AppleHealthKit from '@/lib/modules/health/healthkitBridge';
import AppleHealthKit from '../../lib/modules/health/healthkitBridge';
```

配置文件：
- `tsconfig.json` - TypeScript 路径映射
- `babel.config.js` - Babel 模块解析器配置

## 测试方式

### 1. 欢迎页面测试

在欢迎页面（`app/onboarding/welcome.jsx`）有一个 "Test HealthKit Steps" 按钮：

- 点击按钮会自动请求 HealthKit 权限
- 获取最近 7 天的步数数据
- 显示测试结果和统计信息

### 2. Sleep 页面测试

Sleep 页面会自动使用 HealthKit 数据：

- 启动时检查 HealthKit 权限
- 如果已授权，从 HealthKit 同步睡眠数据
- 在图表中显示睡眠分析

## 安全性和兼容性

1. **平台检查** - 只在 iOS 平台上尝试访问 HealthKit
2. **模块检查** - 在使用前检查 AppleHealthKit 是否存在
3. **权限检查** - 在数据访问前检查权限状态
4. **错误处理** - 所有 HealthKit 调用都有完善的错误处理
5. **空对象保护** - 如果 HealthKit 不可用，返回安全的空对象

## 权限说明

### Bundle ID 共享

`awaken` 应用与壳应用共用同一个 Bundle ID，因此：

- HealthKit 权限在系统层面已开启
- 不需要重复授权
- 读取权限状态即可

### 权限类型

当前配置的权限：

```typescript
{
  permissions: {
    read: [
      Constants.Permissions.Steps,        // 步数
      Constants.Permissions.SleepAnalysis, // 睡眠分析
    ],
    write: [],
  },
}
```

## 故障排除

### HealthKit 不可用

如果 `isHealthKitAvailable()` 返回 `false`：

1. 检查是否在 iOS 设备或模拟器上运行
2. 确认 `react-native-health` 已正确安装
3. 检查 Xcode 项目配置中是否启用了 HealthKit capability

### 权限被拒绝

如果权限被拒绝：

1. 在 iOS 设置中检查应用的 HealthKit 权限
2. 重新请求权限（调用 `initHealthKit`）
3. 引导用户手动开启权限

### 数据为空

如果 HealthKit 返回空数据：

1. 检查设备上是否有健康数据
2. 确认日期范围设置正确
3. 验证权限已授予
4. 检查数据类型是否正确（如 Steps, SleepAnalysis）

## 维护建议

1. **不要修改 bridge 模块** - 除非需要添加新的通用功能
2. **统一导入** - 所有新代码都应从 bridge 导入 HealthKit
3. **错误日志** - 保持完善的错误日志，便于调试
4. **类型安全** - 尽可能使用 TypeScript 类型定义

## 未来扩展

如需添加更多 HealthKit 功能：

1. 在 `healthkitBridge.ts` 中添加新的导出函数
2. 更新权限配置以包含新的数据类型
3. 在相关模块中使用新功能
4. 更新本文档
