# Quick Start Guide - Real Screen Time Permissions

## What's New

The app now requests **real Screen Time permissions** on iOS to analyze your actual device usage and calculate personalized sleep insights.

## How It Works

### 1. **Web/Browser (Demo Mode)**
- Automatically uses 30 days of sample data
- Shows "Using sample data for demonstration" badge
- No real permissions needed

### 2. **iOS Device (Real Permissions)**
- Requests Screen Time API access via FamilyControls framework
- Collects only screen on/off timestamps (no app names or content)
- Uses real data for personalized sleep calculations
- No demo badge when permission is granted

### 3. **iOS Simulator (Demo Mode)**
- FamilyControls not available in Simulator
- Automatically falls back to demo data
- Shows demo badge

## Building for iOS

### Method 1: Quick Test (Expo Prebuild)

```bash
# 1. Install dependencies
npm install

# 2. Generate native iOS project
npx expo prebuild --platform ios

# 3. Run on connected iOS device
npx expo run:ios --device
```

When prompted, select your connected iPhone (iOS 15+).

### Method 2: Production Build (EAS)

```bash
# 1. Install EAS CLI (if not already)
npm install -g eas-cli

# 2. Configure project
eas build:configure

# 3. Build for device
eas build --platform ios --profile development

# 4. Install from EAS dashboard
```

## Testing Permission Flow

1. **Launch app on iOS device** (iOS 15+ required)

2. **Complete onboarding**:
   - Welcome screen
   - Sleep routine setup
   - **Permissions screen** ← This is where it happens

3. **Grant Screen Time permission**:
   - Tap "Allow" on "Screen Time Data" card
   - Read the permission dialog
   - Tap "Open Settings"
   - iOS system dialog appears
   - **Grant permission** ✅

4. **Verify real data is being used**:
   - Complete onboarding
   - Go to home screen
   - **No demo badge should appear**
   - Sleep analytics use your real screen time patterns

## Permission States

| State | iOS Device | iOS Simulator | Web |
|-------|-----------|---------------|-----|
| Module Available | ✅ Yes | ❌ No | ❌ No |
| Real Permission | ✅ Yes | ❌ No | ❌ No |
| Data Source | Real | Demo | Demo |
| Demo Badge | Hidden | Shown | Shown |

## What Data Is Collected

When you grant Screen Time permission:

✅ **What IS collected:**
- Screen on/off timestamps
- Device sleep/wake patterns
- Usage frequency (times per day)

❌ **What is NOT collected:**
- App names or identifiers
- Screen content or screenshots
- Browsing history
- Personal messages or data
- Location data

## Privacy

- All data stays **on your device**
- Never sent to external servers
- Used only for sleep calculations
- You can revoke permission anytime in iOS Settings

## File Structure

```
modules/screen-time/
├── index.ts                    # TypeScript interface
├── app.plugin.js              # Expo config plugin
├── screen-time-module.podspec # CocoaPods spec
└── ios/
    ├── ScreenTimeModule.swift # Native implementation
    └── ScreenTimeModule.m     # Objective-C bridge

app.json                       # Contains iOS entitlements
lib/usageTracking.js          # Permission request logic
lib/store.js                  # State management
```

## Troubleshooting

### "Module not found" error
```bash
npx expo prebuild --clean
npx expo run:ios --device
```

### Permission dialog doesn't appear
- Ensure iOS 15+ device
- Check Settings > Screen Time
- Reset: Settings > General > Reset > Reset Location & Privacy

### Still seeing demo badge after granting permission
- Check console logs: Should show "Screen Time permission granted, using real data"
- Verify in Settings > Screen Time that permission is granted
- Restart app

### Build fails in Xcode
- Clean: Cmd+Shift+K
- `cd ios && pod install && cd ..`
- Rebuild

## Console Logs

Watch for these logs to verify real permissions:

```
✅ Good (Real data):
[UsageTracking] Screen Time permission granted, using real data
[Store] Screen Time permission granted, using real data
[UsageTracking] Using 847 real usage events

❌ Demo mode:
[UsageTracking] No Screen Time permission, will use demo data
[Store] No Screen Time permission, generating demo data
```

## Next Steps

Once you've granted real permissions:

1. The app will collect screen usage over time
2. Sleep need calculation becomes more accurate
3. Circadian rhythm adapts to your actual patterns
4. Sleep debt tracks real vs needed sleep
5. AI tips personalized to your habits

Enjoy your personalized sleep insights! 🌙✨
