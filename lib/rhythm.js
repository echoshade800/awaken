export function generateMockRhythm({ wake = '07:30', sleep = '23:00', chrono = 'neutral' }) {
  const wakeMinute = timeToMinutes(wake);
  const sleepMinute = timeToMinutes(sleep);
  const phaseShifts = { early: -1.5, neutral: 0, late: 1.5 };
  const phaseShift = phaseShifts[chrono] || 0;
  const baseline = 50;
  const amplitude = 25;
  const peakPhase = 14 + phaseShift;
  const points = [];
  let peakEnergy = 0, peakTime = 0, valleyEnergy = 100, valleyTime = 0;

  for (let minute = 0; minute < 1440; minute += 15) {
    const hour = minute / 60;
    const circadian = amplitude * Math.sin(((2 * Math.PI) / 24) * (hour - peakPhase + 6));
    let sleepPressure = 0;
    if (minute >= wakeMinute && minute < sleepMinute) {
      const hoursAwake = (minute - wakeMinute) / 60;
      sleepPressure = 15 * (hoursAwake / 16);
    }
    let energy = baseline + circadian - sleepPressure;
    energy = Math.max(0, Math.min(100, energy));
    points.push({ minute, energy });
    if (energy > peakEnergy) { peakEnergy = energy; peakTime = minute; }
    if (energy < valleyEnergy) { valleyEnergy = energy; valleyTime = minute; }
  }

  const melatoninStart = sleepMinute - 120;
  const wakePoints = points.filter((p) => p.minute >= wakeMinute && p.minute < sleepMinute);
  const energyScore = wakePoints.length > 0
    ? Math.round(wakePoints.reduce((sum, p) => sum + p.energy, 0) / wakePoints.length)
    : 50;

  return {
    points,
    peak: minutesToTime(peakTime),
    valley: minutesToTime(valleyTime),
    melatoninWindow: {
      start: minutesToTime(melatoninStart >= 0 ? melatoninStart : melatoninStart + 1440),
      end: sleep,
    },
    energyScore,
  };
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getCurrentMinute() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}
