import { View, Text, StyleSheet } from 'react-native';
import { Bot, User } from 'lucide-react-native';

export default function ChatBubble({ role, content }) {
  const isAI = role === 'ai';

  return (
    <View style={[styles.container, isAI ? styles.aiContainer : styles.userContainer]}>
      {isAI && (
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, styles.aiAvatar]}>
            <Bot size={20} color="#1A2845" strokeWidth={2.5} />
          </View>
        </View>
      )}

      <View style={styles.bubbleWrapper}>
        <View style={[styles.bubble, isAI ? styles.aiBubble : styles.userBubble]}>
          <Text style={[styles.text, isAI ? styles.aiText : styles.userText]}>{content}</Text>
        </View>
      </View>

      {!isAI && (
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, styles.userAvatar]}>
            <User size={20} color="#FFF" strokeWidth={2.5} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
  },
  aiContainer: {
    justifyContent: 'flex-start',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginBottom: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  aiAvatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  userAvatar: {
    backgroundColor: '#007AFF',
  },
  bubbleWrapper: {
    maxWidth: '75%',
    marginHorizontal: 8,
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  aiBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  aiText: {
    color: '#1A2845',
    fontWeight: '500',
  },
  userText: {
    color: '#FFF',
  },
});
