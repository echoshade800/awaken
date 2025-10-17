import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, RadialGradient, Stop, Polygon, LinearGradient, G, Rect } from 'react-native-svg';
import { line, curveNatural } from 'd3-shape';
import { getCurrentMinute } from '@/lib/rhythm';
import { BlurView } from 'expo-blur';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH;
const CHART_HEIGHT = 180;
const PADDING = { top: 60, right: 15, bottom: 30, left: 15 };

export default function RhythmChart({ rhythmData }) {
  const { points, peak, valley, melatoninWindow } = rhythmData;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const raysAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

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

    Animated.loop(
      Animated.timing(raysAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
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
    if (energy > 80) return { main: '#FFD700', glow: '#FFA500' };
    if (energy > 60) return { main: '#FFE5B4', glow: '#FFB347' };
    if (energy > 40) return { main: '#FFFFFF', glow: '#E0E7FF' };
    if (energy > 20) return { main: '#E0E7FF', glow: '#B8C5FF' };
    return { main: '#9FB4FF', glow: '#7B90FF' };
  };

  const energyColor = getEnergyColor(currentEnergy);

  const getDawnGradientByTime = (minute) => {
    const progress = minute / 1440;
    if (progress < 0.25) return { from: '#1A1A3E', to: '#2A3A6E' };
    if (progress < 0.35) return { from: '#2A3A6E', to: '#4A5A8E' };
    if (progress < 0.45) return { from: '#4A5A8E', to: '#FF9966' };
    if (progress < 0.6) return { from: '#FFB88C', to: '#FFD7A3' };
    if (progress < 0.75) return { from: '#FFE5B4', to: '#FFF4D4' };
    return { from: '#FFF4D4', to: '#4A5A8E' };
  };

  const backgroundGradient = getDawnGradientByTime(currentMinute);

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
  const energyStatus = getEnergyStatus(currentEnergy);
  const bubbleWidth = 200;
  const bubbleHeight = 60;
  const bubbleX = currentX - bubbleWidth / 2;
  const bubbleY = currentY - bubbleHeight - 30;

  const valleyX = xScale(valley.time ? timeToMinutes(valley.time) : 0);
  const valleyY = yScale(valley.energy);
  const peakX = xScale(peak.time ? timeToMinutes(peak.time) : 720);
  const peakY = yScale(peak.energy);

  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const interpolatedGlowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9]
  });

  return (
    <View style={styles.container}>
      <ExpoLinearGradient
        colors={[backgroundGradient.from, backgroundGradient.to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={styles.chart} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
        <Defs>
          <LinearGradient id="dawnCurveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#9FB4FF" stopOpacity="0.6" />
            <Stop offset="20%" stopColor="#C8D5FF" stopOpacity="0.75" />
            <Stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <Stop offset="60%" stopColor="#FFE5B4" stopOpacity="0.95" />
            <Stop offset="80%" stopColor="#FFB347" stopOpacity="0.85" />
            <Stop offset="100%" stopColor="#FF8C42" stopOpacity="0.75" />
          </LinearGradient>

          <RadialGradient id="pointGlow" cx="50%" cy="50%">
            <Stop offset="0%" stopColor={energyColor.main} stopOpacity="1" />
            <Stop offset="50%" stopColor={energyColor.glow} stopOpacity="0.7" />
            <Stop offset="100%" stopColor={energyColor.glow} stopOpacity="0" />
          </RadialGradient>

          <RadialGradient id="auraGlow" cx="50%" cy="50%">
            <Stop offset="0%" stopColor={energyColor.glow} stopOpacity="0.5" />
            <Stop offset="100%" stopColor={energyColor.glow} stopOpacity="0" />
          </RadialGradient>

          <RadialGradient id="horizonGlow" cx="50%" cy="50%">
            <Stop offset="0%" stopColor="#FFA500" stopOpacity="0.8" />
            <Stop offset="50%" stopColor="#FFD700" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#FFE5B4" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Circle
          cx={currentX}
          cy={currentY}
          r="120"
          fill="url(#horizonGlow)"
        />

        <Circle
          cx={currentX}
          cy={currentY}
          r="80"
          fill="url(#auraGlow)"
        />

        <Path
          d={pathData}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: 'blur(10px)' }}
        />

        <Path
          d={pathData}
          stroke="url(#dawnCurveGradient)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <Path
          d={pathData}
          stroke="rgba(255, 255, 255, 0.9)"
          strokeWidth="2.5"
          fill="none"
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

        <G opacity="0.85">
          <SvgText x={valleyX} y={valleyY + 35} fontSize="20" textAnchor="middle">
            🌙
          </SvgText>
          <SvgText x={valleyX} y={valleyY + 50} fontSize="9" fill="rgba(255, 255, 255, 0.7)" textAnchor="middle">
            Low Energy
          </SvgText>
        </G>

        <G opacity="0.85">
          <SvgText x={peakX} y={peakY - 20} fontSize="24" textAnchor="middle">
            ☀️
          </SvgText>
          <SvgText x={peakX} y={peakY - 5} fontSize="9" fill="rgba(255, 255, 255, 0.9)" textAnchor="middle">
            Peak Energy
          </SvgText>
        </G>

        {timeLabels.map((label) => (
          <SvgText
            key={label.time}
            x={xScale(label.minute)}
            y={CHART_HEIGHT - 10}
            fontSize="11"
            fill="rgba(255, 255, 255, 0.75)"
            textAnchor="middle"
            fontWeight="500"
          >
            {label.time}
          </SvgText>
        ))}

      </Svg>

      <View
        style={[
          styles.lightRaysContainer,
          {
            left: Math.max(20, Math.min(CHART_WIDTH - 220, bubbleX)) + 100,
            top: Math.max(10, bubbleY) - 15,
          }
        ]}
      >
        <Animated.View
          style={[
            styles.lightRay,
            {
              opacity: raysAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.2, 0.6, 0.2]
              }),
              transform: [
                {
                  scaleY: raysAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.8, 1.2, 0.8]
                  })
                }
              ]
            }
          ]}
        />
        <Animated.View
          style={[
            styles.lightRay,
            styles.lightRay2,
            {
              opacity: raysAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.15, 0.5, 0.15]
              }),
            }
          ]}
        />
        <Animated.View
          style={[
            styles.lightRay,
            styles.lightRay3,
            {
              opacity: raysAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.1, 0.4, 0.1]
              }),
            }
          ]}
        />
      </View>

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
    overflow: 'hidden',
    borderRadius: 20,
  },
  statusBubble: {
    position: 'absolute',
    borderRadius: 20,
    shadowColor: '#FFB347',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
    minWidth: 200,
    overflow: 'hidden',
  },
  blurContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 20,
  },
  statusTitle: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '700',
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  chart: {
    marginVertical: 4,
  },
  lightRaysContainer: {
    position: 'absolute',
    width: 2,
    height: 30,
    alignItems: 'center',
  },
  lightRay: {
    position: 'absolute',
    width: 2,
    height: 30,
    backgroundColor: '#FFD700',
    borderRadius: 1,
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  lightRay2: {
    width: 1.5,
    height: 25,
    left: -6,
    transform: [{ rotate: '-15deg' }],
    backgroundColor: '#FFE5B4',
  },
  lightRay3: {
    width: 1.5,
    height: 25,
    left: 6,
    transform: [{ rotate: '15deg' }],
    backgroundColor: '#FFE5B4',
  },
});
