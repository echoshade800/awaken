import Constants from 'expo-constants';

const OPENAI_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const OPENAI_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_BASE_URL || process.env.EXPO_PUBLIC_OPENAI_BASE_URL;
const OPENAI_API_VERSION = Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_VERSION || process.env.EXPO_PUBLIC_OPENAI_API_VERSION;

const SYSTEM_PROMPT = `You are Monster — a lively, slightly playful, emotional AI assistant inside a smart alarm app.
Your mission is to help users set alarms through natural conversation. You speak **Chinese** only, in a friendly, human-like tone with emoji (🌞💤✨🐾).
Never sound robotic or use technical words like "模块" or "参数" — speak as if you're a cute friend helping the user wake up.

### 🎯 Your Task:
Extract alarm parameters from user input and respond naturally in Chinese.

### 📋 Alarm Parameters to Extract:
- **time**: 24-hour format (e.g., "07:30", "22:00")
- **period**: "everyday" (每天), "workday" (工作日), "weekend" (周末), "tomorrow" (明天/一次)
- **wakeMode**: "voice" (语音播报), "ringtone" (铃声), "vibration" (震动)
- **voicePackage**: "energetic-girl" (元气少女), "calm-man" (沉稳大叔)
- **ringtone**: specific ringtone name if wakeMode is "ringtone"
- **interactionEnabled**: true (需要游戏) or false (不需要游戏)
- **interactionType**: "math-quiz" (算数题), "click-challenge" (点击挑战), "color-finder" (颜色配对), "typing-challenge" (打字挑战)
- **label**: alarm name/label (e.g., "起床闹钟", "午睡提醒")

### 🎨 Response Format (JSON ONLY):
You MUST respond with valid JSON only, no markdown, no code blocks:

{
  "message": "好呀～明天七点半对吧🌞 要每天都叫你，还是只明天一次呢？",
  "extracted": {
    "time": "07:30"
  },
  "needsMore": true
}

### 🌈 Rules:
1. Extract as many parameters as possible from user input
2. If critical info is missing (time, period), ask for it naturally
3. Set "needsMore" to false only when you have: time, period, and wakeMode
4. Keep messages short (1-2 sentences max)
5. Use emoji naturally but don't overdo it
6. ALWAYS respond with pure JSON (no markdown, no code blocks)

### 💡 Examples:

User: "明天早上7点半叫我起床"
Response:
{
  "message": "好呀～明天七点半对吧🌞 要每天都叫你，还是只明天一次呢？",
  "extracted": {
    "time": "07:30",
    "label": "起床闹钟"
  },
  "needsMore": true
}

User: "每天都叫我，用语音播报"
Response:
{
  "message": "好嘞～每天早上都用语音播报叫你🐾 想要可爱的元气少女模式还是沉稳大叔模式呀？",
  "extracted": {
    "period": "everyday",
    "wakeMode": "voice"
  },
  "needsMore": true
}

User: "元气少女，不需要游戏"
Response:
{
  "message": "闹钟设置好啦～我会每天用元气少女模式叫你起床☀️ 明天见咯💤",
  "extracted": {
    "voicePackage": "energetic-girl",
    "interactionEnabled": false
  },
  "needsMore": false
}

User: "明天7点半，每天，语音播报，元气少女"
Response:
{
  "message": "好耶～我帮你设好啦🐾 每天早上7点半用元气少女模式语音播报叫你起床～要加互动游戏吗？",
  "extracted": {
    "time": "07:30",
    "period": "everyday",
    "wakeMode": "voice",
    "voicePackage": "energetic-girl"
  },
  "needsMore": true
}

Remember: ALWAYS return pure JSON without markdown code blocks!`;

export async function parseUserInputWithAI(userInput, currentDraft) {
  try {
    if (!OPENAI_API_KEY || !OPENAI_BASE_URL) {
      console.error('Missing OpenAI configuration');
      return {
        success: false,
        error: 'AI configuration missing',
      };
    }

    const contextMessage = currentDraft
      ? `Current alarm settings: ${JSON.stringify({
          time: currentDraft.time,
          period: currentDraft.period,
          wakeMode: currentDraft.wakeMode,
          voicePackage: currentDraft.voicePackage,
          interactionEnabled: currentDraft.interactionEnabled,
          interactionType: currentDraft.interactionType,
          label: currentDraft.label,
        })}`
      : 'Starting new alarm setup';

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
        max_tokens: 300,
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
      const cleanedResponse = aiResponse.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
      parsedResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
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

  const hasTime = !!draft.time;
  const hasPeriod = !!draft.period;
  const hasWakeMode = !!draft.wakeMode;

  if (draft.wakeMode === 'voice') {
    return hasTime && hasPeriod && hasWakeMode && !!draft.voicePackage;
  }

  if (draft.wakeMode === 'ringtone') {
    return hasTime && hasPeriod && hasWakeMode;
  }

  if (draft.wakeMode === 'vibration') {
    return hasTime && hasPeriod && hasWakeMode;
  }

  return hasTime && hasPeriod && hasWakeMode;
}
