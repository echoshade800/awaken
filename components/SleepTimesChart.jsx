import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { useState } from 'react';

const CHART_HEIGHT = 240;
const PADDING = { top: 16, right: 12, bottom: 24, left: 0 };
const BAR_WIDTH = 18;
const BAR_SPACING = 10;

export default function SleepTimesChart({ data, chartWidth }) {
  const [selectedBar, setSelectedBar] = useState(null);

  if (!data || data.length === 0) return null;

  const chartArea = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  // Calculate time scale right edge position (leaving space for time labels)
  const timeScaleX = chartWidth - PADDING.right - 40;

  // Calculate starting X position to center all bars
  const totalBarsWidth = data.length * BAR_WIDTH + (data.length - 1) * BAR_SPACING;
  const startX = (timeScaleX - totalBarsWidth) / 2;

  const timeToY = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;
    if (totalMinutes < 12 * 60) totalMinutes += 24 * 60;

    const startMinutes = 22 * 60; // 10pm
    const endMinutes = 36 * 60;   // 12pm next day
    const ratio = (totalMinutes - startMinutes) / (endMinutes - startMinutes);

    return PADDING.top + chartArea * (1 - ratio);
  };

  const yTimeLabels = [
    { time: '10pm', value: '22:00' },
    { time: '12am', value: '00:00' },
    { time: '2am', value: '02:00' },
    { time: '4am', value: '04:00' },
    { time: '6am', value: '06:00' },
    { time: '8am', value: '08:00' },
    { time: '10am', value: '10:00' },
    { time: '12pm', value: '12:00' },
  ];

  // Parse duration string "6h 42m" into separate components
  const parseDuration = (durationStr) => {
    const hourMatch = durationStr.match(/(\d+)h/);
    const minMatch = durationStr.match(/(\d+)m/);
    return {
      hours: hourMatch ? hourMatch[1] : '0',
      minutes: minMatch ? minMatch[1] : '0',
    };
  };

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#9D7AFF" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#5E4FC2" stopOpacity="0.4" />
          </LinearGradient>
        </Defs>

        {/* Horizontal gridlines and time labels */}
        {yTimeLabels.map((label) => {
          const y = timeToY(label.value);
          return (
            <G key={label.value}>
              <Line
                x1={0}
                y1={y}
                x2={timeScaleX}
                y2={y}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="1"
              />
              <SvgText
                x={timeScaleX + 12}
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

        {/* Sleep bars and labels */}
        {data.map((item, index) => {
          const x = startX + index * (BAR_WIDTH + BAR_SPACING);
          const sleepY = timeToY(item.sleepTime);
          const wakeY = timeToY(item.wakeTime);
          const barHeight = Math.abs(wakeY - sleepY);
          const topY = Math.min(sleepY, wakeY);

          const { hours, minutes } = parseDuration(item.duration);

          return (
            <G key={item.date}>
              {/* Sleep bar */}
              <Rect
                x={x}
                y={topY}
                width={BAR_WIDTH}
                height={barHeight}
                fill="url(#barGradient)"
                rx={6}
                ry={6}
                onPress={() => setSelectedBar(selectedBar === index ? null : index)}
              />

              {/* Duration label - hours */}
              <SvgText
                x={x + BAR_WIDTH / 2}
                y={topY - 18}
                fontSize="12"
                fontWeight="600"
                fill="rgba(255, 255, 255, 0.85)"
                textAnchor="middle"
              >
                {hours}h
              </SvgText>

              {/* Duration label - minutes */}
              <SvgText
                x={x + BAR_WIDTH / 2}
                y={topY - 6}
                fontSize="12"
                fontWeight="600"
                fill="rgba(255, 255, 255, 0.85)"
                textAnchor="middle"
              >
                {minutes}m
              </SvgText>

              {/* Day label */}
              <SvgText
                x={x + BAR_WIDTH / 2}
                y={CHART_HEIGHT - PADDING.bottom + 16}
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

      {/* Interactive tooltip */}
      {selectedBar !== null && (
        <View
          style={[
            styles.tooltip,
            {
              left: Math.min(
                Math.max(10, startX + selectedBar * (BAR_WIDTH + BAR_SPACING) - 60),
                chartWidth - 150
              ),
            },
          ]}
        >
          <Text style={styles.tooltipDate}>{data[selectedBar].fullDate}</Text>
          <Text style={styles.tooltipText}>Sleep: {data[selectedBar].duration}</Text>
          <Text style={styles.tooltipText}>
            {data[selectedBar].sleepTime} – {data[selectedBar].wakeTime}
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    padding: 10,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
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
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
});
