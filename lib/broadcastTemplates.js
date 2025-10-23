export const BROADCAST_TEMPLATES = [
  {
    id: 'the-host',
    name: 'The Host',
    subtitle: 'AI 管家模式',
    emoji: '👔',
    content: `Good morning, {nickname}. System boot complete. It's {time}, {weekday}, {date}.
Outside is {weather}, temperature around {high-temp}°, quite optimal for human activity.
Battery level: {battery}.
Your lucky color is {lucky-color}.
Reminder: drink water, smile, and let's run today's mission efficiently ☕.`
  },
  {
    id: 'game-master',
    name: 'Game Master',
    subtitle: '地球Online 模式',
    emoji: '🎮',
    content: `Hey player {nickname}! Quest loading… ✅
It's {time}, {weekday}. Weather report: {weather}, {high-temp}°.
Your HP—uh, battery—is {battery}.
Mission for today: {schedule}.
Bonus tip: {random}.
Now go conquer this day like it's the final boss 💥!`
  },
  {
    id: 'hogwarts-caller',
    name: 'Hogwarts Caller',
    subtitle: '魔法晨唤',
    emoji: '🪄',
    content: `Wake up, young wizard {nickname}. The time is {time}, on this fine {weekday}, {date}.
Skies are {weather}, with a touch of mystery in the wind.
Today's lucky hue is {lucky-color}.
Remember your dream about {dream}? Perhaps... it was a spell. ✨`
  },
  {
    id: 'hero-mode',
    name: 'Hero Mode',
    subtitle: '超级英雄',
    emoji: '⚡',
    content: `Rise and shine, {nickname}! The world needs you.
It's {time}, {weekday}, and the weather's {weather}, {high-temp}°.
Power levels: {battery}.
Your armor's aura today? {lucky-color}.
Mission: {random}.
Now suit up — destiny's waiting!`
  },
  {
    id: 'royal-morning',
    name: 'Royal Morning',
    subtitle: '皇室晨光',
    emoji: '👑',
    content: `Good morning, my liege {nickname}. The kingdom awakens under {weather} skies.
It's {time}, {weekday}, {date}.
Your royal color today is {lucky-color}.
Royal schedule: {schedule}.
Your loyal servant wishes you courage and grace today 👑.`
  }
];
