import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useState } from 'react';
import { BlurView } from 'expo-blur';

const MOCK_DATA = [
  { date: 'Nov 19', day: 'TUE', need: 8.5, actual: 5.25, debt: 3.25 },
  { date: 'Nov 20', day: 'WED', need: 8.5, actual: 7.5, debt: 1.0 },
  { date: 'Nov 21', day: 'THU', need: 8.5, actual: 5.7, debt: 2.8 },
  { date: 'Nov 22', day: 'FRI', need: 8.5, actual: 6.87, debt: 1.63 },
  { date: 'Nov 23', day: 'SAT', need: 8.5, actual: 4.65, debt: 3.85 },
  { date: 'Nov 24', day: 'SUN', need: 8.5, actual: 5.97, debt: 2.53 },
  { date: 'Nov 25', day: 'MON', need: 8.5, actual: 5.07, debt: 3.43 },
];

export default function SleepDebtChart() {
  const [selectedDay, setSelectedDay] = useState(null);

  const totalDebt = MOCK_DATA.reduce((sum, day) => sum + Math.max(0, day.debt), 0);
  const avgDebt = totalDebt / MOCK_DATA.length;
  const isImproving = MOCK_DATA[MOCK_DATA.length - 1].debt < MOCK_DATA[0].debt;

  const maxDebt = Math.max(...MOCK_DATA.map(d => Math.abs(d.debt)));
  const getBarHeight = (debt) => {
    return (Math.abs(debt) / maxDebt) * 80;
  };

  const formatHours = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Current Sleep Debt</Text>
        <Text style={styles.summaryValue}>{formatHours(avgDebt)}</Text>
        <Text style={[styles.summaryTip, isImproving ? styles.tipGood : styles.tipBad]}>
          {isImproving ? "You're getting back on track!" : "Try resting earlier tonight."}
        </Text>
      </View>

      <View style={styles.chartArea}>
        <View style={styles.centerLine} />

        {MOCK_DATA.map((day, index) => {
          const barHeight = getBarHeight(day.debt);
          const isDebt = day.debt > 0;

          return (
            <TouchableOpacity
              key={index}
              style={styles.barContainer}
              onPress={() => setSelectedDay(day)}
              activeOpacity={0.7}
            >
              <View style={styles.barColumn}>
                {isDebt ? (
                  <>
                    <View
                      style={[
                        styles.barUp,
                        { height: barHeight },
                      ]}
                    />
                    <View style={styles.barSpace} />
                  </>
                ) : (
                  <>
                    <View style={styles.barSpace} />
                    <View
                      style={[
                        styles.barDown,
                        { height: barHeight },
                      ]}
                    />
                  </>
                )}
              </View>
              <Text style={styles.dayLabel}>{day.day}</Text>
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
            <Text style={styles.modalDate}>{selectedDay?.date}</Text>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Need</Text>
              <Text style={styles.modalValue}>{formatHours(selectedDay?.need || 0)}</Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Slept</Text>
              <Text style={styles.modalValue}>{formatHours(selectedDay?.actual || 0)}</Text>
            </View>
            <View style={[styles.modalRow, styles.modalDebtRow]}>
              <Text style={styles.modalLabel}>Debt</Text>
              <Text style={[styles.modalDebt, selectedDay?.debt > 0 ? styles.debtNegative : styles.debtPositive]}>
                {selectedDay?.debt > 0 ? '+' : ''}{formatHours(selectedDay?.debt || 0)}
              </Text>
            </View>
          </BlurView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#A9AFB6',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 12,
  },
  summaryTip: {
    fontSize: 14,
    fontWeight: '500',
  },
  tipGood: {
    color: '#3AC7F7',
  },
  tipBad: {
    color: '#FF6B9D',
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 180,
    position: 'relative',
    alignItems: 'center',
  },
  centerLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  barColumn: {
    width: '100%',
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barSpace: {
    height: 80,
  },
  barUp: {
    width: '70%',
    backgroundColor: 'rgba(255, 107, 157, 0.8)',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.3)',
  },
  barDown: {
    width: '70%',
    backgroundColor: 'rgba(58, 199, 247, 0.8)',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(58, 199, 247, 0.3)',
  },
  dayLabel: {
    fontSize: 10,
    color: '#A9AFB6',
    marginTop: 8,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: 220,
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalDate: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalDebtRow: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalLabel: {
    fontSize: 14,
    color: '#A9AFB6',
  },
  modalValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalDebt: {
    fontSize: 16,
    fontWeight: '700',
  },
  debtNegative: {
    color: '#FF6B9D',
  },
  debtPositive: {
    color: '#3AC7F7',
  },
});
