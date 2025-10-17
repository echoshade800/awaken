import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Clock, Calendar, Bell, Volume2, Zap, Trash2, CreditCard as Edit3, ChevronRight, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import useStore from '../../lib/store';
import StarBackground from '../../components/StarBackground';

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

const VOICE_PACKAGE_OPTIONS = [
  { label: '元气少女', value: 'energetic-girl' },
  { label: '沉稳大叔', value: 'calm-man' },
  { label: '温柔姐姐', value: 'gentle-lady' },
  { label: '阳光男孩', value: 'cheerful-boy' },
];

const TASK_OPTIONS = [
  { label: '不需要游戏', value: 'none' },
  { label: '数学挑战', value: 'quiz' },
  { label: '记忆配对', value: 'click' },
  { label: '快速反应', value: 'quick-tap' },
];

export default function AlarmDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { alarms, deleteAlarm, loadAlarmForEdit, updateAlarm } = useStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalOptions, setModalOptions] = useState([]);

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

  const openModal = (type, options) => {
    setModalType(type);
    setModalOptions(options);
    setModalVisible(true);
  };

  const handleSelectOption = async (value) => {
    await updateAlarm(id, { [modalType]: value });
    setModalVisible(false);
  };

  const handleEditBroadcast = () => {
    loadAlarmForEdit(id);
    router.push('/alarm/broadcast-editor');
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
    <LinearGradient colors={['#FFE4B5', '#FFFAF0']} style={styles.container}>
      <StarBackground opacity={0.15} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alarm Details</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Trash2 size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 时间卡片 */}
        <TouchableOpacity style={styles.timeCard} onPress={handleEdit} activeOpacity={0.7}>
          <View style={styles.sunIcon}>
            <View style={styles.sunCore} />
            <View style={styles.sunRays} />
          </View>
          <Text style={styles.timeText}>{alarm.time}</Text>
          {alarm.label && <Text style={styles.labelText}>{alarm.label}</Text>}
        </TouchableOpacity>

        {/* 详细信息卡片 */}
        <View style={styles.detailCard}>
          <TouchableOpacity
            style={styles.detailRow}
            onPress={() => openModal('period', PERIOD_OPTIONS)}
            activeOpacity={0.7}
          >
            <View style={styles.detailLeft}>
              <Calendar size={20} color="#FF9A76" />
              <Text style={styles.detailLabel}>Repeat</Text>
            </View>
            <View style={styles.detailRight}>
              <Text style={styles.detailValue}>{PERIOD_LABELS[alarm.period] || 'Everyday'}</Text>
              <ChevronRight size={16} color="#999" />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.detailRow}
            onPress={() => openModal('wakeMode', WAKE_MODE_OPTIONS)}
            activeOpacity={0.7}
          >
            <View style={styles.detailLeft}>
              <Bell size={20} color="#FF9A76" />
              <Text style={styles.detailLabel}>Wake Mode</Text>
            </View>
            <View style={styles.detailRight}>
              <Text style={styles.detailValue}>
                {WAKE_MODE_LABELS[alarm.wakeMode] || 'Voice'}
              </Text>
              <ChevronRight size={16} color="#999" />
            </View>
          </TouchableOpacity>

          {alarm.wakeMode === 'voice' && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.detailColumn} onPress={handleEditBroadcast} activeOpacity={0.7}>
                <View style={styles.detailLeft}>
                  <Volume2 size={20} color="#FF9A76" />
                  <Text style={styles.detailLabel}>Broadcast</Text>
                  <ChevronRight size={16} color="#999" style={{ marginLeft: 'auto' }} />
                </View>
                <View style={styles.detailValueContainer}>
                  {renderBroadcastPreview()}
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.detailRow}
                onPress={() => openModal('voicePackage', VOICE_PACKAGE_OPTIONS)}
                activeOpacity={0.7}
              >
                <View style={styles.detailLeft}>
                  <Volume2 size={20} color="#FF9A76" />
                  <Text style={styles.detailLabel}>Voice Pack</Text>
                </View>
                <View style={styles.detailRight}>
                  <Text style={styles.detailValue}>
                    {VOICE_PACKAGE_LABELS[alarm.voicePackage] || 'Energetic Girl'}
                  </Text>
                  <ChevronRight size={16} color="#999" />
                </View>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.detailRow}
            onPress={() => openModal('task', TASK_OPTIONS)}
            activeOpacity={0.7}
          >
            <View style={styles.detailLeft}>
              <Zap size={20} color="#FF9A76" />
              <Text style={styles.detailLabel}>Task</Text>
            </View>
            <View style={styles.detailRight}>
              <Text style={styles.detailValue}>
                {TASK_LABELS[alarm.task] || 'None'}
              </Text>
              <ChevronRight size={16} color="#999" />
            </View>
          </TouchableOpacity>
        </View>

        {/* 操作按钮 */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEdit}
            activeOpacity={0.8}
          >
            <Edit3 size={20} color="#FFF" />
            <Text style={styles.editButtonText}>Edit Alarm</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 选项模态框 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === 'period' && '重复周期'}
                {modalType === 'wakeMode' && '唤醒模式'}
                {modalType === 'voicePackage' && '语音包'}
                {modalType === 'task' && '起床任务'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalOptionsContainer}>
              {modalOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.modalOption}
                  onPress={() => handleSelectOption(option.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalOptionText}>{option.label}</Text>
                  {alarm[modalType] === option.value && (
                    <Check size={20} color="#FF9A76" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
    backgroundColor: 'rgba(255, 154, 118, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '300',
    color: '#4A5F8F',
    letterSpacing: 0.5,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 154, 118, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  sunIcon: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sunCore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFA500',
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  sunRays: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFB84D',
    opacity: 0.4,
  },
  timeText: {
    fontSize: 56,
    fontWeight: '300',
    color: '#4A5F8F',
    letterSpacing: -1,
  },
  labelText: {
    fontSize: 18,
    color: '#FF9A76',
    marginTop: 8,
    fontWeight: '400',
  },
  detailCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    fontWeight: '400',
    color: '#4A5F8F',
  },
  detailValue: {
    fontSize: 15,
    color: '#8B7355',
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
    backgroundColor: 'rgba(255, 154, 118, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 154, 118, 0.3)',
  },
  broadcastTagText: {
    fontSize: 13,
    color: '#FF9A76',
    fontWeight: '500',
  },
  actionContainer: {
    paddingTop: 8,
  },
  editButton: {
    backgroundColor: '#FF9A76',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#FF9A76',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A5F8F',
  },
  modalClose: {
    fontSize: 36,
    color: '#999',
    fontWeight: '300',
    lineHeight: 36,
  },
  modalOptionsContainer: {
    paddingHorizontal: 20,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
});
