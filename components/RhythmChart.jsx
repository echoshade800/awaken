import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, RadialGradient, Stop, Polygon, LinearGradient } from 'react-native-svg';
import { line, curveNatural } from 'd3-shape';
import { getCurrentMinute } from '@/lib/rhythm';
import { BlurView } from 'expo-blur';
import { useEffect, useRef } from 'react';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 32;
const CHART_HEIGHT = 180;
const PADDING = { top: 60, right: 15, bottom: 30, left: 15 };

export default function RhythmChart({ rhythmData }) {
  const { points, peak, valley, melatoninWindow } = rhythmData;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -3,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 3,
          duration: 2000,
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

  const pathData = lineGenerator(clampedPoints);

  const currentMinute = getCurrentMinute();
  const currentEnergy = points.find((p) => Math.abs(p.minute - currentMinute) < 15)?.energy || 50;

  const getEnergyColor = (energy) => {
    if (energy > 80) return { main: '#A3E4FF', glow: '#6DD5FA' };
    if (energy > 60) return { main: '#FFFFFF', glow: '#E0F7FF' };
    if (energy > 40) return { main: '#FFE4FF', glow: '#FFD6FF' };
    if (energy > 20) return { main: '#FFD9A3', glow: '#FFBE76' };
    return { main: '#FFA3C7', glow: '#FF758C' };
  };

  const energyColor = getEnergyColor(currentEnergy);

  const getEnergyStatus = (energy) => {
    if (energy > 80) return { title: "Peak Energy", subtitle: "You're at your energy peak!" };
    if (energy > 60) return { title: "Rising", subtitle: "Your energy is rising!" };
    if (energy > 40) return { title: "Moderate", subtitle: "Keep pace, remember to rest" };
    if (energy > 20) return { title: "Declining", subtitle: "Energy declining, slow down" };
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
  const energyStatus = getEnergyStatus(currentEnergy);
  const bubbleWidth = 200;
  const bubbleHeight = 60;
  const bubbleX = currentX - bubbleWidth / 2;
  const bubbleY = currentY - bubbleHeight - 30;

  return (
    <View style={styles.containerWrapper}>
      <View style={styles.container}>
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
          r="80"
          fill="url(#auraGlow)"
        />


        <Path
          d={pathData}
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: 'blur(8px)' }}
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
        <BlurView intensity={20} tint="light" style={styles.blurContainer}>
          <Text style={styles.statusTitle}>{energyStatus.title}</Text>
          <Text style={styles.statusSubtitle}>{energyStatus.subtitle}</Text>
        </BlurView>
      </Animated.View>
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
    width: CHART_WIDTH,
  },
  statusBubble: {
    position: 'absolute',
    borderRadius: 20,
    shadowColor: '#87CEEB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
    color: '#6B7280',
    fontWeight: '400',
  },
  chart: {
    marginVertical: 4,
  },
});
