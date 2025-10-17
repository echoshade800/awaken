import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import Svg, { Path, Circle, Text as SvgText, Defs, RadialGradient, Stop, LinearGradient } from 'react-native-svg';
import { line, area, curveNatural } from 'd3-shape';
import { getCurrentMinute } from '@/lib/rhythm';
import { BlurView } from 'expo-blur';
import { useEffect, useRef } from 'react';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH;
const CHART_HEIGHT = 180;
const PADDING = { top: 50, right: 15, bottom: 30, left: 15 };

export default function RhythmChart({ rhythmData }) {
  const { points } = rhythmData;
  const breatheAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 2,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: -2,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -2,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 2,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

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

  const areaGenerator = area()
    .x((d) => xScale(d.minute))
    .y0(CHART_HEIGHT - PADDING.bottom)
    .y1((d) => yScale(d.energy))
    .curve(curveNatural);

  const wavePathData = lineGenerator(clampedPoints);
  const areaPathData = areaGenerator(clampedPoints);

  const currentMinute = getCurrentMinute();
  const currentEnergy = points.find((p) => Math.abs(p.minute - currentMinute) < 15)?.energy || 50;

  const getEnergyColor = (energy) => {
    if (energy > 80) return { main: '#6DD5FA', glow: '#A3E4FF', bg: '#2E5D8A' };
    if (energy > 60) return { main: '#8EC5FC', glow: '#C8E6FF', bg: '#3A5F8A' };
    if (energy > 40) return { main: '#7BA8D1', glow: '#B5D4ED', bg: '#3D5A7A' };
    if (energy > 20) return { main: '#6B8FB5', glow: '#9FC4E3', bg: '#2E465A' };
    return { main: '#5A7A99', glow: '#8AAAC9', bg: '#2E3A4A' };
  };

  const energyColor = getEnergyColor(currentEnergy);

  const getEnergyStatus = (energy) => {
    if (energy > 80) return { title: "High Tide", subtitle: "能量巅峰，乘风破浪" };
    if (energy > 60) return { title: "Rising Wave", subtitle: "能量涌动，势头正好" };
    if (energy > 40) return { title: "Steady Flow", subtitle: "保持节奏，顺流而行" };
    if (energy > 20) return { title: "Gentle Ripple", subtitle: "能量平稳，随波而动" };
    return { title: "Low Tide", subtitle: "能量低谷，静心休息" };
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
  const energyStatus = getEnergyStatus(currentEnergy);
  const bubbleWidth = 200;
  const bubbleHeight = 60;
  const bubbleX = currentX - bubbleWidth / 2;
  const bubbleY = currentY - bubbleHeight - 30;

  return (
    <View style={styles.container}>
      <BlurView intensity={8} tint="dark" style={styles.backgroundBlur}>
        <Animated.View style={{ transform: [{ translateY: breatheAnim }] }}>
          <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={styles.chart} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
            <Defs>
              <LinearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
                <Stop offset="40%" stopColor="#9FC4E3" stopOpacity="0.25" />
                <Stop offset="100%" stopColor="#2E335A" stopOpacity="0.1" />
              </LinearGradient>

              <LinearGradient id="waveStroke" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <Stop offset="100%" stopColor="#A3D9FF" stopOpacity="0.6" />
              </LinearGradient>

              <RadialGradient id="currentPointGlow" cx="50%" cy="50%">
                <Stop offset="0%" stopColor={energyColor.main} stopOpacity="0.9" />
                <Stop offset="50%" stopColor={energyColor.glow} stopOpacity="0.5" />
                <Stop offset="100%" stopColor={energyColor.glow} stopOpacity="0" />
              </RadialGradient>
            </Defs>

            <Path
              d={areaPathData}
              fill="url(#waveGradient)"
            />

            <Path
              d={wavePathData}
              stroke="url(#waveStroke)"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <Path
              d={wavePathData}
              stroke="#FFFFFF"
              strokeWidth="1"
              fill="none"
              opacity="0.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <Circle
              cx={currentX}
              cy={currentY}
              r="40"
              fill="url(#currentPointGlow)"
            />

            <Circle
              cx={currentX}
              cy={currentY}
              r="14"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2"
              opacity="0.8"
            />

            <Circle
              cx={currentX}
              cy={currentY}
              r="8"
              fill="#FFFFFF"
              opacity="0.95"
            />

            <Circle
              cx={currentX}
              cy={currentY}
              r="3"
              fill={energyColor.main}
              opacity="1"
            />

            {timeLabels.map((label) => (
              <SvgText
                key={label.time}
                x={xScale(label.minute)}
                y={CHART_HEIGHT - 10}
                fontSize="11"
                fill="rgba(255, 255, 255, 0.5)"
                textAnchor="middle"
              >
                {label.time}
              </SvgText>
            ))}

          </Svg>
        </Animated.View>
      </BlurView>

      <Animated.View
        style={[
          styles.statusBubble,
          {
            left: Math.max(20, Math.min(CHART_WIDTH - 220, bubbleX)),
            top: Math.max(10, bubbleY),
            transform: [{ translateY: floatAnim }]
          }
        ]}
      >
        <BlurView intensity={25} tint="light" style={styles.blurContainer}>
          <Text style={styles.statusTitle}>{energyStatus.title}</Text>
          <Text style={styles.statusSubtitle}>{energyStatus.subtitle}</Text>
        </BlurView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    position: 'relative',
  },
  backgroundBlur: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  statusBubble: {
    position: 'absolute',
    borderRadius: 20,
    shadowColor: '#6DD5FA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
    minWidth: 200,
    overflow: 'hidden',
  },
  blurContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
  },
  statusTitle: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '600',
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 11,
    color: '#5A7A99',
    fontWeight: '500',
  },
  chart: {
    marginVertical: 4,
  },
});
