# Monster Sleep - Awaken

A personalized sleep companion that learns your rhythm and helps you wake up energized every morning.

## Features

- 🎯 **Smart Alarms**: AI-powered wake-up times based on your circadian rhythm
- 📊 **Sleep Analytics**: Track sleep debt, patterns, and personalized sleep needs
- 🔋 **Energy Tracking**: Real-time energy level predictions throughout the day
- 📱 **Screen Time Integration**: Analyze device usage to calculate accurate sleep patterns (iOS)
- 🤖 **Monster AI**: Your friendly sleep coach with personalized tips
- 🎮 **Wake-Up Games**: Engaging activities to ensure you're fully awake

## Quick Start

### Web/Browser (Demo Mode)
```bash
npm install
npm run dev
```

### iOS Device (Real Permissions)

**Important**: To use real Screen Time data, you must build for a physical iOS device.

```bash
# Quick test build
npx expo prebuild --platform ios
npx expo run:ios --device

# Or production build via EAS
eas build --platform ios --profile development
```

See [QUICKSTART.md](./QUICKSTART.md) for detailed instructions.

## Screen Time Permissions

This app can request real Screen Time permissions on iOS 15+ to:
- Calculate personalized sleep needs
- Track actual sleep debt over 14 days
- Model your unique circadian rhythm

**Privacy First**: Only screen on/off timestamps are collected. No app names, content, or personal data.

### Permission States

| Platform | Permission | Data Source |
|----------|-----------|-------------|
| iOS 15+ Device | ✅ Real | Screen Time API |
| iOS Simulator | ❌ Demo | Sample Data |
| Web/Browser | ❌ Demo | Sample Data |

## Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Quick start guide for real permissions
- **[BUILD_INSTRUCTIONS.md](./BUILD_INSTRUCTIONS.md)** - Detailed build instructions
- **[SCREEN_TIME_SETUP.md](./SCREEN_TIME_SETUP.md)** - Native module implementation guide

## Project Structure

```
app/
├── (tabs)/              # Main tab navigation
│   ├── index.jsx       # Home: Energy rhythm & tips
│   ├── alarm.jsx       # Alarms management
│   └── sleep.jsx       # Sleep analytics
├── onboarding/         # First-run experience
│   ├── welcome.jsx
│   ├── sleep-routine.jsx
│   ├── permissions.jsx  # Screen Time permission request
│   ├── energy-type.jsx
│   ├── smart-alarm.jsx
│   └── loading.jsx
└── alarm/
    ├── create.jsx      # AI conversation alarm creator
    └── [id].jsx        # Alarm details

components/            # Reusable UI components
lib/
├── store.js          # Zustand state management
├── usageTracking.js  # Screen Time integration
├── sleepCalculations.js
├── rhythm.js
└── backgroundTasks.js

modules/
└── screen-time/      # Native Screen Time module
    ├── ios/
    │   ├── ScreenTimeModule.swift
    │   └── ScreenTimeModule.m
    └── app.plugin.js
```

## Key Technologies

- **Expo SDK 54** - React Native framework
- **Expo Router** - File-based navigation
- **Zustand** - State management
- **AsyncStorage** - Local data persistence
- **FamilyControls** - iOS Screen Time API
- **Expo Notifications** - Local notifications & alarms

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run on iOS (requires macOS)
npx expo run:ios --device

# Type checking
npm run typecheck

# Lint
npm run lint
```

## Building for Production

### iOS
```bash
# Via EAS (recommended)
eas build --platform ios --profile production

# Local build
npx expo prebuild --platform ios
cd ios && xcodebuild ...
```

See [BUILD_INSTRUCTIONS.md](./BUILD_INSTRUCTIONS.md) for complete details.

## How It Works

1. **Onboarding**: User sets up sleep routine and grants permissions
2. **Data Collection**:
   - Real: Screen Time API tracks actual device usage (iOS)
   - Demo: Generated sample data (Web/Simulator)
3. **Analysis**: Calculate personalized sleep need using 30-day history
4. **Rhythm Modeling**: Generate circadian curve based on chronotype
5. **Smart Alarms**: Suggest optimal wake times within user's window
6. **Daily Tips**: Monster AI provides contextual sleep advice

## Privacy & Security

- All data stored locally on device
- No cloud sync or external servers
- Screen Time data never leaves your device
- Only timestamps collected, no app names or content
- User can revoke permissions anytime

## Troubleshooting

See [BUILD_INSTRUCTIONS.md#troubleshooting](./BUILD_INSTRUCTIONS.md#troubleshooting) for common issues.

## License

MIT
