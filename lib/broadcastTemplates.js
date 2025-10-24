export const BROADCAST_TEMPLATES = [
  {
    id: 'the-host',
    name: 'The Host',
    subtitle: 'AI Butler Mode',
    emoji: '👔',
    content: `Good morning, {nickname}. System boot complete. It's {time}, {weekday}, {date}.
Outside is {weather}, temperature around {temp_high}°, quite optimal for human activity.
Battery level: {battery}%.
Your lucky color is {lucky_color}.
Reminder: drink water, smile, and let's run today's mission efficiently ☕.`
  },
  {
    id: 'game-master',
    name: 'Game Master',
    subtitle: 'Earth Online Mode',
    emoji: '🎮',
    content: `Player {nickname}, it's {time} — quest begins!
Today is {weekday}, {date}. Weather: {weather}, temperature {temp_high}°.
Energy core at {battery}%.
Mission today: {schedule}. Lucky color: {lucky_color}.
Daily reward: {random_tip}.`
  },
  {
    id: 'hogwarts-caller',
    name: 'Hogwarts Caller',
    subtitle: 'Wizard Morning',
    emoji: '🪄',
    content: `The clock strikes {time}, {nickname}.
It's {weekday}, {date}, a fine day for spells.
The air feels {weather}, with highs of {temp_high}° and lows of {temp_low}°.
Your lucky hue today is {lucky_color}.
The dream of {dream_keyword} still lingers beyond the veil.
Charm of the day: {random_tip}.`
  },
  {
    id: 'hero-mode',
    name: 'Hero Mode',
    subtitle: 'Superhero Wake',
    emoji: '⚡',
    content: `Rise and shine, {nickname}!
It's {time}, {weekday}, {date}. The sky is {weather}, high {temp_high}°, low {temp_low}°.
Power level: {battery}%.
Your lucky armor color today is {lucky_color}.
Daily quest: {random_tip}.
Let's make this day legendary!`
  },
  {
    id: 'royal-morning',
    name: 'Royal Morning',
    subtitle: 'Fairy Princess / Prince Mode',
    emoji: '👑',
    content: `Good morning, {nickname}. The kingdom greets you at {time}, {weekday}, {date}.
The skies are {weather}, {temp_high}° at most.
Your lucky color is {lucky_color}, glowing like your charm.
Royal duties: {schedule}. Today's blessing: {random_tip}.`
  },
  {
    id: 'galactic-dj',
    name: 'Galactic DJ',
    subtitle: 'Space Radio Mode',
    emoji: '🚀',
    content: `Yo {nickname}, this is Spacewave Radio.
Current time: {time}, Earth date: {weekday}, {date}.
Weather is {weather}, temp {temp_high}°.
Battery resonance at {battery}%.
Lucky wavelength: {lucky_color}.
Transmission of the day: {random_tip}.
Stay cosmic.`
  },
  {
    id: 'pet-buddy',
    name: 'Pet Buddy',
    subtitle: 'Cute Companion Mode',
    emoji: '🐾',
    content: `Woof~ Morning, {nickname}! The sun's up and it's {time}!
Today's {weekday}, {date}, and the weather's {weather}, around {temp_high}°.
Your lucky color is {lucky_color}.
Battery check: {battery}%.
I'll be right here to cheer you up all day 🐶💕.`
  }
];
