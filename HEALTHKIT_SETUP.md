# HealthKit Integration Guide

This app now integrates with Apple HealthKit to fetch real sleep data for accurate sleep tracking and analysis.

## Features

✅ **Automatic Sleep Data Sync** - Fetches sleep data from HealthKit automatically
✅ **Manual Sync Button** - Sync on-demand with the "Sync HealthKit" button
✅ **Permission Management** - Handles HealthKit permissions gracefully
✅ **Demo Data Fallback** - Uses demo data when HealthKit is unavailable
✅ **Smart Data Merging** - Replaces demo data with real data automatically

## How It Works

### On App Launch
1. App checks for HealthKit permission
2. If granted, automatically syncs last 30 days of sleep data
3. If not granted, shows demo data for demonstration

### Manual Sync
1. Tap the "🔄 Sync HealthKit" button in the Sleep tab
2. If permission not granted, you'll be prompted to allow access
3. App fetches and displays your real sleep data from HealthKit

### Data Sources
- **HealthKit**: Real sleep data from iOS Health app (source: 'healthkit')
- **Manual**: Sleep sessions you add manually (source: 'manual')
- **Demo**: Sample data for demonstration (source: 'demo', auto-removed when real data exists)

## Permissions Required

The app requests these HealthKit permissions:
- **Read**: Sleep Analysis, Steps
- **Write**: None (read-only access)

### Privacy
Your health data is:
- Stored only on your device
- Never sent to external servers
- Used only for calculating sleep metrics and insights

## iOS Setup

### Required Files Modified
1. ✅ `Info.plist` - Added HealthKit usage descriptions
2. ✅ `boltexponativewind.entitlements` - Enabled HealthKit capability
3. ✅ `healthPermissions.js` - Integrated HealthKit SDK
4. ✅ `store.js` - Added sync functions

### Building for iOS
```bash
# 1. Install pods (if needed)
cd ios && pod install && cd ..

# 2. Build iOS bundle
npm run build:ios

# 3. Open in Xcode
open ios/boltexponativewind.xcworkspace

# 4. Run on device (HealthKit doesn't work in simulator)
```

## Testing

### On Physical iOS Device
1. Make sure you have sleep data in the Health app
2. Open the app
3. Navigate to the Sleep tab
4. Grant HealthKit permission when prompted
5. Your real sleep data will be displayed

### On Simulator or Web
- App will use demo data (HealthKit not available)
- All features work normally with sample data

## Data Format

Sleep sessions are stored with this structure:
```javascript
{
  id: "healthkit-2025-10-23T06:30:00.000Z",
  date: "2025-10-23",
  bedtimeISO: "2025-10-22T22:30:00.000Z",
  waketimeISO: "2025-10-23T06:30:00.000Z",
  durationMin: 480,
  source: "healthkit"
}
```

## Troubleshooting

### "HealthKit permission denied"
- Go to iPhone Settings > Privacy > Health > [Your App]
- Enable "Sleep Analysis" permission

### "No data found"
- Make sure you have sleep data in the Health app
- Check that your sleep was recorded in the last 30 days
- Verify HealthKit permission is granted

### Data not updating
- Tap the "🔄 Sync HealthKit" button to manually refresh
- App syncs automatically on launch

## Implementation Details

### Sleep Data Processing
1. Fetches raw sleep samples from HealthKit
2. Filters for "ASLEEP" state (ignores "IN_BED")
3. Merges overlapping sessions within 30 minutes
4. Filters out sessions shorter than 1 hour
5. Converts to app's data format
6. Stores locally with AsyncStorage

### Sync Strategy
- **Initial Load**: Syncs on app launch if permission granted
- **Manual Sync**: User-triggered via button
- **Smart Replace**: Removes old HealthKit data before adding fresh data
- **Demo Data**: Automatically removed when real data is synced

## Future Enhancements

Potential improvements:
- Background sync with HealthKit observers
- Step count integration for sleep inference
- Heart rate data for sleep quality analysis
- Export sleep data to other formats
- Weekly/monthly sleep reports
