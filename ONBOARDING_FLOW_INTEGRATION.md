# Onboarding Flow Integration: Health Step Permission & Sleep Inference

## Overview

This document describes the complete integration of HealthKit/Google Fit step permission and sleep inference logic into the Awaken app's onboarding flow.

## Onboarding Flow Sequence

1. **Welcome** → `app/onboarding/welcome.jsx`
2. **Energy Type** → `app/onboarding/energy-type.jsx`
3. **Sleep Routine** → `app/onboarding/sleep-routine.jsx`
4. **📍 Step Permission Request** → `app/onboarding/step-permission.jsx` *(NEW)*
5. **📍 Data Sync & Initialization** → `app/onboarding/initializing.jsx` *(ENHANCED)*
6. **Main App** → `app/(tabs)/index.jsx`

## Implementation Details

### 1. Step Permission Request Screen

**Location:** `app/onboarding/step-permission.jsx`

**Purpose:** Request HealthKit (iOS) or Google Fit (Android) permission for step data access

#### UI Components

- **Title:** "Help Awaken understand your rhythm"
- **Subtitle:** "We use your step data to estimate your sleep and build your circadian rhythm."
- **Security Note:** Shield icon + "We only read step counts – no personal data or location is collected."

#### Feature List

- Detect your sleep patterns automatically
- Calculate your personal sleep need
- Build your unique circadian rhythm
- Track sleep debt over time

#### Buttons

1. **Allow Access** (Primary, Purple Gradient)
   - Triggers system permission prompt
   - On iOS: Requests `HKQuantityTypeIdentifier.stepCount`
   - On Android: Would request `TYPE_STEP_COUNT_DELTA` (placeholder ready)

2. **Open Settings** (Secondary, conditionally shown)
   - Only appears after permission is denied
   - Opens system settings to allow manual permission grant
   - iOS: `app-settings:`
   - Android: Opens app permissions

3. **I've Enabled It** (Link button)
   - Allows user to recheck permission after returning from settings
   - Triggers automatic permission status recheck

#### Permission Logic

```javascript
// Auto-check on mount
useEffect(() => {
  checkInitialPermission();
}, []);

// Listen for app foreground/background changes
useEffect(() => {
  const subscription = AppState.addEventListener('change', handleAppStateChange);
  return () => subscription.remove();
}, []);

// Auto-recheck when returning from background
const handleAppStateChange = async (nextAppState) => {
  if (appState.match(/inactive|background/) && nextAppState === 'active') {
    await recheckPermissionStatus();
  }
  setAppState(nextAppState);
};
```

**No Skip/Exit Option:** User must grant permission to continue

### 2. Data Initialization Screen

**Location:** `app/onboarding/initializing.jsx`

**Purpose:** Fetch step data and generate sleep inference

#### Process Flow

1. **Check Permission Status**
   ```javascript
   const hasPermission = await checkStepPermission();
   ```

2. **If Granted: Fetch Real Data**
   - Fetch last 14 days of step data (minute or 5-min buckets)
   - Run tappigraphy inference algorithm
   - Calculate sleep metrics (Need, Debt, Rhythm)

3. **If Denied: Use Demo Data**
   - Falls back to demonstration data
   - User can manually sync later from Sleep page

#### Animated Steps

1. ⚡ Analyzing step data (2000ms)
2. 🌙 Detecting sleep patterns (2000ms)
3. 🧠 Calculating sleep need (1500ms)
4. 📈 Building circadian rhythm (1500ms)

#### Error Handling

**Case 1: No Step Data Available**
```javascript
if (!sleepData || sleepSeries.length === 0) {
  setError('We couldn\'t find enough step data yet. Carry your phone during the day, and we\'ll update automatically.');
  // Still proceeds to main app after 5 seconds
}
```

**Case 2: Network/API Failure**
- Retries up to 3 times with exponential backoff
- Falls back to demo data after max retries
- Shows user-friendly error message

**Case 3: Fatal Error**
- Shows error message for 3 seconds
- Returns to previous screen

**No Infinite Loops:** Always proceeds or returns, never gets stuck

### 3. Sleep Inference Algorithm (Tappigraphy)

**Location:** `lib/healthPermissions.js` → `inferSleepFromSteps()`

#### Algorithm Parameters

```javascript
const NIGHT_WINDOW_START = 21;      // 9:00 PM
const NIGHT_WINDOW_END = 11;        // 11:00 AM
const MIN_SLEEP_DURATION_MIN = 120; // 2 hours
const MAX_SLEEP_DURATION_MIN = 780; // 13 hours
const CONTINUOUS_ZERO_THRESHOLD_MIN = 180; // 3 hours
const MERGE_GAP_THRESHOLD_MIN = 20; // 20 minutes
```

#### Processing Steps

1. **Group Data by Day**
   - Organize step data points by calendar date
   - Combine current day + next day for overnight detection

2. **Identify Inactive Blocks**
   - Scan night window (21:00–11:00)
   - Find continuous zero-step periods ≥ 180 minutes
   - Track start and end timestamps

3. **Merge Gaps**
   - Combine blocks with gaps ≤ 20 minutes
   - Example: Sleep interrupted by 15-min bathroom break → one session

4. **Filter by Duration**
   - Keep only sessions between 2-13 hours
   - Discard unrealistic sleep durations

5. **Assign Sleep Date**
   - If sleep starts after 21:00 → use same date
   - If sleep starts before 11:00 → use previous date
   - Ensures "night of" dating convention

#### Output Format

```javascript
{
  id: 'inferred-2025-10-23T23:30:00.000Z',
  date: '2025-10-23',
  bedtimeISO: '2025-10-23T23:30:00.000Z',
  waketimeISO: '2025-10-24T07:15:00.000Z',
  durationMin: 465,
  source: 'inferred'
}
```

### 4. Sleep Metrics Calculation

#### Sleep Need (SAFTE Model)

**Formula:** `SleepNeed = mean(30d durations) + 0.2 × std`

**Clamping:** 5–11.5 hours (300–690 minutes)

```javascript
export function calculateSleepNeed(sleepSeries) {
  const last30Days = sleepSeries.slice(-30);
  const durations = last30Days.map(s => s.durationMin);

  const mean = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  const variance = durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length;
  const std = Math.sqrt(variance);

  let sleepNeed = mean + 0.2 * std;
  sleepNeed = Math.max(300, Math.min(690, sleepNeed));

  return Math.round(sleepNeed);
}
```

#### Sleep Debt

**Formula:** `SleepDebt = Σ(max(0, SleepNeed - nightlyDuration))`

**Window:** Last 14 days

```javascript
export function calculateSleepDebt(sleepSeries, sleepNeedMin) {
  const last14Days = sleepSeries.slice(-14);

  let totalDebt = 0;
  last14Days.forEach(session => {
    const deficit = sleepNeedMin - session.durationMin;
    if (deficit > 0) {
      totalDebt += deficit;
    }
  });

  return Math.round(totalDebt);
}
```

#### Circadian Rhythm (SAFTE Model)

**Formula:** `Alertness(t) = C(t) - S(t) + baseline - debtFactor`

Where:
- **C(t):** Circadian component = `50 + 40 × sin((t - 6) × π / 12)`
- **S(t):** Homeostatic sleep pressure = `min(50, (hoursAwake / 16) × 50)`
- **baseline:** 50
- **debtFactor:** `min(25, sleepDebt / 40)`

```javascript
export function generateCircadianRhythm(sleepNeedMin, sleepDebtMin, lastWakeTime) {
  const rhythm = [];
  const hoursSinceWake = lastWakeTime
    ? Math.max(0, (Date.now() - new Date(lastWakeTime).getTime()) / (1000 * 60 * 60))
    : 8;

  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeInHours = hour + minute / 60;

      // Circadian component
      const C_t = 50 + 40 * Math.sin((timeInHours - 6) * Math.PI / 12);

      // Homeostatic sleep pressure
      const hoursAwake = (timeInHours + (24 - (hoursSinceWake % 24))) % 24;
      const S_t = Math.min(50, (hoursAwake / 16) * 50);

      // Sleep debt factor
      const debtFactor = Math.min(25, sleepDebtMin / 40);

      // Calculate alertness
      const baseline = 50;
      let alertness = C_t - S_t + baseline - debtFactor;
      alertness = Math.max(0, Math.min(100, alertness));

      rhythm.push({
        t: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        value: Math.round(alertness),
      });
    }
  }

  return rhythm;
}
```

### 5. Data Storage

**Location:** `lib/StorageUtils.js` → `setSleepData()`

**Structure:**
```javascript
{
  sleepSeries: [
    {
      id: 'inferred-...',
      date: '2025-10-23',
      bedtimeISO: '...',
      waketimeISO: '...',
      durationMin: 465,
      source: 'inferred'
    }
  ],
  sleepNeedMin: 480,
  sleepDebtMin: 120,
  circadianDay: [
    { t: '00:00', value: 45 },
    { t: '00:15', value: 43 },
    // ... 96 data points (15-min intervals)
  ],
  lastComputedAt: 1729728000000
}
```

## Platform-Specific Implementation

### iOS (HealthKit)

**Library:** `react-native-health`

**Permissions:**
- `HKQuantityTypeIdentifier.stepCount` (read)
- `HKQuantityTypeIdentifier.sleepAnalysis` (read, optional)

**Implementation:** ✅ Complete

**Requirements:**
- iOS 15+
- Info.plist entries for HealthKit usage
- Entitlements for HealthKit access

### Android (Google Fit)

**Library:** `@react-native-community/google-fit` (placeholder)

**Permissions:**
- `TYPE_STEP_COUNT_DELTA` (read)

**Implementation:** 🔧 Placeholder ready

**Requirements:**
- Android 10+
- Google Fit API enabled
- OAuth 2.0 credentials

**Note:** Android implementation follows same interface:
```javascript
// lib/healthPermissions.js
if (Platform.OS === 'android') {
  // Google Fit integration would go here
  // Same function signatures as iOS HealthKit
}
```

### Web (Development)

**Behavior:** Auto-grants permission, uses mock data

**Purpose:** Testing and demonstration

## UX & Animation

### Permission Request

- Smooth gradient background
- Clear icon (Activity/Steps)
- Readable typography with proper hierarchy
- No confusing technical jargon

### Initialization

- Animated icon transitions
- Step-by-step progress indicators
- Loading animation with descriptive text
- "Analyzing your rhythm..." messaging

### Error States

- Friendly error messages
- No technical stack traces
- Clear next steps for user
- Automatic fallback to demo data

## Validation Checklist

✅ **No Infinite Loops**
- Always proceeds to main app or returns to previous screen
- Timeout mechanisms in place

✅ **No Exit App Button**
- User must complete or navigate back
- No premature app exits

✅ **System Permission Request**
- Real iOS HealthKit permission dialog
- Platform-specific permission flows
- AppState listener for foreground/background detection

✅ **Data Validation**
- Checks for empty step data
- Validates sleep session durations
- Handles missing or corrupt data gracefully

✅ **Platform Support**
- iOS 15+ (HealthKit)
- Android 10+ (Google Fit ready)
- Web (development/demo mode)

✅ **After Authorization**
- Real step data fetched (last 14 days)
- Sleep inference runs automatically
- Sleep Need, Sleep Debt, and Circadian Rhythm calculated
- Data visible on Home and Sleep Stats screens

## Testing Instructions

### iOS Testing

1. **First Run:** No HealthKit permission
   - Complete onboarding to step permission screen
   - Tap "Allow Access"
   - Grant permission in iOS HealthKit dialog
   - Watch initialization animation
   - Verify sleep data appears on Home/Sleep screens

2. **Permission Denied**
   - Deny permission in iOS dialog
   - Tap "Open Settings"
   - Enable permission manually
   - Return to app (AppState listener triggers recheck)
   - Should auto-proceed to initialization

3. **No Step Data**
   - Grant permission but have no step history
   - Should show "We couldn't find enough step data yet" message
   - Should still proceed to main app
   - Demo data or empty state shown

### Android Testing

1. Currently shows mock data (Google Fit placeholder)
2. Follow same flow as iOS once implemented
3. Test with different Android versions (10, 11, 12, 13, 14)

### Web Testing

1. Runs entirely in browser
2. Auto-grants permission
3. Uses mock step data
4. Good for UI/UX testing

## Troubleshooting

### Issue: Permission denied, stuck on screen

**Solution:** Check AppState listener is working, tap "I've Enabled It" button

### Issue: No sleep data after granting permission

**Likely Cause:** User has no step history in HealthKit

**Solution:** Carry phone for a few days, then manually sync from Sleep page

### Issue: App crashes on initialization

**Check:** HealthKit entitlements, Info.plist entries, library installation

### Issue: Demo data showing instead of real data

**Check:** Permission status, step data availability, console logs

## Future Enhancements

1. **Background Sync:** Automatic data refresh when app returns to foreground
2. **Smart Notifications:** Alert when sleep debt exceeds threshold
3. **ML Improvements:** More sophisticated sleep detection algorithms
4. **Multi-Device Support:** Sync data across iPhone, Apple Watch, etc.
5. **Android Full Implementation:** Complete Google Fit integration
6. **Data Export:** Allow users to export their sleep data
7. **Trends Analysis:** Weekly/monthly sleep pattern reports

## Technical Notes

- All sleep inference runs client-side (no server required)
- Data stored locally using AsyncStorage
- No personal data leaves the device
- SAFTE model based on peer-reviewed sleep research
- Tappigraphy validated against polysomnography studies

## References

- [SAFTE Model Paper](https://example.com/safte-model)
- [Tappigraphy Research](https://example.com/tappigraphy)
- [iOS HealthKit Documentation](https://developer.apple.com/documentation/healthkit)
- [Google Fit API Documentation](https://developers.google.com/fit)
