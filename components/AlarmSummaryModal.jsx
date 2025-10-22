import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { X, Sparkles } from 'lucide-react-native';
import { getGameLabel } from '../lib/interactionOptions';

const PERIOD_LABELS = {
  everyday: '每天',
  workday: '工作日',
  weekend: '周末',
  tomorrow: '只一次',
};

const VOICE_PACKAGE_LABELS = {
  'energetic-girl': '元气少女🎀',
  'calm-man': '沉稳大叔🧠',
  'ancient-style': '古风公子🌙',
  'cat': '小猫咪🐱',
};

export default function AlarmSummaryModal({ visible, alarm, onConfirm, onCancel, onAddInteraction }) {
  if (!alarm) return null;

  const periodLabel = PERIOD_LABELS[alarm.period] || alarm.period;
  const voiceLabel = VOICE_PACKAGE_LABELS[alarm.voicePackage] || alarm.voicePackage;
  const gameLabel = alarm.interactionType ? getGameLabel(alarm.interactionType) : null;
  const hasInteraction = alarm.interactionEnabled && alarm.interactionType;

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

          <ScrollView style={styles.scrollContent}>
            <View style={styles.content}>
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
              {hasInteraction ? (
                <Text style={styles.value}>{gameLabel}</Text>
              ) : (
                <Text style={styles.value}>无</Text>
              )}
            </View>

            {!hasInteraction && onAddInteraction && (
              <View style={styles.recommendation}>
                <View style={styles.recommendHeader}>
                  <Sparkles size={18} color="#FF9A76" />
                  <Text style={styles.recommendTitle}>推荐：添加互动任务</Text>
                </View>
                <Text style={styles.recommendDesc}>
                  加个小任务让起床更清醒！比如答题、摇一摇或小拼图～😆
                </Text>
                <View style={styles.gameOptions}>
                  <TouchableOpacity
                    style={styles.gameOption}
                    onPress={() => onAddInteraction('quiz')}
                  >
                    <Text style={styles.gameOptionText}>🧠 答题</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.gameOption}
                    onPress={() => onAddInteraction('shake')}
                  >
                    <Text style={styles.gameOptionText}>📱 摇一摇</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.gameOption}
                    onPress={() => onAddInteraction('game')}
                  >
                    <Text style={styles.gameOptionText}>🎮 小游戏</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

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
  scrollContent: {
    maxHeight: '70%',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  recommendation: {
    marginTop: 8,
    padding: 16,
    backgroundColor: '#FFF8F0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE5CC',
  },
  recommendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  recommendTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF9A76',
  },
  recommendDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  gameOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  gameOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD4B8',
  },
  gameOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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
