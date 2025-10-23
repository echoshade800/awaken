# HealthKit 集成指南

本应用已经完全集成 Apple HealthKit，可以真实获取 iPhone 的健康数据，包括睡眠和步数信息。

## ✅ 已完成配置

所有必要的 HealthKit 配置已经完成，包括：

1. **Info.plist 配置** - 已添加 HealthKit 权限说明和设备要求
2. **Entitlements 配置** - 已启用 HealthKit capability
3. **Xcode 项目配置** - 已正确引用 entitlements 文件
4. **代码实现** - 已集成 `react-native-health` SDK

## 权限请求说明

应用会请求以下 HealthKit 权限：
- **读取**：睡眠分析、步数
- **写入**：无（仅读取访问）

用户授权后，应用将能够：
- 读取最近 30 天的睡眠数据
- 读取步数数据用于睡眠推断
- 自动同步健康数据到应用

## Features

✅ **Automatic Sleep Data Sync** - Fetches sleep data from HealthKit automatically
✅ **Manual Sync Button** - Sync on-demand with the "Sync HealthKit" button
✅ **Permission Management** - Handles HealthKit permissions gracefully
✅ **Demo Data Fallback** - Uses demo data when HealthKit is unavailable
✅ **Smart Data Merging** - Replaces demo data with real data automatically

## How It Works

### On App Launch
1. App checks for HealthKit permission
2. If granted, automatically syncs last 30 days of sleep data
3. If not granted, shows demo data for demonstration

### Manual Sync
1. Tap the "🔄 Sync HealthKit" button in the Sleep tab
2. If permission not granted, you'll be prompted to allow access
3. App fetches and displays your real sleep data from HealthKit

### Data Sources
- **HealthKit**: Real sleep data from iOS Health app (source: 'healthkit')
- **Manual**: Sleep sessions you add manually (source: 'manual')
- **Demo**: Sample data for demonstration (source: 'demo', auto-removed when real data exists)

## Permissions Required

The app requests these HealthKit permissions:
- **Read**: Sleep Analysis, Steps
- **Write**: None (read-only access)

### Privacy
Your health data is:
- Stored only on your device
- Never sent to external servers
- Used only for calculating sleep metrics and insights

## iOS 配置详情

### 已配置文件清单

1. ✅ **`app.json`** - 添加了 HealthKit iOS 配置
   ```json
   {
     "ios": {
       "infoPlist": {
         "NSHealthShareUsageDescription": "...",
         "UIRequiredDeviceCapabilities": ["healthkit"]
       },
       "entitlements": {
         "com.apple.developer.healthkit": true
       }
     }
   }
   ```

2. ✅ **`ios/boltexponativewind/Info.plist`** - 添加了完整的权限说明
   - NSHealthShareUsageDescription（中文说明）
   - NSHealthUpdateUsageDescription（中文说明）
   - UIRequiredDeviceCapabilities 包含 "healthkit"

3. ✅ **`ios/boltexponativewind/boltexponativewind.entitlements`** - 启用 HealthKit capability
   ```xml
   <key>com.apple.developer.healthkit</key>
   <true/>
   ```

4. ✅ **`ios/boltexponativewind.xcodeproj/project.pbxproj`** - 正确引用 entitlements 文件
   - CODE_SIGN_ENTITLEMENTS 已配置在 Debug 和 Release 构建中

5. ✅ **`lib/healthPermissions.js`** - 集成 `react-native-health` SDK
6. ✅ **`lib/store.js`** - 添加同步函数

### 在真机上构建和测试

```bash
# 1. 安装依赖（如需要）
cd ios && pod install && cd ..

# 2. 构建 iOS bundle
npm run build:ios

# 3. 在 Xcode 中打开项目
open ios/boltexponativewind.xcworkspace

# 4. 在真实 iOS 设备上运行（HealthKit 在模拟器中不可用）
# 在 Xcode 中选择你的设备，然后点击 Run
```

### 重要提示

⚠️ **HealthKit 只能在真实 iOS 设备上工作**
- 模拟器不支持 HealthKit
- 必须使用真实的 iPhone 或 iPad 进行测试
- 确保设备上的"健康"应用中有睡眠数据

## 测试指南

### 在真实 iOS 设备上测试

1. **确保健康数据存在**
   - 打开 iPhone 的"健康"应用
   - 确认有睡眠数据记录
   - 建议至少有几天的睡眠记录

2. **运行应用**
   - 在 Xcode 中连接你的 iPhone
   - 选择你的设备作为运行目标
   - 点击 Run（或按 ⌘R）

3. **授权 HealthKit 权限**
   - 首次运行时，应用会请求 HealthKit 权限
   - 点击"允许"授予读取权限
   - 应用将自动同步你的睡眠数据

4. **查看真实数据**
   - 进入"睡眠"标签页
   - 你将看到从 HealthKit 同步的真实睡眠数据
   - 可以点击"🔄 同步 HealthKit"按钮手动刷新

### 在模拟器或 Web 上
- 应用会使用演示数据（HealthKit 不可用）
- 所有功能正常工作，使用样本数据

## Data Format

Sleep sessions are stored with this structure:
```javascript
{
  id: "healthkit-2025-10-23T06:30:00.000Z",
  date: "2025-10-23",
  bedtimeISO: "2025-10-22T22:30:00.000Z",
  waketimeISO: "2025-10-23T06:30:00.000Z",
  durationMin: 480,
  source: "healthkit"
}
```

## 故障排除

### "HealthKit 权限被拒绝"
**解决方法：**
- 打开 iPhone 的"设置"应用
- 进入：隐私与安全性 > 健康 > [你的应用名称]
- 启用"睡眠分析"权限

### "未找到数据"
**可能原因：**
- 健康应用中没有睡眠数据
- 睡眠数据不在最近 30 天内
- HealthKit 权限未授予

**解决方法：**
- 确认"健康"应用中有睡眠记录
- 检查权限设置
- 尝试手动同步

### "数据未更新"
**解决方法：**
- 点击"🔄 同步 HealthKit"按钮手动刷新
- 应用启动时会自动同步
- 检查网络连接和应用权限

### "应用无法在模拟器中运行"
**这是正常的！**
- HealthKit 不支持 iOS 模拟器
- 必须使用真实设备进行测试
- 在真机上构建和运行应用

## Implementation Details

### Sleep Data Processing
1. Fetches raw sleep samples from HealthKit
2. Filters for "ASLEEP" state (ignores "IN_BED")
3. Merges overlapping sessions within 30 minutes
4. Filters out sessions shorter than 1 hour
5. Converts to app's data format
6. Stores locally with AsyncStorage

### Sync Strategy
- **Initial Load**: Syncs on app launch if permission granted
- **Manual Sync**: User-triggered via button
- **Smart Replace**: Removes old HealthKit data before adding fresh data
- **Demo Data**: Automatically removed when real data is synced

## Future Enhancements

Potential improvements:
- Background sync with HealthKit observers
- Step count integration for sleep inference
- Heart rate data for sleep quality analysis
- Export sleep data to other formats
- Weekly/monthly sleep reports
