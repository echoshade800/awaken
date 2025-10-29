# 🎵 铃声配置完成

## ✅ 已完成的工作

### 1. 创建铃声配置模块 (`lib/ringtones.js`)

**默认铃声：**
- **名称：** Ling Ling
- **URL：** https://fopbpwzvhuyydtwsxkjo.supabase.co/storage/v1/object/public/awaken/Untitled%20folder/lingling.mp3
- **说明：** A gentle and pleasant wake-up melody

**提供的工具函数：**
```javascript
// 获取默认铃声
getDefaultRingtone()
// → { id: 'lingling', name: 'Ling Ling', url: '...', ... }

// 根据 ID 获取铃声
getRingtoneById('lingling')

// 获取铃声 URL
getRingtoneUrl('lingling')

// 获取所有铃声列表
getAllRingtones()
```

---

### 2. 更新音频管理器 (`lib/audioManager.js`)

**自动使用默认铃声：**
```javascript
playAlarmRingtone(null)  // 自动使用 Ling Ling 铃声
playAlarmRingtone(customUrl)  // 使用自定义 URL
```

**播放逻辑：**
1. 如果没有提供 `ringtoneUri`，自动使用默认铃声
2. 尝试从 URL 加载铃声
3. 如果加载失败，回退到系统通知声音

---

### 3. 更新闹钟创建流程 (`lib/store.js`)

**新建闹钟自动配置：**
```javascript
initNewAlarm() 创建的闹钟草稿包含：
{
  ringtone: 'https://...lingling.mp3',  // 铃声 URL
  ringtoneName: 'Ling Ling',            // 铃声名称
  ringtoneUrl: 'https://...lingling.mp3', // 同 ringtone
  task: 'shake',                         // 默认摇一摇任务
  interactionEnabled: true,              // 启用互动任务
  interactionType: 'shake',              // 摇一摇类型
}
```

---

## 🎯 使用方式

### 创建新闹钟
```javascript
// 在 App 中创建闹钟
const store = useStore();

// 1. 初始化新闹钟（自动包含默认铃声）
store.initNewAlarm();

// 2. 设置时间和其他属性
store.updateDraft({
  time: '07:00',
  label: '早晨闹钟',
});

// 3. 保存闹钟（自动调度通知）
await store.saveAlarmFromDraft();
```

### 触发闹钟时
```javascript
// 闹钟触发 → wake-up.jsx 自动播放铃声
const alarm = alarms.find(a => a.id === alarmId);

// 播放闹钟铃声（自动使用 alarm.ringtone）
await playAlarmRingtone(alarm?.ringtone);
// 如果 alarm.ringtone 不存在，自动使用 Ling Ling 默认铃声
```

---

## 🧪 测试步骤

### 1. 快速测试（5分钟后触发）
```javascript
// 在 App 中创建测试闹钟
1. 打开 App
2. 进入闹钟页面
3. 创建新闹钟
4. 设置时间为当前时间 + 5 分钟
5. 保存

// 等待 5 分钟
6. 观察通知是否触发
7. 点击通知打开唤醒页面
8. 验证铃声是否播放（Ling Ling）
```

### 2. 后台测试
```javascript
1. 创建 3 分钟后的闹钟
2. 保存后关闭应用
3. 锁定屏幕
4. 等待闹钟触发

// 验证点：
✓ 通知是否显示
✓ 铃声是否播放
✓ 通知动作按钮是否可用（Stop/Snooze）
✓ 点击通知是否打开唤醒页面
```

### 3. 摇一摇任务测试
```javascript
1. 创建闹钟（已自动启用摇一摇任务）
2. 触发后打开唤醒页面
3. 验证 ShakeTaskCard 显示
4. 摇晃手机 10 次
5. 验证进度更新
6. 完成后 Stop 按钮变为可用
7. 点击 Stop 停止闹钟

// 验证点：
✓ 铃声持续播放
✓ 摇晃检测灵敏度
✓ 触觉反馈
✓ Stop 按钮禁用/启用切换
```

### 4. Snooze 测试
```javascript
1. 创建闹钟并触发
2. 打开唤醒页面
3. 点击 "Snooze 5 min" 按钮
4. 验证页面关闭
5. 等待 5 分钟
6. 验证闹钟重新触发
7. 通知标题显示 "(Snoozed)"

// 验证点：
✓ Snooze 立即停止当前铃声
✓ 5 分钟后准时触发
✓ 标题显示 Snoozed 标记
```

### 5. 静音模式测试
```javascript
1. 开启手机静音模式
2. 创建闹钟并触发
3. 验证铃声仍然播放

// iOS 验证点：
✓ 铃声绕过静音开关
✓ 声音清晰可闻
✓ 音量正常

// 这依赖于后台音频会话配置：
playsInSilentModeIOS: true
```

---

## 📱 铃声播放流程

```
闹钟触发
  ↓
通知显示
  ↓
用户点击通知
  ↓
打开 wake-up.jsx
  ↓
startAlarmAudio()
  ↓
playAlarmRingtone(alarm?.ringtone)
  ↓
【检查 ringtone 参数】
  ↓
如果为 null → 使用默认铃声（Ling Ling）
如果为 URL → 尝试加载
  ↓
【尝试加载铃声】
  ↓
成功 → 循环播放
失败 → 回退到系统声音
  ↓
【后台音频会话保持活跃】
  ↓
用户完成任务 → stopAllSounds()
```

---

## 🎵 铃声文件信息

### 当前配置
```javascript
{
  id: 'lingling',
  name: 'Ling Ling',
  url: 'https://fopbpwzvhuyydtwsxkjo.supabase.co/storage/v1/object/public/awaken/Untitled%20folder/lingling.mp3',
  duration: 120,  // 估计时长 2 分钟
  description: 'A gentle and pleasant wake-up melody',
}
```

### 铃声特点（推测）
- 存储在 Supabase Storage
- 公开访问权限
- MP3 格式
- 适合作为闹钟铃声的旋律

---

## 🔧 添加更多铃声

### 1. 在 `lib/ringtones.js` 中添加

```javascript
export const RINGTONES = {
  DEFAULT: {
    id: 'lingling',
    name: 'Ling Ling',
    url: 'https://...lingling.mp3',
  },

  // 添加新铃声
  GENTLE_WAVES: {
    id: 'gentle_waves',
    name: 'Gentle Waves',
    url: 'https://your-supabase.co/storage/v1/object/public/awaken/gentle_waves.mp3',
    duration: 180,
    description: 'Peaceful ocean waves',
  },

  MORNING_BIRDS: {
    id: 'morning_birds',
    name: 'Morning Birds',
    url: 'https://your-supabase.co/storage/v1/object/public/awaken/morning_birds.mp3',
    duration: 150,
    description: 'Cheerful bird songs',
  },
};
```

### 2. 创建铃声选择器 UI（可选）

```javascript
// components/RingtonePicker.jsx
import { getAllRingtones } from '../lib/ringtones';

function RingtonePicker({ selectedRingtone, onSelect }) {
  const ringtones = getAllRingtones();

  return (
    <View>
      {ringtones.map(ringtone => (
        <TouchableOpacity
          key={ringtone.id}
          onPress={() => onSelect(ringtone)}
        >
          <Text>{ringtone.name}</Text>
          <Text>{ringtone.description}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

---

## 🎛️ 音频配置

### 后台音频会话设置
```javascript
{
  allowsRecordingIOS: false,           // 不需要录音
  playsInSilentModeIOS: true,          // 静音模式也播放 ✅
  staysActiveInBackground: true,       // 后台保持活跃 ✅
  shouldDuckAndroid: true,             // Android 自动降噪
  playThroughEarpieceAndroid: false,   // 使用扬声器
  interruptionModeIOS: DO_NOT_MIX,     // iOS 独占音频
  interruptionModeAndroid: DO_NOT_MIX, // Android 独占音频
}
```

### 铃声播放参数
```javascript
{
  shouldPlay: true,         // 立即播放
  isLooping: true,          // 循环播放 ✅
  volume: 1.0,              // 满音量
  rate: 1.0,                // 正常速度
  shouldCorrectPitch: true, // 音高修正
}
```

---

## ⚠️ 注意事项

### iOS 限制
1. **后台音频必须持续播放**
   - 如果音频停止超过 30 秒，系统可能挂起应用
   - 当前使用循环播放 `isLooping: true` 保持活跃

2. **网络铃声加载**
   - 首次播放需要网络下载
   - 建议实现铃声缓存机制
   - 下载失败会回退到系统声音

3. **用户可关闭通知声音**
   - 即使配置 `playsInSilentModeIOS`，用户仍可在系统设置中关闭
   - 无法强制播放

### Android 限制
1. **电池优化影响**
   - 部分设备可能限制后台音频
   - 需要用户手动添加到白名单

2. **音量控制**
   - Android 音量受系统音量设置影响
   - 闹钟音量 = 通知音量

---

## 📊 测试清单

### 基础功能
- [ ] 创建闹钟自动包含默认铃声
- [ ] 闹钟触发时播放 Ling Ling 铃声
- [ ] 铃声循环播放直到停止
- [ ] 静音模式下铃声仍播放

### 高级功能
- [ ] 自定义铃声 URL 播放正常
- [ ] 铃声加载失败回退到系统声音
- [ ] 摇一摇过程中铃声持续播放
- [ ] Snooze 后铃声立即停止
- [ ] Stop 后铃声完全停止

### 边缘情况
- [ ] 网络断开时铃声播放（缓存）
- [ ] 低电量模式下铃声播放
- [ ] 通话中闹钟触发（音频中断处理）
- [ ] 应用被杀死后闹钟仍触发

---

## ✅ 完成总结

### 已实现
✅ 铃声配置模块（`lib/ringtones.js`）
✅ 默认铃声：Ling Ling (Supabase Storage)
✅ AudioManager 自动使用默认铃声
✅ 新建闹钟自动配置铃声
✅ 播放失败回退机制
✅ 后台音频会话配置
✅ 循环播放支持

### 可立即测试
- 创建新闹钟
- 5 分钟后触发
- 验证 Ling Ling 铃声播放
- 测试摇一摇任务
- 测试 Snooze 功能

### 建议优化
1. 实现铃声缓存（避免每次下载）
2. 添加更多铃声选项
3. 实现铃声选择器 UI
4. 添加音量渐强功能
5. 支持本地铃声文件

---

**配置完成时间：** 2025-10-29
**默认铃声：** Ling Ling (Supabase Storage)
**状态：** ✅ 可以开始测试
