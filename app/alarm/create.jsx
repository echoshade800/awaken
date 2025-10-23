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
  InputAccessoryView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
  const { fromOnboarding } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
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

    // Random greeting
    const greetings = [
      'Hey~ Want me to set an alarm for you? Time to rest up! 💤',
      'Oh~ A new day is starting! ☀️ Let me help you set an alarm!',
      'Good morning~ 🌤️ Want to give your alarm a name? Like Work, Gym~',
    ];
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

    addChatMessage({
      role: 'ai',
      content: randomGreeting,
    });

    // Provide quick name options
    setTimeout(() => {
      setSuggestedOptions([
        { label: 'Work', value: 'Work', field: 'label' },
        { label: 'Gym', value: 'Gym', field: 'label' },
        { label: 'Nap', value: 'Nap', field: 'label' },
        { label: 'Custom', value: 'custom', field: 'label' },
      ]);
    }, 500);
  }, []);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [chatHistory, suggestedOptions]);

  // Detect return from voice broadcast editor
  useEffect(() => {
    if (currentAlarmDraft?.wakeMode === 'voice' &&
        currentAlarmDraft?.broadcastContent &&
        chatHistory.length > 0) {
      // Check if last message is "Edit Voice Broadcast"
      const lastUserMessage = [...chatHistory].reverse().find(msg => msg.role === 'user');
      if (lastUserMessage?.content === '📝 Edit Voice Broadcast') {
        // User just returned from editor, continue conversation
        setTimeout(async () => {
          addChatMessage({
            role: 'ai',
            content: 'Voice broadcast is all set~ Let\'s continue!',
          });
          await continueConversation('Voice setup completed', currentAlarmDraft);
        }, 300);
      }
    }
  }, [currentAlarmDraft?.broadcastContent]);


  const handleOptionSelect = async (option) => {
    const { field, value, label } = option;

    // Handle custom input
    if (value === 'custom') {
      addChatMessage({
        role: 'user',
        content: label,
      });
      setSuggestedOptions(null);
      setTimeout(() => {
        let prompt = '';
        if (field === 'time') {
          prompt = 'Okay~ Please enter your desired time, like "7:30" or "18:00"~';
        } else if (field === 'label') {
          prompt = 'Okay~ Please enter an alarm name, like "Morning" or "Exercise"~';
        }
        addChatMessage({
          role: 'ai',
          content: prompt,
        });
      }, 500);
      return;
    }

    // Handle task type selection
    if (field === 'interactionType') {
      addChatMessage({
        role: 'user',
        content: label,
      });

      // Build updated draft
      let updatedFields;
      if (value === 'none') {
        updatedFields = { interactionEnabled: false, interactionType: null };
      } else {
        updatedFields = { interactionEnabled: true, interactionType: value };
      }

      // Update draft immediately
      updateDraft(updatedFields);

      setSuggestedOptions(null);

      // Pass updated draft to AI
      setTimeout(async () => {
        const updatedDraft = { ...currentAlarmDraft, ...updatedFields };
        await continueConversation(label, updatedDraft);
      }, 500);
      return;
    }

    // Handle wake mode selection
    if (field === 'wakeMode') {
      addChatMessage({
        role: 'user',
        content: label,
      });

      updateDraft({ wakeMode: value });
      setSuggestedOptions(null);

      // If voice broadcast selected, show edit button
      if (value === 'voice') {
        setTimeout(() => {
          addChatMessage({
            role: 'ai',
            content: 'Voice broadcast is so gentle~ Click the button below to edit your voice content!',
          });
          setSuggestedOptions([
            { label: '📝 Edit Voice Broadcast', value: 'edit-voice', field: 'action' }
          ]);
        }, 500);
        return;
      }

      // If ringtone selected, show ringtone options
      if (value === 'ringtone') {
        setTimeout(() => {
          addChatMessage({
            role: 'ai',
            content: 'Alright~ Choose a ringtone you like! You can tap to preview~',
          });
          setSuggestedOptions([
            { label: '🔔 Ringtone 1', value: 'ringtone-1', field: 'ringtone' },
            { label: '🔔 Ringtone 2', value: 'ringtone-2', field: 'ringtone' },
            { label: '🔔 Ringtone 3', value: 'ringtone-3', field: 'ringtone' },
            { label: '📱 Custom Ringtone', value: 'custom-ringtone', field: 'ringtone' }
          ]);
        }, 500);
        return;
      }

      // Other wake modes continue conversation
      setTimeout(async () => {
        const updatedDraft = { ...currentAlarmDraft, wakeMode: value };
        await continueConversation(label, updatedDraft);
      }, 500);
      return;
    }

    // Handle voice broadcast edit action
    if (field === 'action' && value === 'edit-voice') {
      addChatMessage({
        role: 'user',
        content: label,
      });
      setSuggestedOptions(null);

      // Navigate to voice broadcast editor
      router.push('/alarm/broadcast-editor');
      return;
    }

    // Handle ringtone selection
    if (field === 'ringtone') {
      addChatMessage({
        role: 'user',
        content: label,
      });

      const ringtoneMap = {
        'ringtone-1': { name: 'Ringtone 1', url: 'placeholder-url-1' },
        'ringtone-2': { name: 'Ringtone 2', url: 'placeholder-url-2' },
        'ringtone-3': { name: 'Ringtone 3', url: 'placeholder-url-3' },
        'custom-ringtone': { name: 'Custom Ringtone', url: 'placeholder-custom' }
      };

      const selectedRingtone = ringtoneMap[value];
      updateDraft({
        ringtoneName: selectedRingtone.name,
        ringtoneUrl: selectedRingtone.url
      });

      setSuggestedOptions(null);

      setTimeout(async () => {
        const updatedDraft = {
          ...currentAlarmDraft,
          ringtoneName: selectedRingtone.name,
          ringtoneUrl: selectedRingtone.url
        };
        await continueConversation(label, updatedDraft);
      }, 500);
      return;
    }

    // Handle regular options
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
          content: 'Sorry, I encountered a problem. Please try again~',
        });
        setIsAIProcessing(false);
        return;
      }

      // Update draft if AI extracted new parameters
      if (aiResult.extracted && Object.keys(aiResult.extracted).length > 0) {
        updateDraft(aiResult.extracted);
      }

      // Show AI response
      setTimeout(() => {
        addChatMessage({
          role: 'ai',
          content: aiResult.message,
        });

        // If AI suggests options, render them
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
    // Check if all information collected
    if (!isAlarmComplete(currentAlarmDraft)) {
      addChatMessage({
        role: 'ai',
        content: 'Almost there~ Please continue answering to complete the setup 😊',
      });
      return;
    }

    // All information complete, show confirmation modal
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

    // Save alarm
    await saveAlarmFromDraft();

    // Simulate user confirm click
    addChatMessage({
      role: 'user',
      content: 'Confirm',
    });

    // Call AI to generate encouragement
    setTimeout(async () => {
      setIsAIProcessing(true);

      try {
        const aiResult = await parseUserInputWithAI('Confirm alarm creation', currentAlarmDraft);

        if (aiResult.success) {
          addChatMessage({
            role: 'ai',
            content: aiResult.message,
          });
        } else {
          // Fallback: use default encouragement
          addChatMessage({
            role: 'ai',
            content: 'Done~ Alarm is all set! Go try it out! 🎉',
          });
        }

        setIsAIProcessing(false);

        // Navigate to next step after 1.5s delay
        setTimeout(() => {
          if (fromOnboarding === 'true') {
            router.replace('/onboarding/initializing');
          } else {
            router.back();
          }
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
          if (fromOnboarding === 'true') {
            router.replace('/onboarding/initializing');
          } else {
            router.back();
          }
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
      content: 'Voice input under development~ Please use options or text input',
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

  const inputAccessoryViewID = 'alarmInputAccessory';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#3D5A80', '#5A7BA5', '#7A9BC4', '#FFB88C', '#E8F4FF', '#F0F8FF', '#FAFCFF']}
        locations={[0, 0.25, 0.4, 0.5, 0.65, 0.82, 1]}
        style={styles.backgroundGradient}
      />
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
        contentContainerStyle={[
          styles.chatContent,
          { paddingBottom: 60 + insets.bottom + 8 }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        inputAccessoryViewID={Platform.OS === 'ios' ? inputAccessoryViewID : undefined}
      >
        {chatHistory.map((message) => (
          <ChatBubble key={message.id} role={message.role} content={message.content} />
        ))}

        {isAIProcessing && (
          <View style={styles.aiLoadingContainer}>
            <ActivityIndicator size="small" color="#FF9A76" />
            <Text style={styles.aiLoadingText}>Monster is thinking...</Text>
          </View>
        )}

        {renderSuggestedOptions()}
      </ScrollView>

      {Platform.OS === 'ios' ? (
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <View style={[styles.inputContainer, { paddingBottom: insets.bottom }]}>
            <TouchableOpacity style={styles.voiceButton} onPress={handleVoiceInput}>
              <Mic size={24} color="#FF9A76" />
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
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
        </InputAccessoryView>
      ) : (
        <KeyboardAvoidingView behavior="padding">
          <View style={[styles.inputContainer, { paddingBottom: insets.bottom }]}>
            <TouchableOpacity style={styles.voiceButton} onPress={handleVoiceInput}>
              <Mic size={24} color="#FF9A76" />
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
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
      )}

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
    paddingTop: 12,
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
