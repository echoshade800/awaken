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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Send, Mic } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useStore from '../../lib/store';
import ChatBubble from '../../components/ChatBubble';
import TagOptions from '../../components/TagOptions';
import AlarmInfoCard from '../../components/AlarmInfoCard';
import GameSelector from '../../components/GameSelector';
import { getGameLabel } from '../../lib/interactionOptions';
import { parseUserInputWithAI, isAlarmComplete } from '../../lib/monsterAI';

export default function AlarmCreate() {
  const router = useRouter();
  const scrollViewRef = useRef(null);
  const [inputText, setInputText] = useState('');
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [suggestedOptions, setSuggestedOptions] = useState(null);
  const [isInSummary, setIsInSummary] = useState(false);
  const [hasReturnedFromEditor, setHasReturnedFromEditor] = useState(false);

  const {
    currentAlarmDraft,
    chatHistory,
    initNewAlarm,
    updateDraft,
    addChatMessage,
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
        content: '这个闹钟是做什么用的呢？比如起床、午睡、运动提醒之类的🐾',
      });
    }, 500);
  }, []);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [chatHistory, suggestedOptions]);

  // 监听从 broadcast-editor 返回
  useEffect(() => {
    if (currentAlarmDraft?.broadcastContent && !hasReturnedFromEditor) {
      setHasReturnedFromEditor(true);
      addChatMessage({
        role: 'user',
        content: '播报内容已设置完成',
      });
      setTimeout(async () => {
        // 继续对话流程
        await continueConversation('播报内容已配置好');
      }, 500);
    }
  }, [currentAlarmDraft?.broadcastContent]);

  const handleOptionSelect = async (option) => {
    // 用户点击了选项按钮
    const { field, value, label } = option;

    // 处理特殊情况：自定义播报内容
    if (field === 'broadcastContent' && value === 'custom') {
      addChatMessage({
        role: 'user',
        content: label,
      });
      setSuggestedOptions(null);
      // 跳转到 broadcast-editor
      setTimeout(() => {
        router.push('/alarm/broadcast-editor');
      }, 300);
      return;
    }

    // 处理特殊情况：游戏选择
    if (field === 'interactionEnabled' && value === true) {
      addChatMessage({
        role: 'user',
        content: label,
      });
      updateDraft({ [field]: value });
      setSuggestedOptions(null);

      // AI 询问游戏类型
      setTimeout(() => {
        addChatMessage({
          role: 'ai',
          content: '选一个你喜欢的游戏吧～',
        });
        // 显示游戏选择器
        setSuggestedOptions([
          { label: '数学挑战', value: 'quiz', field: 'interactionType', isGame: true },
          { label: '记忆配对', value: 'memory', field: 'interactionType', isGame: true },
          { label: '快速反应', value: 'quick-tap', field: 'interactionType', isGame: true },
        ]);
      }, 500);
      return;
    }

    // 普通选项处理
    addChatMessage({
      role: 'user',
      content: label,
    });

    updateDraft({ [field]: value });
    setSuggestedOptions(null);

    // 继续对话
    setTimeout(async () => {
      await continueConversation(label);
    }, 500);
  };

  const continueConversation = async (userMessage) => {
    setIsAIProcessing(true);

    try {
      const aiResult = await parseUserInputWithAI(userMessage, currentAlarmDraft);

      if (!aiResult.success) {
        addChatMessage({
          role: 'ai',
          content: '抱歉，我遇到了一点问题。请重新输入～',
        });
        setIsAIProcessing(false);
        return;
      }

      // 更新 draft（如果 AI 提取了新参数）
      if (aiResult.extracted && Object.keys(aiResult.extracted).length > 0) {
        updateDraft(aiResult.extracted);
      }

      // 显示 AI 回复
      setTimeout(() => {
        addChatMessage({
          role: 'ai',
          content: aiResult.message,
        });

        // 如果 AI 建议显示选项，渲染选项
        if (aiResult.suggestOptions && aiResult.suggestOptions.length > 0) {
          setSuggestedOptions(aiResult.suggestOptions);
        } else {
          setSuggestedOptions(null);
        }

        // 检查是否完成
        if (!aiResult.needsMore && isAlarmComplete(currentAlarmDraft)) {
          setTimeout(() => {
            showSummary();
          }, 500);
        }

        setIsAIProcessing(false);
      }, 500);
    } catch (error) {
      console.error('Conversation error:', error);
      addChatMessage({
        role: 'ai',
        content: '抱歉，我遇到了一点问题。请重新输入～',
      });
      setIsAIProcessing(false);
    }
  };

  const showSummary = () => {
    const summaryText = generateSummary();
    addChatMessage({
      role: 'ai',
      content: summaryText,
    });
    setIsInSummary(true);
    setSuggestedOptions(null);
  };

  const generateSummary = () => {
    const { label, time, period, wakeMode, voicePackage, ringtone, interactionEnabled, interactionType } = currentAlarmDraft;

    const periodLabels = {
      everyday: '每天',
      workday: '工作日',
      weekend: '周末',
      tomorrow: '只一次',
    };
    const periodLabel = periodLabels[period] || period;

    let summary = `好的！我帮你总结一下：\n\n`;
    summary += `📝 名称：${label}\n`;
    summary += `⏰ 时间：${time}\n`;
    summary += `📅 周期：${periodLabel}\n`;

    if (wakeMode === 'voice') {
      const voiceLabels = {
        'energetic-girl': '元气少女',
        'calm-man': '沉稳大叔',
      };
      const voiceLabel = voiceLabels[voicePackage] || voicePackage;
      summary += `🎙️ 方式：语音播报（${voiceLabel}）\n`;
    } else if (wakeMode === 'ringtone') {
      summary += `🎵 方式：铃声\n`;
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

  const handleTextInput = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setInputText('');

    addChatMessage({
      role: 'user',
      content: userMessage,
    });

    await continueConversation(userMessage);
  };

  const handleVoiceInput = () => {
    addChatMessage({
      role: 'ai',
      content: '语音输入功能开发中～请使用选项或文字输入',
    });
  };

  const renderSuggestedOptions = () => {
    if (!suggestedOptions || suggestedOptions.length === 0) return null;

    // 检查是否是游戏选择
    const isGameSelection = suggestedOptions.some((opt) => opt.isGame);

    if (isGameSelection) {
      return (
        <GameSelector
          selectedValue={currentAlarmDraft?.interactionType}
          onSelect={(value) => {
            const option = suggestedOptions.find((opt) => opt.value === value);
            if (option) {
              handleOptionSelect(option);
            }
          }}
        />
      );
    }

    return (
      <TagOptions
        options={suggestedOptions}
        selectedValue={null}
        onSelect={(value) => {
          const option = suggestedOptions.find((opt) => opt.value === value);
          if (option) {
            handleOptionSelect(option);
          }
        }}
      />
    );
  };

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
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Alarm</Text>
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

          {isAIProcessing && (
            <View style={styles.aiLoadingContainer}>
              <ActivityIndicator size="small" color="#FF9A76" />
              <Text style={styles.aiLoadingText}>Monster 正在思考中...</Text>
            </View>
          )}

          {renderSuggestedOptions()}

          {isInSummary && (
            <View style={styles.summaryActions}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>保存闹钟</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resetButton} onPress={handleCancel}>
                <Text style={styles.resetButtonText}>重新设置</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {!isInSummary && (
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.voiceButton} onPress={handleVoiceInput}>
              <Mic size={24} color="#FF9A76" />
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder="输入消息..."
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleTextInput}
              returnKeyType="send"
              multiline
              maxLength={200}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleTextInput}
              disabled={!inputText.trim()}
            >
              <Send size={20} color={inputText.trim() ? '#FFFFFF' : '#CCC'} />
            </TouchableOpacity>
          </View>
        )}
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
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  aiLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  aiLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FF9A76',
  },
  summaryActions: {
    marginTop: 20,
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#FF9A76',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resetButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  voiceButton: {
    padding: 10,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#FF9A76',
    borderRadius: 20,
    padding: 10,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
});
