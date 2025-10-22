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
];

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
