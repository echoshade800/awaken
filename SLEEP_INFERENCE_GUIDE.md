# Sleep Inference from Step Data - Technical Guide

This document explains how the app infers sleep sessions from HealthKit step data, providing accurate sleep tracking even when direct sleep data is unavailable.

## Overview

The app now uses a **hybrid approach** to gather sleep data:

1. **Direct HealthKit Sleep Data** (primary source)
2. **Inferred from Step Data** (fallback/supplementary)
3. **Manual Entry** (user input)

## How Sleep Inference Works

### Step 1: Fetch Step Data

The app fetches minute-by-minute step counts from HealthKit for the last 30 days.

```javascript
const stepData = await fetchStepData(startDate, endDate);
// Returns: [{ timestamp: "2025-10-23T22:00:00Z", steps: 0 }, ...]
```

### Step 2: Identify Inactive Periods

The inference algorithm (`inferSleepFromSteps`) analyzes step data to find extended periods of inactivity:

**Key Parameters:**
- **Minimum Duration**: 180 minutes (3 hours) of continuous inactivity
- **Valid Sleep Range**: 120-780 minutes (2-13 hours)
- **Time Window**: Only considers periods between 9 PM and 11 AM
- **Grouping Threshold**: Steps occurring within this window

### Step 3: Process Inactive Periods

For each day's data:

1. **Group by Day**: Organize step data by calendar date
2. **Find Inactivity**: Detect when steps = 0 for extended periods
3. **Mark Sleep Start**: First inactive timestamp
4. **Mark Sleep End**: First active timestamp after sleep
5. **Calculate Duration**: Time between sleep start and end
6. **Validate**: Ensure duration is within reasonable range

### Step 4: Filter and Validate

The algorithm applies several filters:

```javascript
// Only consider nighttime periods
if (hour < 21 && hour >= 11) continue;

// Minimum sleep duration: 3 hours
if (durationMin < 180) continue;

// Valid sleep range: 2-13 hours
if (sleepDuration < 120 || sleepDuration > 780) continue;
```

### Step 5: Handle Edge Cases

**Early Morning Sleep:**
If sleep starts between midnight and 3 AM, it's attributed to the previous day:
```javascript
if (sleepStart.getHours() >= 0 && sleepStart.getHours() < 3) {
  sleepStart.setDate(sleepStart.getDate() - 1);
}
```

**Multiple Sessions:**
If multiple sleep periods are detected for the same date, only the longest is kept.

## Data Flow Diagram

```
┌─────────────────────────────────────────────────┐
│         HealthKit Permission Granted            │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
      ┌────────────────────────────┐
      │   Fetch Step Data (30 days)│
      └────────────┬───────────────┘
                   │
                   ▼
      ┌────────────────────────────┐
      │  Infer Sleep Sessions      │
      │  - Find inactivity periods │
      │  - Validate durations      │
      │  - Group by date           │
      └────────────┬───────────────┘
                   │
                   ▼
      ┌────────────────────────────┐
      │ Fetch Direct Sleep Data    │
      │ (from HealthKit if exists) │
      └────────────┬───────────────┘
                   │
                   ▼
      ┌────────────────────────────┐
      │   Merge Both Sources       │
      │ - Prefer direct data       │
      │ - Fill gaps with inferred  │
      └────────────┬───────────────┘
                   │
                   ▼
      ┌────────────────────────────┐
      │  Store & Display Sessions  │
      │  - Save to AsyncStorage    │
      │  - Update UI with source   │
      └────────────────────────────┘
```

## Data Source Priority

When multiple sources exist for the same date:

1. **Direct HealthKit Sleep** - Most accurate (user tracked sleep)
2. **Inferred from Steps** - Good approximation (algorithm-based)
3. **Manual Entry** - User input (fallback)

The sync algorithm automatically:
- Prefers direct HealthKit sleep data
- Uses inferred data to fill gaps
- Preserves manual entries
- Removes old inferred data when fresh data arrives

## Sleep Session Format

### Inferred Sessions
```javascript
{
  id: "inferred-2025-10-23T22:30:00.000Z",
  date: "2025-10-23",
  bedtimeISO: "2025-10-22T22:30:00.000Z",
  waketimeISO: "2025-10-23T06:30:00.000Z",
  durationMin: 480,
  source: "inferred"  // Tagged as inferred
}
```

### Direct HealthKit Sessions
```javascript
{
  id: "healthkit-2025-10-23T22:30:00.000Z",
  date: "2025-10-23",
  bedtimeISO: "2025-10-22T22:30:00.000Z",
  waketimeISO: "2025-10-23T06:30:00.000Z",
  durationMin: 480,
  source: "healthkit"  // Tagged as direct
}
```

## UI Indicators

The app displays the data source for each sleep session:

| Source | Icon | Label | Description |
|--------|------|-------|-------------|
| **healthkit** | ❤️ | HealthKit | Direct sleep data from HealthKit |
| **inferred** | 🚶 | Step Data | Inferred from step counts |
| **manual** | 📱 | Manual | User-entered data |

## Accuracy Considerations

### When Inference Works Well
✅ Regular sleep schedules
✅ Sleeping with phone nearby
✅ Minimal nighttime movement
✅ No phone usage during sleep

### When Inference May Be Less Accurate
⚠️ Irregular sleep patterns
⚠️ Phone not carried during sleep
⚠️ Frequent nighttime activity
⚠️ Multiple naps during the day

### Limitations
- **Cannot detect sleep quality** - Only duration
- **Requires phone proximity** - For step tracking
- **May miss short naps** - Below 2-hour threshold
- **Sensitive to nighttime activity** - Walking to bathroom, etc.

## Algorithm Parameters

These can be tuned for better accuracy:

```javascript
// In inferSleepFromSteps()
const MIN_INACTIVE_DURATION = 180;  // 3 hours minimum
const MIN_SLEEP_DURATION = 120;     // 2 hours minimum
const MAX_SLEEP_DURATION = 780;     // 13 hours maximum
const START_HOUR = 21;              // 9 PM earliest
const END_HOUR = 11;                // 11 AM latest
```

## Sync Behavior

### On App Launch
```javascript
1. Check HealthKit permission
2. If granted → Auto-sync last 30 days
3. Fetch step data
4. Infer sleep sessions
5. Fetch direct sleep data
6. Merge and display
```

### Manual Sync Button
```javascript
1. User taps "Sync HealthKit"
2. Request permission if needed
3. Fetch fresh data
4. Replace old inferred data
5. Show sync result message
```

### Sync Result Messages

The app shows detailed sync results:

- `"Synced 15 sessions (5 direct, 10 inferred)"` - Mixed sources
- `"Synced 10 sleep sessions from HealthKit"` - All direct
- `"Inferred 12 sessions from step data"` - All inferred
- `"No new sleep data found"` - No data available

## Performance

### Data Volume
- 30 days of minute-by-minute steps ≈ 43,200 data points
- Processing time: < 1 second
- Memory usage: Minimal (streaming processing)

### Optimization
- Data fetched once per sync
- Results cached in AsyncStorage
- UI updates only on data change
- Stale data replaced on sync

## Error Handling

The system gracefully handles errors:

```javascript
// Permission denied
if (permission !== 'granted') {
  return { success: false, message: 'Permission not granted' };
}

// No step data available
if (!stepData || stepData.length === 0) {
  // Falls back to direct sleep data only
}

// Inference fails
catch (error) {
  console.error('Inference error:', error);
  // Returns empty array, app continues
}
```

## Future Improvements

Potential enhancements:

1. **Heart Rate Integration** - Use HR to improve accuracy
2. **Motion Sensor Data** - Detect restlessness
3. **Machine Learning** - Personalized inference models
4. **Nap Detection** - Identify short sleep periods
5. **Sleep Stages** - Estimate light/deep sleep
6. **Background Sync** - Automatic daily updates
7. **Quality Metrics** - Sleep efficiency calculations

## Testing

### Manual Testing Steps

1. **Grant HealthKit Permission**
   - Open app → Sleep tab
   - Tap "Sync HealthKit"
   - Allow permission

2. **Verify Step Data Fetch**
   - Check console logs
   - Should see "Fetched step data points: X"

3. **Check Inference Results**
   - Look for "Inferred sleep sessions: X"
   - Verify sessions appear in list

4. **Validate Source Labels**
   - Each session should show correct icon
   - ❤️ for direct, 🚶 for inferred

5. **Test Data Priority**
   - If both exist, direct should be used
   - Inferred fills gaps only

### Expected Console Logs

```
[Store] Starting HealthKit sync...
[Store] Fetching step data from 2025-09-23... to 2025-10-23...
[Store] Fetched step data points: 43200
[Store] Inferring sleep from step data...
[Store] Inferred sleep sessions: 15
[Store] Fetching direct sleep data from HealthKit...
[Store] Fetched direct HealthKit sessions: 5
[Store] Total new sessions: 20
[Store] Sync completed. Total sessions: 20
[Store] - Direct HealthKit: 5
[Store] - Inferred from steps: 15
[Store] - Manual: 0
```

## Troubleshooting

### "No sleep data found"
- Ensure phone tracked steps during sleep
- Check HealthKit has step data for the period
- Verify sleep occurred in valid time window (9 PM - 11 AM)

### Inaccurate sleep times
- May need to adjust algorithm parameters
- Consider if phone was moving during sleep
- Check for irregular sleep patterns

### Missing sessions
- Sessions < 2 hours are filtered out
- Naps during daytime (11 AM - 9 PM) are ignored
- Very fragmented sleep may not be detected

## Summary

This sleep inference system provides:

✅ **Automatic Sleep Tracking** - No manual logging needed
✅ **Gap Filling** - Infers sleep when direct data unavailable
✅ **Transparent Sourcing** - Shows where data came from
✅ **Hybrid Accuracy** - Best of both direct and inferred data
✅ **Graceful Degradation** - Works with whatever data is available

The result is a comprehensive sleep tracking system that maximizes data availability while maintaining accuracy and transparency.
