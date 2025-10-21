import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { X } from 'lucide-react-native';
import { getGameLabel } from '../lib/interactionOptions';

const PERIOD_LABELS = {
  everyday: '每天',
  workday: '工作日',
  weekend: '周末',
  tomorrow: '只一次',
};

const VOICE_PACKAGE_LABELS = {
  'energetic-girl': '元气少女',
  'calm-man': '沉稳大叔',
};

export default function AlarmSummaryModal({ visible, alarm, onConfirm, onCancel }) {
  if (!alarm) return null;

  const periodLabel = PERIOD_LABELS[alarm.period] || alarm.period;
  const voiceLabel = VOICE_PACKAGE_LABELS[alarm.voicePackage] || alarm.voicePackage;
  const gameLabel = alarm.interactionType ? getGameLabel(alarm.interactionType) : null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>闹钟设置总结</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.summaryItem}>
              <Text style={styles.label}>📝 名称</Text>
              <Text style={styles.value}>{alarm.label || '未设置'}</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.label}>⏰ 时间</Text>
              <Text style={styles.value}>{alarm.time}</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.label}>📅 周期</Text>
              <Text style={styles.value}>{periodLabel}</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.label}>🎙️ 唤醒方式</Text>
              {alarm.wakeMode === 'voice' ? (
                <Text style={styles.value}>语音播报（{voiceLabel}）</Text>
              ) : alarm.wakeMode === 'ringtone' ? (
                <Text style={styles.value}>铃声</Text>
              ) : alarm.wakeMode === 'vibration' ? (
                <Text style={styles.value}>震动</Text>
              ) : (
                <Text style={styles.value}>未设置</Text>
              )}
            </View>

            {alarm.broadcastContent && (
              <View style={styles.summaryItem}>
                <Text style={styles.label}>📻 播报内容</Text>
                <Text style={styles.value}>
                  {alarm.broadcastContent === 'default' ? '默认播报' : '自定义播报'}
                </Text>
              </View>
            )}

            <View style={styles.summaryItem}>
              <Text style={styles.label}>🎮 互动游戏</Text>
              {alarm.interactionEnabled && gameLabel ? (
                <Text style={styles.value}>{gameLabel}</Text>
              ) : (
                <Text style={styles.value}>无</Text>
              )}
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>继续修改</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.confirmButtonText}>确认保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#FF9A76',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
