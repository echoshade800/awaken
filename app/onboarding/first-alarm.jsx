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
import { Send, Mic } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useStore from '../../lib/store';
import ChatBubble from '../../components/ChatBubble';
import TagOptions from '../../components/TagOptions';
import AlarmInfoCard from '../../components/AlarmInfoCard';
import AlarmSummaryModal from '../../components/AlarmSummaryModal';
import { parseUserInputWithAI, isAlarmComplete } from '../../lib/monsterAI';

export default function FirstAlarmOnboarding() {
  const router = useRouter();
  const scrollViewRef = useRef(null);
  const [inputText, setInputText] = useState('');
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [suggestedOptions, setSuggestedOptions] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [canSkip, setCanSkip] = useState(false);

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
      content: 'Welcome! Let\'s create your very first alarm together~ 🎉\n\nWhat would you like to use this alarm for?',
    });

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

  useEffect(() => {
    if (currentAlarmDraft?.wakeMode === 'voice' &&
        currentAlarmDraft?.broadcastContent &&
        chatHistory.length > 0) {
      const lastUserMessage = [...chatHistory].reverse().find(msg => msg.role === 'user');
      if (lastUserMessage?.content === '📝 Edit Voice Broadcast') {
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

    if (field === 'interactionType') {
      addChatMessage({
        role: 'user',
        content: label,
      });

      let updatedFields;
      if (value === 'none') {
        updatedFields = { interactionEnabled: false, interactionType: null };
      } else {
        updatedFields = { interactionEnabled: true, interactionType: value };
      }

      updateDraft(updatedFields);
      setSuggestedOptions(null);

      setTimeout(async () => {
        const updatedDraft = { ...currentAlarmDraft, ...updatedFields };
        await continueConversation(label, updatedDraft);
      }, 500);
      return;
    }

    if (field === 'wakeMode') {
      addChatMessage({
        role: 'user',
        content: label,
      });

      updateDraft({ wakeMode: value });
      setSuggestedOptions(null);

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

      setTimeout(async () => {
        const updatedDraft = { ...currentAlarmDraft, wakeMode: value };
        await continueConversation(label, updatedDraft);
      }, 500);
      return;
    }

    if (field === 'action' && value === 'edit-voice') {
      addChatMessage({
        role: 'user',
        content: label,
      });
      setSuggestedOptions(null);

      router.push('/alarm/broadcast-editor');
      return;
    }

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

      if (aiResult.extracted && Object.keys(aiResult.extracted).length > 0) {
        updateDraft(aiResult.extracted);
      }

      setTimeout(() => {
        addChatMessage({
          role: 'ai',
          content: aiResult.message,
        });

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
        content: 'Sorry, I encountered a problem. Please try again~',
      });
      setIsAIProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (!isAlarmComplete(currentAlarmDraft)) {
      addChatMessage({
        role: 'ai',
        content: 'Almost there~ Please continue answering to complete the setup 😊',
      });
      return;
    }

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

    await saveAlarmFromDraft();

    addChatMessage({
      role: 'user',
      content: 'Confirm',
    });

    setTimeout(async () => {
      setIsAIProcessing(true);

      try {
        const aiResult = await parseUserInputWithAI('Confirm creating alarm', currentAlarmDraft);

        if (aiResult.success) {
          addChatMessage({
            role: 'ai',
            content: aiResult.message,
          });
        } else {
          addChatMessage({
            role: 'ai',
            content: 'Done~ Your first alarm is all set! 🎉',
          });
        }

        setIsAIProcessing(false);

        setTimeout(() => {
          clearAlarmDraft();
          router.replace('/(tabs)');
        }, 1500);
      } catch (error) {
        addChatMessage({
          role: 'ai',
          content: 'Done~ Your first alarm is all set! 🎉',
        });
        setIsAIProcessing(false);

        setTimeout(() => {
          clearAlarmDraft();
          router.replace('/(tabs)');
        }, 1500);
      }
    }, 500);
  };

  const handleSendMessage = async () => {
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
      content: 'Voice input is under development~ Please use options or text input',
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={0}
    >
      <LinearGradient
        colors={['#3D5A80', '#5A7BA5', '#7A9BC4', '#FFB88C', '#E8F4FF', '#F0F8FF', '#FAFCFF']}
        locations={[0, 0.25, 0.4, 0.5, 0.65, 0.82, 1]}
        style={styles.backgroundGradient}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Your First Alarm</Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {chatHistory.map((message, index) => (
          <ChatBubble
            key={index}
            message={message.content}
            isUser={message.role === 'user'}
          />
        ))}

        {suggestedOptions && (
          <TagOptions
            options={suggestedOptions}
            onSelect={handleOptionSelect}
          />
        )}

        {isAIProcessing && (
          <View style={styles.aiLoadingContainer}>
            <ActivityIndicator size="small" color="#FF9A76" />
            <Text style={styles.aiLoadingText}>Monster is thinking...</Text>
          </View>
        )}

        {isAlarmComplete(currentAlarmDraft) && !isAIProcessing && (
          <View style={styles.confirmButtonContainer}>
            <AlarmInfoCard alarm={currentAlarmDraft} />
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>Confirm Alarm</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          returnKeyType="send"
          onSubmitEditing={handleSendMessage}
        />
        <TouchableOpacity
          style={styles.voiceButton}
          onPress={handleVoiceInput}
          activeOpacity={0.7}
        >
          <Mic size={22} color="#FF9A76" strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!inputText.trim()}
          activeOpacity={0.7}
        >
          <Send size={20} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <AlarmSummaryModal
        visible={showSummaryModal}
        alarm={currentAlarmDraft}
        onClose={() => setShowSummaryModal(false)}
        onConfirm={handleFinalSave}
        onAddInteraction={handleAddInteraction}
        allowEdit={true}
      />
    </KeyboardAvoidingView>
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
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  aiLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  aiLoadingText: {
    fontSize: 14,
    color: '#FF9A76',
    fontWeight: '500',
  },
  confirmButtonContainer: {
    marginTop: 20,
    gap: 16,
  },
  confirmButton: {
    backgroundColor: '#FF9A76',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#FF9A76',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    maxHeight: 100,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFE5D9',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF9A76',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF9A76',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#D5D5D7',
    shadowOpacity: 0,
  },
});
