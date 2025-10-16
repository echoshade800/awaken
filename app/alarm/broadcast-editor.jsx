import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, GripVertical, Clock, Calendar, Cloud, CalendarCheck, Sparkles } from 'lucide-react-native';
import useStore from '../../lib/store';

const MODULE_ICONS = {
  time: Clock,
  date: Calendar,
  weather: Cloud,
  schedule: CalendarCheck,
  lucky: Sparkles,
};

const MODULE_LABELS = {
  time: '时间播报',
  date: '日期播报',
  weather: '天气预报',
  schedule: '日程提醒',
  lucky: '每日彩蛋',
};

const MODULE_DESCRIPTIONS = {
  time: '播报当前时间，例如"现在是早上7点"',
  date: '播报日期和星期，例如"今天是星期五"',
  weather: '播报今日天气，例如"今天最高温24度"',
  schedule: '播报今日日程，例如"你今天有个会议"',
  lucky: '播报每日幸运内容，例如"今日幸运色是蓝色"',
};

export default function BroadcastEditor() {
  const router = useRouter();
  const { currentAlarmDraft, updateDraft } = useStore();
  const [modules, setModules] = useState(currentAlarmDraft?.voiceModules || []);

  const handleToggle = (moduleType) => {
    const updated = modules.map((m) =>
      m.type === moduleType ? { ...m, enabled: !m.enabled } : m
    );
    setModules(updated);
  };

  const handleSave = () => {
    updateDraft({ voiceModules: modules });
    router.back();
  };

  const renderModule = (module) => {
    const Icon = MODULE_ICONS[module.type];
    const label = MODULE_LABELS[module.type];
    const description = MODULE_DESCRIPTIONS[module.type];

    return (
      <View key={module.type} style={styles.moduleCard}>
        <View style={styles.moduleHeader}>
          <View style={styles.moduleLeft}>
            <GripVertical size={20} color="#CCC" />
            <Icon size={24} color="#007AFF" />
            <View style={styles.moduleInfo}>
              <Text style={styles.moduleLabel}>{label}</Text>
              <Text style={styles.moduleDescription}>{description}</Text>
            </View>
          </View>
          <Switch
            value={module.enabled}
            onValueChange={() => handleToggle(module.type)}
            trackColor={{ false: '#E0E0E0', true: '#34C759' }}
            thumbColor="#FFF"
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>语音播报设置</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>选择播报内容</Text>
        <Text style={styles.sectionDescription}>
          拖动模块可以调整播报顺序，关闭不需要的模块
        </Text>

        {modules.map((module) => renderModule(module))}

        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>播报预览</Text>
          <View style={styles.previewBox}>
            <Text style={styles.previewText}>
              {modules
                .filter((m) => m.enabled)
                .map((m) => MODULE_LABELS[m.type])
                .join(' → ')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  moduleCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  moduleDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  previewSection: {
    marginHorizontal: 16,
    marginTop: 32,
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  previewBox: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  previewText: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
  },
});
