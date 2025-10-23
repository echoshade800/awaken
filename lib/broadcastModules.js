/**
 * 语音播报模块 (Voice Broadcast Modules)
 *
 * 用户在创建闹钟时，如果选择"语音播报"作为叫醒方式，
 * 可以进入语音播报编辑器，自定义播报内容。
 *
 * 编辑器支持插入动态标签（如 {time}, {weather} 等），
 * 这些标签在闹钟响起时会被替换为实时数据。
 *
 * 例如：
 * "早安！现在是 {time}，今天天气 {weather}，记得 {clothing}哦～"
 * → "早安！现在是 7:30 AM，今天天气 Sunny，记得穿件薄外套哦～"
 */

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
  Activity,
  User,
  BedDouble,
  CalendarClock
} from 'lucide-react-native';

/**
 * 所有可用的播报模块
 * 每个模块包含：
 * - id: 唯一标识符
 * - label: 显示名称
 * - icon: 图标组件
 * - tag: 在播报文本中使用的标签（如 {time}）
 * - description: 模块描述
 * - mockValue: 预览时的示例值
 */
export const BROADCAST_MODULES = [
  {
    id: 'time',
    label: 'Current Time',
    icon: Clock,
    tag: '{time}',
    description: 'Display current hour and minute',
    mockValue: '7:30 AM'
  },
  {
    id: 'date',
    label: 'Date',
    icon: Calendar,
    tag: '{date}',
    description: 'Display full date information',
    mockValue: 'Wednesday, October 16, 2025'
  },
  {
    id: 'weekday',
    label: 'Weekday',
    icon: CalendarDays,
    tag: '{weekday}',
    description: 'Day of the week',
    mockValue: 'Tuesday'
  },
  {
    id: 'schedule',
    label: 'Schedule',
    icon: CalendarClock,
    tag: '{schedule}',
    description: 'Today\'s schedule or tasks',
    mockValue: '9 AM team meeting, 6 PM gym session'
  },
  {
    id: 'weather',
    label: 'Weather',
    icon: Cloud,
    tag: '{weather}',
    description: 'Current weather condition',
    mockValue: 'Sunny'
  },
  {
    id: 'high-temp',
    label: 'High Temp',
    icon: ThermometerSun,
    tag: '{high-temp}',
    description: 'Today\'s highest temperature',
    mockValue: '28°C'
  },
  {
    id: 'low-temp',
    label: 'Low Temp',
    icon: Snowflake,
    tag: '{low-temp}',
    description: 'Today\'s lowest temperature',
    mockValue: '18°C'
  },
  {
    id: 'avg-temp',
    label: 'Avg Temp',
    icon: Thermometer,
    tag: '{avg-temp}',
    description: 'Today\'s average temperature',
    mockValue: '23°C'
  },
  {
    id: 'humidity',
    label: 'Humidity',
    icon: Droplets,
    tag: '{humidity}',
    description: 'Current air humidity',
    mockValue: '65%'
  },
  {
    id: 'clothing',
    label: 'Clothing Tip',
    icon: Shirt,
    tag: '{clothing}',
    description: 'Clothing advice based on weather',
    mockValue: 'Light jacket or long sleeve recommended'
  },
  {
    id: 'dream',
    label: 'Dream Keyword',
    icon: Moon,
    tag: '{dream}',
    description: 'Record and remind last night\'s dream',
    mockValue: 'You dreamed of the ocean and starry sky'
  },
  {
    id: 'rhythm',
    label: 'Rhythm Status',
    icon: Activity,
    tag: '{rhythm}',
    description: 'Display current biological rhythm status',
    mockValue: 'Current energy level at peak'
  },
  {
    id: 'battery',
    label: 'Battery',
    icon: Battery,
    tag: '{battery}',
    description: 'Device current battery level',
    mockValue: '80%'
  },
  {
    id: 'schedule',
    label: 'Schedule',
    icon: CalendarDays,
    tag: '{schedule}',
    description: 'Today\'s to-do items and schedule',
    mockValue: 'Meeting at 10 AM'
  },
  {
    id: 'lucky-color',
    label: 'Lucky Color',
    icon: Palette,
    tag: '{lucky-color}',
    description: 'Today\'s lucky color',
    mockValue: 'Blue'
  },
  {
    id: 'random',
    label: 'Random',
    icon: Gift,
    tag: '{random}',
    description: 'Random fun content',
    mockValue: 'You\'ll meet good luck today'
  },
  {
    id: 'nickname',
    label: 'Nickname',
    icon: User,
    tag: '{nickname}',
    description: 'Your personalized nickname',
    mockValue: 'Sleepy Bear'
  },
  {
    id: 'sleep-duration',
    label: 'Sleep Duration',
    icon: BedDouble,
    tag: '{sleep-duration}',
    description: 'How long you slept last night',
    mockValue: '7 hours 30 minutes'
  },
];

/**
 * 语音包 (Voice Packages)
 *
 * 用户可以选择不同的语音角色来播报闹钟内容。
 * 每个语音包有不同的音色、语调和风格。
 *
 * 注意：这些是预定义的语音角色，实际的 TTS（文本转语音）
 * 实现需要根据 tone 和 pitch 参数配置语音引擎。
 */
export const VOICE_PACKAGES = [
  {
    id: 'energetic-girl',
    label: 'Energetic Girl',
    description: 'Sweet and energetic female voice',
    tone: 'cheerful',
    pitch: 'high'
  },
  {
    id: 'calm-man',
    label: 'Calm Man',
    description: 'Warm and powerful male voice',
    tone: 'steady',
    pitch: 'low'
  },
  {
    id: 'gentle-lady',
    label: 'Gentle Lady',
    description: 'Soft and soothing female voice',
    tone: 'gentle',
    pitch: 'medium'
  },
  {
    id: 'cheerful-boy',
    label: 'Cheerful Boy',
    description: 'Warm and enthusiastic male voice',
    tone: 'energetic',
    pitch: 'medium-high'
  },
];

/**
 * 生成模拟数据
 * 用于预览播报内容时，将所有标签替换为示例值
 *
 * @returns {Object} 标签到示例值的映射，例如 { '{time}': '7:30 AM', '{weather}': 'Sunny', ... }
 */
export function generateMockData() {
  const mockData = {};
  BROADCAST_MODULES.forEach(module => {
    mockData[module.tag] = module.mockValue;
  });
  return mockData;
}

/**
 * 替换播报内容中的标签
 * 将播报文本中的 {tag} 替换为实际数据
 *
 * @param {string} content - 包含标签的播报文本，例如 "早安！现在是 {time}，天气 {weather}"
 * @param {Object} data - 标签到实际值的映射，如果不提供则使用模拟数据
 * @returns {string} 替换后的文本，例如 "早安！现在是 7:30 AM，天气 Sunny"
 *
 * @example
 * replaceTags("早安！{time}，{weather}", {'{time}': '07:30', '{weather}': '晴天'})
 * // 返回 "早安！07:30，晴天"
 */
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
