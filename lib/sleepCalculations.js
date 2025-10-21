/**
 * Sleep Calculation Utilities
 * Handles sleep need, sleep debt, and circadian rhythm calculations
 */

// Constants
const MIN_SLEEP_NEED = 5;
const MAX_SLEEP_NEED = 11.5;
const MAX_SLEEP_DEBT = 15;
const CIRCADIAN_PERIOD = 24.2;
const DATA_WINDOW_DAYS = 14;

/**
 * Calculate individual sleep need based on user data
 * @param {Object} params - Sleep routine data
 * @returns {number} Sleep need in hours
 */
export function calculateSleepNeed(params) {
  const {
    bedtime = '23:00',
    wakeTime = '07:00',
    energyType = 'balanced',
    alertnessLevel = 'moderate',
  } = params;

  // Calculate base sleep duration from routine
  const baseDuration = calculateDurationBetweenTimes(bedtime, wakeTime);

  // Energy type adjustments
  const energyAdjustments = {
    'morning-lark': -0.5, // Morning types tend to need slightly less
    'night-owl': 0.5, // Night types may need slightly more
    'balanced': 0,
  };

  // Alertness level adjustments
  const alertnessAdjustments = {
    'very-tired': 1.0,
    'tired': 0.5,
    'moderate': 0,
    'energetic': -0.3,
    'very-energetic': -0.5,
  };

  let sleepNeed = baseDuration;
  sleepNeed += energyAdjustments[energyType] || 0;
  sleepNeed += alertnessAdjustments[alertnessLevel] || 0;

  // Constrain to valid range
  return Math.max(MIN_SLEEP_NEED, Math.min(MAX_SLEEP_NEED, sleepNeed));
}

/**
 * Calculate sleep debt over the last 14 days with recovery factor
 * @param {number} sleepNeed - User's sleep need in hours
 * @param {Array} sleepHistory - Array of {date, duration} objects
 * @returns {number} Sleep debt in hours (negative means deficit)
 */
export function calculateSleepDebt(sleepNeed, sleepHistory = []) {
  if (!sleepHistory || sleepHistory.length === 0) {
    return 0;
  }

  let debt = 0;
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - DATA_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const recentSessions = sleepHistory
    .filter((record) => new Date(record.date) >= cutoffDate)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  recentSessions.forEach((record, index) => {
    const duration = typeof record.duration === 'number' ? record.duration : record.durationMin / 60;
    const deficit = sleepNeed - duration;

    const decayFactor = Math.exp(-0.05 * (recentSessions.length - index - 1));
    debt += deficit * decayFactor;
  });

  return Math.max(-MAX_SLEEP_DEBT, Math.min(0, -debt));
}

/**
 * Generate 24-hour circadian rhythm curve
 * @param {Object} params - User parameters
 * @returns {Array} Array of {time, energy} objects
 */
export function generateCircadianCurve(params) {
  const {
    wakeTime = '07:00',
    sleepTime = '23:00',
    sleepNeed = 8,
    sleepDebt = 0,
    energyType = 'balanced',
  } = params;

  const wakeHour = timeStringToHours(wakeTime);
  const sleepHour = timeStringToHours(sleepTime);

  // Generate 24 hourly data points
  const curve = [];
  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();
  const currentTime = currentHour + currentMinute / 60;

  for (let hour = 0; hour < 24; hour++) {
    const energy = calculateAlertness(hour, {
      wakeHour,
      sleepHour,
      sleepNeed,
      sleepDebt,
      energyType,
      currentTime,
    });

    curve.push({
      time: `${String(hour).padStart(2, '0')}:00`,
      energy: Math.round(energy),
      hour,
    });
  }

  return curve;
}

/**
 * Calculate alertness level using enhanced SAFTE model
 * @param {number} hour - Hour of day (0-23)
 * @param {Object} params - Calculation parameters
 * @returns {number} Energy level (0-100)
 */
function calculateAlertness(hour, params) {
  const { wakeHour, sleepHour, sleepNeed, sleepDebt, energyType, currentTime } = params;

  let hoursSinceWake = hour - wakeHour;
  if (hoursSinceWake < 0) hoursSinceWake += 24;

  const circadianPhase = ((hour - 6) * 2 * Math.PI) / CIRCADIAN_PERIOD;
  let circadianComponent = 45 * Math.sin(circadianPhase) + 50;

  if (hour >= 14 && hour <= 16) {
    circadianComponent -= 8;
  }
  if (hour >= 2 && hour <= 5) {
    circadianComponent -= 12;
  }

  const isAwake = (hour >= wakeHour && hour < 24) || (hour >= 0 && hour < sleepHour);
  let sleepPressure;

  if (isAwake) {
    const S_max = 100;
    const tau = 18.2;
    sleepPressure = S_max * (1 - Math.exp(-hoursSinceWake / tau)) * (hoursSinceWake / 16);
    sleepPressure = Math.min(sleepPressure, 35);
  } else {
    let hoursSinceSleep = hour - sleepHour;
    if (hoursSinceSleep < 0) hoursSinceSleep += 24;
    sleepPressure = 35 * Math.exp(-hoursSinceSleep / 2.5);
  }

  const energyTypeBoost = {
    'morning-lark': hour < 12 ? 12 : hour > 20 ? -8 : -2,
    'night-owl': hour > 18 ? 12 : hour < 10 ? -8 : -2,
    'balanced': hour >= 9 && hour <= 11 ? 5 : 0,
  };

  const debtImpact = Math.min(Math.abs(sleepDebt) * 2.5, 20);
  const debtPenalty = sleepDebt < -2 ? debtImpact : debtImpact * 0.5;

  const inertiaEffect = isAwake && hoursSinceWake < 0.5 ? -15 : 0;

  let alertness =
    circadianComponent -
    sleepPressure +
    (energyTypeBoost[energyType] || 0) -
    debtPenalty +
    inertiaEffect;

  const baselineAdjustment = (8 - sleepNeed) * 2.5;
  alertness += baselineAdjustment;

  if (Math.abs(hour - currentTime) < 0.5) {
    alertness += 3;
  }

  return Math.max(0, Math.min(100, alertness));
}

/**
 * Get energy status labels based on level
 * @param {number} energy - Energy level (0-100)
 * @returns {Object} Status info
 */
export function getEnergyStatus(energy) {
  if (energy >= 80) {
    return {
      label: 'Peak Energy',
      color: '#FFD700',
      icon: '🔥',
      tip: "Now's your best focus window 🔥",
    };
  } else if (energy >= 60) {
    return {
      label: 'Rising',
      color: '#FFA500',
      icon: '⚡',
      tip: "Energy's building up ☀️",
    };
  } else if (energy >= 40) {
    return {
      label: 'Moderate',
      color: '#90EE90',
      icon: '🙂',
      tip: '✨ Energy balanced. Keep it calm and consistent 🌙',
    };
  } else {
    return {
      label: 'Low Energy',
      color: '#87CEEB',
      icon: '😴',
      tip: 'Time to unwind 🌙 You deserve some rest',
    };
  }
}

/**
 * Get sleep debt message
 * @param {number} debt - Sleep debt in hours (negative means deficit)
 * @returns {Object} Debt info
 */
export function getSleepDebtInfo(debt) {
  const absDebt = Math.abs(debt);

  if (debt >= 0) {
    return {
      label: 'Fully recovered',
      emoji: '😴',
      color: '#90EE90',
      severity: 'good',
    };
  } else if (absDebt <= 2) {
    return {
      label: 'Not bad',
      emoji: '🙂',
      color: '#FFD700',
      severity: 'okay',
    };
  } else {
    return {
      label: 'You need more rest',
      emoji: '💤',
      color: '#FF6B6B',
      severity: 'warning',
    };
  }
}

/**
 * Find peak and valley times in energy curve
 * @param {Array} curve - Energy curve data
 * @returns {Object} Peak and valley info
 */
export function findPeakAndValley(curve) {
  if (!curve || curve.length === 0) {
    return {
      peak: { time: '13:00', energy: 80 },
      valley: { time: '03:00', energy: 20 },
    };
  }

  let peak = curve[0];
  let valley = curve[0];

  curve.forEach((point) => {
    if (point.energy > peak.energy) peak = point;
    if (point.energy < valley.energy) valley = point;
  });

  return { peak, valley };
}

/**
 * Get current energy from curve
 * @param {Array} curve - Energy curve data
 * @returns {number} Current energy level
 */
export function getCurrentEnergy(curve) {
  if (!curve || curve.length === 0) return 50;

  const now = new Date();
  const currentHour = now.getHours();

  const currentPoint = curve.find((p) => p.hour === currentHour);
  return currentPoint ? currentPoint.energy : 50;
}

// Helper functions

function calculateDurationBetweenTimes(startTime, endTime) {
  const start = timeStringToHours(startTime);
  const end = timeStringToHours(endTime);

  let duration = end - start;
  if (duration < 0) duration += 24;

  return duration;
}

function timeStringToHours(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours + (minutes || 0) / 60;
}

/**
 * Format hours to time string
 * @param {number} hours - Hours (can be decimal)
 * @returns {string} Formatted time string
 */
export function formatHoursToTime(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

/**
 * Get dynamic monster tip based on current energy phase
 * @param {number} currentEnergy - Current energy level
 * @param {number} sleepDebt - Current sleep debt
 * @returns {string} Monster tip message
 */
export function getDynamicMonsterTip(currentEnergy, sleepDebt) {
  const absDebt = Math.abs(sleepDebt);

  // High sleep debt warnings
  if (absDebt > 3) {
    return '⚠️ Your sleep debt is high. Time for extra rest 💤';
  }

  // Energy-based tips
  if (currentEnergy >= 80) {
    return "🔥 Peak energy time! Perfect for your toughest tasks";
  } else if (currentEnergy >= 60) {
    return '⚡ Energy rising — great time to stay focused';
  } else if (currentEnergy >= 40) {
    return '✨ Energy balanced. Keep it calm and consistent 🌙';
  } else {
    return '🌙 Low energy phase. Time to wind down and rest';
  }
}
