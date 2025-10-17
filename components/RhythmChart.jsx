import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Defs, RadialGradient, Stop, G } from 'react-native-svg';
import { line, curveNatural } from 'd3-shape';
import { getCurrentMinute } from '@/lib/rhythm';
import { useState, useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing
} from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH;
const CHART_HEIGHT = 300;

export default function RhythmChart({ rhythmData }) {
  const { points, peak, valley } = rhythmData;
  const [isExpanded, setIsExpanded] = useState(false);

  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  useEffect(() => {
    scale1.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    scale2.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    scale3.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500 }),
        withTiming(0.4, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
    opacity: pulseOpacity.value * 0.3,
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
    opacity: pulseOpacity.value * 0.2,
  }));

  const animatedStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: scale3.value }],
    opacity: pulseOpacity.value * 0.15,
  }));

  const currentMinute = getCurrentMinute();
  const currentEnergy = points.find((p) => Math.abs(p.minute - currentMinute) < 15)?.energy || 50;

  const getEnergyColor = (energy) => {
    if (energy > 80) return {
      primary: '#6DD5FA',
      secondary: '#2193B0',
      glow: '#A3E4FF',
      text: '☀️'
    };
    if (energy > 60) return {
      primary: '#A8EDEA',
      secondary: '#FED6E3',
      glow: '#FFFFFF',
      text: '🌤️'
    };
    if (energy > 40) return {
      primary: '#FBD786',
      secondary: '#F7797D',
      glow: '#FFE4A3',
      text: '🌆'
    };
    if (energy > 20) return {
      primary: '#FEB47B',
      secondary: '#FF7E5F',
      glow: '#FFD9A3',
      text: '🌙'
    };
    return {
      primary: '#667EEA',
      secondary: '#764BA2',
      glow: '#A3B3FF',
      text: '🌃'
    };
  };

  const getEnergyStatus = (energy) => {
    if (energy > 80) return {
      title: "Your Energy is Soaring",
      subtitle: `Best time for focus between ${peak.time}`,
      emoji: '☀️'
    };
    if (energy > 60) return {
      title: "Energy is Rising",
      subtitle: `Peak coming at ${peak.time}`,
      emoji: '🌤️'
    };
    if (energy > 40) return {
      title: "Steady Energy Flow",
      subtitle: "Maintain your current rhythm",
      emoji: '🌆'
    };
    if (energy > 20) return {
      title: "Energy Winding Down",
      subtitle: `Low point at ${valley.time}`,
      emoji: '🌙'
    };
    return {
      title: "Time to Recharge",
      subtitle: "Rest and restore your energy",
      emoji: '🌃'
    };
  };

  const energyColor = getEnergyColor(currentEnergy);
  const energyStatus = getEnergyStatus(currentEnergy);
  const brightness = currentEnergy / 100;

  const xScale = (minute) => {
    const clampedMinute = Math.max(0, Math.min(1440, minute));
    return 40 + ((clampedMinute / 1440) * (CHART_WIDTH - 80));
  };

  const yScale = (energy) => {
    const clampedEnergy = Math.max(0, Math.min(100, energy));
    return 200 - ((clampedEnergy / 100) * 120);
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

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setIsExpanded(!isExpanded)}
        style={styles.touchable}
      >
        <View style={styles.orbContainer}>
          <Animated.View
            style={[
              styles.waveRing,
              {
                backgroundColor: energyColor.glow,
                width: 200,
                height: 200,
                borderRadius: 100,
              },
              animatedStyle3
            ]}
          />
          <Animated.View
            style={[
              styles.waveRing,
              {
                backgroundColor: energyColor.primary,
                width: 160,
                height: 160,
                borderRadius: 80,
              },
              animatedStyle2
            ]}
          />
          <Animated.View
            style={[
              styles.waveRing,
              {
                backgroundColor: energyColor.secondary,
                width: 120,
                height: 120,
                borderRadius: 60,
              },
              animatedStyle1
            ]}
          />

          <View style={[
            styles.energyOrb,
            {
              backgroundColor: energyColor.primary,
              shadowColor: energyColor.glow,
              opacity: 0.5 + (brightness * 0.5),
            }
          ]}>
            <View style={[
              styles.orbCore,
              { backgroundColor: energyColor.secondary }
            ]}>
              <Text style={styles.energyValue}>{Math.round(currentEnergy)}</Text>
              <Text style={styles.energyEmoji}>{energyStatus.emoji}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>{energyStatus.title}</Text>
          <Text style={styles.statusSubtitle}>{energyStatus.subtitle}</Text>
          <Text style={styles.expandHint}>
            {isExpanded ? '↑ Tap to collapse' : '↓ Tap to see rhythm details'}
          </Text>
        </View>

        {isExpanded && (
          <View style={styles.chartContainer}>
            <Svg width={CHART_WIDTH} height={250} viewBox={`0 0 ${CHART_WIDTH} 250`}>
              <Defs>
                <RadialGradient id="lineGlow" cx="50%" cy="50%">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                  <Stop offset="100%" stopColor={energyColor.primary} stopOpacity="0.2" />
                </RadialGradient>
              </Defs>

              <Path
                d={pathData}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
              />

              <Path
                d={pathData}
                stroke={energyColor.primary}
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                opacity={0.8}
              />

              <Path
                d={pathData}
                stroke="#FFFFFF"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                opacity={0.9}
              />

              <G>
                <Circle
                  cx={CHART_WIDTH / 2}
                  cy={yScale(currentEnergy)}
                  r="8"
                  fill={energyColor.secondary}
                />
                <Circle
                  cx={CHART_WIDTH / 2}
                  cy={yScale(currentEnergy)}
                  r="4"
                  fill="#FFFFFF"
                />
              </G>
            </Svg>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    alignItems: 'center',
  },
  touchable: {
    width: '100%',
    alignItems: 'center',
  },
  orbContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  waveRing: {
    position: 'absolute',
  },
  energyOrb: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 10,
  },
  orbCore: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  energyValue: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  energyEmoji: {
    fontSize: 24,
    marginTop: 4,
  },
  statusContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statusSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 20,
  },
  expandHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 12,
    fontWeight: '500',
  },
  chartContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    paddingVertical: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});
