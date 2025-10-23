# HealthKit 真实权限配置说明

## ✅ 配置状态：已完成

本应用已完全配置好真实的 HealthKit 权限，可以在真实 iPhone 设备上获取健康数据。

## 配置内容

### 1. iOS 原生配置
- ✅ `Info.plist` - 添加了中文权限说明
- ✅ `boltexponativewind.entitlements` - 启用 HealthKit capability
- ✅ Xcode 项目 - 正确引用 entitlements 文件

### 2. 应用配置
- ✅ `app.json` - iOS HealthKit 配置
- ✅ `healthPermissions.js` - 集成 react-native-health SDK
- ✅ 权限请求流程 - 自动请求和处理权限

## 权限说明

应用会请求访问以下健康数据：
- **睡眠分析** - 读取你的睡眠记录
- **步数** - 用于推断睡眠模式

所有数据仅在设备本地处理，不会上传到服务器。

## 如何测试

1. **在 Xcode 中打开项目**
   ```bash
   cd ios
   open boltexponativewind.xcworkspace
   ```

2. **连接真实 iPhone**
   - 使用数据线连接你的 iPhone
   - 在 Xcode 中选择你的设备

3. **运行应用**
   - 点击 Run 按钮（⌘R）
   - 首次运行会请求 HealthKit 权限
   - 授权后即可查看真实健康数据

## 重要提示

⚠️ **HealthKit 只在真实设备上工作**
- iOS 模拟器不支持 HealthKit
- 必须使用真实 iPhone 或 iPad
- 确保设备的"健康"应用中有数据

## 权限管理

如果需要重新授权：
1. 打开 iPhone 设置
2. 进入：隐私与安全性 > 健康 > Awaken
3. 调整权限设置

## 技术细节

查看完整的技术文档：[HEALTHKIT_SETUP.md](./HEALTHKIT_SETUP.md)
