import {
  Clock,
  Calendar,
  Cloud,
  Battery,
  CalendarDays,
  Palette,
  Gift,
  Shirt,
  ThermometerSun,
  Snowflake,
  Thermometer,
  Droplets,
  Moon,
  Activity
} from 'lucide-react-native';

export const BROADCAST_MODULES = [
  {
    id: 'time',
    label: '当前时间',
    icon: Clock,
    tag: '{时间}',
    description: '显示当前的小时和分钟',
    mockValue: '7点30分'
  },
  {
    id: 'date',
    label: '日期',
    icon: Calendar,
    tag: '{日期}',
    description: '显示完整的日期信息',
    mockValue: '2025年10月16日星期三'
  },
  {
    id: 'weather',
    label: '天气',
    icon: Cloud,
    tag: '{天气}',
    description: '当前天气状况',
    mockValue: '晴天'
  },
  {
    id: 'high-temp',
    label: '最高温',
    icon: ThermometerSun,
    tag: '{最高温}',
    description: '今日最高气温',
    mockValue: '28度'
  },
  {
    id: 'low-temp',
    label: '最低温',
    icon: Snowflake,
    tag: '{最低温}',
    description: '今日最低气温',
    mockValue: '18度'
  },
  {
    id: 'avg-temp',
    label: '平均温',
    icon: Thermometer,
    tag: '{平均温}',
    description: '今日平均气温',
    mockValue: '23度'
  },
  {
    id: 'humidity',
    label: '湿度',
    icon: Droplets,
    tag: '{湿度}',
    description: '当前空气湿度',
    mockValue: '65%'
  },
  {
    id: 'clothing',
    label: '穿衣提醒',
    icon: Shirt,
    tag: '{穿衣}',
    description: '根据天气提供穿衣建议',
    mockValue: '适合穿薄外套或长袖'
  },
  {
    id: 'dream',
    label: '梦境关键词',
    icon: Moon,
    tag: '{梦境}',
    description: '记录和提醒昨晚的梦境',
    mockValue: '你梦到了大海和星空'
  },
  {
    id: 'rhythm',
    label: '节律状态',
    icon: Activity,
    tag: '{节律}',
    description: '显示当前的生物节律状态',
    mockValue: '当前能量水平高峰期'
  },
  {
    id: 'battery',
    label: '电量',
    icon: Battery,
    tag: '{电量}',
    description: '设备当前电量',
    mockValue: '80%'
  },
  {
    id: 'schedule',
    label: '日程提醒',
    icon: CalendarDays,
    tag: '{日程}',
    description: '今日待办事项和日程',
    mockValue: '上午10点有会议'
  },
  {
    id: 'lucky-color',
    label: '幸运色',
    icon: Palette,
    tag: '{幸运色}',
    description: '今日的幸运颜色',
    mockValue: '蓝色'
  },
  {
    id: 'random',
    label: '随机彩蛋',
    icon: Gift,
    tag: '{彩蛋}',
    description: '随机的趣味内容',
    mockValue: '今天会遇到好运'
  },
];

export const VOICE_PACKAGES = [
  {
    id: 'energetic-girl',
    label: '元气少女',
    description: '活力满满的甜美女声',
    tone: 'cheerful',
    pitch: 'high'
  },
  {
    id: 'calm-man',
    label: '沉稳大叔',
    description: '温暖有力的男声',
    tone: 'steady',
    pitch: 'low'
  },
  {
    id: 'gentle-lady',
    label: '温柔姐姐',
    description: '轻柔舒缓的女声',
    tone: 'gentle',
    pitch: 'medium'
  },
  {
    id: 'cheerful-boy',
    label: '阳光男孩',
    description: '热情开朗的男声',
    tone: 'energetic',
    pitch: 'medium-high'
  },
];

export function generateMockData() {
  const mockData = {};
  BROADCAST_MODULES.forEach(module => {
    mockData[module.tag] = module.mockValue;
  });
  return mockData;
}

export function replaceTags(content, data = null) {
  const replaceData = data || generateMockData();
  let result = content;

  Object.keys(replaceData).forEach(tag => {
    result = result.replace(
      new RegExp(tag.replace(/[{}]/g, '\\$&'), 'g'),
      replaceData[tag]
    );
  });

  return result;
}
