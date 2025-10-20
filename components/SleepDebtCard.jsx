import { View, Text, StyleSheet, Animated } from 'react-native';
import UnifiedPanelBorder from '@/components/UnifiedPanelBorder';
import { useEffect, useRef } from 'react';

export default function SleepDebtCard({ sleepDebt = 0 }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // 格式化睡眠债务显示
  const formatSleepDebt = (debt) => {
    if (debt <= 0) {
      return { hours: '0', minutes: '00', status: 'Very Rested', emoji: '💤' };
    }
    
    const absDebt = Math.abs(debt);
    const hours = Math.floor(absDebt);
    const minutes = Math.round((absDebt - hours) * 60);
    
    let status, emoji;
    if (absDebt <= 2) {
      status = 'Not bad';
      emoji = '🙂';
    } else {
      status = 'You need rest';
      emoji = '🥱';
    }
    
    return {
      hours: hours.toString(),
      minutes: minutes.toString().padStart(2, '0'),
      status,
      emoji
    };
  };

  const debtInfo = formatSleepDebt(sleepDebt);

  // 数值变化动画
  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [sleepDebt]);

  return (
    <View style={styles.container}>
      <UnifiedPanelBorder style={styles.panel}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>恢复性睡眠</Text>
            <Text style={styles.headerEmoji}>😴</Text>
          </View>
          
          <Animated.View 
            style={[styles.valueContainer, { transform: [{ scale: scaleAnim }] }]}
          >
            <View style={styles.timeDisplay}>
              <Text style={styles.timeNumber}>{debtInfo.hours}</Text>
              <Text style={styles.timeUnit}>h</Text>
              <Text style={styles.timeNumber}>{debtInfo.minutes}</Text>
              <Text style={styles.timeUnit}>m</Text>
            </View>
          </Animated.View>
          
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {debtInfo.emoji} {debtInfo.status}
            </Text>
          </View>
        </View>
      </UnifiedPanelBorder>
      <Text style={styles.label}>Sleep Debt: {sleepDebt > 0 ? '+' : ''}{sleepDebt}h</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  panel: {
    height: 110,
    width: '100%',
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  headerEmoji: {
    fontSize: 14,
  },
  valueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  timeNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 36,
  },
  timeUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 4,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(200, 230, 255, 0.95)',
    letterSpacing: 0.8,
    marginTop: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(200, 230, 255, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
