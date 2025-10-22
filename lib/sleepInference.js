const NIGHT_START_HOUR = 21;
const NIGHT_END_HOUR = 11;
const MIN_SLEEP_DURATION_MIN = 180;
const MAX_SLEEP_DURATION_MIN = 780;
const MIN_VALID_SLEEP_MIN = 120;
const GAP_MERGE_THRESHOLD_MIN = 20;
const GAP_STEPS_THRESHOLD = 60;
const LOW_ACTIVITY_THRESHOLD = 2;
const WAKE_CONTINUOUS_MIN = 3;
const WAKE_BURST_THRESHOLD = 30;

const formatTime = (date) => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const addMinutes = (date, minutes) => {
  return new Date(date.getTime() + minutes * 60000);
};

const getDateString = (date) => {
  return date.toISOString().split('T')[0];
};

const findSilentSegments = (minuteSteps) => {
  const segments = [];
  let currentSegment = null;

  for (let i = 0; i < minuteSteps.length; i++) {
    const isLowActivity = minuteSteps[i].steps <= LOW_ACTIVITY_THRESHOLD;

    if (isLowActivity) {
      if (!currentSegment) {
        currentSegment = {
          startIndex: i,
          endIndex: i,
          startTime: minuteSteps[i].timestamp,
          endTime: minuteSteps[i].timestamp,
        };
      } else {
        currentSegment.endIndex = i;
        currentSegment.endTime = minuteSteps[i].timestamp;
      }
    } else {
      if (currentSegment) {
        const durationMin = (currentSegment.endIndex - currentSegment.startIndex + 1);
        if (durationMin >= MIN_SLEEP_DURATION_MIN) {
          segments.push(currentSegment);
        }
        currentSegment = null;
      }
    }
  }

  if (currentSegment) {
    const durationMin = (currentSegment.endIndex - currentSegment.startIndex + 1);
    if (durationMin >= MIN_SLEEP_DURATION_MIN) {
      segments.push(currentSegment);
    }
  }

  return segments;
};

const mergeSegmentsByGap = (segments, minuteSteps) => {
  if (segments.length <= 1) return segments;

  const merged = [segments[0]];

  for (let i = 1; i < segments.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = segments[i];

    const gapMin = curr.startIndex - prev.endIndex - 1;

    if (gapMin <= GAP_MERGE_THRESHOLD_MIN) {
      let gapSteps = 0;
      for (let j = prev.endIndex + 1; j < curr.startIndex; j++) {
        gapSteps += minuteSteps[j].steps;
      }

      if (gapSteps < GAP_STEPS_THRESHOLD) {
        prev.endIndex = curr.endIndex;
        prev.endTime = curr.endTime;
        continue;
      }
    }

    merged.push(curr);
  }

  return merged;
};

const refineSleepBoundaries = (segment, minuteSteps) => {
  let sleepStart = segment.startIndex;
  let sleepEnd = segment.endIndex;

  for (let i = segment.startIndex - 1; i >= Math.max(0, segment.startIndex - 60); i--) {
    if (minuteSteps[i].steps > LOW_ACTIVITY_THRESHOLD) {
      sleepStart = i + 1;
      break;
    }
  }

  let wakeCount = 0;
  for (let i = segment.endIndex + 1; i < Math.min(minuteSteps.length, segment.endIndex + 60); i++) {
    if (minuteSteps[i].steps > LOW_ACTIVITY_THRESHOLD) {
      wakeCount++;
      if (wakeCount >= WAKE_CONTINUOUS_MIN || minuteSteps[i].steps >= WAKE_BURST_THRESHOLD) {
        sleepEnd = i - wakeCount;
        break;
      }
    } else {
      wakeCount = 0;
    }
  }

  return {
    startIndex: sleepStart,
    endIndex: sleepEnd,
    startTime: minuteSteps[sleepStart].timestamp,
    endTime: minuteSteps[sleepEnd].timestamp,
  };
};

const assignDateToSleep = (startTime) => {
  const hour = startTime.getHours();

  if (hour >= 0 && hour < 2) {
    const prevDay = new Date(startTime);
    prevDay.setDate(prevDay.getDate() - 1);
    return getDateString(prevDay);
  }

  return getDateString(startTime);
};

export const inferSleepFromSteps = async (minuteSteps, targetDate) => {
  const nightStart = new Date(targetDate);
  nightStart.setHours(NIGHT_START_HOUR, 0, 0, 0);

  const nightEnd = new Date(targetDate);
  nightEnd.setDate(nightEnd.getDate() + 1);
  nightEnd.setHours(NIGHT_END_HOUR, 0, 0, 0);

  const nightWindow = minuteSteps.filter(
    (step) => step.timestamp >= nightStart && step.timestamp <= nightEnd
  );

  if (nightWindow.length === 0) {
    return null;
  }

  const silentSegments = findSilentSegments(nightWindow);
  if (silentSegments.length === 0) {
    return null;
  }

  const mergedSegments = mergeSegmentsByGap(silentSegments, nightWindow);

  const validSegments = mergedSegments
    .map(seg => refineSleepBoundaries(seg, nightWindow))
    .filter(seg => {
      const durationMin = Math.floor((seg.endTime - seg.startTime) / 60000);
      return durationMin >= MIN_VALID_SLEEP_MIN && durationMin <= MAX_SLEEP_DURATION_MIN;
    });

  if (validSegments.length === 0) {
    return null;
  }

  const longestSegment = validSegments.reduce((longest, current) => {
    const currentDuration = current.endTime - current.startTime;
    const longestDuration = longest.endTime - longest.startTime;
    return currentDuration > longestDuration ? current : longest;
  });

  const durationMin = Math.floor((longestSegment.endTime - longestSegment.startTime) / 60000);

  const belongsToDate = assignDateToSleep(longestSegment.startTime);

  return {
    date: belongsToDate,
    startISO: longestSegment.startTime.toISOString(),
    endISO: longestSegment.endTime.toISOString(),
    durationMin,
  };
};

export const inferSleepForPeriod = async (minuteSteps) => {
  const sleepRecords = [];
  const dates = new Set();

  minuteSteps.forEach(step => {
    dates.add(getDateString(step.timestamp));
  });

  const sortedDates = Array.from(dates).sort();

  for (const date of sortedDates) {
    const sleep = await inferSleepFromSteps(minuteSteps, new Date(date));
    if (sleep) {
      const existing = sleepRecords.find(s => s.date === sleep.date);
      if (!existing) {
        sleepRecords.push(sleep);
      } else if (sleep.durationMin > existing.durationMin) {
        const index = sleepRecords.indexOf(existing);
        sleepRecords[index] = sleep;
      }
    }
  }

  return sleepRecords;
};

export const calculateSleepNeed = (sleepRecords) => {
  if (sleepRecords.length === 0) return 8 * 60;

  const durations = sleepRecords.map(s => s.durationMin);
  const mean = durations.reduce((a, b) => a + b, 0) / durations.length;

  const variance = durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length;
  const stdDev = Math.sqrt(variance);

  const alpha = 0.2;
  const sleepNeed = mean + alpha * stdDev;

  const minNeed = 5 * 60;
  const maxNeed = 11.5 * 60;

  return Math.max(minNeed, Math.min(maxNeed, sleepNeed));
};

export const calculateSleepDebt = (sleepRecords, sleepNeed) => {
  const last14Days = sleepRecords.slice(-14);

  let totalDebt = 0;
  for (const record of last14Days) {
    const deficit = Math.max(0, sleepNeed - record.durationMin);
    totalDebt += deficit;
  }

  const maxDebt = 15 * 60;
  return Math.min(totalDebt, maxDebt);
};

export const calculateCircadianRhythm = (sleepDebt) => {
  const circadianPeriod = 24.2;
  const hoursInDay = 24;
  const samplesPerHour = 1;
  const totalSamples = hoursInDay * samplesPerHour;

  const baseline = 50;
  const amplitude = 30;

  const debtPressure = Math.min(sleepDebt / (15 * 60), 1) * 20;

  const rhythm = [];

  for (let i = 0; i < totalSamples; i++) {
    const hour = i / samplesPerHour;

    const circadianValue = amplitude * Math.sin((2 * Math.PI * hour) / circadianPeriod - Math.PI / 2);

    const rawValue = baseline + circadianValue - debtPressure;

    const normalizedValue = Math.max(0, Math.min(100, rawValue));

    const hourStr = Math.floor(hour).toString().padStart(2, '0');
    const minStr = ((hour % 1) * 60).toString().padStart(2, '0');

    rhythm.push({
      t: `${hourStr}:${minStr}`,
      value: Math.round(normalizedValue),
    });
  }

  return rhythm;
};
