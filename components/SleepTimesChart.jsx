import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useState } from 'react';
import { BlurView } from 'expo-blur';

const MOCK_DATA = [
  { date: 'TUE', fullDate: 'Tue, Nov 19', start: '2:11a', end: '7:26a', duration: '5h 15m', hours: 5.25 },
  { date: 'WED', fullDate: 'Wed, Nov 20', start: '11:40p', end: '7:10a', duration: '6h 56m', hours: 7.5 },
  { date: 'THU', fullDate: 'Thu, Nov 21', start: '1:20a', end: '6:50a', duration: '5h 42m', hours: 5.7 },
  { date: 'FRI', fullDate: 'Fri, Nov 22', start: '12:30a', end: '7:00a', duration: '6h 52m', hours: 6.87 },
  { date: 'SAT', fullDate: 'Sat, Nov 23', start: '2:45a', end: '7:15a', duration: '4h 39m', hours: 4.65 },
  { date: 'SUN', fullDate: 'Sun, Nov 24', start: '1:10a', end: '6:40a', duration: '5h 58m', hours: 5.97 },
  { date: 'MON', fullDate: 'Mon, Nov 25', start: '1:50a', end: '6:54a', duration: '5h 4m', hours: 5.07 },
  { date: 'TUE', fullDate: 'Tue, Nov 26', start: '--', end: '--', duration: '--h --m', hours: 0 },
];

export default function SleepTimesChart() {
  const [selectedDay, setSelectedDay] = useState(null);

  const maxHours = 10;

  const getBarHeight = (hours) => {
    return (hours / maxHours) * 160;
  };

  const getBarPosition = (start) => {
    if (start === '--') return 0;
    const [time, period] = start.split(/(?=[ap])/);
    const [hours, minutes] = time.split(':').map(Number);
    let totalHours = hours;
    if (period === 'p' && hours !== 12) totalHours += 12;
    if (period === 'a' && hours === 12) totalHours = 0;

    const position = ((22 - totalHours) / 14) * 100;
    return Math.max(0, Math.min(100, position));
  };

  return (
    <View style={styles.container}>
      <View style={styles.timeAxis}>
        <Text style={styles.timeLabel}>10p</Text>
        <Text style={styles.timeLabel}>12a</Text>
        <Text style={styles.timeLabel}>2a</Text>
        <Text style={styles.timeLabel}>4a</Text>
        <Text style={styles.timeLabel}>6a</Text>
        <Text style={styles.timeLabel}>8a</Text>
        <Text style={styles.timeLabel}>10a</Text>
        <Text style={styles.timeLabel}>12p</Text>
      </View>

      <View style={styles.chartArea}>
        {MOCK_DATA.map((day, index) => {
          const barHeight = getBarHeight(day.hours);
          const topPosition = getBarPosition(day.start);

          return (
            <TouchableOpacity
              key={index}
              style={styles.barContainer}
              onPress={() => day.hours > 0 && setSelectedDay(day)}
              activeOpacity={0.7}
            >
              <View style={styles.barColumn}>
                {day.hours > 0 && (
                  <View style={[styles.barWrapper, { top: `${topPosition}%` }]}>
                    <View style={[styles.bar, { height: barHeight }]}>
                      <View style={styles.moonIcon}>
                        <Text style={styles.moonEmoji}>🌙</Text>
                      </View>
                      <View style={styles.sleepSegments}>
                        <View style={[styles.segment, styles.deepSleep]} />
                        <View style={[styles.segment, styles.lightSleep]} />
                      </View>
                      <Text style={styles.zzz}>Zz</Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.barInfo}>
                <Text style={styles.durationText}>{day.duration}</Text>
                <Text style={styles.dateText}>{day.date}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal
        visible={selectedDay !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDay(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedDay(null)}
        >
          <BlurView intensity={20} tint="dark" style={styles.modalCard}>
            <Text style={styles.modalDate}>{selectedDay?.fullDate}</Text>
            <Text style={styles.modalTime}>{selectedDay?.start} – {selectedDay?.end}</Text>
            <Text style={styles.modalDuration}>{selectedDay?.duration}</Text>
          </BlurView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 280,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  timeAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  timeLabel: {
    fontSize: 10,
    color: '#A9AFB6',
    fontWeight: '500',
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 200,
    position: 'relative',
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  barColumn: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  barWrapper: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
  },
  bar: {
    width: '90%',
    backgroundColor: 'rgba(122, 92, 244, 0.8)',
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(122, 92, 244, 0.3)',
  },
  moonIcon: {
    marginTop: -12,
  },
  moonEmoji: {
    fontSize: 16,
  },
  sleepSegments: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  segment: {
    height: '45%',
    width: '100%',
  },
  deepSleep: {
    backgroundColor: 'rgba(122, 92, 244, 0.9)',
  },
  lightSleep: {
    backgroundColor: 'rgba(122, 92, 244, 0.5)',
  },
  zzz: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  barInfo: {
    marginTop: 8,
    alignItems: 'center',
  },
  durationText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 10,
    color: '#A9AFB6',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: 200,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  modalDate: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  modalTime: {
    fontSize: 14,
    color: '#A9AFB6',
    marginBottom: 4,
  },
  modalDuration: {
    fontSize: 18,
    color: '#7A5CF4',
    fontWeight: '700',
  },
});
