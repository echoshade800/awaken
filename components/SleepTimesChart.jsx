import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { useState } from 'react';

const CHART_HEIGHT = 240;
const PADDING = { top: 50, right: 50, bottom: 40, left: 20 };

export default function SleepTimesChart({ data, chartWidth }) {
  const [selectedBar, setSelectedBar] = useState(null);

  if (!data || data.length === 0) return null;

  const chartArea = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const totalBarSpace = chartWidth - PADDING.left - PADDING.right;
  const barWidth = Math.floor(totalBarSpace / (data.length * 1.5));
  const barSpacing = Math.floor(barWidth * 0.5);

  const timeToY = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;
    if (totalMinutes < 12 * 60) totalMinutes += 24 * 60;

    const startMinutes = 22 * 60;
    const endMinutes = 36 * 60;
    const ratio = (totalMinutes - startMinutes) / (endMinutes - startMinutes);

    return PADDING.top + chartArea * (1 - ratio);
  };

  const yTimeLabels = [
    { time: '10:00 PM', value: '22:00' },
    { time: '12:00 AM', value: '00:00' },
    { time: '2:00 AM', value: '02:00' },
    { time: '4:00 AM', value: '04:00' },
    { time: '6:00 AM', value: '06:00' },
    { time: '8:00 AM', value: '08:00' },
    { time: '10:00 AM', value: '10:00' },
    { time: '12:00 PM', value: '12:00' },
  ];

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#9D7AFF" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#5E4FC2" stopOpacity="0.4" />
          </LinearGradient>
        </Defs>

        {yTimeLabels.map((label) => {
          const y = timeToY(label.value);
          return (
            <G key={label.value}>
              <Line
                x1={PADDING.left}
                y1={y}
                x2={chartWidth - PADDING.right}
                y2={y}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="1"
              />
              <SvgText
                x={chartWidth - PADDING.right + 12}
                y={y}
                fontSize="10"
                fill="rgba(255, 255, 255, 0.5)"
                textAnchor="start"
                alignmentBaseline="middle"
              >
                {label.time}
              </SvgText>
            </G>
          );
        })}

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
                rx={6}
                ry={6}
                onPress={() => setSelectedBar(selectedBar === index ? null : index)}
              />

              <SvgText
                x={x + barWidth / 2}
                y={topY - 6}
                fontSize="12"
                fontWeight="600"
                fill="rgba(255, 255, 255, 0.85)"
                textAnchor="middle"
                alignmentBaseline="baseline"
              >
                {item.duration}
              </SvgText>

              <SvgText
                x={x + barWidth / 2}
                y={CHART_HEIGHT - PADDING.bottom + 20}
                fontSize="12"
                fontWeight="400"
                fill="rgba(255, 255, 255, 0.7)"
                textAnchor="middle"
              >
                {item.dayLabel.toUpperCase()}
              </SvgText>
            </G>
          );
        })}
      </Svg>

      {selectedBar !== null && (
        <View
          style={[
            styles.tooltip,
            {
              left: Math.min(
                Math.max(10, PADDING.left + selectedBar * (barWidth + barSpacing) - 70),
                chartWidth - 160
              ),
            },
          ]}
        >
          <Text style={styles.tooltipDate}>📅 {data[selectedBar].fullDate}</Text>
          <Text style={styles.tooltipText}>🕓 Slept: {data[selectedBar].duration}</Text>
          <Text style={styles.tooltipText}>
            🌙 {data[selectedBar].sleepTime} – {data[selectedBar].wakeTime}
          </Text>
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
    borderRadius: 12,
    padding: 10,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
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
