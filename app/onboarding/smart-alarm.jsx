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
import GameSelector from '../../components/GameSelector';
import {
  INTERACTION_ENABLE_OPTIONS,
  getGameLabel,
} from '../../lib/interactionOptions';

const LABEL_OPTIONS = [
  { label: '起床闹钟', value: '起床闹钟' },
  { label: '午睡提醒', value: '午睡提醒' },
  { label: '上班闹钟', value: '上班闹钟' },
  { label: '锻炼时间', value: '锻炼时间' },
  { label: '喝水提醒', value: '喝水提醒' },
  { label: '自定义...', value: 'custom' },
];

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
  { label: '震动', value: 'vibration' },
];

const RINGTONE_OPTIONS = [
  { label: 'Gentle Wake', value: 'gentle-wake' },
  { label: 'Ocean Flow', value: 'ocean-flow' },
  { label: 'Morning Sun', value: 'morning-sun' },
];

const VOICE_PACKAGE_OPTIONS = [
  { label: '元气少女', value: 'energetic-girl' },
  { label: '沉稳大叔', value: 'calm-man' },
];

const STEP_CONFIGS = [
  {
    step: 0,
    aiMessage: '先给这个闹钟起个名字吧～',
    field: 'label',
    options: LABEL_OPTIONS,
    allowCustomInput: true,
  },
  {
    step: 1,
    aiMessage: '你想什么时候起床呢？',
    field: 'time',
    options: TIME_OPTIONS,
  },
  {
    step: 2,
    aiMessage: '好的～需要每天都响吗？',
    field: 'period',
    options: PERIOD_OPTIONS,
  },
  {
    step: 3,
    aiMessage: '想用什么方式叫醒你呢？',
    field: 'wakeMode',
    options: WAKE_MODE_OPTIONS,
  },
  {
    step: 3.5,
    aiMessage: '选择你想播报的内容吧～',
    field: 'voiceModules',
    isCustom: true,
    condition: (draft) => draft.wakeMode === 'voice',
  },
  {
    step: 3.6,
    aiMessage: '想用什么声音播报呢？',
    field: 'voicePackage',
    options: VOICE_PACKAGE_OPTIONS,
    condition: (draft) => draft.wakeMode === 'voice',
  },
  {
    step: 3.8,
    aiMessage: '选择铃声',
    field: 'ringtone',
    options: RINGTONE_OPTIONS,
    condition: (draft) => draft.wakeMode === 'ringtone',
  },
  {
    step: 4,
    aiMessage: '要不要加点互动游戏，让起床更有趣呢？🎮',
    field: 'interactionEnabled',
    options: INTERACTION_ENABLE_OPTIONS,
  },
  {
    step: 4.5,
    aiMessage: '选一个你喜欢的游戏吧！',
    field: 'interactionType',
    isGameSelection: true,
    condition: (draft) => draft.interactionEnabled === true,
  },
];

export default function SmartAlarmScreen() {
  const router = useRouter();
  const scrollViewRef = useRef(null);
  const [inputText, setInputText] = useState('');
  const [isCustomLabelInput, setIsCustomLabelInput] = useState(false);

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

  useEffect(() => {
    const stepConfig = getCurrentStepConfig();
    if (
      stepConfig &&
      stepConfig.field === 'voiceModules' &&
      currentAlarmDraft?.broadcastContent &&
      chatHistory.length > 0 &&
      !chatHistory[chatHistory.length - 1]?.content?.includes('播报内容已设置')
    ) {
      addChatMessage({
        role: 'user',
        content: '播报内容已设置完成',
      });
      setTimeout(() => {
        proceedToNextStep();
      }, 500);
    }
  }, [currentAlarmDraft?.broadcastContent]);

  const handleTagSelect = (field, value) => {
    if (field === 'label' && value === 'custom') {
      setIsCustomLabelInput(true);
      addChatMessage({
        role: 'user',
        content: '自定义...',
      });
      setTimeout(() => {
        addChatMessage({
          role: 'ai',
          content: '好的！请输入你想要的闹钟名字～',
        });
      }, 300);
      return;
    }

    updateDraft({ [field]: value });

    addChatMessage({
      role: 'user',
      content: getSelectedOptionLabel(field, value),
    });

    proceedToNextStep();
  };

  const getSelectedOptionLabel = (field, value) => {
    if (field === 'interactionType') {
      return getGameLabel(value);
    }

    const stepConfig = STEP_CONFIGS.find((s) => s.field === field);
    const option = stepConfig?.options?.find((o) => o.value === value);
    return option?.label || value;
  };

  const proceedToNextStep = () => {
    setTimeout(() => {
      let nextStepIndex = currentStep + 1;

      while (nextStepIndex < STEP_CONFIGS.length) {
        const nextStepConfig = STEP_CONFIGS[nextStepIndex];

        if (nextStepConfig.condition && !nextStepConfig.condition(currentAlarmDraft)) {
          nextStepIndex++;
          continue;
        }

        nextStep();

        setTimeout(() => {
          addChatMessage({
            role: 'ai',
            content: nextStepConfig.aiMessage,
          });
        }, 500);

        return;
      }

      showSummary();
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
    const { time, period, wakeMode, voicePackage, ringtone, interactionEnabled, interactionType } = currentAlarmDraft;
    const periodLabel = PERIOD_OPTIONS.find((o) => o.value === period)?.label;

    let summary = `好的！我帮你总结一下：\n\n`;
    summary += `⏰ 时间：${time}\n`;
    summary += `📅 周期：${periodLabel}\n`;

    if (wakeMode === 'voice') {
      const voiceLabel = VOICE_PACKAGE_OPTIONS.find((o) => o.value === voicePackage)?.label;
      summary += `🎙️ 方式：语音播报（${voiceLabel}）\n`;
    } else if (wakeMode === 'ringtone') {
      const ringtoneLabel = RINGTONE_OPTIONS.find((o) => o.value === ringtone)?.label;
      summary += `🎵 方式：铃声（${ringtoneLabel || '默认'}）\n`;
    } else if (wakeMode === 'vibration') {
      summary += `📳 方式：震动\n`;
    }

    if (interactionEnabled && interactionType) {
      const gameLabel = getGameLabel(interactionType);
      summary += `🎮 互动：${gameLabel}\n`;
    } else {
      summary += `🎮 互动：无\n`;
    }

    summary += `\n确认保存吗？`;
    return summary;
  };

  const generateDefaultLabel = () => {
    const { time, period } = currentAlarmDraft;
    const periodLabel = PERIOD_OPTIONS.find((o) => o.value === period)?.label || '';
    return `${time} ${periodLabel}闹钟`;
  };

  const handleSave = async () => {
    if (!currentAlarmDraft.label || currentAlarmDraft.label.trim() === '') {
      updateDraft({ label: generateDefaultLabel() });
    }

    await saveAlarmFromDraft();
    addChatMessage({
      role: 'ai',
      content: '闹钟已保存！祝你好梦～',
    });

    setTimeout(() => {
      router.push('/onboarding/loading');
    }, 1000);
  };

  const handleSkip = () => {
    clearAlarmDraft();
    router.push('/onboarding/loading');
  };

  const handleTextInput = () => {
    if (!inputText.trim()) return;

    if (isCustomLabelInput) {
      const customLabel = inputText.trim();
      addChatMessage({
        role: 'user',
        content: customLabel,
      });
      updateDraft({ label: customLabel });
      setIsCustomLabelInput(false);
      setInputText('');
      proceedToNextStep();
      return;
    }

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

    if (stepConfig.field === 'label') {
      updateDraft({ label: text.trim() });
      proceedToNextStep();
      return;
    }

    if (stepConfig.field === 'time') {
      const timeMatch = text.match(/(?:早上|上午|中午|下午|晚上|夜里)?(\d{1,2})[:.：点]?(\d{2})?/);
      if (timeMatch) {
        let hour = parseInt(timeMatch[1]);
        const minute = timeMatch[2] ? timeMatch[2].padStart(2, '0') : '00';

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

    const matchedOption = stepConfig.options?.find((opt) => {
      const label = opt.label.toLowerCase().replace(/\s+/g, '');
      return lowerText.includes(label) || label.includes(lowerText);
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
    <View style={styles.container}>
      <LinearGradient
        colors={['#3D5A80', '#5A7BA5', '#7A9BC4', '#FFB88C', '#E8F4FF', '#F0F8FF', '#FAFCFF']}
        locations={[0, 0.25, 0.4, 0.5, 0.65, 0.82, 1]}
        style={styles.backgroundGradient}
      />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Set Your First Alarm</Text>
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

          {stepConfig && !isInSummary && !stepConfig.isCustom && !stepConfig.isGameSelection && stepConfig.options && (
            <TagOptions
              options={stepConfig.options}
              selectedValue={currentAlarmDraft?.[stepConfig.field]}
              onSelect={(value) => handleTagSelect(stepConfig.field, value)}
            />
          )}

          {stepConfig && !isInSummary && stepConfig.isGameSelection && (
            <GameSelector
              selectedValue={currentAlarmDraft?.interactionType}
              onSelect={(value) => handleTagSelect('interactionType', value)}
            />
          )}

          {stepConfig && !isInSummary && stepConfig.isCustom && stepConfig.field === 'voiceModules' && (
            <View style={styles.customAction}>
              <TouchableOpacity
                style={styles.editModulesButton}
                onPress={() => router.push('/alarm/broadcast-editor')}
              >
                <Text style={styles.editModulesText}>编辑播报内容</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.skipButton2}
                onPress={() => {
                  addChatMessage({ role: 'user', content: '使用默认设置' });
                  proceedToNextStep();
                }}
              >
                <Text style={styles.skipButtonText2}>使用默认设置</Text>
              </TouchableOpacity>
            </View>
          )}

          {isInSummary && (
            <View style={styles.summaryActions}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>保存闹钟</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.skipButtonAlt} onPress={handleSkip}>
                <Text style={styles.skipButtonTextAlt}>跳过</Text>
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
            <Mic size={22} color="#FF9A76" />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="输入时间或选择选项..."
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
            <Send size={20} color={inputText.trim() ? '#FF9A76' : 'rgba(255, 255, 255, 0.5)'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 0.5,
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
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#FF9A76',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#FF9A76',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButtonAlt: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  skipButtonTextAlt: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
  },
  customAction: {
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  editModulesButton: {
    backgroundColor: '#FF9A76',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  editModulesText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton2: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  skipButtonText2: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
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
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#4A5F8F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
