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
import AlarmSummaryModal from '../../components/AlarmSummaryModal';
import GameSelector from '../../components/GameSelector';
import { getGameLabel } from '../../lib/interactionOptions';
import { parseUserInputWithAI, isAlarmComplete } from '../../lib/monsterAI';

export default function AlarmCreate() {
  const router = useRouter();
  const scrollViewRef = useRef(null);
  const [inputText, setInputText] = useState('');
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [suggestedOptions, setSuggestedOptions] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
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

    // 处理特殊情况：两级选择 - 用户点击了 [铃声]
    if (field === 'wakeMode' && value === 'ringtone') {
      addChatMessage({
        role: 'user',
        content: label,
      });
      setSuggestedOptions(null);

      // 显示铃声子选项
      setTimeout(() => {
        addChatMessage({
          role: 'ai',
          content: '好的～我们有3种铃声供你选择：',
        });
        setSuggestedOptions([
          { label: '铃声 1 - 轻柔唤醒', value: 'gentle-wake', field: 'ringtone' },
          { label: '铃声 2 - 清晨鸟鸣', value: 'morning-birds', field: 'ringtone' },
          { label: '铃声 3 - 渐强提示', value: 'gradual-alert', field: 'ringtone' },
        ]);
      }, 500);
      return;
    }

    // 处理特殊情况：用户选择了具体的铃声
    if (field === 'ringtone') {
      addChatMessage({
        role: 'user',
        content: label,
      });
      updateDraft({ wakeMode: 'ringtone', ringtone: value });
      setSuggestedOptions(null);

      // 继续对话
      setTimeout(async () => {
        await continueConversation(label);
      }, 500);
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

  const checkMissingInfo = (draft) => {
    const missing = [];

    if (!draft.label) missing.push('label');
    if (!draft.time) missing.push('time');
    if (!draft.period) missing.push('period');
    if (!draft.wakeMode) missing.push('wakeMode');

    if (draft.wakeMode === 'voice') {
      if (!draft.voicePackage) missing.push('voicePackage');
      if (!draft.broadcastContent) missing.push('broadcastContent');
    }

    return missing;
  };

  const handleConfirm = async () => {
    // 检查必要信息是否完整
    const missingInfo = checkMissingInfo(currentAlarmDraft);

    if (missingInfo.length > 0) {
      // 有缺失信息，询问用户
      const missingLabels = {
        label: '闹钟名称',
        time: '时间',
        period: '周期',
        wakeMode: '唤醒方式',
        voicePackage: '语音包',
        broadcastContent: '播报内容',
      };

      const missingText = missingInfo.map((key) => missingLabels[key]).join('、');

      addChatMessage({
        role: 'ai',
        content: `还缺少一些信息哦～\n缺少：${missingText}\n\n请继续输入或选择～`,
      });

      // 根据第一个缺失项提供建议
      const firstMissing = missingInfo[0];
      await askForMissingInfo(firstMissing);
    } else {
      // 信息完整，显示总结弹窗
      setShowSummaryModal(true);
    }
  };

  const askForMissingInfo = async (field) => {
    // 根据缺失字段，让 AI 主动询问
    const prompts = {
      label: '这个闹钟是做什么用的呢？',
      time: '你想什么时候叫你呢？',
      period: '要每天都叫你，还是只一次呢？',
      wakeMode: '想用什么方式叫你呢？',
      voicePackage: '想用可爱的元气少女还是沉稳大叔呀？',
      broadcastContent: '要自定义播报内容吗？',
    };

    const message = prompts[field] || '请继续输入～';
    await continueConversation(message);
  };

  const handleFinalSave = async () => {
    setShowSummaryModal(false);
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

        {currentAlarmDraft && (
          <AlarmInfoCard
            alarm={currentAlarmDraft}
            onConfirm={handleConfirm}
            showConfirmButton={true}
          />
        )}

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
        </ScrollView>

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
      </KeyboardAvoidingView>

      <AlarmSummaryModal
        visible={showSummaryModal}
        alarm={currentAlarmDraft}
        onConfirm={handleFinalSave}
        onCancel={() => setShowSummaryModal(false)}
      />
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
