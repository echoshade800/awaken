import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, Pressable, TextInput } from 'react-native';
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
  quiz: '数学挑战',
  memory: '记忆配对',
  'quick-tap': '快速反应',
};

const PERIOD_OPTIONS = [
  { label: '每天', value: 'everyday' },
  { label: '工作日', value: 'workday' },
  { label: '周末', value: 'weekend' },
  { label: '只一次', value: 'tomorrow' },
  { label: '自定义', value: 'custom' },
];

const WAKE_MODE_OPTIONS = [
  { label: '语音播报', value: 'voice' },
  { label: '铃声', value: 'ringtone' },
  { label: '震动', value: 'vibration' },
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
  { label: '记忆配对', value: 'memory' },
  { label: '快速反应', value: 'quick-tap' },
];

const WEEKDAY_OPTIONS = [
  { label: '周一', value: 'monday' },
  { label: '周二', value: 'tuesday' },
  { label: '周三', value: 'wednesday' },
  { label: '周四', value: 'thursday' },
  { label: '周五', value: 'friday' },
  { label: '周六', value: 'saturday' },
  { label: '周日', value: 'sunday' },
];

export default function AlarmDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { alarms, deleteAlarm, loadAlarmForEdit, updateAlarm } = useStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalOptions, setModalOptions] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [selectedHour, setSelectedHour] = useState('07');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

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
    if (modalType === 'period' && value === 'custom') {
      setSelectedDays(alarm.customDays || []);
      setModalType('customDays');
      return;
    }
    await updateAlarm(id, { [modalType]: value });
    setModalVisible(false);
  };

  const toggleDay = (day) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const saveCustomDays = async () => {
    await updateAlarm(id, { period: 'custom', customDays: selectedDays });
    setModalVisible(false);
  };

  const handleEditTime = () => {
    const [hour, minute] = alarm.time.split(':');
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setTimeModalVisible(true);
  };

  const saveTime = async () => {
    const newTime = `${selectedHour}:${selectedMinute}`;
    await updateAlarm(id, { time: newTime });
    setTimeModalVisible(false);
  };

  const handleEditBroadcast = () => {
    loadAlarmForEdit(id);
    router.push('/alarm/broadcast-editor');
  };

  const handleDelete = () => {
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    setDeleteModalVisible(false);
    await deleteAlarm(id);
    setShowSuccessToast(true);
    setTimeout(() => {
      router.back();
    }, 1500);
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
        <TouchableOpacity style={styles.timeCard} onPress={handleEditTime} activeOpacity={0.7}>
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
                {modalType === 'customDays' && '选择星期'}
                {modalType === 'wakeMode' && '唤醒模式'}
                {modalType === 'voicePackage' && '语音包'}
                {modalType === 'task' && '起床任务'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalOptionsContainer}>
              {modalType === 'customDays' ? (
                <>
                  {WEEKDAY_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={styles.modalOption}
                      onPress={() => toggleDay(option.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.modalOptionText}>{option.label}</Text>
                      {selectedDays.includes(option.value) && (
                        <Check size={20} color="#FF9A76" />
                      )}
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={saveCustomDays}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.saveButtonText}>确认</Text>
                  </TouchableOpacity>
                </>
              ) : (
                modalOptions.map((option) => (
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
                ))
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 时间选择模态框 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={timeModalVisible}
        onRequestClose={() => setTimeModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setTimeModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>设置时间</Text>
              <TouchableOpacity onPress={() => setTimeModalVisible(false)}>
                <Text style={styles.modalClose}>×</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.timePickerContainer}>
              <View style={styles.timePickerRow}>
                <View style={styles.timePickerColumn}>
                  <Text style={styles.timePickerLabel}>小时</Text>
                  <ScrollView
                    style={styles.timePickerScroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.timePickerScrollContent}
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <TouchableOpacity
                          key={hour}
                          style={[
                            styles.timePickerOption,
                            selectedHour === hour && styles.timePickerOptionSelected
                          ]}
                          onPress={() => setSelectedHour(hour)}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.timePickerOptionText,
                            selectedHour === hour && styles.timePickerOptionTextSelected
                          ]}>
                            {hour}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
                <Text style={styles.timeSeparator}>:</Text>
                <View style={styles.timePickerColumn}>
                  <Text style={styles.timePickerLabel}>分钟</Text>
                  <ScrollView
                    style={styles.timePickerScroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.timePickerScrollContent}
                  >
                    {Array.from({ length: 60 }, (_, i) => {
                      const minute = i.toString().padStart(2, '0');
                      return (
                        <TouchableOpacity
                          key={minute}
                          style={[
                            styles.timePickerOption,
                            selectedMinute === minute && styles.timePickerOptionSelected
                          ]}
                          onPress={() => setSelectedMinute(minute)}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.timePickerOptionText,
                            selectedMinute === minute && styles.timePickerOptionTextSelected
                          ]}>
                            {minute}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveTime}
                activeOpacity={0.8}
              >
                <Text style={styles.saveButtonText}>确认</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 删除确认模态框 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>删除闹钟</Text>
            <Text style={styles.deleteModalMessage}>确定要删除这个闹钟吗？</Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelButton]}
                onPress={() => setDeleteModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.confirmDeleteButton]}
                onPress={confirmDelete}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmDeleteButtonText}>删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 删除成功提示 */}
      {showSuccessToast && (
        <View style={styles.successToast}>
          <Check size={20} color="#FFF" />
          <Text style={styles.successToastText}>闹钟已删除</Text>
        </View>
      )}
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
  saveButton: {
    backgroundColor: '#FF9A76',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  timePickerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  timePickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timePickerLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 10,
  },
  timePickerScroll: {
    maxHeight: 200,
    width: '100%',
  },
  timePickerScrollContent: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  timePickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 60,
    alignItems: 'center',
    borderRadius: 8,
  },
  timePickerOptionSelected: {
    backgroundColor: 'rgba(255, 154, 118, 0.2)',
  },
  timePickerOptionText: {
    fontSize: 18,
    color: '#333',
  },
  timePickerOptionTextSelected: {
    color: '#FF9A76',
    fontWeight: '600',
  },
  timeSeparator: {
    fontSize: 32,
    color: '#4A5F8F',
    fontWeight: '300',
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 340,
    alignItems: 'center',
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4A5F8F',
    marginBottom: 12,
  },
  deleteModalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmDeleteButton: {
    backgroundColor: '#FF4444',
  },
  confirmDeleteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  successToast: {
    position: 'absolute',
    top: 100,
    left: '50%',
    transform: [{ translateX: -80 }],
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  successToastText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
