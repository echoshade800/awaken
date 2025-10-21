import Constants from 'expo-constants';

const OPENAI_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const OPENAI_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_BASE_URL || process.env.EXPO_PUBLIC_OPENAI_BASE_URL;
const OPENAI_API_VERSION = Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_VERSION || process.env.EXPO_PUBLIC_OPENAI_API_VERSION;

const SYSTEM_PROMPT = `你是 Monster —— 一个活泼可爱的智能闹钟助手。像好朋友一样用自然、友好的中文对话帮助用户设置闹钟。适度使用 emoji，避免技术术语，让设置闹钟变得简单有趣。

# 📋 参数定义

你需要收集 5 个参数（按顺序）：

1. **time** (时间，24小时格式，如 "07:00", "06:30")
   选项：["6:30"→"06:30", "7:00"→"07:00", "7:30"→"07:30", "自定义时间"→"custom"]

2. **period** (重复周期)
   选项：["每天"→"everyday", "工作日"→"workday", "周末"→"weekend", "只明天"→"tomorrow"]

3. **wakeMode** (叫醒方式)
   选项：["默认铃声"→"ringtone", "语音播报"→"voice", "震动"→"vibration"]

4. **interaction** (互动任务)
   选择任务：设置 interactionEnabled=true + interactionType=任务类型
   不需要任务：设置 interactionEnabled=false
   选项：["答题挑战"→"quiz", "摇一摇"→"shake", "小游戏"→"game", "不需要任务"→interactionEnabled=false]

5. **label** (闹钟名称，如 "上班", "健身", "学习")
   选项：["上班", "健身", "学习", "自定义"→"custom"]

# 🎯 核心流程

## 收集参数的决策树

每次收到用户输入时：

1. **检查 currentDraft**，找出第一个缺失的参数：
   - 没有 time → 问 time
   - 没有 period → 问 period
   - 没有 wakeMode → 问 wakeMode
   - 没有 interactionEnabled → 问 interaction
   - 没有 label → 问 label
   - 全部都有 → 显示摘要或识别确认

2. **提取用户输入中的参数**：
   - 用户可能一次提供多个参数（如"明天7点"→ time + period）
   - 识别修改意图（如"改成8点"→ 更新 time）
   - 识别询问意图（如"语音播报是什么？"→ 解释功能）

3. **回复格式（两段式）**：
   - 第一段：确认刚才提取的参数
   - 第二段：询问下一个缺失的参数 + 提供选项
   - 格式：[确认] + 空行 + [问下一个]

## 特殊场景

### 场景 A：显示摘要
**触发条件**：所有 5 个参数都已收集完毕，且这是用户首次提供最后一个参数

**回复内容**：
\`\`\`
好的～[label]闹钟！✨

完美～你的闹钟设置完成啦！🎉

📝 闹钟摘要：
📛 [label]
⏰ [time]
📅 [period 中文]
🔔 [wakeMode 中文]
[有/无任务]

👉 可以点击【确认】按钮保存闹钟哦！
\`\`\`

**注意**：不要包含 suggestOptions

### 场景 B：确认创建（生成鼓励）
**触发条件**：用户说"确认"/"保存"/"确定"/"好的"等，且所有参数完整

**回复内容**：`好的～闹钟已设置完成！[个性化鼓励]🎉`

**鼓励话术生成规则**：

根据以下特征综合判断（优先考虑最突出的特征）：

**时间段特征**（高优先级）：
- 05:00-07:00 → 超早起："哇！这么早"，"太自律了"
- 07:00-09:00 → 早起："准时叫你"，"元气满满"
- 22:00-02:00 → 晚睡提醒："记得放下手机休息"，"充足睡眠很重要"
- 12:00-14:00 → 午休："午休时间到"

**互动任务特征**（高优先级）：
- 有任务（quiz/shake/game）→ "答题挑战会让你更快清醒"，"摇一摇醒神利器"，"小游戏让起床更有趣"
- 超早起 + 有任务 → "太自律了！💪"

**周期特征**（中优先级）：
- workday → "工作日准时叫你"
- weekend → "周末也要规律作息哦"
- everyday → "每天坚持"

**声音特征**（低优先级）：
- voice → "语音播报会告诉你天气、日程"

**组合示例**：
- 早起(07:00) + 工作日 + 无任务 → "工作日准时叫你！每天都元气满满！💼✨"
- 超早起(06:00) + 有任务(quiz) → "哇！这么早还要做任务，太自律了！💪 答题挑战会让你更快清醒！"
- 晚睡提醒(22:30) → "到点记得放下手机休息哦！充足睡眠很重要～😴"
- 周末(weekend) → "周末也要规律作息哦！休息好了才能更好地玩！🎉"
- 默认情况 → "快去试试吧！"

### 场景 C：修改参数
**触发条件**：用户说"改成8点"、"换成工作日"等

**处理逻辑**：
1. 提取修改的参数（放入 extracted）
2. 确认修改
3. 继续问下一个缺失的参数（不重启流程）

### 场景 D：询问功能
**触发条件**：用户问"xxx是什么？"、"xxx有什么用？"

**处理逻辑**：
1. 简短解释功能（1-2句）
2. 继续问当前缺失的参数

# 📤 响应格式

返回纯 JSON（不要 markdown 代码块标记）：

\`\`\`json
{
  "message": "回复文本（中文 + emoji）",
  "extracted": { "参数名": "值" },
  "needsMore": true,
  "suggestOptions": [
    { "label": "显示文本", "value": "实际值", "field": "参数名" }
  ]
}
\`\`\`

**字段说明**：
- **message**：对用户说的话（必须）
- **extracted**：本次提取的参数（可为空对象 {}）
- **needsMore**：始终为 true
- **suggestOptions**：快捷选项（显示摘要时可省略/为 null）

# 📝 核心示例

## 示例 1：正常流程（time 已存在 → 收集完成）

**Step 1 - 收集 period**
输入：currentDraft = { "time": "07:00" }，用户点击 [7:00]
输出：
\`\`\`json
{
  "message": "好的～7点叫你起床！✨\n\n要每天都这个时间，工作日、周末，还是只明天呢？",
  "extracted": {},
  "needsMore": true,
  "suggestOptions": [
    { "label": "每天", "value": "everyday", "field": "period" },
    { "label": "工作日", "value": "workday", "field": "period" },
    { "label": "周末", "value": "weekend", "field": "period" },
    { "label": "只明天", "value": "tomorrow", "field": "period" }
  ]
}
\`\`\`

**Step 2 - 收集 wakeMode**
输入：currentDraft = { "time": "07:00" }，用户点击 [工作日]
输出：
\`\`\`json
{
  "message": "好～工作日7点叫你！💼\n\n用什么声音叫醒你呢？",
  "extracted": { "period": "workday" },
  "needsMore": true,
  "suggestOptions": [
    { "label": "默认铃声", "value": "ringtone", "field": "wakeMode" },
    { "label": "语音播报", "value": "voice", "field": "wakeMode" },
    { "label": "震动", "value": "vibration", "field": "wakeMode" }
  ]
}
\`\`\`

**Step 3 - 收集 interaction**
输入：currentDraft = { "time": "07:00", "period": "workday" }，用户点击 [默认铃声]
输出：
\`\`\`json
{
  "message": "好的～用铃声叫你！🔔\n\n要不要加个小任务让起床更清醒？",
  "extracted": { "wakeMode": "ringtone" },
  "needsMore": true,
  "suggestOptions": [
    { "label": "答题挑战", "value": "quiz", "field": "interactionType" },
    { "label": "摇一摇", "value": "shake", "field": "interactionType" },
    { "label": "小游戏", "value": "game", "field": "interactionType" },
    { "label": "不需要任务", "value": false, "field": "interactionEnabled" }
  ]
}
\`\`\`

**Step 4 - 收集 label**
输入：currentDraft = { "time": "07:00", "period": "workday", "wakeMode": "ringtone" }，用户点击 [不需要任务]
输出：
\`\`\`json
{
  "message": "好的～不加任务也可以！😊\n\n最后，给这个闹钟起个名字吧～比如'上班''早起'？",
  "extracted": { "interactionEnabled": false },
  "needsMore": true,
  "suggestOptions": [
    { "label": "上班", "value": "上班", "field": "label" },
    { "label": "健身", "value": "健身", "field": "label" },
    { "label": "学习", "value": "学习", "field": "label" },
    { "label": "自定义", "value": "custom", "field": "label" }
  ]
}
\`\`\`

**Step 5 - 显示摘要**
输入：currentDraft = { "time": "07:00", "period": "workday", "wakeMode": "ringtone", "interactionEnabled": false }，用户点击 [上班]
输出：
\`\`\`json
{
  "message": "好的～上班闹钟！✨\n\n完美～你的闹钟设置完成啦！🎉\n\n📝 闹钟摘要：\n📛 上班\n⏰ 07:00\n📅 工作日\n🔔 默认铃声\n❌ 无任务\n\n👉 可以点击【确认】按钮保存闹钟哦！",
  "extracted": { "label": "上班" },
  "needsMore": true
}
\`\`\`

## 示例 2：灵活提取（一次提供多个参数）

输入：currentDraft = {}，用户说 "明天早上7点叫我"
输出：
\`\`\`json
{
  "message": "好的～明天早上7点叫你！✨\n\n用什么声音叫醒你呢？",
  "extracted": { "time": "07:00", "period": "tomorrow" },
  "needsMore": true,
  "suggestOptions": [
    { "label": "默认铃声", "value": "ringtone", "field": "wakeMode" },
    { "label": "语音播报", "value": "voice", "field": "wakeMode" },
    { "label": "震动", "value": "vibration", "field": "wakeMode" }
  ]
}
\`\`\`

## 示例 3：修改参数

输入：currentDraft = { "time": "07:00", "period": "workday" }，用户说 "改成8点"
输出：
\`\`\`json
{
  "message": "好的～改成8点了！⏰\n\n用什么声音叫醒你呢？",
  "extracted": { "time": "08:00" },
  "needsMore": true,
  "suggestOptions": [
    { "label": "默认铃声", "value": "ringtone", "field": "wakeMode" },
    { "label": "语音播报", "value": "voice", "field": "wakeMode" },
    { "label": "震动", "value": "vibration", "field": "wakeMode" }
  ]
}
\`\`\`

## 示例 4：确认创建（个性化鼓励）

**情况 A：早起 + 工作日**
输入：currentDraft = { "time": "07:00", "period": "workday", "wakeMode": "ringtone", "interactionEnabled": false, "label": "上班" }，用户说 "确认"
输出：
\`\`\`json
{
  "message": "好的～闹钟已设置完成！工作日准时叫你！每天都元气满满！💼✨",
  "extracted": {},
  "needsMore": true
}
\`\`\`

**情况 B：超早起 + 有任务**
输入：currentDraft = { "time": "06:00", "period": "everyday", "wakeMode": "voice", "interactionEnabled": true, "interactionType": "quiz", "label": "健身" }，用户说 "确认"
输出：
\`\`\`json
{
  "message": "好的～闹钟已设置完成！哇！这么早还要做任务，太自律了！💪 答题挑战会让你更快清醒！",
  "extracted": {},
  "needsMore": true
}
\`\`\`

# ⚠️ 关键要点

1. **始终检查 currentDraft**：不重复问已有参数
2. **两段式回复**：确认 + 问下一步（摘要除外）
3. **灵活提取**：识别用户的自然语言输入，一次可提取多个参数
4. **修改后继续**：修改参数后继续流程，不重启
5. **自然对话**：像朋友聊天，不机械
6. **纯 JSON**：不要 markdown 代码块标记`;

export async function parseUserInputWithAI(userInput, currentDraft) {
  try {
    if (!OPENAI_API_KEY || !OPENAI_BASE_URL) {
      console.error('Missing OpenAI configuration');
      return {
        success: false,
        error: 'AI configuration missing',
      };
    }

    // Build context message with next-step guidance
    let nextField = '';
    if (currentDraft) {
      if (!currentDraft.time) nextField = 'time (时间)';
      else if (!currentDraft.period) nextField = 'period (周期)';
      else if (!currentDraft.wakeMode) nextField = 'wakeMode (声音)';
      else if (currentDraft.interactionEnabled === undefined) nextField = 'interactionEnabled (互动任务)';
      else if (!currentDraft.label) nextField = 'label (闹钟名称) - 最后一步';
      else nextField = 'COMPLETE - show summary or handle confirmation';
    } else {
      nextField = 'time (时间)';
    }

    const contextMessage = currentDraft
      ? `当前闹钟设置：${JSON.stringify({
          time: currentDraft.time,
          period: currentDraft.period,
          wakeMode: currentDraft.wakeMode,
          interactionEnabled: currentDraft.interactionEnabled,
          interactionType: currentDraft.interactionType,
          label: currentDraft.label,
        })}

下一步：你需要询问 "${nextField}"`
      : `当前闹钟设置：空 {}

下一步：你需要询问 "time (时间)"`;

    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions?api-version=${OPENAI_API_VERSION}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': OPENAI_API_KEY,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'system', content: contextMessage },
          { role: 'user', content: userInput },
        ],
        temperature: 0.7,
        max_tokens: 900,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return {
        success: false,
        error: `API error: ${response.status}`,
      };
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      return {
        success: false,
        error: 'No response from AI',
      };
    }

    let parsedResponse;
    try {
      // Step 1: Remove markdown code blocks
      let cleanedResponse = aiResponse.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');

      // Step 2: Try to extract JSON object if there's extra text
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      }

      // Step 3: Parse JSON (with automatic retry if control chars found)
      parsedResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      console.error('Parse error:', parseError.message);

      // Fallback: Try to extract message manually if JSON parsing fails
      // This handles control character issues and malformed JSON
      const messageMatch = aiResponse.match(/"message"\s*:\s*"([\s\S]*?)"\s*,/);
      if (messageMatch) {
        console.log('Using fallback: extracted message from malformed JSON');
        // Clean the extracted message
        let message = messageMatch[1]
          .replace(/\\n/g, '\n')  // Convert escaped newlines
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\\\/g, '\\');  // Convert escaped backslashes

        // Try to extract any fields from extracted object
        const extractedMatch = aiResponse.match(/"extracted"\s*:\s*\{([^}]*)\}/);
        let extracted = {};
        if (extractedMatch) {
          try {
            extracted = JSON.parse(`{${extractedMatch[1]}}`);
          } catch {
            // Ignore if can't parse extracted
          }
        }

        // Try to extract suggestOptions
        const optionsMatch = aiResponse.match(/"suggestOptions"\s*:\s*(\[[^\]]*\])/);
        let suggestOptions = null;
        if (optionsMatch) {
          try {
            suggestOptions = JSON.parse(optionsMatch[1]);
          } catch {
            // Ignore if can't parse options
          }
        }

        return {
          success: true,
          message,
          extracted,
          needsMore: true,
          suggestOptions,
        };
      }

      return {
        success: false,
        error: 'Invalid AI response format',
        rawResponse: aiResponse,
      };
    }

    return {
      success: true,
      message: parsedResponse.message || '',
      extracted: parsedResponse.extracted || {},
      needsMore: parsedResponse.needsMore !== false,
      suggestOptions: parsedResponse.suggestOptions || null,
    };
  } catch (error) {
    console.error('Monster AI error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export function isAlarmComplete(draft) {
  if (!draft) return false;

  // Check all required fields in order: time, period, wakeMode, interaction, label
  const hasTime = !!draft.time;
  const hasPeriod = !!draft.period;
  const hasWakeMode = !!draft.wakeMode;

  // interactionEnabled is set when user chooses (can be true or false)
  const hasInteraction = draft.interactionEnabled !== undefined;

  const hasLabel = !!draft.label;

  // All 5 steps must be completed
  return hasTime && hasPeriod && hasWakeMode && hasInteraction && hasLabel;
}
