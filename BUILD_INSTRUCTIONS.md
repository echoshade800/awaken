# Build Instructions for iOS with Screen Time Module

This app now includes a native Screen Time module that requires building with Expo's development client.

## Prerequisites

- macOS with Xcode 15+
- iOS 15+ device (Screen Time API doesn't work in Simulator)
- Expo CLI installed: `npm install -g expo-cli`
- EAS CLI installed: `npm install -g eas-cli`

## Quick Start

### Option 1: Development Build (Recommended)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Prebuild iOS native project**
   ```bash
   npx expo prebuild --platform ios
   ```
   This will generate the `ios/` directory with all native code.

3. **Open in Xcode**
   ```bash
   open ios/boltexponativewind.xcworkspace
   ```

4. **Configure Signing**
   - Select your project in Xcode
   - Go to "Signing & Capabilities"
   - Select your team
   - Verify "Family Controls" capability is present

5. **Build and Run**
   ```bash
   npx expo run:ios --device
   ```
   Select your connected iOS device when prompted.

### Option 2: EAS Build (Cloud Build)

1. **Configure EAS**
   ```bash
   eas build:configure
   ```

2. **Create development build**
   ```bash
   eas build --platform ios --profile development
   ```

3. **Install on device**
   - Download the build from EAS dashboard
   - Install via TestFlight or ad-hoc distribution

## Testing Screen Time Permission

1. **Launch app on device**

2. **Complete onboarding**
   - Enter sleep routine
   - Reach permissions screen

3. **Request Screen Time permission**
   - Tap "Allow" on Screen Time Data card
   - Dialog will appear explaining the feature
   - Tap "Open Settings"
   - System permission dialog will appear
   - Grant permission

4. **Verify real data**
   - Complete onboarding
   - Check home screen
   - "Using sample data" badge should NOT appear if permission granted
   - Sleep analytics will be based on actual device usage

## Troubleshooting

### Module not found error
```bash
npx expo prebuild --clean
npx expo run:ios --device
```

### Permission dialog doesn't appear
- Verify you're on iOS 15+
- Check in Settings > Screen Time that permission is not already set
- Reset permissions: Settings > General > Reset > Reset Location & Privacy

### Build errors in Xcode
- Clean build folder: Cmd+Shift+K
- Delete derived data
- `cd ios && pod install && cd ..`
- Rebuild

### "Family Controls not available"
- Family Controls only works on physical devices, not Simulator
- Requires iOS 15.0 or later
- Some devices may have parental controls that restrict this

## File Structure

```
modules/
└── screen-time/
    ├── package.json
    ├── index.ts                      # TypeScript interface
    ├── app.plugin.js                 # Expo config plugin
    ├── screen-time-module.podspec    # iOS CocoaPods spec
    └── ios/
        ├── ScreenTimeModule.swift    # Swift implementation
        └── ScreenTimeModule.m        # Objective-C bridge
```

## What's Implemented

✅ Real Screen Time permission request (iOS)
✅ Authorization status checking
✅ Screen usage data collection
✅ Automatic fallback to demo data if permission denied
✅ Privacy-preserving data collection (timestamps only)
✅ Integration with sleep need calculation

## Platform Support

- **iOS**: Full Screen Time API support (iOS 15+)
- **Android**: Usage Stats API (future implementation)
- **Web**: Demo data only

## Notes

- Screen Time data is collected **only with explicit user permission**
- Only screen on/off timestamps are collected (no app names or content)
- Data is used exclusively for calculating sleep patterns
- User can revoke permission anytime in iOS Settings
