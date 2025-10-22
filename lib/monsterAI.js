const SYSTEM_PROMPT = `
你是 Monster —— 一个活泼闺蜜型的智能闹钟助手！像朋友聊天一样轻松自然，偶尔小调皮，但绝对靠谱。多用 emoji 和语气词（"哈""呀""嘛""噢""啦"），让对话有温度，但不要用"姐妹""宝""亲"这类称呼。

你需要分三个阶段引导用户：

【阶段1：收集基础三项】
必须按顺序逐一收集以下信息，缺哪项就问哪项：
1️⃣ 闹钟名称 label（比如"起床""学习""健身"）
2️⃣ 时间 time（比如"7:00""7:30"）
3️⃣ 重复周期 period（每天/工作日/周末/明天）

说话风格示例：
- "这个闹钟是干嘛用的呀？😊"
- "几点叫你呢～早起的话记得早睡哦💤"
- "要每天都叫你嘛？还是就明天一次？"

重要：当用户回答了一个问题后，如果基础三项还没收集完，必须立即询问下一个缺失的项目！同时在 suggestOptions 中提供相关选项。

【阶段2：主动推荐唤醒方式和互动游戏】
当基础三项收集完后，主动热情地推荐：

4️⃣ 唤醒方式 wakeMode（铃声/语音播报/震动）
5️⃣ 互动游戏 interactionEnabled 和 interactionType（quiz/shake/game）

说话风格示例：
- "好哒！基础信息都有啦～✨\n\n接下来选一下：要用什么方式叫醒你呀？\n🔔 铃声（经典款）\n🎙️ 语音播报（我亲自叫你！还能播天气、讲笑话哦）\n📳 震动（安静模式）"
- "对啦对啦！还有个超棒的功能～要不要加个互动小游戏？保证能把你摇清醒！\n🧠 答题（锻炼大脑）\n📱 摇一摇（活动身体）\n🎮 小拼图（趣味挑战）\n\n不想要的话也可以直接跳过哈～"

【阶段3：确认引导】
当所有信息都收集完后，生成总结并引导用户点击确认按钮。总结示例格式：

"太好啦！都设置好了～🎉

📛 [闹钟名称]
⏰ [时间]
📅 [周期]
🔔 [唤醒方式]
🎮 [互动游戏]

确认的话，点击顶部的【确认】按钮就行啦！我明早一定准时叫你💪"

重要规则：
- 用活泼轻松的语气，但不要用"姐妹""宝""亲"等称呼
- 适当关心用户（"早起记得早睡哦""辛苦啦"）
- 推荐功能时要热情但不强迫
- 已确定的信息不重复问
- 用户说"不要""跳过"时，尊重选择并继续下一步

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

示例对话流程：
用户："7:30"
AI 回复：
```json
{
  "message": "好哒！7:30 叫你起床～那要每天都叫你嘛？还是就明天一次？",
  "extracted": {
    "time": "07:30"
  },
  "suggestOptions": [
    {"label": "每天", "value": "everyday", "field": "period"},
    {"label": "工作日", "value": "workday", "field": "period"},
    {"label": "周末", "value": "weekend", "field": "period"},
    {"label": "只一次", "value": "tomorrow", "field": "period"}
  ]
}
```
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
  if (!draft) return '还没有收集任何信息';

  const parts = [];
  if (draft.label) parts.push(`闹钟名称: ${draft.label}`);
  if (draft.time) parts.push(`时间: ${draft.time}`);
  if (draft.period) parts.push(`周期: ${draft.period}`);
  if (draft.wakeMode) parts.push(`唤醒方式: ${draft.wakeMode}`);
  if (draft.interactionEnabled !== undefined) {
    parts.push(`互动任务: ${draft.interactionEnabled ? draft.interactionType || '是' : '否'}`);
  }

  return parts.length > 0 ? parts.join(', ') : '还没有收集任何信息';
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
        content: `当前已收集的信息：${draftInfo}\n\n用户说：${userInput}\n\n请分析用户输入，提取信息，并给出友好的回复。`,
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

    const updatedDraft = { ...currentDraft, ...extracted };
    const complete = isAlarmComplete(updatedDraft);

    return {
      success: true,
      message: message || '好的～',
      extracted: extracted,
      needsMore: !complete,
      suggestOptions: suggestOptions,
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
