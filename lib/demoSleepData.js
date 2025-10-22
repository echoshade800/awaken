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
  return DEMO_SLEEP_DATA.filter((item) => item.sleepStart !== '--:--').map((item, index) => {
    const durationMin = parseDuration(item.duration);
    let sleepStartISO = timeToISO(item.date, item.sleepStart);
    const sleepEndISO = timeToISO(item.date, item.sleepEnd);

    const startHour = parseInt(item.sleepStart.split(':')[0]);
    if (startHour >= 0 && startHour < 12) {
      const prevDate = new Date(item.date);
      prevDate.setDate(prevDate.getDate() - 1);
      sleepStartISO = timeToISO(prevDate.toISOString().split('T')[0], item.sleepStart);
    }

    return {
      id: `demo-${item.date}`,
      date: item.date,
      bedtimeISO: sleepStartISO,
      waketimeISO: sleepEndISO,
      durationMin: durationMin,
      source: 'demo',
    };
  });
}

export function isDemoDataActive() {
  return true;
}

export default DEMO_SLEEP_DATA;
