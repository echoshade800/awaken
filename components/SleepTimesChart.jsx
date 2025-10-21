import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { useState } from 'react';

const CHART_HEIGHT = 240;
const PADDING = { top: 32, right: 50, bottom: 64, left: 8 };
const BAR_GAP = 8;
const TOTAL_COLUMNS = 8;

export default function SleepTimesChart({ data, chartWidth }) {
  const [selectedBar, setSelectedBar] = useState(null);

  if (!data || data.length === 0) return null;

  const chartArea = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  // Calculate bar width to fill chart evenly
  const availableWidth = chartWidth - PADDING.left - PADDING.right;
  const totalGapWidth = (TOTAL_COLUMNS - 1) * BAR_GAP;
  const barWidth = Math.floor((availableWidth - totalGapWidth) / TOTAL_COLUMNS);

  // Time scale calculations
  const timeToY = (timeStr) => {
    if (!timeStr) return null;

    const [hours, minutes] = timeStr.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;

    // Normalize times after midnight to next day
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
  ];

  // Parse duration string "6h 42m" into separate components
  const parseDuration = (item) => {
    if (!item.sleepTime || !item.wakeTime) {
      return { hours: '--', minutes: '--' };
    }

    if (item.duration) {
      const hourMatch = item.duration.match(/(\d+)h/);
      const minMatch = item.duration.match(/(\d+)m/);
      return {
        hours: hourMatch ? hourMatch[1] : '0',
        minutes: minMatch ? minMatch[1] : '0',
      };
    }

    return { hours: '--', minutes: '--' };
  };

  // Calculate column X position
  const getColumnX = (index) => {
    return PADDING.left + index * (barWidth + BAR_GAP);
  };

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#9D7AFF" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#5E4FC2" stopOpacity="0.4" />
          </LinearGradient>
          <LinearGradient id="ghostGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#9D7AFF" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#5E4FC2" stopOpacity="0.15" />
          </LinearGradient>
        </Defs>

        {/* Horizontal gridlines and time labels */}
        {yTimeLabels.map((label) => {
          const y = timeToY(label.value);
          return (
            <G key={label.value}>
              <Line
                x1={PADDING.left}
                y1={y}
                x2={chartWidth - PADDING.right}
                y2={y}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="1"
              />
              <SvgText
                x={chartWidth - PADDING.right + 8}
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
          const x = getColumnX(index);
          const centerX = x + barWidth / 2;

          const { hours, minutes } = parseDuration(item);
          const hasData = item.sleepTime && item.wakeTime;
          const isToday = item.dayLabel.toLowerCase() === 'today';

          let barElement = null;

          if (hasData) {
            const sleepY = timeToY(item.sleepTime);
            const wakeY = timeToY(item.wakeTime);
            const barHeight = Math.abs(wakeY - sleepY);
            const topY = Math.min(sleepY, wakeY);

            barElement = (
              <Rect
                x={x}
                y={topY}
                width={barWidth}
                height={barHeight}
                fill={isToday && item.partial ? "url(#ghostGradient)" : "url(#barGradient)"}
                rx={6}
                ry={6}
                onPress={() => setSelectedBar(selectedBar === index ? null : index)}
              />
            );
          } else if (!isToday) {
            // Dashed outline for missing data (not Today)
            const defaultTop = PADDING.top + chartArea * 0.3;
            const defaultHeight = chartArea * 0.4;

            barElement = (
              <Rect
                x={x}
                y={defaultTop}
                width={barWidth}
                height={defaultHeight}
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="1"
                strokeDasharray="4,4"
                rx={6}
                ry={6}
              />
            );
          }

          return (
            <G key={`${item.date}-${index}`}>
              {barElement}

              {/* Duration label - hours */}
              <SvgText
                x={x}
                y={CHART_HEIGHT - PADDING.bottom + 4}
                fontSize="11"
                fontWeight="600"
                fill="rgba(255, 255, 255, 0.85)"
                textAnchor="start"
              >
                {hours}h
              </SvgText>

              {/* Duration label - minutes */}
              <SvgText
                x={x}
                y={CHART_HEIGHT - PADDING.bottom + 14}
                fontSize="11"
                fontWeight="600"
                fill="rgba(255, 255, 255, 0.85)"
                textAnchor="start"
              >
                {minutes}m
              </SvgText>

              {/* Day label */}
              <SvgText
                x={x}
                y={CHART_HEIGHT - PADDING.bottom + 32}
                fontSize="11"
                fontWeight="400"
                fill="rgba(255, 255, 255, 0.7)"
                textAnchor="start"
              >
                {item.dayLabel.toUpperCase()}
              </SvgText>
            </G>
          );
        })}
      </Svg>

      {/* Interactive tooltip */}
      {selectedBar !== null && data[selectedBar]?.sleepTime && (
        <View
          style={[
            styles.tooltip,
            {
              left: Math.min(
                Math.max(10, getColumnX(selectedBar) + barWidth / 2 - 70),
                chartWidth - 150
              ),
            },
          ]}
        >
          <Text style={styles.tooltipDate}>{data[selectedBar].fullDate || data[selectedBar].dayLabel}</Text>
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
