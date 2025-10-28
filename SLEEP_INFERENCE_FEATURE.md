# 睡眠推断功能实现文档

## 🎯 功能概述

从 HealthKit 原始步数片段推断睡眠时间段，并在 Sleep 页面展示。

**核心思路**: "睡觉" ≈ "长时间低步数活动区间"（几乎不走路）

---

## ✅ 已完成的修改

### STEP 1: 更新 healthkitBridge.ts

**文件**: `src/modules/health/healthkitBridge.ts`

#### 新增函数: `getRawStepSamplesLastNHours`

```typescript
async function getRawStepSamplesLastNHours(hours = 24): Promise<
  { ok: true; data: { startDate: string; endDate: string; value: number }[] } |
  { ok: false; error: string }
>
```

**功能**:
- 获取最近 N 小时（默认 24 小时）的原始步数片段
- 每个片段包含完整的 `startDate`、`endDate`、`value`
- 不聚合、不按天求和，保留原始时间段信息
- 按时间倒序排序（最新的在前）

**实现细节**:
- ✅ 依赖 `isHealthKitAvailable()` 检查可用性
- ✅ 使用统一的错误处理模式 `{ ok, error }`
- ✅ 安全的错误兜底，不会崩溃
- ✅ 详细的控制台日志输出

**位置**: 第 94-139 行

---

### STEP 2: 更新 Sleep 页面

**文件**: `app/(tabs)/sleep.jsx`

#### 2.1 导入新函数 (第 10-15 行)

```javascript
import {
  isHealthKitAvailable,
  initHealthKitIfAvailable,
  getLast14DaysSteps,
  getRawStepSamplesLastNHours,  // ← 新增
} from '@/src/modules/health/healthkitBridge';
```

#### 2.2 新增状态管理 (第 53-56 行)

```javascript
// Inferred sleep windows from raw step samples
const [inferredSleepWindows, setInferredSleepWindows] = useState([]);
const [sleepCalcError, setSleepCalcError] = useState(null);
const [loadingSleepInference, setLoadingSleepInference] = useState(false);
```

#### 2.3 睡眠推断逻辑 (第 175-293 行)

**新增 useEffect**: 自动执行睡眠推断

**推断算法**:

1. **检查 HealthKit 可用性**
   ```javascript
   if (!isHealthKitAvailable()) {
     setSleepCalcError('HealthKit not available');
     return;
   }
   ```

2. **初始化 HealthKit**
   ```javascript
   const initRes = await initHealthKitIfAvailable();
   if (!initRes.ok) {
     setSleepCalcError(initRes.error);
     return;
   }
   ```

3. **获取最近 24 小时原始步数片段**
   ```javascript
   const rawRes = await getRawStepSamplesLastNHours(24);
   ```

4. **睡眠窗口推断核心算法**:

   **参数**:
   - `LOW_THRESHOLD = 20`: 步数 < 20 视为低活动
   - `MIN_DURATION_MS = 60 * 60 * 1000`: 最小持续时长 1 小时
   - `MAX_GAP_MS = 5 * 60 * 1000`: 最大间隔 5 分钟（仍视为连续）

   **步骤**:
   - 按时间升序处理样本（旧到新）
   - 识别连续的低活动片段（`value < 20`）
   - 将相邻片段合并成更长的窗口
     - 如果间隔 ≤ 5 分钟 → 合并
     - 如果间隔 > 5 分钟 → 关闭当前窗口，开启新窗口
   - 过滤出持续时长 > 1 小时的窗口
   - 按时长降序排序
   - 保留最长的前 2 个窗口

5. **结果存储**
   ```javascript
   setInferredSleepWindows(longWindows.slice(0, 2));
   ```

#### 2.4 格式化函数 (第 392-400 行)

```javascript
const formatWindow = (w) => {
  const pad = (n) => String(n).padStart(2, '0');
  const durMs = w.end.getTime() - w.start.getTime();
  const durMinTotal = Math.round(durMs / 60000);
  const durH = Math.floor(durMinTotal / 60);
  const durM = durMinTotal % 60;
  return `${pad(w.start.getHours())}:${pad(w.start.getMinutes())} – ${pad(w.end.getHours())}:${pad(w.end.getMinutes())} (${durH}h ${durM}m)`;
};
```

**输出示例**: `03:25 – 06:50 (3h 25m)`

#### 2.5 UI 显示 (第 652-686 行)

**新增卡片**: "Inferred Sleep From Steps (Last 24h)"

**显示状态**:

1. **加载中**:
   ```
   🔄 Analyzing sleep patterns...
   ```

2. **错误状态**:
   ```
   ⚠️ [错误信息]
   ```

3. **无睡眠窗口**:
   ```
   No inferred sleep periods (last 24h).
   ```

4. **成功状态** (显示推断的睡眠窗口):
   ```
   😴 03:25 – 06:50 (3h 25m)
   😴 13:00 – 14:30 (1h 30m)
   ```

#### 2.6 新增样式 (第 996-1029 行)

```javascript
inferredSleepContainer: {
  marginTop: 12,
  backgroundColor: 'rgba(157, 122, 255, 0.1)',
  borderRadius: 12,
  padding: 12,
  borderWidth: 1,
  borderColor: 'rgba(157, 122, 255, 0.3)',
},
inferredSleepHeader: {
  fontSize: 13,
  fontWeight: '600',
  color: 'rgba(255, 255, 255, 0.9)',
  marginBottom: 8,
},
inferredSleepWindows: {
  gap: 8,
},
sleepWindowItem: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  padding: 8,
  backgroundColor: 'rgba(157, 122, 255, 0.15)',
  borderRadius: 8,
},
sleepWindowIcon: {
  fontSize: 18,
},
sleepWindowText: {
  fontSize: 14,
  color: 'rgba(255, 255, 255, 0.9)',
  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  fontWeight: '500',
},
```

---

## 🎨 UI 设计

### 视觉层次

```
Sleep 页面
  ├─ 页面标题 "My Progress"
  ├─ Sync HealthKit 按钮
  ├─ 数据源提示横幅
  ├─ HealthKit Steps Data (已有)
  │   └─ Recent Step Data (Last 3 days)
  │       ├─ Mon Jan 13 2025: 8,234 steps
  │       ├─ Tue Jan 14 2025: 6,543 steps
  │       └─ Wed Jan 15 2025: 9,876 steps
  └─ Inferred Sleep From Steps (新增) ✨
      └─ 😴 03:25 – 06:50 (3h 25m)
      └─ 😴 13:00 – 14:30 (1h 30m)
```

### 颜色方案

- **容器背景**: `rgba(157, 122, 255, 0.1)` (淡紫色)
- **边框**: `rgba(157, 122, 255, 0.3)` (紫色半透明)
- **睡眠窗口项背景**: `rgba(157, 122, 255, 0.15)` (稍深紫色)
- **文字**: `rgba(255, 255, 255, 0.9)` (亮白色)
- **图标**: 😴 emoji

---

## 🔄 数据流

```
用户打开 Sleep 页面
   ↓
useEffect 触发睡眠推断
   ↓
1. isHealthKitAvailable()
   ├─→ false → 显示 "HealthKit not available"
   └─→ true → 继续
   ↓
2. initHealthKitIfAvailable()
   ├─→ { ok: false } → 显示错误
   └─→ { ok: true } → 继续
   ↓
3. getRawStepSamplesLastNHours(24)
   ├─→ { ok: false } → 显示错误
   └─→ { ok: true, data: [...] } → 继续
   ↓
4. 睡眠推断算法
   ├─ 按时间排序样本
   ├─ 识别低活动片段 (< 20 步)
   ├─ 合并连续片段 (间隔 ≤ 5 分钟)
   ├─ 过滤短窗口 (< 1 小时)
   ├─ 按时长降序排序
   └─ 保留前 2 个
   ↓
5. setInferredSleepWindows([...])
   ↓
UI 显示推断的睡眠窗口
```

---

## 🧪 测试场景

### Scenario 1: HealthKit 不可用 ✅
**预期**:
```
容器显示: "HealthKit not available"
不崩溃，优雅降级
```

### Scenario 2: HealthKit 可用但权限未授予 ✅
**预期**:
```
容器显示: "HealthKit init failed" 或类似错误信息
显示友好的错误提示
```

### Scenario 3: 有步数数据，推断出睡眠窗口 ✅
**预期**:
```
容器显示:
😴 03:25 – 06:50 (3h 25m)  ← 最长睡眠窗口
😴 13:00 – 14:30 (1h 30m)  ← 第二长睡眠窗口（午睡？）
```

### Scenario 4: 有步数数据，但没有长时间低活动区间 ✅
**预期**:
```
容器显示: "No inferred sleep periods (last 24h)."
说明用户最近 24 小时内没有长时间不走路的区间
```

### Scenario 5: 最近 24 小时内持续高活动（一直在走） ✅
**预期**:
```
容器显示: "No inferred sleep periods (last 24h)."
算法正确识别出无睡眠窗口
```

---

## 📊 算法参数调优

### 当前参数

| 参数 | 值 | 说明 |
|------|-----|------|
| `LOW_THRESHOLD` | 20 步 | 低于此值视为"几乎不走路" |
| `MIN_DURATION_MS` | 1 小时 | 最短睡眠时长 |
| `MAX_GAP_MS` | 5 分钟 | 视为连续的最大间隔 |
| 保留窗口数 | 2 个 | 显示最长的 2 个睡眠窗口 |

### 可能的优化方向

**如果误报太多（非睡眠被识别为睡眠）**:
- ↑ 增加 `LOW_THRESHOLD` (例如改为 30 步)
- ↑ 增加 `MIN_DURATION_MS` (例如改为 2 小时)
- ↓ 减小 `MAX_GAP_MS` (例如改为 3 分钟)

**如果漏报太多（真实睡眠未被识别）**:
- ↓ 减小 `LOW_THRESHOLD` (例如改为 15 步)
- ↓ 减小 `MIN_DURATION_MS` (例如改为 45 分钟)
- ↑ 增加 `MAX_GAP_MS` (例如改为 10 分钟)

---

## 🔒 安全性保证

### ✅ 不会崩溃
- 所有 HealthKit 调用都通过 `healthkitBridge.ts`
- 完整的错误处理 (`try-catch` + `{ ok, error }` 模式)
- 不直接访问 `.SharingAuthorized` 或其他可能 undefined 的属性

### ✅ 优雅降级
- HealthKit 不可用 → 显示友好提示
- 权限被拒绝 → 显示权限引导
- 无数据 → 显示"无睡眠窗口"
- 任何错误 → 显示具体错误信息

### ✅ 性能优化
- `useEffect` 只在组件 mount 时执行一次
- 使用 `didCancel` 标志避免竞态条件
- 异步操作不阻塞 UI 渲染

---

## 🎯 用户价值

### 解决的问题
- ❌ **之前**: Sleep 页面数据来自 demo 或手动输入，缺乏真实数据
- ✅ **现在**: 自动从步数推断睡眠，无需手动记录

### 用户体验提升
1. **自动化**: 无需手动输入睡眠时间
2. **可视化**: 清晰展示推断的睡眠窗口
3. **透明度**: 明确标注"从步数推断"，让用户理解数据来源
4. **即时性**: 页面加载时自动推断，无需额外操作

---

## 📝 代码质量

- ✅ **无 Linter 错误**
- ✅ **完整的注释**
- ✅ **清晰的变量命名**
- ✅ **统一的错误处理**
- ✅ **可维护的代码结构**

---

## 🚀 未来增强方向

### 短期优化
1. **参数可配置化**: 允许用户调整灵敏度
2. **更多统计信息**: 显示总睡眠时长、睡眠效率等
3. **历史趋势**: 展示最近一周的睡眠窗口趋势图
4. **午睡识别**: 区分主要睡眠和午睡

### 长期方向
1. **机器学习**: 根据用户反馈优化推断算法
2. **多数据源融合**: 结合心率、屏幕使用时间等
3. **睡眠质量评估**: 深浅睡眠分析
4. **个性化建议**: 基于睡眠模式提供改善建议

---

## 📚 相关文档

- `SLEEP_PAGE_HEALTHKIT_FIX.md` - Sleep 页面 HealthKit 崩溃修复
- `HEALTHKIT_INITIALIZING_FIX.md` - Initializing 页面修复
- `HEALTHKIT_BRIDGE_MIGRATION_CHECKLIST.md` - Bridge 迁移总览
- `src/modules/health/healthkitBridge.ts` - 统一 HealthKit 接口

---

## ✅ 验收清单

- [x] ✅ healthkitBridge.ts 添加 `getRawStepSamplesLastNHours` 函数
- [x] ✅ Sleep 页面导入新函数
- [x] ✅ 添加状态管理 (`inferredSleepWindows`, `sleepCalcError`, `loadingSleepInference`)
- [x] ✅ 实现睡眠推断 useEffect
- [x] ✅ 添加格式化函数 `formatWindow`
- [x] ✅ 添加 UI 显示推断睡眠窗口
- [x] ✅ 添加新样式
- [x] ✅ 无 Linter 错误
- [x] ✅ 保留原有步数数据显示
- [x] ✅ 不访问 `.SharingAuthorized` 等旧 API

---

**实现完成日期**: 2025-10-27  
**文件修改**:
- `src/modules/health/healthkitBridge.ts` (+48 行)
- `app/(tabs)/sleep.jsx` (+153 行)

**状态**: ✅ 完成，待真机测试

