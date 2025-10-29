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
    mockValue: 'October 16'
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
    mockValue: '28'
  },
  {
    id: 'uv-temp',
    label: 'UV Temp',
    icon: Activity,
    tag: '{uv-temp}',
    description: 'UV index temperature',
    mockValue: 'Moderate'
  },
  {
    id: 'precipitation',
    label: 'Precipitation',
    icon: Droplets,
    tag: '{precipitation}',
    description: 'Precipitation probability',
    mockValue: '20%'
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
    icon: CalendarClock,
    tag: '{schedule}',
    description: 'Today\'s schedule or tasks',
    mockValue: '9 AM team meeting'
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
    id: 'sd',
    label: 'SD',
    icon: BedDouble,
    tag: '{sd}',
    description: 'Sleep duration',
    mockValue: '7h 30m'
  },
  {
    id: 'dream-link',
    label: 'Dream Link',
    icon: Moon,
    tag: '{dream-link}',
    description: 'Link to dream journal',
    mockValue: 'ocean and stars'
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
    id: 'random-tip',
    label: 'Random Tip',
    icon: Gift,
    tag: '{random-tip}',
    description: 'Random motivational tip',
    mockValue: 'Stay hydrated today'
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
    id: 'the-host',
    label: 'The Host',
    emoji: '👨‍💼',
    description: 'Professional and systematic voice',
    tone: 'formal',
    pitch: 'medium'
  },
  {
    id: 'fairy-morning',
    label: 'Fairy Morning',
    emoji: '🧚',
    description: 'Magical and enchanting voice',
    tone: 'gentle',
    pitch: 'high'
  },
  {
    id: 'hero-mode',
    label: 'Hero Mode',
    emoji: '🦸‍♂️',
    description: 'Powerful and energetic voice',
    tone: 'energetic',
    pitch: 'medium-high'
  },
  {
    id: 'pet-buddy',
    label: 'Pet Buddy',
    emoji: '🐶',
    description: 'Cute and cheerful voice',
    tone: 'playful',
    pitch: 'high'
  },
  {
    id: 'dream-voice',
    label: 'Dream Voice',
    emoji: '💬',
    description: 'Calm and soothing voice',
    tone: 'calm',
    pitch: 'low'
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
