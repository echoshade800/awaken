import { View, Text, StyleSheet, memo, useWindowDimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, RadialGradient, Stop, Polygon, LinearGradient } from 'react-native-svg';
import { line, curveNatural } from 'd3-shape';
import { getCurrentMinute } from '@/lib/rhythm';

const CHART_HEIGHT = 260;
const PADDING = { top: 40, right: 15, bottom: 20, left: 15 };

function RhythmChart({ rhythmData }) {
  const { width: screenWidth } = useWindowDimensions();
  const CHART_WIDTH = screenWidth - 32;

  if (!rhythmData || !rhythmData.curve || rhythmData.curve.length === 0) {
    return null;
  }

  // Convert curve data to points format expected by chart
  const points = rhythmData.curve
    .filter((point) => {
      // Filter out invalid data points
      return (
        point &&
        typeof point.hour === 'number' &&
        typeof point.energy === 'number' &&
        !isNaN(point.hour) &&
        !isNaN(point.energy) &&
        isFinite(point.hour) &&
        isFinite(point.energy)
      );
    })
    .map((point) => ({
      minute: point.hour * 60,
      energy: point.energy,
    }));

  // If no valid points after filtering, return null
  if (points.length === 0) {
    return null;
  }

  const peak = rhythmData.peak ? {
    time: rhythmData.peak.time,
    minute: parseInt(rhythmData.peak.time.split(':')[0]) * 60 + parseInt(rhythmData.peak.time.split(':')[1] || '0'),
    energy: rhythmData.peak.energy,
  } : null;

  const valley = rhythmData.valley ? {
    time: rhythmData.valley.time,
    minute: parseInt(rhythmData.valley.time.split(':')[0]) * 60 + parseInt(rhythmData.valley.time.split(':')[1] || '0'),
    energy: rhythmData.valley.energy,
  } : null;

  const melatoninWindow = null;

  const xScale = (minute) => {
    const clampedMinute = Math.max(0, Math.min(1440, minute));
    return PADDING.left + ((clampedMinute / 1440) * (CHART_WIDTH - PADDING.left - PADDING.right));
  };

  const yScale = (energy) => {
    const clampedEnergy = Math.max(0, Math.min(100, energy));
    const chartArea = CHART_HEIGHT - PADDING.top - PADDING.bottom;

    return CHART_HEIGHT - PADDING.bottom - ((clampedEnergy / 100) * chartArea);
  };

  const clampedPoints = points.map((p) => ({
    minute: Math.max(0, Math.min(1440, p.minute)),
    energy: Math.max(0, Math.min(100, p.energy)),
  }));

  const lineGenerator = line()
    .x((d) => xScale(d.minute))
    .y((d) => yScale(d.energy))
    .curve(curveNatural)
    .defined((d) => {
      // Ensure the point is valid before including it in the path
      return (
        d &&
        typeof d.minute === 'number' &&
        typeof d.energy === 'number' &&
        !isNaN(d.minute) &&
        !isNaN(d.energy) &&
        isFinite(d.minute) &&
        isFinite(d.energy)
      );
    });

  const pathData = lineGenerator(clampedPoints);

  // If pathData is invalid or null, return null
  if (!pathData || pathData.includes('NaN') || pathData.includes('undefined')) {
    console.warn('Invalid path data generated, skipping chart render');
    return null;
  }

  const currentMinute = getCurrentMinute();
  
  // 获取当前时间点的精确能量值（保持真实值0-100）
  const getCurrentEnergyValue = () => {
    const exactPoint = points.find((p) => Math.abs(p.minute - currentMinute) < 5);
    
    if (exactPoint) {
      return Math.round(exactPoint.energy);
    }
    
    // 线性插值获取更精确的值
    const before = points.filter(p => p.minute <= currentMinute).pop();
    const after = points.find(p => p.minute > currentMinute);
    
    if (before && after) {
      const ratio = (currentMinute - before.minute) / (after.minute - before.minute);
      const interpolatedEnergy = before.energy + ratio * (after.energy - before.energy);
      return Math.round(Math.max(0, Math.min(100, interpolatedEnergy)));
    }
    
    return before?.energy ? Math.round(before.energy) : 50;
  };

  const currentEnergy = getCurrentEnergyValue();


  const getEnergyColor = (energy) => {
    if (energy > 80) return { main: '#A3E4FF', glow: '#6DD5FA' };
    if (energy > 60) return { main: '#FFFFFF', glow: '#E0F7FF' };
    if (energy > 40) return { main: '#FFE4FF', glow: '#FFD6FF' };
    if (energy > 20) return { main: '#FFD9A3', glow: '#FFBE76' };
    return { main: '#FFA3C7', glow: '#FF758C' };
  };

  const energyColor = getEnergyColor(currentEnergy);

  const timeLabels = [
    { time: '0:00', minute: 0 },
    { time: '6:00', minute: 360 },
    { time: '12:00', minute: 720 },
    { time: '18:00', minute: 1080 },
    { time: '23:59', minute: 1439 },
  ];

  const currentX = xScale(currentMinute);
  const currentY = yScale(currentEnergy);

  return (
    <View style={styles.containerWrapper}>
      <View style={[styles.container, { width: CHART_WIDTH }]}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={styles.chart} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
        <Defs>
          <LinearGradient id="auroraGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#A3E4FF" stopOpacity="0.4" />
            <Stop offset="15%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <Stop offset="40%" stopColor="#FFD6FF" stopOpacity="0.7" />
            <Stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <Stop offset="85%" stopColor="#A3E4FF" stopOpacity="0.5" />
            <Stop offset="100%" stopColor="#FFE4FF" stopOpacity="0.4" />
          </LinearGradient>

          <RadialGradient id="pointGlow" cx="50%" cy="50%">
            <Stop offset="0%" stopColor={energyColor.main} stopOpacity="1" />
            <Stop offset="50%" stopColor={energyColor.glow} stopOpacity="0.6" />
            <Stop offset="100%" stopColor={energyColor.glow} stopOpacity="0" />
          </RadialGradient>

          <RadialGradient id="auraGlow" cx="50%" cy="50%">
            <Stop offset="0%" stopColor={energyColor.glow} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={energyColor.glow} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Circle
          cx={currentX}
          cy={currentY}
          r="120"
          fill="url(#auraGlow)"
        />


        <Path
          d={pathData}
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <Path
          d={pathData}
          stroke="url(#auroraGradient)"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <Path
          d={pathData}
          stroke="#FFFFFF"
          strokeWidth="2"
          fill="none"
          opacity="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <Circle
          cx={currentX}
          cy={currentY}
          r="30"
          fill="url(#pointGlow)"
        />

        <Circle
          cx={currentX}
          cy={currentY}
          r="20"
          fill="none"
          stroke={energyColor.main}
          strokeWidth="2"
          opacity="0.4"
        />

        <Circle
          cx={currentX}
          cy={currentY}
          r="12"
          fill="none"
          stroke={energyColor.main}
          strokeWidth="2.5"
          opacity="0.7"
        />

        <Circle
          cx={currentX}
          cy={currentY}
          r="7"
          fill={energyColor.main}
          opacity="1"
        />

        <Circle
          cx={currentX}
          cy={currentY}
          r="3"
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


      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  containerWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  container: {
    position: 'relative',
  },
  chart: {
    marginVertical: 4,
  },
});

export default memo(RhythmChart, (prevProps, nextProps) => {
  return (
    prevProps.rhythmData?.energyScore === nextProps.rhythmData?.energyScore &&
    prevProps.rhythmData?.curve?.length === nextProps.rhythmData?.curve?.length
  );
});
