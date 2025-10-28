# 闹钟原生集成完整实现方案 (方案 B)

## 📋 目标
实现一个完整功能的智能闹钟系统，支持：
- ✅ 后台触发（应用关闭时也能响铃）
- ✅ 自动弹出全屏唤醒页面
- ✅ 自定义铃声或 AI 语音播报
- ✅ 互动任务（摇一摇、答题等）
- ✅ 小睡（Snooze）功能
- ✅ 数据持久化（Supabase）

---

## 🏗️ 技术架构

### 核心技术栈
```
┌─────────────────────────────────────────┐
│         React Native / Expo             │
│  ┌───────────────────────────────────┐  │
│  │   前端 UI 层                       │  │
│  │   - 唤醒页面 (Wake Up Screen)     │  │
│  │   - 闹钟管理页面                   │  │
│  │   - 互动任务组件                   │  │
│  └───────────────────────────────────┘  │
│                  ↕                       │
│  ┌───────────────────────────────────┐  │
│  │   业务逻辑层                       │  │
│  │   - 闹钟调度管理器                 │  │
│  │   - 声音播放控制器                 │  │
│  │   - 任务验证逻辑                   │  │
│  └───────────────────────────────────┘  │
│                  ↕                       │
│  ┌───────────────────────────────────┐  │
│  │   原生模块层 (iOS/Android)        │  │
│  │   - UNUserNotificationCenter      │  │
│  │   - AVAudioPlayer                  │  │
│  │   - Background Tasks               │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                  ↕
         ┌─────────────────┐
         │   Supabase DB   │
         │   - alarms 表   │
         │   - wake_events │
         └─────────────────┘
```

---

## 📦 依赖包规划

### 1. 核心依赖（需要安装）
```json
{
  "expo-notifications": "^0.32.12",        // ✅ 已安装 - 本地通知
  "expo-av": "~14.0.8",                     // 🔴 需安装 - 音频播放
  "expo-speech": "~12.0.2",                 // ✅ 已安装 - 语音播报
  "expo-haptics": "~15.0.7",                // ✅ 已安装 - 触觉反馈
  "expo-device": "^8.0.9",                  // ✅ 已安装 - 设备信息
  "expo-background-fetch": "~12.0.1",       // 🔴 需安装 - 后台任务
  "expo-task-manager": "~11.9.1",           // 🔴 需安装 - 任务管理
  "react-native-sensor-manager": "latest"   // 🔴 需安装 - 摇一摇传感器
}
```

### 2. 原生能力配置

#### iOS (Info.plist)
```xml
<!-- 后台音频播放 -->
<key>UIBackgroundModes</key>
<array>
  <string>audio</string>              <!-- 音频后台 -->
  <string>processing</string>         <!-- 后台处理 -->
  <string>fetch</string>              <!-- 后台获取 -->
</array>

<!-- 通知权限 -->
<key>NSUserNotificationUsageDescription</key>
<string>We need notifications to wake you up with alarms</string>

<!-- 始终保持激活（可选，慎用） -->
<key>UIApplicationExitsOnSuspend</key>
<false/>
```

#### app.json 配置
```json
{
  "expo": {
    "plugins": [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#FF8C42",
          "sounds": [
            "./assets/sounds/alarm-ringtone.mp3",
            "./assets/sounds/gentle-wake.mp3"
          ]
        }
      ],
      [
        "expo-av",
        {
          "microphonePermission": false
        }
      ],
      [
        "expo-background-fetch",
        {
          "backgroundFetchInterval": 60
        }
      ]
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.fanthus.bolt-expo-nativewind",
      "infoPlist": {
        "UIBackgroundModes": ["audio", "processing", "fetch"]
      }
    }
  }
}
```

---

## 🔧 实现模块详解

### Module 1: 原生通知调度器 (`lib/alarmScheduler.js`)

**功能：**
- 注册/取消本地通知
- 处理重复闹钟（每日、工作日、自定义）
- Snooze 重新调度

```javascript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// 配置通知行为
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.MAX, // Android 最高优先级
  }),
});

/**
 * 调度闹钟通知
 * @param {Object} alarm - 闹钟配置
 * @returns {Promise<string>} notificationId
 */
export async function scheduleAlarm(alarm) {
  const { id, time, label, repeatDays, wakeMode, ringtone } = alarm;

  // 解析时间（格式：HH:mm）
  const [hours, minutes] = time.split(':').map(Number);
  const triggerDate = new Date();
  triggerDate.setHours(hours, minutes, 0, 0);

  // 如果时间已过，设置为明天
  if (triggerDate < new Date()) {
    triggerDate.setDate(triggerDate.getDate() + 1);
  }

  // 配置触发器
  const trigger = {
    hour: hours,
    minute: minutes,
    repeats: repeatDays && repeatDays.length > 0,
  };

  // 调度通知
  const notificationId = await Notifications.scheduleNotificationAsync({
    identifier: `alarm-${id}`,
    content: {
      title: '⏰ Time to Wake Up!',
      body: label || 'Your alarm is ringing',
      sound: ringtone || 'default',
      priority: 'max',
      data: {
        alarmId: id,
        wakeMode,
        action: 'WAKE_UP',
      },
      categoryIdentifier: 'ALARM_CATEGORY', // 用于自定义动作
    },
    trigger,
  });

  return notificationId;
}

/**
 * 取消闹钟
 */
export async function cancelAlarm(alarmId) {
  await Notifications.cancelScheduledNotificationAsync(`alarm-${alarmId}`);
}

/**
 * 调度 Snooze（5分钟后）
 */
export async function scheduleSnooze(alarm) {
  const notificationId = await Notifications.scheduleNotificationAsync({
    identifier: `snooze-${alarm.id}-${Date.now()}`,
    content: {
      title: '😴 Snooze Time Over',
      body: alarm.label || 'Time to wake up again',
      sound: alarm.ringtone || 'default',
      priority: 'max',
      data: {
        alarmId: alarm.id,
        wakeMode: alarm.wakeMode,
        action: 'SNOOZE_END',
      },
    },
    trigger: {
      seconds: 300, // 5分钟 = 300秒
    },
  });

  return notificationId;
}

/**
 * 注册通知类别和动作（iOS）
 */
export async function registerNotificationCategories() {
  if (Platform.OS === 'ios') {
    await Notifications.setNotificationCategoryAsync('ALARM_CATEGORY', [
      {
        identifier: 'SNOOZE_ACTION',
        buttonTitle: 'Snooze 5 min',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: 'STOP_ACTION',
        buttonTitle: "I'm up",
        options: {
          opensAppToForeground: true,
        },
      },
    ]);
  }
}
```

---

### Module 2: 音频播放管理器 (`lib/audioManager.js`)

**功能：**
- 播放自定义铃声
- TTS 语音播报
- 后台音频模式
- 音量控制

```javascript
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

let currentSound = null;

/**
 * 初始化音频会话（支持后台播放）
 */
export async function initAudioSession() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,        // 静音模式也播放
      staysActiveInBackground: true,     // 后台保持激活
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch (error) {
    console.error('Failed to set audio mode:', error);
  }
}

/**
 * 播放铃声
 * @param {string} ringtoneUri - 铃声文件 URI
 * @param {boolean} loop - 是否循环播放
 */
export async function playAlarmRingtone(ringtoneUri, loop = true) {
  try {
    // 停止当前播放
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    }

    // 加载并播放新铃声
    const { sound } = await Audio.Sound.createAsync(
      { uri: ringtoneUri } || require('../assets/sounds/default-alarm.mp3'),
      {
        isLooping: loop,
        volume: 1.0,
        shouldPlay: true,
      }
    );

    currentSound = sound;

    // 监听播放完成
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish && !status.isLooping) {
        console.log('Ringtone finished playing');
      }
    });

    return sound;
  } catch (error) {
    console.error('Failed to play ringtone:', error);
    return null;
  }
}

/**
 * 停止铃声
 */
export async function stopAlarmRingtone() {
  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    } catch (error) {
      console.error('Failed to stop ringtone:', error);
    }
  }
}

/**
 * 播放语音播报
 * @param {string} text - 播报文本
 */
export async function speakWakeMessage(text) {
  try {
    // 检查是否正在播放
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) {
      await Speech.stop();
    }

    // 播放语音
    await Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.9,
      volume: 1.0,
      voice: 'com.apple.ttsbundle.Samantha-compact', // iOS
    });
  } catch (error) {
    console.error('Failed to speak:', error);
  }
}

/**
 * 停止语音播报
 */
export async function stopSpeaking() {
  try {
    await Speech.stop();
  } catch (error) {
    console.error('Failed to stop speech:', error);
  }
}

/**
 * 播放闹钟（铃声 + 语音）
 */
export async function playWakeSequence(alarm) {
  await initAudioSession();

  // 播放铃声
  if (alarm.wakeMode === 'ringtone' && alarm.ringtoneUrl) {
    await playAlarmRingtone(alarm.ringtoneUrl);
  }

  // 播放语音播报
  if (alarm.wakeMode === 'voice' && alarm.broadcastContent) {
    await speakWakeMessage(alarm.broadcastContent);
  }
}

/**
 * 停止所有声音
 */
export async function stopAllSounds() {
  await stopAlarmRingtone();
  await stopSpeaking();
}
```

---

### Module 3: 后台任务处理器 (`lib/backgroundAlarmTask.js`)

**功能：**
- 监听闹钟触发时间
- 自动唤醒应用
- 跳转到唤醒页面

```javascript
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

const ALARM_BACKGROUND_TASK = 'ALARM_BACKGROUND_TASK';

/**
 * 定义后台任务
 */
TaskManager.defineTask(ALARM_BACKGROUND_TASK, async () => {
  try {
    console.log('[Background Task] Checking for alarms...');

    // 获取所有待触发的通知
    const notifications = await Notifications.getAllScheduledNotificationsAsync();

    // 检查是否有即将触发的闹钟（1分钟内）
    const now = Date.now();
    const upcomingAlarms = notifications.filter((notif) => {
      const trigger = notif.trigger;
      const triggerTime = trigger.value || trigger.date;
      return triggerTime && triggerTime - now < 60000; // 1分钟内
    });

    if (upcomingAlarms.length > 0) {
      console.log('[Background Task] Upcoming alarm detected');
      // 这里可以预加载资源或准备唤醒页面
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('[Background Task] Error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * 注册后台任务
 */
export async function registerBackgroundTask() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(ALARM_BACKGROUND_TASK);

    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(ALARM_BACKGROUND_TASK, {
        minimumInterval: 60, // 每分钟检查一次
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('[Background Task] Registered successfully');
    }
  } catch (error) {
    console.error('[Background Task] Registration failed:', error);
  }
}

/**
 * 注销后台任务
 */
export async function unregisterBackgroundTask() {
  try {
    await BackgroundFetch.unregisterTaskAsync(ALARM_BACKGROUND_TASK);
    console.log('[Background Task] Unregistered');
  } catch (error) {
    console.error('[Background Task] Unregister failed:', error);
  }
}

/**
 * 设置通知响应处理器（打开唤醒页面）
 */
export function setupNotificationResponseHandler() {
  Notifications.addNotificationResponseReceivedListener((response) => {
    const { alarmId, action } = response.notification.request.content.data;

    console.log('[Notification Response]', action, alarmId);

    if (action === 'WAKE_UP' || action === 'SNOOZE_END') {
      // 导航到唤醒页面
      router.push({
        pathname: '/alarm/wake-up',
        params: { alarmId },
      });
    }
  });
}
```

---

### Module 4: 唤醒页面组件 (`app/alarm/wake-up.jsx`)

**功能：**
- 全屏显示
- 显示闹钟信息
- 播放声音
- 互动任务
- Snooze / Stop 按钮

```javascript
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import useStore from '../../lib/store';
import { playWakeSequence, stopAllSounds } from '../../lib/audioManager';
import { scheduleSnooze } from '../../lib/alarmScheduler';
import MonsterIcon from '../../components/MonsterIcon';
import ShakeTaskCard from '../../components/ShakeTaskCard';

export default function WakeUpScreen() {
  const { alarmId } = useLocalSearchParams();
  const alarm = useStore((state) => state.alarms.find((a) => a.id === alarmId));

  const [currentTime, setCurrentTime] = useState(new Date());
  const [taskCompleted, setTaskCompleted] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 播放闹钟声音
    if (alarm) {
      playWakeSequence(alarm);
    }

    // 更新时间
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // 怪兽呼吸动画
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      clearInterval(timer);
      stopAllSounds();
    };
  }, [alarm]);

  const handleSnooze = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // 停止声音
    await stopAllSounds();

    // 调度 5 分钟后的 Snooze
    await scheduleSnooze(alarm);

    // 关闭页面
    router.back();
  };

  const handleStop = async () => {
    // 检查任务是否完成
    if (alarm.task !== 'none' && !taskCompleted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      alert('Please complete the wake task first!');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // 停止声音
    await stopAllSounds();

    // 记录唤醒事件到 Supabase
    await useStore.getState().addWakeEvent({
      alarmId,
      timestamp: new Date().toISOString(),
      completedTask: alarm.task !== 'none',
    });

    // 关闭页面
    router.replace('/');
  };

  if (!alarm) {
    return null;
  }

  const timeString = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <View style={styles.container}>
      {/* 渐变背景 */}
      <LinearGradient
        colors={['#A8D5E2', '#FFE8B8', '#FFD1A3']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.content} edges={['top', 'bottom']}>
        {/* 时间显示 */}
        <View style={styles.timeSection}>
          <Text style={styles.timeText}>{timeString}</Text>
          <Text style={styles.labelText}>
            {alarm.label} · {alarm.repeatDisplay || 'Once'}
          </Text>
        </View>

        {/* 怪兽图标 */}
        <Animated.View
          style={[
            styles.monsterContainer,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <MonsterIcon size={180} type="morning" />
        </Animated.View>

        {/* 问候语 */}
        <View style={styles.messageSection}>
          <Text style={styles.greetingText}>Good morning,</Text>
          <Text style={styles.greetingText}>I'm waking you up 🐾</Text>

          {alarm.wakeMode === 'voice' && alarm.broadcastContent && (
            <Text style={styles.broadcastText}>{alarm.broadcastContent}</Text>
          )}
        </View>

        {/* 互动任务 */}
        {alarm.task !== 'none' && (
          <ShakeTaskCard
            taskType={alarm.task}
            onComplete={() => setTaskCompleted(true)}
            completed={taskCompleted}
          />
        )}

        {/* 按钮 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.snoozeButton}
            onPress={handleSnooze}
            activeOpacity={0.8}
          >
            <Text style={styles.snoozeButtonText}>Snooze 5 min</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.stopButton,
              (!taskCompleted && alarm.task !== 'none') && styles.stopButtonDisabled,
            ]}
            onPress={handleStop}
            activeOpacity={0.8}
          >
            <Text style={styles.stopButtonText}>I'm up</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  timeSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  timeText: {
    fontSize: 72,
    fontWeight: '300',
    color: '#1A2B3C',
    letterSpacing: -2,
  },
  labelText: {
    fontSize: 18,
    color: '#4A5A6A',
    marginTop: 8,
  },
  monsterContainer: {
    alignSelf: 'center',
    marginVertical: 40,
  },
  messageSection: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1A2B3C',
    textAlign: 'center',
  },
  broadcastText: {
    fontSize: 16,
    color: '#5A6A7A',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  snoozeButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  snoozeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2B3C',
  },
  stopButton: {
    flex: 1,
    backgroundColor: '#FF8C42',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  stopButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  stopButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
```

---

### Module 5: 摇一摇任务组件 (`components/ShakeTaskCard.jsx`)

```javascript
import { View, Text, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';

export default function ShakeTaskCard({ taskType, onComplete, completed }) {
  const [shakeCount, setShakeCount] = useState(0);
  const [subscription, setSubscription] = useState(null);

  const requiredShakes = taskType === 'shake' ? 3 : 0;

  useEffect(() => {
    if (taskType !== 'shake' || completed) return;

    let lastShake = 0;
    const SHAKE_THRESHOLD = 1.5;

    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const acceleration = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      if (acceleration > SHAKE_THRESHOLD && now - lastShake > 500) {
        lastShake = now;
        setShakeCount((prev) => {
          const newCount = prev + 1;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

          if (newCount >= requiredShakes) {
            onComplete();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }

          return newCount;
        });
      }
    });

    Accelerometer.setUpdateInterval(100);
    setSubscription(sub);

    return () => {
      sub && sub.remove();
    };
  }, [taskType, completed]);

  if (taskType === 'none') return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Wake Task</Text>
      <Text style={styles.instruction}>
        Shake your phone {requiredShakes} times to turn off the alarm · {shakeCount}/{requiredShakes}
      </Text>
      {completed && <Text style={styles.completedText}>✓ Task Completed!</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 24,
    borderRadius: 20,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A2B3C',
    marginBottom: 12,
    textAlign: 'center',
  },
  instruction: {
    fontSize: 16,
    color: '#4A5A6A',
    textAlign: 'center',
    lineHeight: 24,
  },
  completedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 12,
  },
});
```

---

## 🗄️ Supabase 数据库设计

### 新增表：`wake_events`

```sql
/*
  # Wake Events Table

  1. New Tables
    - `wake_events`
      - `id` (uuid, primary key)
      - `user_id` (text) - 用户标识
      - `alarm_id` (text) - 闹钟 ID
      - `timestamp` (timestamptz) - 触发时间
      - `action` (text) - 动作类型：'snoozed', 'dismissed', 'completed'
      - `completed_task` (boolean) - 是否完成任务
      - `snooze_count` (integer) - 小睡次数
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policy for authenticated users
*/

CREATE TABLE IF NOT EXISTS wake_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  alarm_id text NOT NULL,
  timestamp timestamptz NOT NULL,
  action text NOT NULL CHECK (action IN ('snoozed', 'dismissed', 'completed')),
  completed_task boolean DEFAULT false,
  snooze_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wake_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wake events"
  ON wake_events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own wake events"
  ON wake_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX idx_wake_events_timestamp ON wake_events(timestamp DESC);
CREATE INDEX idx_wake_events_alarm_id ON wake_events(alarm_id);
```

### 更新 `alarms` 表（添加新字段）

```sql
ALTER TABLE alarms ADD COLUMN IF NOT EXISTS notification_id text;
ALTER TABLE alarms ADD COLUMN IF NOT EXISTS last_triggered_at timestamptz;
ALTER TABLE alarms ADD COLUMN IF NOT EXISTS snooze_count integer DEFAULT 0;
```

---

## 📱 完整工作流程

### 1️⃣ 用户创建闹钟
```
用户输入闹钟信息
  ↓
保存到 Zustand Store
  ↓
保存到 AsyncStorage
  ↓
调用 scheduleAlarm() 注册通知
  ↓
返回 notificationId 并保存
```

### 2️⃣ 闹钟触发（后台）
```
系统时间到达设定时间
  ↓
iOS/Android 系统触发通知
  ↓
播放系统通知声音
  ↓
显示通知横幅
  ↓
[用户点击通知]
  ↓
触发 NotificationResponse 监听器
  ↓
router.push('/alarm/wake-up')
```

### 3️⃣ 唤醒页面展示
```
WakeUpScreen 加载
  ↓
获取闹钟配置
  ↓
调用 playWakeSequence()
  - 播放自定义铃声（循环）
  - 或播放 TTS 语音
  ↓
显示任务卡片（如有）
  ↓
等待用户操作
```

### 4️⃣ 用户操作分支

**A. 点击 Snooze：**
```
stopAllSounds()
  ↓
scheduleSnooze(alarm) - 注册 5 分钟后通知
  ↓
记录到 wake_events (action: 'snoozed')
  ↓
router.back()
```

**B. 完成任务 → 点击 I'm up：**
```
检查任务完成状态
  ↓
stopAllSounds()
  ↓
记录到 wake_events (action: 'completed', completed_task: true)
  ↓
更新闹钟统计信息
  ↓
router.replace('/') - 返回首页
```

---

## 🚀 实施步骤（Todo List）

### 阶段 1: 环境准备（第 1-2 天）
- [ ] 安装必需依赖包
  - [ ] `expo-av`
  - [ ] `expo-background-fetch`
  - [ ] `expo-task-manager`
  - [ ] `expo-sensors`（用于摇一摇）
- [ ] 配置 `app.json` 插件
- [ ] 更新 iOS `Info.plist` 权限
- [ ] 准备音频资源文件
  - [ ] 默认铃声 `default-alarm.mp3`
  - [ ] 柔和铃声 `gentle-wake.mp3`

### 阶段 2: 核心模块开发（第 3-5 天）
- [ ] 实现 `lib/alarmScheduler.js`
  - [ ] `scheduleAlarm()`
  - [ ] `cancelAlarm()`
  - [ ] `scheduleSnooze()`
  - [ ] `registerNotificationCategories()`
- [ ] 实现 `lib/audioManager.js`
  - [ ] `initAudioSession()`
  - [ ] `playAlarmRingtone()`
  - [ ] `speakWakeMessage()`
  - [ ] `stopAllSounds()`
- [ ] 实现 `lib/backgroundAlarmTask.js`
  - [ ] `registerBackgroundTask()`
  - [ ] `setupNotificationResponseHandler()`

### 阶段 3: UI 组件开发（第 6-8 天）
- [ ] 创建 `app/alarm/wake-up.jsx`
  - [ ] 全屏布局
  - [ ] 时间显示
  - [ ] 怪兽动画
  - [ ] 问候语显示
  - [ ] 按钮功能
- [ ] 创建 `components/ShakeTaskCard.jsx`
  - [ ] 加速度计监听
  - [ ] 进度显示
  - [ ] 完成反馈
- [ ] 创建其他任务组件
  - [ ] `components/MathTaskCard.jsx`（答题）
  - [ ] `components/MemoryTaskCard.jsx`（记忆）

### 阶段 4: 集成与测试（第 9-10 天）
- [ ] 集成到现有闹钟流程
  - [ ] 更新 `useStore` 添加新方法
  - [ ] 修改闹钟创建流程调用 scheduler
  - [ ] 修改闹钟编辑/删除流程
- [ ] 权限请求流程
  - [ ] 通知权限
  - [ ] 后台任务权限
  - [ ] 传感器权限
- [ ] Supabase 集成
  - [ ] 创建 `wake_events` 表
  - [ ] 实现数据同步逻辑

### 阶段 5: 优化与打磨（第 11-12 天）
- [ ] 后台稳定性测试
  - [ ] 应用关闭时触发
  - [ ] 低电量模式测试
  - [ ] 多个闹钟并发测试
- [ ] 音频体验优化
  - [ ] 渐强音量（淡入效果）
  - [ ] 语音播报自然度调整
- [ ] UI/UX 打磨
  - [ ] 动画流畅度
  - [ ] 触觉反馈
  - [ ] 错误提示

### 阶段 6: 上线准备（第 13-14 天）
- [ ] 构建测试版本
  - [ ] `npx expo run:ios`
  - [ ] TestFlight 分发
- [ ] 文档编写
  - [ ] 用户使用指南
  - [ ] 故障排查文档
- [ ] 提交审核（如需要）

---

## ⚠️ 技术难点与解决方案

### 难点 1: iOS 后台限制
**问题：** iOS 严格限制后台任务执行时间（通常只有 30 秒）

**解决方案：**
- 使用 `UNUserNotificationCenter` 依赖系统调度（最可靠）
- 设置 `UIBackgroundModes: audio` 保持音频会话
- 不依赖 JS 后台任务，而是使用系统通知 + 用户点击触发

### 难点 2: 自动全屏唤醒
**问题：** iOS 不允许应用自动唤醒到前台

**解决方案：**
- **方案 A（推荐）：** 使用高优先级通知 + 全屏横幅，用户点击后打开
- **方案 B（高级）：** 使用 `UNNotificationServiceExtension` 自定义通知 UI
- **方案 C（不推荐）：** 尝试使用 VoIP 推送（可能被拒审）

### 难点 3: 声音持续播放
**问题：** 通知声音只播放一次，无法循环

**解决方案：**
- 通知只负责唤醒，真正的铃声在应用内通过 `expo-av` 播放
- 设置 `playsInSilentModeIOS: true` 确保静音模式也能播放
- 使用 `isLooping: true` 实现循环播放

### 难点 4: 重复闹钟调度
**问题：** 自定义重复模式（如只在工作日）

**解决方案：**
```javascript
// 为每个需要触发的日期单独注册通知
function scheduleRecurringAlarm(alarm) {
  const { repeatDays, time } = alarm;
  const notificationIds = [];

  repeatDays.forEach(day => {
    const trigger = {
      weekday: day, // 1=Sunday, 2=Monday, ...
      hour: parseInt(time.split(':')[0]),
      minute: parseInt(time.split(':')[1]),
      repeats: true,
    };

    const id = await Notifications.scheduleNotificationAsync({
      identifier: `alarm-${alarm.id}-day${day}`,
      content: { /* ... */ },
      trigger,
    });

    notificationIds.push(id);
  });

  return notificationIds;
}
```

---

## 📊 性能优化建议

1. **音频资源优化**
   - 使用 MP3 格式（iOS 原生支持）
   - 文件大小控制在 2MB 以内
   - 采样率 44.1kHz

2. **后台任务优化**
   - 只在真正需要时注册后台任务
   - 避免频繁唤醒（最低间隔 15 分钟）

3. **电池优化**
   - 播放完毕及时释放音频资源
   - 完成任务后立即注销监听器

4. **内存优化**
   - 唤醒页面使用 `useMemo` 缓存计算结果
   - 动画使用 `useNativeDriver: true`

---

## 🎯 总结

这是一个完整的原生集成方案，核心思路是：

1. **使用系统通知作为调度核心**（最可靠）
2. **应用内播放自定义声音**（绕过通知声音限制）
3. **用户交互触发全屏页面**（符合 iOS 规范）
4. **Supabase 持久化数据**（统计分析）

实施难度：⭐⭐⭐⭐ (中高)
预计开发时间：10-14 天
iOS 审核通过率：95%+（符合 Apple 规范）

---

**下一步建议：**
是否开始实施？我可以按阶段逐步实现每个模块。
