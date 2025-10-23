import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { line, curveMonotoneX } from 'd3-shape';
import { useState, Fragment } from 'react';

const CHART_HEIGHT = 220;
const PADDING = { top: 40, right: 20, bottom: 30, left: 30 };

export default function SleepDebtChart({ data, sleepNeed, chartWidth }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  console.log('[SleepDebtChart] Render with data:', {
    hasData: !!data,
    dataLength: data?.length,
    sleepNeed,
    chartWidth,
  });

  if (!data || data.length === 0) {
    console.log('[SleepDebtChart] No data, showing placeholder');
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Loading sleep debt...</Text>
        <Text style={styles.emptySubtext}>Track your sleep debt over time</Text>
      </View>
    );
  }

  // Filter out invalid data points
  const validData = data.filter((d) => {
    return (
      d &&
      typeof d.debt === 'number' &&
      !isNaN(d.debt) &&
      isFinite(d.debt)
    );
  });

  if (validData.length === 0) {
    console.log('[SleepDebtChart] No valid data after filtering');
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No valid sleep debt data</Text>
        <Text style={styles.emptySubtext}>Check your sleep records</Text>
      </View>
    );
  }

  const chartArea = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const debtValues = validData.map(d => d.debt).filter(v => isFinite(v));
  if (debtValues.length === 0) {
    console.log('[SleepDebtChart] No valid debt values');
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No valid debt values</Text>
        <Text style={styles.emptySubtext}>Unable to calculate sleep debt</Text>
      </View>
    );
  }

  const maxDebt = Math.max(...debtValues.map(d => Math.abs(d)), 4);
  const minDebt = Math.min(...debtValues, -4);

  const xScale = (index) => {
    if (validData.length <= 1) {
      return PADDING.left + (chartWidth - PADDING.left - PADDING.right) / 2;
    }
    return PADDING.left + (index / (validData.length - 1)) * (chartWidth - PADDING.left - PADDING.right);
  };

  const yScale = (debt) => {
    const range = maxDebt - minDebt;
    if (range === 0) {
      return PADDING.top + chartArea / 2;
    }
    const ratio = (debt - minDebt) / range;
    return PADDING.top + chartArea * (1 - ratio);
  };

  const zeroY = yScale(0);

  const lineGenerator = line()
    .x((d, i) => xScale(i))
    .y((d) => yScale(d.debt))
    .curve(curveMonotoneX)
    .defined((d) => {
      return (
        d &&
        typeof d.debt === 'number' &&
        !isNaN(d.debt) &&
        isFinite(d.debt)
      );
    });

  let pathData;
  try {
    pathData = lineGenerator(validData);
  } catch (error) {
    console.error('Error generating line path:', error);
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Error generating chart</Text>
      </View>
    );
  }

  // If pathData is invalid, return error message
  if (!pathData || pathData.includes('NaN') || pathData.includes('undefined')) {
    console.warn('[SleepDebtChart] Invalid path data:', pathData?.substring(0, 100));
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Error generating chart</Text>
        <Text style={styles.emptySubtext}>Please refresh or check data</Text>
      </View>
    );
  }

  const yAxisLabels = [];
  for (let i = Math.ceil(minDebt); i <= Math.floor(maxDebt); i += 2) {
    yAxisLabels.push(i);
  }

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#9D7AFF" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#9D7AFF" stopOpacity="0.6" />
          </LinearGradient>
        </Defs>

        {yAxisLabels.map((label) => (
          <G key={label}>
            <Line
              x1={PADDING.left}
              y1={yScale(label)}
              x2={chartWidth - PADDING.right}
              y2={yScale(label)}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="1"
            />
            <SvgText
              x={PADDING.left - 8}
              y={yScale(label)}
              fontSize="10"
              fill="#B0B0B0"
              textAnchor="end"
              alignmentBaseline="middle"
            >
              {label > 0 ? `+${label}h` : `${label}h`}
            </SvgText>
          </G>
        ))}

        <Line
          x1={PADDING.left}
          y1={zeroY}
          x2={chartWidth - PADDING.right}
          y2={zeroY}
          stroke="#48E0C2"
          strokeWidth="2"
          strokeDasharray="4,4"
          opacity="0.6"
        />

        <Path
          d={pathData}
          stroke="url(#lineGradient)"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {validData.map((point, index) => (
          <Circle
            key={index}
            cx={xScale(index)}
            cy={yScale(point.debt)}
            r={hoveredPoint === index ? 6 : 4}
            fill="#FFFFFF"
            opacity="0.9"
            onPress={() => setHoveredPoint(hoveredPoint === index ? null : index)}
          />
        ))}

        {validData.map((point, index) => {
          if (index % Math.ceil(validData.length / 5) === 0 || index === validData.length - 1) {
            return (
              <SvgText
                key={index}
                x={xScale(index)}
                y={CHART_HEIGHT - PADDING.bottom + 20}
                fontSize="10"
                fill="rgba(255, 255, 255, 0.7)"
                textAnchor="middle"
              >
                {point.dateLabel}
              </SvgText>
            );
          }
          return null;
        })}
      </Svg>

      {hoveredPoint !== null && validData[hoveredPoint] && (
        <View style={[styles.tooltip, { left: xScale(hoveredPoint) - 70 }]}>
          <Text style={styles.tooltipDate}>📅 {validData[hoveredPoint].fullDate}</Text>
          <Text style={styles.tooltipText}>🕓 Slept: {validData[hoveredPoint].sleptDisplay}</Text>
          <Text style={styles.tooltipText}>😴 Ideal: {sleepNeed}h</Text>
          <Text style={styles.tooltipText}>💤 Debt: {validData[hoveredPoint].debt > 0 ? '+' : ''}{validData[hoveredPoint].debt.toFixed(1)}h</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    minHeight: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    marginTop: 4,
  },
  tooltip: {
    position: 'absolute',
    top: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(12px)',
    borderRadius: 12,
    padding: 10,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
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
    lineHeight: 14,
  },
});
