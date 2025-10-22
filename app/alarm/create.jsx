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
import { parseUserInputWithAI, isAlarmComplete } from '../../lib/monsterAI';

export default function AlarmCreate() {
  const router = useRouter();
  const scrollViewRef = useRef(null);
  const [inputText, setInputText] = useState('');
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [suggestedOptions, setSuggestedOptions] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

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

    // 随机选择一个开场白
    const greetings = [
      '嘿～要不要我帮你定个闹钟？今天太累啦，早点休息嘛💤',
      '呀～新的一天要开始啦☀️ 让我帮你设个闹钟吧！',
      '早安～🌤️ 要给闹钟取个名字吗？比如上班、健身～',
    ];
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

    addChatMessage({
      role: 'ai',
      content: randomGreeting,
    });

    // 提供快捷名称选项
    setTimeout(() => {
      setSuggestedOptions([
        { label: '上班', value: '上班', field: 'label' },
        { label: '健身', value: '健身', field: 'label' },
        { label: '午睡', value: '午睡', field: 'label' },
        { label: '自定义', value: 'custom', field: 'label' },
      ]);
    }, 500);
  }, []);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [chatHistory, suggestedOptions]);


  const handleOptionSelect = async (option) => {
    const { field, value, label } = option;

    // 处理自定义输入
    if (value === 'custom') {
      addChatMessage({
        role: 'user',
        content: label,
      });
      setSuggestedOptions(null);
      setTimeout(() => {
        let prompt = '';
        if (field === 'time') {
          prompt = '好的～请输入你想要的时间，比如"7:30"或者"18:00"～';
        } else if (field === 'label') {
          prompt = '好的～请输入闹钟名称，比如"早起"、"晨练"等～';
        }
        addChatMessage({
          role: 'ai',
          content: prompt,
        });
      }, 500);
      return;
    }

    // 处理任务类型选择
    if (field === 'interactionType') {
      addChatMessage({
        role: 'user',
        content: label,
      });

      // 构建更新后的 draft
      let updatedFields;
      if (value === 'none') {
        updatedFields = { interactionEnabled: false, interactionType: null };
      } else {
        updatedFields = { interactionEnabled: true, interactionType: value };
      }

      // 立即更新 draft
      updateDraft(updatedFields);

      setSuggestedOptions(null);

      // 传递更新后的完整 draft 给 AI
      setTimeout(async () => {
        const updatedDraft = { ...currentAlarmDraft, ...updatedFields };
        await continueConversation(label, updatedDraft);
      }, 500);
      return;
    }

    // 普通选项处理
    addChatMessage({
      role: 'user',
      content: label,
    });

    const updatedFields = { [field]: value };
    updateDraft(updatedFields);
    setSuggestedOptions(null);

    setTimeout(async () => {
      const updatedDraft = { ...currentAlarmDraft, ...updatedFields };
      await continueConversation(label, updatedDraft);
    }, 500);
  };

  const continueConversation = async (userMessage, draftOverride = null) => {
    setIsAIProcessing(true);

    try {
      const draftToUse = draftOverride || currentAlarmDraft;
      const aiResult = await parseUserInputWithAI(userMessage, draftToUse);

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

  const handleConfirm = async () => {
    // 检查是否所有信息都已收集
    if (!isAlarmComplete(currentAlarmDraft)) {
      addChatMessage({
        role: 'ai',
        content: '还差一点点～请继续回答问题完成设置😊',
      });
      return;
    }

    // 所有信息完整，显示确认弹窗
    setShowSummaryModal(true);
  };

  const handleAddInteraction = (interactionType) => {
    updateDraft({
      interactionEnabled: true,
      interactionType: interactionType,
    });
    setShowSummaryModal(false);

    setTimeout(() => {
      setShowSummaryModal(true);
    }, 100);
  };

  const handleFinalSave = async () => {
    setShowSummaryModal(false);

    // 保存闹钟
    await saveAlarmFromDraft();

    // 模拟用户点击确认
    addChatMessage({
      role: 'user',
      content: '确认',
    });

    // 调用 AI 生成鼓励话术
    setTimeout(async () => {
      setIsAIProcessing(true);

      try {
        const aiResult = await parseUserInputWithAI('确认创建闹钟', currentAlarmDraft);

        if (aiResult.success) {
          addChatMessage({
            role: 'ai',
            content: aiResult.message,
          });
        } else {
          // 降级：使用默认鼓励
          addChatMessage({
            role: 'ai',
            content: '好的～闹钟已设置完成！快去试试吧！🎉',
          });
        }

        setIsAIProcessing(false);

        // 延迟 1.5 秒后返回列表页
        setTimeout(() => {
          router.back();
        }, 1500);
      } catch (error) {
        console.error('Final encouragement error:', error);

        // 降级：使用默认鼓励
        addChatMessage({
          role: 'ai',
          content: '好的～闹钟已设置完成！快去试试吧！🎉',
        });

        setIsAIProcessing(false);

        setTimeout(() => {
          router.back();
        }, 1500);
      }
    }, 300);
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
            showConfirmButton={isAlarmComplete(currentAlarmDraft)}
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
        onAddInteraction={handleAddInteraction}
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
