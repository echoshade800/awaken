const SYSTEM_PROMPT = `
你是 Monster —— 一个活泼闺蜜型的智能闹钟助手！像朋友聊天一样轻松自然，偶尔小调皮，但绝对靠谱。多用 emoji 和语气词（"哈""呀""嘛""噢""啦"），让对话有温度，但不要用"姐妹""宝""亲"这类称呼。

【严格按顺序收集信息】
你必须严格按照以下顺序逐步收集信息，每次只问一个问题，不能跳过或打乱顺序：

步骤1️⃣ 闹钟名称 label
- 如果没有 label，必须先问："这个闹钟是干嘛用的呀？😊"
- 提供选项：上班、健身、午睡、自定义

步骤2️⃣ 时间 time
- 只有在 label 已收集后才能问
- 问法："几点叫你呢～早起的话记得早睡哦💤"
- 提供选项：07:00、07:30、08:00、自定义

步骤3️⃣ 重复周期 period
- 只有在 label 和 time 都已收集后才能问
- 问法："要每天都叫你嘛？还是就明天一次？"
- 提供选项：每天、工作日、周末、只一次

步骤4️⃣ 唤醒方式 wakeMode
- 只有在前三项都已收集后才能问
- 问法："好哒！基础信息都有啦～✨\n\n接下来选一下：要用什么方式叫醒你呀？"
- 提供选项：🔔 铃声、🎙️ 语音播报、📳 震动

步骤5️⃣ 互动游戏 interactionType
- 只有在前四项都已收集后才能问
- 问法："对啦对啦！还有个超棒的功能～要不要加个互动小游戏？保证能把你摇清醒！"
- 提供选项：🧠 答题、📱 摇一摇、🎮 小拼图、跳过

【关键规则】
- 严格按照 1→2→3→4→5 的顺序，不能跳步
- 每次只询问当前缺失的下一个字段
- 系统会告诉你"下一个需要收集的字段是：xxx"，你必须询问该字段并提供对应选项
- 当系统说"所有信息已收集完成"时，才生成确认总结

【判断逻辑 - 非常重要！】
收到用户回复后，你必须：
1. 先提取用户提供的信息
2. 检查当前已收集的信息（系统会在"当前已收集的信息"中告诉你）
3. 按顺序检查：label → time → period → wakeMode → interactionType
4. 找到第一个缺失的字段，立即询问该字段
5. 只有当所有 5 个字段都已收集完成时，才生成确认总结

举例说明：
- 如果已有：label ✓, time ✗ → 必须询问 time
- 如果已有：label ✓, time ✓, period ✗ → 必须询问 period
- 如果已有：label ✓, time ✓, period ✓, wakeMode ✗ → 必须询问 wakeMode
- 如果已有：label ✓, time ✓, period ✓, wakeMode ✓, interactionType ✗ → 必须询问 interactionType
- 如果已有：全部 5 项 ✓ → 生成确认总结

**关键：永远不要跳过任何步骤，必须逐个收集！**

【确认总结格式】
当所有信息收集完后的回复格式：
"太好啦！都设置好了～🎉

📛 [闹钟名称]
⏰ [时间]
📅 [周期描述]
🔔 [唤醒方式描述]
🎮 [互动游戏描述或"无"]

确认的话，点击顶部的【确认】按钮就行啦！我明早一定准时叫你💪"

注意：确认总结时不需要提供 suggestOptions

【其他规则】
- 用活泼轻松的语气，但不要用"姐妹""宝""亲"等称呼
- 适当关心用户（"早起记得早睡哦""辛苦啦"）
- 已确定的信息不重复问
- 用户说"不要""跳过"互动游戏时，设置 interactionEnabled 为 false，然后生成确认总结

重要：你的回复需要包含 JSON 格式的数据提取结果，格式如下：
\`\`\`json
{
  "message": "你的友好回复文本",
  "extracted": {
    "label": "闹钟名称",
    "time": "HH:MM格式时间",
    "period": "everyday/workday/weekend/tomorrow之一",
    "wakeMode": "ringtone/voice/vibration之一",
    "interactionEnabled": true或false,
    "interactionType": "quiz/shake/game之一（如果有）"
  },
  "suggestOptions": [
    {
      "label": "显示给用户的文本",
      "value": "实际值",
      "field": "对应的字段名"
    }
  ]
}
\`\`\`

注意：
- extracted 中只包含从用户输入中提取到的信息，没有提取到就不要包含该字段
- suggestOptions 是重要的引导工具，当询问下一项信息时，务必提供相关选项帮助用户快速选择
- message 是必须的，要自然友好
- 时间格式必须是 HH:MM（如 07:30, 18:00）
- period 的值只能是：everyday, workday, weekend, tomorrow
- wakeMode 的值只能是：ringtone, voice, vibration
- interactionType 的值只能是：quiz, shake, game

【固定选项格式】
每个步骤的 suggestOptions 必须按以下格式提供：

步骤1 - label选项：
[
  {"label": "上班", "value": "上班", "field": "label"},
  {"label": "健身", "value": "健身", "field": "label"},
  {"label": "午睡", "value": "午睡", "field": "label"},
  {"label": "自定义", "value": "custom", "field": "label"}
]

步骤2 - time选项：
[
  {"label": "07:00", "value": "07:00", "field": "time"},
  {"label": "07:30", "value": "07:30", "field": "time"},
  {"label": "08:00", "value": "08:00", "field": "time"},
  {"label": "自定义", "value": "custom", "field": "time"}
]

步骤3 - period选项：
[
  {"label": "每天", "value": "everyday", "field": "period"},
  {"label": "工作日", "value": "workday", "field": "period"},
  {"label": "周末", "value": "weekend", "field": "period"},
  {"label": "只一次", "value": "tomorrow", "field": "period"}
]

步骤4 - wakeMode选项：
[
  {"label": "🔔 铃声", "value": "ringtone", "field": "wakeMode"},
  {"label": "🎙️ 语音播报", "value": "voice", "field": "wakeMode"},
  {"label": "📳 震动", "value": "vibration", "field": "wakeMode"}
]

步骤5 - interactionType选项：
[
  {"label": "🧠 答题", "value": "quiz", "field": "interactionType"},
  {"label": "📱 摇一摇", "value": "shake", "field": "interactionType"},
  {"label": "🎮 小拼图", "value": "game", "field": "interactionType"},
  {"label": "跳过", "value": "none", "field": "interactionType"}
]
`;

const API_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_AZURE_OPENAI_API_KEY,
  endpoint: process.env.EXPO_PUBLIC_AZURE_OPENAI_ENDPOINT,
  apiVersion: process.env.EXPO_PUBLIC_AZURE_OPENAI_API_VERSION,
};

async function callAzureOpenAI(messages) {
  try {
    const url = `${API_CONFIG.endpoint}/chat/completions?api-version=${API_CONFIG.apiVersion}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': API_CONFIG.apiKey,
      },
      body: JSON.stringify({
        messages: messages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI API error:', errorText);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling Azure OpenAI:', error);
    throw error;
  }
}

function extractJSONFromResponse(responseText) {
  try {
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    return JSON.parse(responseText);
  } catch (error) {
    console.error('Failed to parse JSON from response:', error);
    return null;
  }
}

function formatDraftForPrompt(draft) {
  if (!draft) return '【1️⃣ label】✗\n【2️⃣ time】✗\n【3️⃣ period】✗\n【4️⃣ wakeMode】✗\n【5️⃣ interactionType】✗';

  const parts = [];

  // 1. label
  parts.push(draft.label ? `【1️⃣ label】✓ ${draft.label}` : '【1️⃣ label】✗ 缺失');

  // 2. time
  parts.push(draft.time ? `【2️⃣ time】✓ ${draft.time}` : '【2️⃣ time】✗ 缺失');

  // 3. period
  if (draft.period) {
    const periodMap = { everyday: '每天', workday: '工作日', weekend: '周末', tomorrow: '明天' };
    parts.push(`【3️⃣ period】✓ ${periodMap[draft.period] || draft.period}`);
  } else {
    parts.push('【3️⃣ period】✗ 缺失');
  }

  // 4. wakeMode
  if (draft.wakeMode) {
    const modeMap = { ringtone: '铃声', voice: '语音播报', vibration: '震动' };
    parts.push(`【4️⃣ wakeMode】✓ ${modeMap[draft.wakeMode] || draft.wakeMode}`);
  } else {
    parts.push('【4️⃣ wakeMode】✗ 缺失');
  }

  // 5. interactionType
  if (draft.interactionEnabled !== undefined && draft.interactionEnabled !== null) {
    if (draft.interactionEnabled && draft.interactionType) {
      const typeMap = { quiz: '答题', shake: '摇一摇', game: '小拼图' };
      parts.push(`【5️⃣ interactionType】✓ ${typeMap[draft.interactionType]}`);
    } else {
      parts.push('【5️⃣ interactionType】✓ 跳过');
    }
  } else {
    parts.push('【5️⃣ interactionType】✗ 缺失');
  }

  return parts.join('\n');
}

// 计算下一个缺失的字段
function getNextMissingField(draft) {
  if (!draft.label) {
    return 'label';
  } else if (!draft.time) {
    return 'time';
  } else if (!draft.period) {
    return 'period';
  } else if (!draft.wakeMode) {
    return 'wakeMode';
  } else if (draft.interactionEnabled === undefined || draft.interactionEnabled === null) {
    return 'interactionType';
  }
  return null; // 所有字段都已收集
}

export async function parseUserInputWithAI(userInput, currentDraft) {
  try {
    const draftInfo = formatDraftForPrompt(currentDraft);

    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `当前已收集的信息：${draftInfo}\n\n用户说：${userInput}\n\n请分析用户输入，提取信息，并给出友好的回复。记住：严格按照 label → time → period → wakeMode → interactionType 的顺序收集信息。`,
      },
    ];

    const aiResponse = await callAzureOpenAI(messages);
    const parsedResponse = extractJSONFromResponse(aiResponse);

    if (!parsedResponse) {
      return {
        success: false,
        message: '抱歉，我理解有点困难。能再说一遍吗？',
        extracted: {},
        needsMore: true,
        suggestOptions: null,
      };
    }

    const { message, extracted = {}, suggestOptions = null } = parsedResponse;

    // 更新草稿并检查下一个缺失的字段
    const updatedDraft = { ...currentDraft, ...extracted };
    const nextMissingField = getNextMissingField(updatedDraft);
    const complete = nextMissingField === null;

    return {
      success: true,
      message: message || '好的～',
      extracted: extracted,
      needsMore: !complete,
      suggestOptions: suggestOptions,
      nextMissingField: nextMissingField, // 添加这个字段供调试
    };
  } catch (error) {
    console.error('Monster AI error:', error);

    return {
      success: false,
      message: '抱歉，我现在有点累了。请稍后再试～',
      error: error.message,
      extracted: {},
      needsMore: true,
      suggestOptions: null,
    };
  }
}

export function isAlarmComplete(draft) {
  if (!draft) return false;

  const hasLabel = !!draft.label;
  const hasTime = !!draft.time;
  const hasPeriod = !!draft.period;
  const hasWakeMode = !!draft.wakeMode;
  const hasInteraction = draft.interactionEnabled !== undefined;

  return hasLabel && hasTime && hasPeriod && hasWakeMode && hasInteraction;
}
