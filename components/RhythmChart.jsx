import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, RadialGradient, Stop, Polygon } from 'react-native-svg';
import { line, curveNatural } from 'd3-shape';
import { getCurrentMinute } from '@/lib/rhythm';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH;
const CHART_HEIGHT = 180;
const PADDING = { top: 60, right: 15, bottom: 30, left: 15 };

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

  const getEnergyStatus = (energy) => {
    if (energy > 80) return { title: "Peak Energy", subtitle: "You're at your energy peak!" };
    if (energy > 60) return { title: "Rising", subtitle: "Your energy is rising!" };
    if (energy > 40) return { title: "Moderate", subtitle: "保持节奏，记得适时休息哦" };
    if (energy > 20) return { title: "Declining", subtitle: "能量在下降，建议放慢节奏" };
    return { title: "Low", subtitle: "Time to rest and recharge" };
  };

  const timeLabels = [
    { time: '0:00', minute: 0 },
    { time: '6:00', minute: 360 },
    { time: '12:00', minute: 720 },
    { time: '18:00', minute: 1080 },
    { time: '23:59', minute: 1439 },
  ];

  const currentX = xScale(currentMinute);
  const currentY = yScale(currentEnergy);
  const bubbleWidth = 200;
  const bubbleHeight = 40;
  const bubbleX = currentX - bubbleWidth / 2;
  const bubbleY = currentY - bubbleHeight - 30;

  return (
    <View style={styles.container}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={styles.chart} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
        <Defs>
          <RadialGradient id="glowGradient" cx="50%" cy="50%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.2" />
          </RadialGradient>
        </Defs>


        <Path
          d={pathData}
          stroke="#FFFFFF"
          strokeWidth="4"
          fill="none"
          opacity="0.9"
        />

        <Circle
          cx={currentX}
          cy={currentY}
          r="18"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
          opacity="0.6"
        />

        <Circle
          cx={currentX}
          cy={currentY}
          r="10"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          opacity="0.9"
        />

        <Circle
          cx={currentX}
          cy={currentY}
          r="6"
          fill="#FFFFFF"
          opacity="1"
        />

        <Polygon
          points={`${currentX},${currentY - 24} ${currentX - 8},${currentY - 32} ${currentX + 8},${currentY - 32}`}
          fill="rgba(255, 255, 255, 0.95)"
        />

        {timeLabels.map((label) => (
          <SvgText
            key={label.time}
            x={xScale(label.minute)}
            y={CHART_HEIGHT - 10}
            fontSize="11"
            fill="rgba(255, 255, 255, 0.6)"
            textAnchor="middle"
          >
            {label.time}
          </SvgText>
        ))}

      </Svg>

      <View
        style={[
          styles.statusBubble,
          {
            left: Math.max(20, Math.min(CHART_WIDTH - 220, bubbleX)),
            top: Math.max(10, bubbleY)
          }
        ]}
      >
        <Text style={styles.statusTitle}>{getEnergyStatus(currentEnergy).title}</Text>
        <Text style={styles.statusSubtitle}>{getEnergyStatus(currentEnergy).subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    position: 'relative',
  },
  statusBubble: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 200,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '600',
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '400',
  },
  chart: {
    marginVertical: 4,
  },
});
