// 互动游戏配置
// 这些游戏目前仅用于选择，实际游戏逻辑将在后续接入

export const INTERACTION_GAMES = {
  // 推荐游戏
  'math-quiz': {
    id: 'math-quiz',
    label: '简单算数',
    description: '完成3道简单的加减法题目',
    icon: '🔢',
  },
  'click-challenge': {
    id: 'click-challenge',
    label: '点击挑战',
    description: '3秒内点击屏幕上随机出现的5个光点',
    icon: '👆',
  },
  'color-finder': {
    id: 'color-finder',
    label: '找到颜色',
    description: '在多个方块中找到指定颜色',
    icon: '🎨',
  },
  'typing-challenge': {
    id: 'typing-challenge',
    label: '打字输入',
    description: '输入指定文字',
    icon: '⌨️',
  },

  // 更多游戏
  'puzzle-2x2': {
    id: 'puzzle-2x2',
    label: '拼图挑战',
    description: '将2x2打乱的图片拖回正确位置',
    icon: '🧩',
  },
  'memory-match': {
    id: 'memory-match',
    label: '记忆配对',
    description: '翻牌配对相同图案',
    icon: '🃏',
  },
  'quick-tap': {
    id: 'quick-tap',
    label: '快速点击',
    description: '快速点击指定区域',
    icon: '⚡',
  },
  'wordle': {
    id: 'wordle',
    label: 'Wordle猜词',
    description: '猜出正确的单词',
    icon: '📝',
  },
  'puzzle-3x3': {
    id: 'puzzle-3x3',
    label: '高级拼图',
    description: '将3x3打乱的图片拖回正确位置',
    icon: '🎯',
  },
  'linker': {
    id: 'linker',
    label: 'Linker连线',
    description: '连接相同颜色的点',
    icon: '🔗',
  },
  'block-puzzle': {
    id: 'block-puzzle',
    label: 'Block拼图',
    description: '放置方块填满网格',
    icon: '🟦',
  },
  'shake-phone': {
    id: 'shake-phone',
    label: '甩甩手机',
    description: '摇动手机达到指定次数',
    icon: '📱',
  },
};

// 推荐游戏（默认显示的4个）
export const RECOMMENDED_GAMES = ['math-quiz', 'click-challenge', 'color-finder', 'typing-challenge'];

// 更多游戏（展开后显示的8个）
export const MORE_GAMES = [
  'puzzle-2x2',
  'memory-match',
  'quick-tap',
  'wordle',
  'puzzle-3x3',
  'linker',
  'block-puzzle',
  'shake-phone',
];

// 是否需要互动选项
export const INTERACTION_ENABLE_OPTIONS = [
  { label: '不需要互动', value: false },
  { label: '需要互动游戏', value: true },
];

// 获取推荐游戏选项
export const getRecommendedGames = () => {
  return RECOMMENDED_GAMES.map((id) => ({
    label: INTERACTION_GAMES[id].label,
    value: id,
    description: INTERACTION_GAMES[id].description,
    icon: INTERACTION_GAMES[id].icon,
  }));
};

// 获取更多游戏选项
export const getMoreGames = () => {
  return MORE_GAMES.map((id) => ({
    label: INTERACTION_GAMES[id].label,
    value: id,
    description: INTERACTION_GAMES[id].description,
    icon: INTERACTION_GAMES[id].icon,
  }));
};

// 获取游戏的显示标签
export const getGameLabel = (gameId) => {
  return INTERACTION_GAMES[gameId]?.label || gameId;
};
