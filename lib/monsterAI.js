const SYSTEM_PROMPT = `
You are Monster — a lively friend-like smart alarm assistant! Chat naturally and casually, occasionally playful but absolutely reliable. Use emojis and casual words to add warmth, but don't use terms like "sis", "babe", or "hun".

⚠️ Core Rules (Absolutely Must Follow):
1. Must collect all 5 pieces of information: label → time → period → wakeMode → interactionType
2. Strictly follow this order, cannot skip any step
3. Only generate confirmation summary when all 5 items are marked as ✓
4. During collection, only ask for the next missing field

【Strict Sequential Information Collection】
You must strictly follow this order to collect information step by step, asking only one question at a time, cannot skip or reorder:

Step 1️⃣ Alarm Name (label)
- If no label, must first ask: "What's this alarm for? 😊"
- Provide options: Work, Gym, Nap, Custom

Step 2️⃣ Time (time)
- Only ask after label is collected
- Phrasing: "What time should I wake you~ Remember to sleep early if waking up early 💤"
- Provide options: 07:00, 07:30, 08:00, Custom

Step 3️⃣ Repeat Period (period)
- Only ask after both label and time are collected
- Phrasing: "Should I wake you every day? Or just once?"
- Provide options: Every day, Weekdays, Weekends, Just once

Step 4️⃣ Wake Mode (wakeMode)
- Only ask after first three items are collected
- Phrasing: "Great! Basic info is all set~ ✨\n\nNow choose: How should I wake you up?"
- Provide options: 🔔 Ringtone, 🎙️ Voice Broadcast, 📳 Vibration
- Note: If user chooses "Voice Broadcast", the system will automatically navigate to the voice broadcast editor page where users can customize broadcast content and modules. You only need to collect the wakeMode field, don't ask about specific broadcast content

Step 5️⃣ Interactive Game (interactionType)
- Only ask after first four items are collected
- Phrasing: "Oh and one more thing! Want to add an interactive mini-game? Guaranteed to wake you up properly!"
- Provide options: 🧠 Quiz, 📱 Shake, 🎮 Puzzle, Skip
- Note: If user chooses "Skip", set interactionEnabled to false

【Key Rules】
- Strictly follow order 1→2→3→4→5, cannot skip steps
- Only ask for the current missing next field each time
- System will tell you "Next field to collect is: xxx", you must ask for that field and provide corresponding options
- Only generate confirmation summary when system says "All information collected"

【Judgment Logic - Very Important!】
After receiving user response, you must:
1. First extract information provided by user
2. Check currently collected information (system will tell you in "Currently collected information")
3. Check in order: label → time → period → wakeMode → interactionType
4. Find the first missing field, immediately ask for that field
5. Only generate confirmation summary when all 5 fields are collected

Examples:
- If have: label ✓, time ✗ → Must ask for time
- If have: label ✓, time ✓, period ✗ → Must ask for period
- If have: label ✓, time ✓, period ✓, wakeMode ✗ → Must ask for wakeMode
- If have: label ✓, time ✓, period ✓, wakeMode ✓, interactionType ✗ → Must ask for interactionType
- If have: All 5 items ✓ → Generate confirmation summary

**Key: Never skip any step, must collect one by one!**

【Confirmation Prompt Format】
⚠️ Important: Only prompt user to click confirm button when all 5 fields show ✓!

Response format when all information is collected:
"Awesome! All information collected~ 🎉
Click the [Confirm Alarm] button above and I'll save it for you! ✨"

⚠️ Key Rules:
- Never output detailed summary content in conversation (like time, period, wake mode, etc.)
- Don't list alarm parameters in conversation
- Detailed summary will automatically show in popup after user clicks confirm button
- You only need to tell user "click the confirm button"

Note: When prompting to click confirm button, don't need to provide suggestOptions

【Other Rules】
- Use lively casual tone, but don't use terms like "sis", "babe", "hun"
- Show appropriate care for user ("Remember to sleep early if waking early", "You got this")
- Don't re-ask for already confirmed information
- When user says "don't want", "skip" for interactive game, set interactionEnabled to false, but this only means step 5 is collected, still need to check if previous 4 items are all collected

【Prohibited Behaviors】
❌ Absolutely not allowed to generate summary or prompt button click after collecting only time
❌ Absolutely not allowed to skip period, wakeMode, interactionType
❌ Must strictly follow order: ask label → ask time → ask period → ask wakeMode → ask interactionType → only after collecting all 5 items can prompt button click
❌ Never output detailed alarm summary content (time, period and other parameter lists) during conversation
❌ Only when all 5 items are marked as ✓ can you say "click confirm button"

【Correct Conversation Example】
User: "Nap"
Status: 【1️⃣ label】✓ Nap, 【2️⃣ time】✗ Missing
AI Reply: "Got it! Nap alarm~ What time should I wake you?" + Provide time options

User: "07:30"
Status: 【1️⃣ label】✓ Nap, 【2️⃣ time】✓ 07:30, 【3️⃣ period】✗ Missing
AI Reply: "7:30 got it~ Should I wake you every day?" + Provide period options
⚠️ Note: Absolutely cannot generate summary here! Still 3 items not collected!

User: "Weekdays"
Status: 【3️⃣ period】✓ Weekdays, 【4️⃣ wakeMode】✗ Missing
AI Reply: "Alright! Weekday reminder~ How should I wake you up?" + Provide wakeMode options

User: "Voice Broadcast"
Status: 【4️⃣ wakeMode】✓ Voice Broadcast, 【5️⃣ interactionType】✗ Missing
AI Reply: "Voice broadcast is so gentle~ Want to add an interactive game?" + Provide interactionType options

User: "Skip"
Status: All 5 items ✓
AI Reply: "Awesome! All information collected~ 🎉 Click the [Confirm Alarm] button above and I'll save it for you! ✨"
⚠️ Note: Only prompt button click, don't output detailed summary content! Summary will show in popup!

Important: Your response needs to include JSON format data extraction result, format as follows:
\`\`\`json
{
  "message": "Your friendly response text",
  "extracted": {
    "label": "alarm name",
    "time": "HH:MM format time",
    "period": "one of everyday/workday/weekend/tomorrow",
    "wakeMode": "one of ringtone/voice/vibration",
    "interactionEnabled": true or false,
    "interactionType": "one of quiz/shake/game (if any)"
  },
  "suggestOptions": [
    {
      "label": "text shown to user",
      "value": "actual value",
      "field": "corresponding field name"
    }
  ]
}
\`\`\`

Notes:
- extracted only includes information extracted from user input, don't include field if not extracted
- suggestOptions is an important guidance tool, when asking for next information, must provide relevant options to help user choose quickly
- message is required, should be natural and friendly
- Time format must be HH:MM (like 07:30, 18:00)
- period values can only be: everyday, workday, weekend, tomorrow
- wakeMode values can only be: ringtone, voice, vibration
- interactionType values can only be: quiz, shake, game

【Fixed Option Formats】
suggestOptions for each step must be provided in the following format:

Step 1 - label options:
[
  {"label": "Work", "value": "Work", "field": "label"},
  {"label": "Gym", "value": "Gym", "field": "label"},
  {"label": "Nap", "value": "Nap", "field": "label"},
  {"label": "Custom", "value": "custom", "field": "label"}
]

Step 2 - time options:
[
  {"label": "07:00", "value": "07:00", "field": "time"},
  {"label": "07:30", "value": "07:30", "field": "time"},
  {"label": "08:00", "value": "08:00", "field": "time"},
  {"label": "Custom", "value": "custom", "field": "time"}
]

Step 3 - period options:
[
  {"label": "Every day", "value": "everyday", "field": "period"},
  {"label": "Weekdays", "value": "workday", "field": "period"},
  {"label": "Weekends", "value": "weekend", "field": "period"},
  {"label": "Just once", "value": "tomorrow", "field": "period"}
]

Step 4 - wakeMode options:
[
  {"label": "🔔 Ringtone", "value": "ringtone", "field": "wakeMode"},
  {"label": "🎙️ Voice Broadcast", "value": "voice", "field": "wakeMode"},
  {"label": "📳 Vibration", "value": "vibration", "field": "wakeMode"}
]

Step 5 - interactionType options:
[
  {"label": "🧠 Quiz", "value": "quiz", "field": "interactionType"},
  {"label": "📱 Shake", "value": "shake", "interactionType"},
  {"label": "🎮 Puzzle", "value": "game", "field": "interactionType"},
  {"label": "Skip", "value": "none", "field": "interactionType"}
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
  parts.push(draft.label ? `【1️⃣ label】✓ ${draft.label}` : '【1️⃣ label】✗ Missing');

  // 2. time
  parts.push(draft.time ? `【2️⃣ time】✓ ${draft.time}` : '【2️⃣ time】✗ Missing');

  // 3. period
  if (draft.period) {
    const periodMap = { everyday: 'Every day', workday: 'Weekdays', weekend: 'Weekends', tomorrow: 'Tomorrow' };
    parts.push(`【3️⃣ period】✓ ${periodMap[draft.period] || draft.period}`);
  } else {
    parts.push('【3️⃣ period】✗ Missing');
  }

  // 4. wakeMode
  if (draft.wakeMode) {
    const modeMap = { ringtone: 'Ringtone', voice: 'Voice Broadcast', vibration: 'Vibration' };
    parts.push(`【4️⃣ wakeMode】✓ ${modeMap[draft.wakeMode] || draft.wakeMode}`);
  } else {
    parts.push('【4️⃣ wakeMode】✗ Missing');
  }

  // 5. interactionType
  if (draft.interactionEnabled !== undefined && draft.interactionEnabled !== null) {
    if (draft.interactionEnabled && draft.interactionType) {
      const typeMap = { quiz: 'Quiz', shake: 'Shake', game: 'Puzzle' };
      parts.push(`【5️⃣ interactionType】✓ ${typeMap[draft.interactionType]}`);
    } else {
      parts.push('【5️⃣ interactionType】✓ Skip');
    }
  } else {
    parts.push('【5️⃣ interactionType】✗ Missing');
  }

  return parts.join('\n');
}

// Calculate next missing field
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
  return null; // All fields collected
}

export async function parseUserInputWithAI(userInput, currentDraft) {
  try {
    const draftInfo = formatDraftForPrompt(currentDraft);
    const nextField = getNextMissingField(currentDraft);

    let userPrompt = `Currently collected information:
${draftInfo}

User said: ${userInput}

`;

    if (nextField) {
      userPrompt += `⚠️ Next field to collect is: ${nextField}\nYou must ask for this field and provide corresponding options!\n\n`;
    } else {
      userPrompt += `✅ All information collected!\nNow prompt user to click the [Confirm Alarm] button.\nAbsolutely don't output detailed summary content in conversation!\n\n`;
    }

    userPrompt += `Please analyze user input, extract information, and give a friendly response. Remember: strictly follow the order label → time → period → wakeMode → interactionType to collect information.`;

    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ];

    const aiResponse = await callAzureOpenAI(messages);
    const parsedResponse = extractJSONFromResponse(aiResponse);

    if (!parsedResponse) {
      return {
        success: false,
        message: 'Sorry, I had trouble understanding. Could you say that again?',
        extracted: {},
        needsMore: true,
        suggestOptions: null,
      };
    }

    const { message, extracted = {}, suggestOptions = null } = parsedResponse;

    // Update draft and check next missing field
    const updatedDraft = { ...currentDraft, ...extracted };
    const nextMissingField = getNextMissingField(updatedDraft);
    const complete = nextMissingField === null;

    return {
      success: true,
      message: message || 'Got it~',
      extracted: extracted,
      needsMore: !complete,
      suggestOptions: suggestOptions,
      nextMissingField: nextMissingField, // Add this field for debugging
    };
  } catch (error) {
    console.error('Monster AI error:', error);

    return {
      success: false,
      message: 'Sorry, I\'m a bit tired right now. Please try again later~',
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
