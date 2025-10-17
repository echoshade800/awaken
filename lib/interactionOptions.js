// Interactive games configuration
// These games are currently for selection only, actual game logic will be implemented later

export const INTERACTION_GAMES = {
  // Recommended games
  'math-quiz': {
    id: 'math-quiz',
    label: 'Math Quiz',
    description: 'Complete 3 simple addition and subtraction problems',
    icon: '🔢',
  },
  'click-challenge': {
    id: 'click-challenge',
    label: 'Click Challenge',
    description: 'Click 5 random light spots on screen within 3 seconds',
    icon: '👆',
  },
  'color-finder': {
    id: 'color-finder',
    label: 'Color Finder',
    description: 'Find the specified color among multiple blocks',
    icon: '🎨',
  },
  'typing-challenge': {
    id: 'typing-challenge',
    label: 'Typing Challenge',
    description: 'Type the specified text',
    icon: '⌨️',
  },

  // More games
  'puzzle-2x2': {
    id: 'puzzle-2x2',
    label: 'Puzzle 2x2',
    description: 'Drag shuffled 2x2 image pieces back to correct positions',
    icon: '🧩',
  },
  'memory-match': {
    id: 'memory-match',
    label: 'Memory Match',
    description: 'Flip cards to match identical patterns',
    icon: '🃏',
  },
  'quick-tap': {
    id: 'quick-tap',
    label: 'Quick Tap',
    description: 'Quickly tap the specified area',
    icon: '⚡',
  },
  'wordle': {
    id: 'wordle',
    label: 'Wordle',
    description: 'Guess the correct word',
    icon: '📝',
  },
  'puzzle-3x3': {
    id: 'puzzle-3x3',
    label: 'Puzzle 3x3',
    description: 'Drag shuffled 3x3 image pieces back to correct positions',
    icon: '🎯',
  },
  'linker': {
    id: 'linker',
    label: 'Linker',
    description: 'Connect dots of the same color',
    icon: '🔗',
  },
  'block-puzzle': {
    id: 'block-puzzle',
    label: 'Block Puzzle',
    description: 'Place blocks to fill the grid',
    icon: '🟦',
  },
  'shake-phone': {
    id: 'shake-phone',
    label: 'Shake Phone',
    description: 'Shake the phone for specified times',
    icon: '📱',
  },
};

// Recommended games (4 default shown)
export const RECOMMENDED_GAMES = ['math-quiz', 'click-challenge', 'color-finder', 'typing-challenge'];

// More games (8 shown when expanded)
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

// Interaction enable options
export const INTERACTION_ENABLE_OPTIONS = [
  { label: 'No Interaction', value: false },
  { label: 'Enable Game', value: true },
];

// Get recommended games
export const getRecommendedGames = () => {
  return RECOMMENDED_GAMES.map((id) => ({
    label: INTERACTION_GAMES[id].label,
    value: id,
    description: INTERACTION_GAMES[id].description,
    icon: INTERACTION_GAMES[id].icon,
  }));
};

// Get more games
export const getMoreGames = () => {
  return MORE_GAMES.map((id) => ({
    label: INTERACTION_GAMES[id].label,
    value: id,
    description: INTERACTION_GAMES[id].description,
    icon: INTERACTION_GAMES[id].icon,
  }));
};

// Get game display label
export const getGameLabel = (gameId) => {
  return INTERACTION_GAMES[gameId]?.label || gameId;
};
