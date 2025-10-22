function parseTime(input) {
  const timeMatch = input.match(/(\d{1,2})[:\：](\d{2})/);
  if (timeMatch) {
    const hour = timeMatch[1].padStart(2, '0');
    const minute = timeMatch[2];
    return `${hour}:${minute}`;
  }

  const hourOnlyMatch = input.match(/(\d{1,2})\s*点/);
  if (hourOnlyMatch) {
    const hour = hourOnlyMatch[1].padStart(2, '0');
    return `${hour}:00`;
  }

  return null;
}

function parsePeriod(input) {
  if (/每天|天天/.test(input)) return 'everyday';
  if (/工作日|周一到周五|星期一到星期五/.test(input)) return 'workday';
  if (/周末|星期六|星期天|星期日/.test(input)) return 'weekend';
  if (/明天|只.*一次|就.*一次/.test(input)) return 'tomorrow';
  return null;
}

function parseLabel(input) {
  if (/上班|工作|打卡/.test(input)) return '上班';
  if (/健身|运动|锻炼/.test(input)) return '健身';
  if (/学习|读书/.test(input)) return '学习';
  if (/午睡|午休/.test(input)) return '午睡';
  return null;
}

function getNextMissingField(draft) {
  if (!draft.label) return 'label';
  if (!draft.time) return 'time';
  if (!draft.period) return 'period';
  if (!draft.wakeMode) return 'wakeMode';
  if (draft.interactionEnabled === undefined) return 'interaction';
  return null;
}

function generateEncouragement(draft) {
  if (!draft) return '快去试试吧！';

  const timeHour = draft.time ? parseInt(draft.time.split(':')[0]) : null;
  const hasTask = draft.interactionEnabled === true;
  const period = draft.period;

  let encouragement = '';

  if (timeHour >= 5 && timeHour < 7) {
    encouragement = hasTask
      ? '哇！这么早还要做任务，太自律了！💪 答题挑战会让你更快清醒！'
      : '哇！这么早，太自律了！💪';
  } else if (timeHour >= 7 && timeHour < 9) {
    if (period === 'workday') {
      encouragement = '工作日准时叫你！每天都元气满满！💼✨';
    } else {
      encouragement = '准时叫你起床！元气满满！✨';
    }
  } else if (timeHour >= 22 || timeHour < 3) {
    encouragement = '到点记得放下手机休息哦！充足睡眠很重要～😴';
  } else if (timeHour >= 12 && timeHour < 14) {
    encouragement = '午休时间到～好好休息才能下午更有精神！💤';
  } else if (period === 'weekend') {
    encouragement = '周末也要规律作息哦！休息好了才能更好地玩！🎉';
  } else if (hasTask) {
    const taskType = draft.interactionType;
    if (taskType === 'quiz') {
      encouragement = '答题挑战会让你更快清醒！🧠';
    } else if (taskType === 'shake') {
      encouragement = '摇一摇醒神利器！📱';
    } else if (taskType === 'game') {
      encouragement = '小游戏让起床更有趣！🎮';
    } else {
      encouragement = '快去试试吧！';
    }
  } else {
    encouragement = '快去试试吧！';
  }

  return encouragement;
}

function formatPeriodChinese(period) {
  const map = {
    everyday: '每天',
    workday: '工作日',
    weekend: '周末',
    tomorrow: '只明天一次',
  };
  return map[period] || period;
}

function formatWakeModeChinese(wakeMode) {
  const map = {
    ringtone: '默认铃声',
    voice: '语音播报',
    vibration: '震动',
  };
  return map[wakeMode] || wakeMode;
}

export async function parseUserInputWithAI(userInput, currentDraft) {
  try {
    const draft = currentDraft || {};
    const extracted = {};
    let message = '';
    let suggestOptions = null;

    const lowerInput = userInput.toLowerCase();

    const isConfirmation = /^(确认|确定|好的|保存|创建)$/.test(userInput.trim());
    if (isConfirmation && getNextMissingField(draft) === null) {
      const encouragement = generateEncouragement(draft);
      return {
        success: true,
        message: `好的～闹钟已设置完成！${encouragement}🎉`,
        extracted: {},
        needsMore: true,
        suggestOptions: null,
      };
    }

    const time = parseTime(userInput);
    if (time) extracted.time = time;

    const period = parsePeriod(userInput);
    if (period) extracted.period = period;

    const label = parseLabel(userInput);
    if (label) extracted.label = label;

    const updatedDraft = { ...draft, ...extracted };
    const nextField = getNextMissingField(updatedDraft);

    if (Object.keys(extracted).length > 0) {
      const extractedKeys = Object.keys(extracted);
      if (extractedKeys.includes('time')) {
        message = `好的～${extracted.time}叫你起床！✨`;
      } else if (extractedKeys.includes('period')) {
        const periodText = formatPeriodChinese(extracted.period);
        message = `好～${periodText}${updatedDraft.time || ''}叫你！💼`;
      } else if (extractedKeys.includes('label')) {
        message = `好的～${extracted.label}闹钟！✨`;
      }
    }

    if (nextField === null) {
      const periodText = formatPeriodChinese(updatedDraft.period);
      const wakeModeText = formatWakeModeChinese(updatedDraft.wakeMode);
      const taskText = updatedDraft.interactionEnabled ? '✅ 有任务' : '❌ 无任务';

      message = `${message ? message + '\n\n' : ''}完美～你的闹钟设置完成啦！🎉

📝 闹钟摘要：
📛 ${updatedDraft.label}
⏰ ${updatedDraft.time}
📅 ${periodText}
🔔 ${wakeModeText}
${taskText}

👉 可以点击【确认】按钮保存闹钟哦！`;

      return {
        success: true,
        message,
        extracted,
        needsMore: true,
        suggestOptions: null,
      };
    }

    if (message) message += '\n\n';

    if (nextField === 'label') {
      message += '要给这个闹钟取个名字吗？比如上班、健身、午睡～';
      suggestOptions = [
        { label: '上班', value: '上班', field: 'label' },
        { label: '健身', value: '健身', field: 'label' },
        { label: '午睡', value: '午睡', field: 'label' },
        { label: '自定义', value: 'custom', field: 'label' },
      ];
    } else if (nextField === 'time') {
      message += '想几点起呀？我猜你可能想设个07:30的闹钟～要不要我帮你？🌞';
      suggestOptions = [
        { label: '6:30', value: '06:30', field: 'time' },
        { label: '7:00', value: '07:00', field: 'time' },
        { label: '7:30', value: '07:30', field: 'time' },
        { label: '自定义时间', value: 'custom', field: 'time' },
      ];
    } else if (nextField === 'period') {
      message += '要每天都叫你，还是只明天一次呀？';
      suggestOptions = [
        { label: '每天', value: 'everyday', field: 'period' },
        { label: '工作日', value: 'workday', field: 'period' },
        { label: '周末', value: 'weekend', field: 'period' },
        { label: '只这一次', value: 'tomorrow', field: 'period' },
      ];
    } else if (nextField === 'wakeMode') {
      message += '用什么方式叫醒你呢？';
      suggestOptions = [
        { label: '默认铃声', value: 'ringtone', field: 'wakeMode' },
        { label: '语音播报', value: 'voice', field: 'wakeMode' },
        { label: '震动', value: 'vibration', field: 'wakeMode' },
      ];
    } else if (nextField === 'interaction') {
      message += '要不要加个小任务让起床更清醒？';
      suggestOptions = [
        { label: '答题挑战', value: 'quiz', field: 'interactionType' },
        { label: '摇一摇', value: 'shake', field: 'interactionType' },
        { label: '小游戏', value: 'game', field: 'interactionType' },
        { label: '不需要任务', value: false, field: 'interactionEnabled' },
      ];
    }

    if (!message) {
      message = '嗯～我还需要一些信息。请继续输入或选择～';
    }

    return {
      success: true,
      message,
      extracted,
      needsMore: true,
      suggestOptions,
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

  // Check all required fields in order: label, time, period, wakeMode, interaction
  const hasLabel = !!draft.label;
  const hasTime = !!draft.time;
  const hasPeriod = !!draft.period;
  const hasWakeMode = !!draft.wakeMode;
  const hasInteraction = draft.interactionEnabled !== undefined;

  return hasLabel && hasTime && hasPeriod && hasWakeMode && hasInteraction;
}
