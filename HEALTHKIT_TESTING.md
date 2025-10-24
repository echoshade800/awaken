# HealthKit 集成测试指南

## 🏥 HealthKit 集成已完成

您的应用现在已经集成了真实的 HealthKit 功能，可以获取用户的真实步数数据并推理睡眠模式。

## 📱 测试要求

**重要：HealthKit 只能在真实的 iOS 设备上测试，不支持模拟器。**

### 设备要求
- iOS 8.0+ 的真实 iPhone 或 iPad
- 已登录 Apple ID
- 健康应用已设置

### 开发者要求
- Apple Developer 账户
- 在 Apple Developer Portal 中为应用启用了 HealthKit 功能

## 🚀 部署和测试步骤

### 1. 构建原生代码
```bash
# 生成原生 iOS 项目
npx expo prebuild

# 安装 iOS 依赖
npx pod-install
```

### 2. 构建开发版本
```bash
# 使用 EAS Build 构建开发版本
eas build --profile development --platform ios

# 或者在 Xcode 中打开项目并构建
open ios/YourApp.xcworkspace
```

### 3. 安装到设备
- 通过 Xcode 直接安装到连接的设备
- 或者下载 EAS Build 构建的 .ipa 文件并安装

## 🧪 测试流程

### 新用户流程测试
1. **启动应用** - 确保是首次使用
2. **完成引导** - Welcome → Sleep Routine → Energy Type → Smart Alarm
3. **创建闹钟** - 设置第一个闹钟
4. **HealthKit 授权** - 应该自动跳转到权限页面
5. **授权步骤**:
   - 点击 "Grant Permission" 按钮
   - iOS 系统会弹出 HealthKit 权限对话框
   - 确保 "Steps" 权限被授予
6. **数据初始化** - 应用会分析最近 14 天的步数数据
7. **进入主界面** - 查看生成的睡眠数据和节律曲线

### Sleep 页面测试
1. **有数据状态** - 如果有足够的步数数据，应显示睡眠图表
2. **数据不足状态** - 如果数据不足，显示相应提示
3. **无权限状态** - 如果用户拒绝权限，显示权限请求界面
4. **同步功能** - 点击 "Sync HealthKit" 按钮测试数据同步

## 📊 预期行为

### HealthKit 权限授权后
- 应用会获取过去 14 天的真实步数数据
- 根据步数模式推理睡眠时间段
- 生成个性化的睡眠需求和睡眠债务
- 在 Sleep 页面显示真实的睡眠分析图表

### 数据显示
- **Sleep Times 图表** - 显示最近几天的睡眠时间段
- **Sleep Debt 图表** - 显示睡眠债务趋势
- **睡眠记录列表** - 显示详细的睡眠时间记录

## 🐛 故障排除

### 权限被拒绝
- 进入 iOS 设置 → 隐私与安全 → 健康 → 您的应用
- 确保 "Steps" 权限被启用

### 没有数据显示
- 确保设备上有足够的步数数据（至少 3-4 天）
- 检查健康应用是否有步数记录
- 尝试点击 "Sync HealthKit" 重新同步

### 权限检查失败
- 确保应用在真实设备上运行
- 检查 Apple Developer Portal 中是否启用了 HealthKit
- 确保应用的 Bundle ID 与开发者账户匹配

## 📝 日志调试

在 Xcode 或 Metro 日志中查找以下日志：
```
[HealthPermissions] checkStepPermission called
[HealthKit] Initialized successfully
[HealthKit] Fetched step data: X daily samples
[Sleep] HealthKit permission: granted
```

## 🎯 成功标志

✅ 用户可以成功授权 HealthKit 权限  
✅ 应用获取到真实的步数数据  
✅ Sleep 页面显示基于真实数据的睡眠分析  
✅ 睡眠推理算法正确识别睡眠时间段  
✅ 数据同步功能正常工作  

---

**注意**: 模拟器测试只会显示模拟数据，要测试真实 HealthKit 功能必须使用真实设备。
