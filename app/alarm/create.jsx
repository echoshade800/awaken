import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Send, Mic } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useStore from '../../lib/store';
import ChatBubble from '../../components/ChatBubble';
import TagOptions from '../../components/TagOptions';
import AlarmInfoCard from '../../components/AlarmInfoCard';
import VoiceBroadcastEditor from '../../components/VoiceBroadcastEditor';

const TIME_OPTIONS = [
  { label: '明天早上7点', value: '07:00' },
  { label: '明天早上8点', value: '08:00' },
  { label: '今晚10点', value: '22:00' },
];

const PERIOD_OPTIONS = [
  { label: '每天', value: 'everyday' },
  { label: '工作日', value: 'workday' },
  { label: '周末', value: 'weekend' },
  { label: '只一次', value: 'tomorrow' },
];

const WAKE_MODE_OPTIONS = [
  { label: '语音播报', value: 'voice' },
  { label: '铃声', value: 'ringtone' },
];

const RINGTONE_OPTIONS = [
  { label: 'Gentle Wake', value: 'gentle-wake' },
  { label: 'Ocean Flow', value: 'ocean-flow' },
  { label: 'Morning Sun', value: 'morning-sun' },
];

const TASK_OPTIONS = [
  { label: '无任务', value: 'none' },
  { label: '简单算数', value: 'quiz' },
  { label: '点击挑战', value: 'click' },
  { label: '快速点击', value: 'quick-tap' },
];

const VOICE_PACKAGE_OPTIONS = [
  { label: '元气少女', value: 'energetic-girl' },
  { label: '沉稳大叔', value: 'calm-man' },
];

const STEP_CONFIGS = [
  {
    step: 0,
    aiMessage: '你想什么时候起床呢？',
    field: 'time',
    options: TIME_OPTIONS,
  },
  {
    step: 1,
    aiMessage: '好的～需要每天都响吗？',
    field: 'period',
    options: PERIOD_OPTIONS,
  },
  {
    step: 2,
    aiMessage: '想用什么方式叫醒你呢？',
    field: 'wakeMode',
    options: WAKE_MODE_OPTIONS,
  },
  {
    step: 2.5,
    aiMessage: '选择你想播报的内容吧～',
    field: 'voiceModules',
    isCustom: true,
    condition: (draft) => draft.wakeMode === 'voice',
  },
  {
    step: 2.8,
    aiMessage: '选择铃声',
    field: 'ringtone',
    options: RINGTONE_OPTIONS,
    condition: (draft) => draft.wakeMode === 'ringtone',
  },
  {
    step: 3,
    aiMessage: '需要完成什么任务才能关闭闹钟吗？',
    field: 'task',
    options: TASK_OPTIONS,
  },
  {
    step: 4,
    aiMessage: '想用什么声音播报呢？',
    field: 'voicePackage',
    options: VOICE_PACKAGE_OPTIONS,
    condition: (draft) => draft.wakeMode === 'voice',
  },
];

export default function AlarmCreate() {
  const router = useRouter();
  const scrollViewRef = useRef(null);
  const [inputText, setInputText] = useState('');

  const {
    currentAlarmDraft,
    chatHistory,
    currentStep,
    initNewAlarm,
    updateDraft,
    addChatMessage,
    nextStep,
    saveAlarmFromDraft,
    clearAlarmDraft,
  } = useStore();

  useEffect(() => {
    initNewAlarm();
    addChatMessage({
      role: 'ai',
      content: '嗨～让我帮你设置一个闹钟吧！',
    });
    setTimeout(() => {
      addChatMessage({
        role: 'ai',
        content: STEP_CONFIGS[0].aiMessage,
      });
    }, 500);
  }, []);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [chatHistory]);

  const handleTagSelect = (field, value) => {
    updateDraft({ [field]: value });

    addChatMessage({
      role: 'user',
      content: getSelectedOptionLabel(field, value),
    });

    proceedToNextStep();
  };

  const getSelectedOptionLabel = (field, value) => {
    const stepConfig = STEP_CONFIGS.find((s) => s.field === field);
    const option = stepConfig?.options.find((o) => o.value === value);
    return option?.label || value;
  };

  const proceedToNextStep = () => {
    setTimeout(() => {
      const nextStepIndex = currentStep + 1;

      if (nextStepIndex < STEP_CONFIGS.length) {
        const nextStepConfig = STEP_CONFIGS[nextStepIndex];

        if (nextStepConfig.condition && !nextStepConfig.condition(currentAlarmDraft)) {
          nextStep();
          proceedToNextStep();
          return;
        }

        nextStep();

        setTimeout(() => {
          addChatMessage({
            role: 'ai',
            content: nextStepConfig.aiMessage,
          });
        }, 500);
      } else {
        showSummary();
      }
    }, 300);
  };

  const showSummary = () => {
    setTimeout(() => {
      const summaryText = generateSummary();
      addChatMessage({
        role: 'ai',
        content: summaryText,
      });
      nextStep();
    }, 500);
  };

  const generateSummary = () => {
    const { time, period, wakeMode, task, voicePackage, ringtone } = currentAlarmDraft;
    const periodLabel = PERIOD_OPTIONS.find((o) => o.value === period)?.label;

    let summary = `好的！我帮你总结一下：\n\n`;
    summary += `⏰ 时间：${time}\n`;
    summary += `📅 周期：${periodLabel}\n`;

    if (wakeMode === 'voice') {
      const voiceLabel = VOICE_PACKAGE_OPTIONS.find((o) => o.value === voicePackage)?.label;
      summary += `🎙️ 方式：语音播报（${voiceLabel}）\n`;
    } else {
      const ringtoneLabel = RINGTONE_OPTIONS.find((o) => o.value === ringtone)?.label;
      summary += `🎵 方式：铃声（${ringtoneLabel || '默认'}）\n`;
    }

    const taskLabel = TASK_OPTIONS.find((o) => o.value === task)?.label;
    summary += `🎮 任务：${taskLabel}\n`;

    summary += `\n确认保存吗？`;
    return summary;
  };

  const handleSave = async () => {
    await saveAlarmFromDraft();
    addChatMessage({
      role: 'ai',
      content: '闹钟已保存！祝你好梦～',
    });

    setTimeout(() => {
      router.back();
    }, 1000);
  };

  const handleCancel = () => {
    clearAlarmDraft();
    router.back();
  };

  const handleTextInput = () => {
    if (!inputText.trim()) return;

    addChatMessage({
      role: 'user',
      content: inputText.trim(),
    });

    const currentConfig = getCurrentStepConfig();
    if (currentConfig && !isInSummary) {
      parseTextInput(inputText.trim(), currentConfig);
    }

    setInputText('');
  };

  const parseTextInput = (text, stepConfig) => {
    const lowerText = text.toLowerCase().replace(/\s+/g, '');

    // 处理时间输入
    if (stepConfig.field === 'time') {
      // 匹配各种时间格式：7点、7:00、07:30、早上8点、晚上10点等
      const timeMatch = text.match(/(?:早上|上午|中午|下午|晚上|夜里)?(\d{1,2})[:.：点]?(\d{2})?/);
      if (timeMatch) {
        let hour = parseInt(timeMatch[1]);
        const minute = timeMatch[2] ? timeMatch[2].padStart(2, '0') : '00';

        // 处理时间段关键词
        if (text.includes('晚上') || text.includes('夜里')) {
          if (hour < 12) hour += 12;
        } else if (text.includes('下午')) {
          if (hour < 12 && hour !== 12) hour += 12;
        }

        const timeValue = `${String(hour).padStart(2, '0')}:${minute}`;
        updateDraft({ time: timeValue });
        proceedToNextStep();
        return;
      }
    }

    // 处理周期输入
    if (stepConfig.field === 'period') {
      if (lowerText.includes('每天') || lowerText.includes('天天')) {
        updateDraft({ period: 'everyday' });
        proceedToNextStep();
        return;
      }
      if (lowerText.includes('工作日') || lowerText.includes('上班')) {
        updateDraft({ period: 'workday' });
        proceedToNextStep();
        return;
      }
      if (lowerText.includes('周末') || lowerText.includes('休息')) {
        updateDraft({ period: 'weekend' });
        proceedToNextStep();
        return;
      }
      if (lowerText.includes('一次') || lowerText.includes('明天') || lowerText.includes('只要')) {
        updateDraft({ period: 'tomorrow' });
        proceedToNextStep();
        return;
      }
    }

    // 处理唤醒方式
    if (stepConfig.field === 'wakeMode') {
      if (lowerText.includes('语音') || lowerText.includes('播报') || lowerText.includes('说话')) {
        updateDraft({ wakeMode: 'voice' });
        proceedToNextStep();
        return;
      }
      if (lowerText.includes('铃声') || lowerText.includes('音乐') || lowerText.includes('响')) {
        updateDraft({ wakeMode: 'ringtone' });
        proceedToNextStep();
        return;
      }
    }

    // 处理任务类型
    if (stepConfig.field === 'task') {
      if (lowerText.includes('无') || lowerText.includes('不要') || lowerText.includes('不需要')) {
        updateDraft({ task: 'none' });
        proceedToNextStep();
        return;
      }
      if (lowerText.includes('算数') || lowerText.includes('数学') || lowerText.includes('计算')) {
        updateDraft({ task: 'quiz' });
        proceedToNextStep();
        return;
      }
      if (lowerText.includes('点击') && (lowerText.includes('挑战') || lowerText.includes('普通'))) {
        updateDraft({ task: 'click' });
        proceedToNextStep();
        return;
      }
      if (lowerText.includes('快速') || lowerText.includes('快点')) {
        updateDraft({ task: 'quick-tap' });
        proceedToNextStep();
        return;
      }
    }

    // 通用选项匹配（更宽松的匹配）
    const matchedOption = stepConfig.options?.find((opt) => {
      const label = opt.label.toLowerCase().replace(/\s+/g, '');
      const value = opt.value.toLowerCase();

      // 检查是否包含标签关键词
      if (lowerText.includes(label) || label.includes(lowerText)) {
        return true;
      }

      // 检查是否包含值关键词
      if (lowerText.includes(value) || value.includes(lowerText)) {
        return true;
      }

      // 检查标签中的关键字
      const keywords = label.split('');
      return keywords.some(k => k.length > 1 && lowerText.includes(k));
    });

    if (matchedOption) {
      updateDraft({ [stepConfig.field]: matchedOption.value });
      proceedToNextStep();
    } else {
      setTimeout(() => {
        addChatMessage({
          role: 'ai',
          content: '抱歉，我没理解。请选择下面的选项或重新输入～',
        });
      }, 300);
    }
  };

  const handleVoiceInput = () => {
    addChatMessage({
      role: 'ai',
      content: '语音输入功能开发中～请使用选项或文字输入',
    });
  };

  const getCurrentStepConfig = () => {
    return STEP_CONFIGS[currentStep];
  };

  const stepConfig = getCurrentStepConfig();
  const isInSummary = currentStep >= STEP_CONFIGS.length;

  return (
    <LinearGradient colors={['#FFF7E8', '#E6F4FF']} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <ArrowLeft size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>设置闹钟</Text>
          <View style={{ width: 24 }} />
        </View>

      {currentAlarmDraft && <AlarmInfoCard alarm={currentAlarmDraft} />}

      <ScrollView
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {chatHistory.map((message) => (
          <ChatBubble key={message.id} role={message.role} content={message.content} />
        ))}

        {stepConfig && !isInSummary && !stepConfig.isCustom && stepConfig.options && (
          <TagOptions
            options={stepConfig.options}
            selectedValue={currentAlarmDraft?.[stepConfig.field]}
            onSelect={(value) => handleTagSelect(stepConfig.field, value)}
          />
        )}

        {stepConfig && !isInSummary && stepConfig.isCustom && stepConfig.field === 'voiceModules' && (
          <View style={styles.editorContainer}>
            <VoiceBroadcastEditor
              value={currentAlarmDraft?.broadcastContent || ''}
              onChange={(content) => updateDraft({ broadcastContent: content })}
            />
            <View style={styles.editorActions}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  const content = currentAlarmDraft?.broadcastContent;
                  addChatMessage({
                    role: 'user',
                    content: content || '使用默认播报内容',
                  });
                  proceedToNextStep();
                }}
              >
                <Text style={styles.confirmButtonText}>确认</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isInSummary && (
          <View style={styles.summaryActions}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>保存闹钟</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.voiceButton}
          onPress={handleVoiceInput}
          activeOpacity={0.7}
        >
          <Mic size={22} color="#007AFF" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="输入时间或选择标签..."
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleTextInput}
          returnKeyType="send"
          editable={!isInSummary}
          multiline={false}
        />

        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleTextInput}
          disabled={!inputText.trim()}
          activeOpacity={0.7}
        >
          <Send size={20} color={inputText.trim() ? '#007AFF' : '#CCC'} />
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: 48,
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  chatArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  chatContent: {
    paddingVertical: 8,
    paddingBottom: 16,
  },
  summaryActions: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  editorContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  editorActions: {
    paddingTop: 8,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 0,
    gap: 10,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1C1C1E',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
