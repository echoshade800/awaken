const DEMO_SLEEP_DATA = [
  {
    date: '2025-10-08',
    dayOfWeek: 'Wed',
    sleepStart: '23:40',
    sleepEnd: '07:20',
    duration: '7h 40m',
    sleepNeed: '8h 30m',
    sleepDebt: '-0h 50m',
  },
  {
    date: '2025-10-09',
    dayOfWeek: 'Thu',
    sleepStart: '00:10',
    sleepEnd: '08:00',
    duration: '7h 50m',
    sleepNeed: '8h 30m',
    sleepDebt: '-0h 40m',
  },
  {
    date: '2025-10-10',
    dayOfWeek: 'Fri',
    sleepStart: '00:30',
    sleepEnd: '09:10',
    duration: '8h 40m',
    sleepNeed: '8h 30m',
    sleepDebt: '+0h 10m',
  },
  {
    date: '2025-10-11',
    dayOfWeek: 'Sat',
    sleepStart: '01:10',
    sleepEnd: '09:45',
    duration: '8h 35m',
    sleepNeed: '8h 30m',
    sleepDebt: '+0h 05m',
  },
  {
    date: '2025-10-12',
    dayOfWeek: 'Sun',
    sleepStart: '00:55',
    sleepEnd: '09:10',
    duration: '8h 15m',
    sleepNeed: '8h 30m',
    sleepDebt: '-0h 15m',
  },
  {
    date: '2025-10-13',
    dayOfWeek: 'Mon',
    sleepStart: '23:20',
    sleepEnd: '07:00',
    duration: '7h 40m',
    sleepNeed: '8h 30m',
    sleepDebt: '-0h 50m',
  },
  {
    date: '2025-10-14',
    dayOfWeek: 'Tue',
    sleepStart: '23:50',
    sleepEnd: '07:10',
    duration: '7h 20m',
    sleepNeed: '8h 30m',
    sleepDebt: '-1h 10m',
  },
  {
    date: '2025-10-15',
    dayOfWeek: 'Wed',
    sleepStart: '00:10',
    sleepEnd: '07:45',
    duration: '7h 35m',
    sleepNeed: '8h 30m',
    sleepDebt: '-0h 55m',
  },
  {
    date: '2025-10-16',
    dayOfWeek: 'Thu',
    sleepStart: '23:55',
    sleepEnd: '08:10',
    duration: '8h 15m',
    sleepNeed: '8h 30m',
    sleepDebt: '-0h 15m',
  },
  {
    date: '2025-10-17',
    dayOfWeek: 'Fri',
    sleepStart: '00:35',
    sleepEnd: '08:55',
    duration: '8h 20m',
    sleepNeed: '8h 30m',
    sleepDebt: '-0h 10m',
  },
  {
    date: '2025-10-18',
    dayOfWeek: 'Sat',
    sleepStart: '01:10',
    sleepEnd: '09:25',
    duration: '8h 15m',
    sleepNeed: '8h 30m',
    sleepDebt: '-0h 15m',
  },
  {
    date: '2025-10-19',
    dayOfWeek: 'Sun',
    sleepStart: '00:40',
    sleepEnd: '09:00',
    duration: '8h 20m',
    sleepNeed: '8h 30m',
    sleepDebt: '-0h 10m',
  },
  {
    date: '2025-10-20',
    dayOfWeek: 'Mon',
    sleepStart: '23:50',
    sleepEnd: '07:20',
    duration: '7h 30m',
    sleepNeed: '8h 30m',
    sleepDebt: '-1h 00m',
  },
  {
    date: '2025-10-21',
    dayOfWeek: 'Tue',
    sleepStart: '00:15',
    sleepEnd: '07:50',
    duration: '7h 35m',
    sleepNeed: '8h 30m',
    sleepDebt: '-0h 55m',
  },
  {
    date: '2025-10-22',
    dayOfWeek: 'Wed',
    sleepStart: '--:--',
    sleepEnd: '--:--',
    duration: '--h --m',
    sleepNeed: '8h 30m',
    sleepDebt: '--',
  },
];

function parseDuration(duration) {
  if (duration === '--h --m') return 0;
  const match = duration.match(/(\d+)h (\d+)m/);
  if (!match) return 0;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

function timeToISO(date, time) {
  if (time === '--:--') return null;
  const [hours, minutes] = time.split(':').map(Number);
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

export function convertDemoToSleepSessions() {
  try {
    return DEMO_SLEEP_DATA
      .filter((item) => item && item.sleepStart && item.sleepStart !== '--:--')
      .map((item, index) => {
        try {
          const durationMin = parseDuration(item.duration);
          if (!durationMin || durationMin <= 0) {
            console.warn('Invalid duration for demo data:', item);
            return null;
          }

          const [startHourStr, startMinStr] = item.sleepStart.split(':');
          const [endHourStr, endMinStr] = item.sleepEnd.split(':');

          const startHour = parseInt(startHourStr, 10);
          const endHour = parseInt(endHourStr, 10);

          if (isNaN(startHour) || isNaN(endHour)) {
            console.warn('Invalid time format in demo data:', item);
            return null;
          }

          let bedtimeDate = new Date(item.date);
          let waketimeDate = new Date(item.date);

          if (isNaN(bedtimeDate.getTime()) || isNaN(waketimeDate.getTime())) {
            console.warn('Invalid date in demo data:', item.date);
            return null;
          }

          // If sleep starts in evening (after 8pm) or early morning (before noon),
          // set bedtime to previous day
          if (startHour >= 20 || startHour < 12) {
            bedtimeDate.setDate(bedtimeDate.getDate() - 1);
          }

          const bedH = parseInt(startHourStr, 10);
          const bedM = parseInt(startMinStr, 10);
          const wakeH = parseInt(endHourStr, 10);
          const wakeM = parseInt(endMinStr, 10);

          if (isNaN(bedH) || isNaN(bedM) || isNaN(wakeH) || isNaN(wakeM)) {
            console.warn('Invalid time components in demo data:', item);
            return null;
          }

          bedtimeDate.setHours(bedH, bedM, 0, 0);
          waketimeDate.setHours(wakeH, wakeM, 0, 0);

          // Validate that wake time is after bed time
          if (waketimeDate <= bedtimeDate) {
            console.warn('Wake time is not after bed time:', { bedtimeDate, waketimeDate, item });
            // This is expected for overnight sleep, so don't return null
          }

          return {
            id: `demo-${item.date}`,
            date: item.date,
            bedtimeISO: bedtimeDate.toISOString(),
            waketimeISO: waketimeDate.toISOString(),
            durationMin: durationMin,
            source: 'demo',
          };
        } catch (error) {
          console.error('Error converting demo item:', error, item);
          return null;
        }
      })
      .filter(session => session !== null);
  } catch (error) {
    console.error('Error converting demo sleep sessions:', error);
    return [];
  }
}

export function isDemoDataActive() {
  return true;
}

export default DEMO_SLEEP_DATA;
