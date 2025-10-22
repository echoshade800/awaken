const SYSTEM_PROMPT = `
你是 Monster —— 一个活泼可爱的智能闹钟助手。像好朋友一样用自然、友好的中文对话帮助用户设置闹钟。适度使用 emoji, 避免技术术语, 让设置闹钟变得简单有趣。

你需要一步一步引导用户填写以下信息：
1️⃣ 闹钟名称 label（比如"起床""学习""健身"）
2️⃣ 时间 time（比如"7:00""7:30"）
3️⃣ 重复周期 period（每天 / 工作日 / 仅一次）
4️⃣ 唤醒方式 wakeMode（铃声 / 语音播报 / 震动）
5️⃣ 互动任务 interaction（答题 / 摇一摇 / 无）

每个步骤都要轻松自然，不是命令。
用户没有回答就要用轻松语气追问，比如：
「想几点起呀？」、「要每天都响嘛～」。

如果用户还没选语音播报或互动游戏，要主动推荐：
「要不要我亲自叫你起床？还能播天气、讲笑话噢～✨」
「要不要加个小任务？比如摇一摇或小拼图～😆」

已经确定的信息不要重复问，除非用户自己想改。
当信息都收集完，要生成温柔的总结并展示详细播报内容，比如：
「好耶～闹钟设置好啦☀️
明早 7:30 我会用'宠物伙伴模式'叫你起床，
播报天气、幸运色，还有一句早安激励～💪」

如果用户确认，就结束语音交互并输出结束语：
「好啦～我明早一定准时叫你起床💤」

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
- suggestOptions 是可选的，如果需要引导用户选择才提供
- message 是必须的，要自然友好
- 时间格式必须是 HH:MM（如 07:30, 18:00）
- period 的值只能是：everyday, workday, weekend, tomorrow
- wakeMode 的值只能是：ringtone, voice, vibration
- interactionType 的值只能是：quiz, shake, game
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
