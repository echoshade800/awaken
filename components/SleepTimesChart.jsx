import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { useState, Fragment } from 'react';

const CHART_HEIGHT = 220;
const PADDING = { top: 40, right: 20, bottom: 30, left: 20 };

export default function SleepTimesChart({ data, chartWidth }) {
  const [selectedBar, setSelectedBar] = useState(null);

  if (!data || data.length === 0) return null;

  const chartArea = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const barWidth = (chartWidth - PADDING.left - PADDING.right) / (data.length * 1.5);
  const barSpacing = barWidth * 0.5;

  const timeToY = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;
    if (totalMinutes < 12 * 60) totalMinutes += 24 * 60;

    const startMinutes = 22 * 60;
    const endMinutes = 36 * 60;
    const ratio = (totalMinutes - startMinutes) / (endMinutes - startMinutes);

    return PADDING.top + chartArea * (1 - ratio);
  };

  const yTimeLabels = ['22:00', '02:00', '06:00', '10:00'];

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#9D7AFF" stopOpacity="0.7" />
            <Stop offset="100%" stopColor="#5E4FC2" stopOpacity="0.3" />
          </LinearGradient>
        </Defs>

        {yTimeLabels.map((time) => (
          <SvgText
            key={time}
            x={PADDING.left - 8}
            y={timeToY(time)}
            fontSize="10"
            fill="#B0B0B0"
            textAnchor="end"
            alignmentBaseline="middle"
          >
            {time}
          </SvgText>
        ))}

        {data.map((item, index) => {
          const x = PADDING.left + index * (barWidth + barSpacing);
          const sleepY = timeToY(item.sleepTime);
          const wakeY = timeToY(item.wakeTime);
          const barHeight = Math.abs(wakeY - sleepY);
          const topY = Math.min(sleepY, wakeY);

          return (
            <G key={item.date}>
              <Rect
                x={x}
                y={topY}
                width={barWidth}
                height={barHeight}
                fill="url(#barGradient)"
                rx={4}
                ry={4}
                onPress={() => setSelectedBar(selectedBar === index ? null : index)}
              />

              <SvgText
                x={x + barWidth / 2}
                y={CHART_HEIGHT - PADDING.bottom + 20}
                fontSize="11"
                fill="#FFFFFF"
                textAnchor="middle"
                opacity="0.8"
              >
                {item.dayLabel}
              </SvgText>
            </G>
          );
        })}
      </Svg>

      {selectedBar !== null && (
        <View style={[styles.tooltip, { left: PADDING.left + selectedBar * (barWidth + barSpacing) - 40 }]}>
          <Text style={styles.tooltipDate}>📅 {data[selectedBar].fullDate}</Text>
          <Text style={styles.tooltipText}>🕓 Slept: {data[selectedBar].duration}</Text>
          <Text style={styles.tooltipText}>🌙 {data[selectedBar].sleepTime} – {data[selectedBar].wakeTime}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    top: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: 12,
    padding: 8,
    minWidth: 160,
  },
  tooltipDate: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  tooltipText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
});
