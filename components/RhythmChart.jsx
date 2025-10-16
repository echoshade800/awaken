import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { line, curveNatural } from 'd3-shape';
import { getCurrentMinute } from '@/lib/rhythm';

const CHART_WIDTH = Dimensions.get('window').width - 40;
const CHART_HEIGHT = 140;
const PADDING = { top: 20, right: 20, bottom: 30, left: 40 };

export default function RhythmChart({ rhythmData }) {
  const { points, peak, valley, melatoninWindow } = rhythmData;

  const xScale = (minute) => {
    const clampedMinute = Math.max(0, Math.min(1440, minute));
    return PADDING.left + ((clampedMinute / 1440) * (CHART_WIDTH - PADDING.left - PADDING.right));
  };

  const yScale = (energy) => {
    const clampedEnergy = Math.max(0, Math.min(100, energy));
    return CHART_HEIGHT - PADDING.bottom - ((clampedEnergy / 100) * (CHART_HEIGHT - PADDING.top - PADDING.bottom));
  };

  const clampedPoints = points.map((p) => ({
    minute: Math.max(0, Math.min(1440, p.minute)),
    energy: Math.max(0, Math.min(100, p.energy)),
  }));

  const lineGenerator = line()
    .x((d) => xScale(d.minute))
    .y((d) => yScale(d.energy))
    .curve(curveNatural);

  const pathData = lineGenerator(clampedPoints);

  const currentMinute = getCurrentMinute();
  const currentEnergy = points.find((p) => Math.abs(p.minute - currentMinute) < 15)?.energy || 50;

  const timeLabels = [
    { time: '0:00', minute: 0 },
    { time: '6:00', minute: 360 },
    { time: '12:00', minute: 720 },
    { time: '18:00', minute: 1080 },
    { time: '23:59', minute: 1439 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.statusBadge}>
        <Text style={styles.statusIcon}>☀️</Text>
        <Text style={styles.statusText}>You're in your focus peak</Text>
      </View>

      <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={styles.chart} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
        <Line
          x1={PADDING.left}
          y1={yScale(50)}
          x2={CHART_WIDTH - PADDING.right}
          y2={yScale(50)}
          stroke="#E5E5EA"
          strokeWidth="1"
          strokeDasharray="4,4"
        />

        <Path
          d={pathData}
          stroke="#007AFF"
          strokeWidth="3"
          fill="none"
          clipPath={`inset(0 ${PADDING.right}px 0 0)`}
        />

        <Circle
          cx={xScale(currentMinute)}
          cy={yScale(currentEnergy)}
          r="6"
          fill="#007AFF"
          stroke="#FFFFFF"
          strokeWidth="3"
        />

        {timeLabels.map((label) => (
          <SvgText
            key={label.time}
            x={xScale(label.minute)}
            y={CHART_HEIGHT - 10}
            fontSize="11"
            fill="#8E8E93"
            textAnchor="middle"
          >
            {label.time}
          </SvgText>
        ))}

        <SvgText
          x={PADDING.left - 10}
          y={yScale(100) + 5}
          fontSize="11"
          fill="#8E8E93"
          textAnchor="end"
        >
          100
        </SvgText>
        <SvgText
          x={PADDING.left - 10}
          y={yScale(50) + 5}
          fontSize="11"
          fill="#8E8E93"
          textAnchor="end"
        >
          50
        </SvgText>
        <SvgText
          x={PADDING.left - 10}
          y={yScale(0) + 5}
          fontSize="11"
          fill="#8E8E93"
          textAnchor="end"
        >
          0
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '400',
  },
  chart: {
    marginVertical: 4,
  },
});
