import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Clock, Calendar, Bell, Volume2, Zap, Trash2, CreditCard as Edit3 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useStore from '../../lib/store';

const PERIOD_LABELS = {
  everyday: '每天',
  workday: '工作日',
  weekend: '周末',
  custom: '自定义',
};

const WAKE_MODE_LABELS = {
  voice: '语音播报',
  ringtone: '铃声',
};

const VOICE_PACKAGE_LABELS = {
  'energetic-girl': '元气少女',
  'calm-man': '沉稳大叔',
  'gentle-lady': '温柔姐姐',
  'cheerful-boy': '阳光男孩',
};

const TASK_LABELS = {
  none: '无任务',
  quiz: '算数题',
  click: '点击挑战',
  'quick-tap': '快速点击',
};

export default function AlarmDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { alarms, deleteAlarm, loadAlarmForEdit } = useStore();

  const alarm = alarms.find((a) => a.id === id);

  if (!alarm) {
    return (
      <View style={styles.container}>
        <Text>闹钟不存在</Text>
      </View>
    );
  }

  const handleEdit = () => {
    loadAlarmForEdit(id);
    router.push('/alarm/create');
  };

  const handleDelete = () => {
    Alert.alert(
      '删除闹钟',
      '确定要删除这个闹钟吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            await deleteAlarm(id);
            router.back();
          },
        },
      ]
    );
  };

  const renderBroadcastPreview = () => {
    if (!alarm.broadcastContent) {
      return <Text style={styles.detailValue}>默认播报内容</Text>;
    }

    const parts = [];
    let lastIndex = 0;
    const regex = /\{(时间|日期|天气|最高温|最低温|平均温|湿度|穿衣|梦境|节律|电量|日程|幸运色|彩蛋)\}/g;
    let match;

    while ((match = regex.exec(alarm.broadcastContent)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: alarm.broadcastContent.substring(lastIndex, match.index),
        });
      }

      parts.push({
        type: 'tag',
        label: match[1],
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < alarm.broadcastContent.length) {
      parts.push({
        type: 'text',
        content: alarm.broadcastContent.substring(lastIndex),
      });
    }

    return (
      <View style={styles.broadcastPreview}>
        {parts.map((part, index) => {
          if (part.type === 'text') {
            return (
              <Text key={index} style={styles.broadcastText}>
                {part.content}
              </Text>
            );
          } else {
            return (
              <View key={index} style={styles.broadcastTag}>
                <Text style={styles.broadcastTagText}>{part.label}</Text>
              </View>
            );
          }
        })}
      </View>
    );
  };

  return (
    <LinearGradient colors={['#FFF7E8', '#E6F4FF']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>闹钟详情</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Trash2 size={22} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 时间卡片 */}
        <View style={styles.timeCard}>
          <Text style={styles.timeText}>{alarm.time}</Text>
          {alarm.label && <Text style={styles.labelText}>{alarm.label}</Text>}
        </View>

        {/* 详细信息卡片 */}
        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Calendar size={20} color="#007AFF" />
              <Text style={styles.detailLabel}>重复</Text>
            </View>
            <Text style={styles.detailValue}>{PERIOD_LABELS[alarm.period] || '每天'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Bell size={20} color="#007AFF" />
              <Text style={styles.detailLabel}>叫醒方式</Text>
            </View>
            <Text style={styles.detailValue}>
              {WAKE_MODE_LABELS[alarm.wakeMode] || '语音播报'}
            </Text>
          </View>

          {alarm.wakeMode === 'voice' && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailColumn}>
                <View style={styles.detailLeft}>
                  <Volume2 size={20} color="#007AFF" />
                  <Text style={styles.detailLabel}>播报内容</Text>
                </View>
                <View style={styles.detailValueContainer}>
                  {renderBroadcastPreview()}
                </View>
              </View>

              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <View style={styles.detailLeft}>
                  <Volume2 size={20} color="#007AFF" />
                  <Text style={styles.detailLabel}>语音包</Text>
                </View>
                <Text style={styles.detailValue}>
                  {VOICE_PACKAGE_LABELS[alarm.voicePackage] || '元气少女'}
                </Text>
              </View>
            </>
          )}

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Zap size={20} color="#007AFF" />
              <Text style={styles.detailLabel}>关闭任务</Text>
            </View>
            <Text style={styles.detailValue}>
              {TASK_LABELS[alarm.task] || '无任务'}
            </Text>
          </View>
        </View>

        {/* 操作按钮 */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEdit}
            activeOpacity={0.8}
          >
            <Edit3 size={20} color="#FFF" />
            <Text style={styles.editButtonText}>编辑闹钟</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
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
    fontWeight: '600',
    color: '#1C1C1E',
  },
  deleteButton: {
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
    gap: 20,
  },
  timeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  timeText: {
    fontSize: 56,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -1,
  },
  labelText: {
    fontSize: 18,
    color: '#666',
    marginTop: 8,
  },
  detailCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailColumn: {
    gap: 12,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  detailValue: {
    fontSize: 15,
    color: '#666',
  },
  detailValueContainer: {
    paddingLeft: 30,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  broadcastPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  broadcastText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
  broadcastTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  broadcastTagText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  actionContainer: {
    paddingTop: 8,
  },
  editButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
