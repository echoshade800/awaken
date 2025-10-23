# HealthKit Integration in Onboarding Flow

## Overview

The app now integrates HealthKit authorization into the onboarding flow to fetch real step data and generate sleep inference data. This replaces the demo data with actual user health information.

## Implementation Details

### 1. Onboarding Flow Integration

The HealthKit authorization is integrated into the existing onboarding flow at these key points:

**Flow Sequence:**
1. Welcome → Sleep Routine → Permissions → Energy Type → Smart Alarm
2. **First Alarm Creation** (`/alarm/create?fromOnboarding=true`)
3. **Step Permission Screen** (`/onboarding/step-permission`) - Requests HealthKit access
4. **Initializing Screen** (`/onboarding/initializing`) - Fetches and processes data
5. Main App (Tabs)

### 2. Step Permission Screen (`app/onboarding/step-permission.jsx`)

**Purpose:** Request HealthKit authorization for step data access

**Features:**
- Explains why step data is needed: "We'll use your step data to infer sleep patterns and improve your rhythm insights"
- Shows security assurance and feature benefits
- Provides "Grant Permission" button to trigger iOS HealthKit dialog
- Includes "I've Enabled It" option for users who already granted permission
- Automatically proceeds to initialization after permission granted

**User Experience:**
- Clear explanation of data usage
- Privacy-focused messaging
- Easy-to-understand benefits list
- Fallback option if permission dialog doesn't appear

### 3. Initializing Screen (`app/onboarding/initializing.jsx`)

**Purpose:** Fetch step data and generate sleep inference

**Process:**
1. Checks HealthKit permission status
2. If granted: Fetches past 14 days of step data and runs sleep inference
3. If denied: Falls back to demo data for UI demonstration
4. Shows animated progress with 4 steps:
   - Analyzing step data
   - Detecting sleep patterns
   - Calculating sleep need
   - Building circadian rhythm

**Error Handling:**
- Retries up to 3 times on failure
- Falls back to demo data if all retries fail
- Shows error message to user if initialization completely fails

### 4. Sleep Inference Process (`lib/sleepInference.js`)

**Data Collection:**
```javascript
const endDate = new Date();
const startDate = new Date();
startDate.setDate(startDate.getDate() - 14); // Past 14 days

const stepData = await fetchStepData(startDate, endDate);
```

**Sleep Detection Algorithm:**
- Groups step data by day
- Identifies inactive periods (step count = 0) during typical sleep hours (21:00 - 11:00)
- Converts inactive periods lasting 3+ hours into sleep sessions
- Filters for realistic sleep durations (2-13 hours)

**Sleep Metrics Calculation:**
- **Sleep Need:** Calculated from average sleep duration + 20% of standard deviation
- **Sleep Debt:** Cumulative deficit when actual sleep < sleep need over past 14 days
- **Circadian Rhythm:** Generated based on sleep patterns and homeostatic pressure

### 5. Data Storage (`lib/StorageUtils.js`)

**New Storage Keys:**
- `healthKitAuthorized`: Boolean indicating if user granted HealthKit access
- `lastHealthKitSync`: Timestamp of last successful data sync
- `sleepSessions`: Array of sleep session objects with source attribution

**Session Data Format:**
```javascript
{
  id: "healthkit-2025-10-23T01:00:00.000Z",
  date: "2025-10-23",
  bedtimeISO: "2025-10-23T01:00:00.000Z",
  waketimeISO: "2025-10-23T08:30:00.000Z",
  durationMin: 450,
  source: "healthkit" | "demo" | "inferred"
}
```

### 6. Sleep Page Updates (`app/(tabs)/sleep.jsx`)

**Data Source Indication:**
- Shows banner indicating data source:
  - "📊 Data from HealthKit" - Direct HealthKit sleep data
  - "🔍 Sleep inferred from step data" - Computed from step counts
  - "📝 Demo data (sync HealthKit for real insights)" - Using demo data
  - "⚠️ Not enough step data to infer sleep patterns yet" - Permission needed

**Empty State Handling:**
- If no HealthKit permission: Shows message about needing step data
- If permission granted but no data: Shows "Not enough step data" message
- Provides "Sync HealthKit" button to manually trigger data refresh

### 7. Health Permissions Module (`lib/healthPermissions.js`)

**Key Functions:**

**`requestStepPermission()`**
- Initializes HealthKit and requests permission
- Returns 'granted' or 'denied'
- Web platform: Returns 'granted' for demo purposes

**`checkStepPermission()`**
- Checks current permission status
- Non-blocking check for existing authorization

**`fetchStepData(startDate, endDate)`**
- Fetches minute-level step data from HealthKit
- Returns array of `{ timestamp, steps }` objects
- Falls back to mock data if HealthKit unavailable

**`inferSleepFromSteps(stepData)`**
- Analyzes step data to identify sleep periods
- Groups by day and finds inactive periods
- Returns array of sleep sessions with dates and durations

### 8. Store Integration (`lib/store.js`)

**New State Properties:**
```javascript
healthKitAuthorized: boolean,
lastHealthKitSync: number | null
```

**New Store Methods:**
- `requestHealthKitPermission()`: Request permission and update state
- `checkHealthKitPermission()`: Check permission and update state
- `syncHealthKitData()`: Manually trigger HealthKit data sync

## User Journey

### First-Time User (Onboarding)

1. User completes welcome screens and creates first alarm
2. **Step Permission screen appears**
   - User sees explanation of why step data is needed
   - User taps "Grant Permission"
   - iOS HealthKit permission dialog shows
   - User grants permission
3. **Initializing screen appears**
   - Shows animated progress (Analyzing → Detecting → Calculating → Building)
   - Fetches past 14 days of step data in background
   - Runs sleep inference algorithm
   - Saves results to local storage
4. **User lands on main app**
   - Sleep page shows inferred sleep data
   - Charts display actual sleep patterns
   - Data source banner shows "Sleep inferred from step data"

### User Who Denies Permission

1. User denies HealthKit permission
2. App falls back to demo data
3. Sleep page shows "Demo data" banner
4. User can tap "Sync HealthKit" button to re-request permission
5. If user grants permission later, next sync will fetch real data

### Returning User

1. On app start, checks for HealthKit authorization status
2. If authorized and auto-tracking enabled:
   - Automatically syncs HealthKit data on Sleep page mount
   - Updates sleep sessions in background
3. User can manually sync via "Sync HealthKit" button
4. Last sync time is tracked and displayed

## Technical Notes

### Platform Support

- **iOS:** Full HealthKit integration with real step data
- **Web:** Mock data for development and demo purposes
- **Android:** Currently shows mock data (future: Google Fit integration)

### Data Privacy

- Only step count data is accessed
- No location data or personal information collected
- User can revoke permission anytime via iOS Settings
- All data stored locally on device (AsyncStorage)

### Performance

- Step data fetched once during onboarding
- Subsequent syncs use efficient date range queries
- Sleep inference runs in background
- UI shows loading states during data processing

### Error Handling

- Network failures: Retry with exponential backoff
- Permission denied: Graceful fallback to demo data
- No data available: Clear messaging to user
- Invalid data: Validation and filtering

## Future Enhancements

1. **Real HealthKit Sleep Data:** Use `getSleepSamples()` instead of step inference
2. **Background Sync:** Automatically sync when app returns to foreground
3. **Smart Notifications:** Alert user if sleep debt is high
4. **Sleep Goals:** Set personal sleep targets based on inference
5. **Trend Analysis:** Show sleep quality trends over weeks/months

## Troubleshooting

### Permission Not Working

1. Check iOS Settings → Privacy → Health → [App Name]
2. Ensure "Steps" permission is enabled
3. Try "I've Enabled It" button if dialog doesn't appear

### No Data Showing

1. Verify HealthKit has step data for past 14 days
2. Check if other apps are tracking steps (Apple Health, fitness apps)
3. Try manual sync via "Sync HealthKit" button

### Demo Data Still Showing

1. Clear app data and restart onboarding
2. Ensure permission was actually granted
3. Check logs for HealthKit initialization errors
