// Demo sleep patterns (will be applied to recent dates dynamically)
const DEMO_SLEEP_PATTERNS = [
  { sleepStart: '23:40', sleepEnd: '07:20', duration: '7h 40m' },
  { sleepStart: '00:10', sleepEnd: '08:00', duration: '7h 50m' },
  { sleepStart: '00:30', sleepEnd: '09:10', duration: '8h 40m' },
  { sleepStart: '01:10', sleepEnd: '09:45', duration: '8h 35m' },
  { sleepStart: '00:55', sleepEnd: '09:10', duration: '8h 15m' },
  { sleepStart: '23:20', sleepEnd: '07:00', duration: '7h 40m' },
  { sleepStart: '23:50', sleepEnd: '07:10', duration: '7h 20m' },
  { sleepStart: '00:10', sleepEnd: '07:45', duration: '7h 35m' },
  { sleepStart: '23:55', sleepEnd: '08:10', duration: '8h 15m' },
  { sleepStart: '00:35', sleepEnd: '08:55', duration: '8h 20m' },
  { sleepStart: '01:10', sleepEnd: '09:25', duration: '8h 15m' },
  { sleepStart: '00:40', sleepEnd: '09:00', duration: '8h 20m' },
  { sleepStart: '23:50', sleepEnd: '07:20', duration: '7h 30m' },
];

function calculateDebt(duration) {
  if (duration === '--h --m') return '--';

  const match = duration.match(/(\d+)h (\d+)m/);
  if (!match) return '-0h 00m';

  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const totalMinutes = hours * 60 + minutes;
  const needMinutes = 8 * 60 + 30;
  const debtMinutes = needMinutes - totalMinutes;

  const sign = debtMinutes > 0 ? '-' : '+';
  const absDebt = Math.abs(debtMinutes);
  const debtHours = Math.floor(absDebt / 60);
  const debtMins = absDebt % 60;

  return `${sign}${debtHours}h ${String(debtMins).padStart(2, '0')}m`;
}

function generateDemoSleepData() {
  const data = [];
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate 13 days of data (excluding today)
  for (let i = 13; i >= 1; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = dayNames[date.getDay()];
    const pattern = DEMO_SLEEP_PATTERNS[(13 - i) % DEMO_SLEEP_PATTERNS.length];

    data.push({
      date: dateStr,
      dayOfWeek: dayOfWeek,
      sleepStart: pattern.sleepStart,
      sleepEnd: pattern.sleepEnd,
      duration: pattern.duration,
      sleepNeed: '8h 30m',
      sleepDebt: calculateDebt(pattern.duration),
    });
  }

  // Add today with no data
  data.push({
    date: today.toISOString().split('T')[0],
    dayOfWeek: dayNames[today.getDay()],
    sleepStart: '--:--',
    sleepEnd: '--:--',
    duration: '--h --m',
    sleepNeed: '8h 30m',
    sleepDebt: '--',
  });

  return data;
}

const DEMO_SLEEP_DATA = generateDemoSleepData();

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
  const demoData = generateDemoSleepData();

  return demoData.filter((item) => item.sleepStart !== '--:--').map((item, index) => {
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
