import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';

export default function SleepDebtPuzzle({ sleepDebt = -2 }) {
  const puzzleSize = 120;
  const pieceSize = puzzleSize / 2;

  const createPuzzlePath = (x, y, hasTab = true, tabDirection = 'right') => {
    const tabSize = pieceSize * 0.25;
    const cornerRadius = 3;

    let path = `M ${x + cornerRadius} ${y}`;

    path += ` L ${x + pieceSize - cornerRadius} ${y}`;
    path += ` Q ${x + pieceSize} ${y} ${x + pieceSize} ${y + cornerRadius}`;

    if (hasTab && tabDirection === 'right') {
      path += ` L ${x + pieceSize} ${y + pieceSize / 2 - tabSize}`;
      path += ` Q ${x + pieceSize + tabSize} ${y + pieceSize / 2} ${x + pieceSize} ${y + pieceSize / 2 + tabSize}`;
    }

    path += ` L ${x + pieceSize} ${y + pieceSize - cornerRadius}`;
    path += ` Q ${x + pieceSize} ${y + pieceSize} ${x + pieceSize - cornerRadius} ${y + pieceSize}`;

    if (hasTab && tabDirection === 'bottom') {
      path += ` L ${x + pieceSize / 2 + tabSize} ${y + pieceSize}`;
      path += ` Q ${x + pieceSize / 2} ${y + pieceSize + tabSize} ${x + pieceSize / 2 - tabSize} ${y + pieceSize}`;
    }

    path += ` L ${x + cornerRadius} ${y + pieceSize}`;
    path += ` Q ${x} ${y + pieceSize} ${x} ${y + pieceSize - cornerRadius}`;

    if (hasTab && tabDirection === 'left') {
      path += ` L ${x} ${y + pieceSize / 2 + tabSize}`;
      path += ` Q ${x - tabSize} ${y + pieceSize / 2} ${x} ${y + pieceSize / 2 - tabSize}`;
    }

    path += ` L ${x} ${y + cornerRadius}`;
    path += ` Q ${x} ${y} ${x + cornerRadius} ${y}`;

    path += ' Z';
    return path;
  };

  const topLeftPath = createPuzzlePath(0, 0, true, 'right');
  const topRightPath = createPuzzlePath(pieceSize, 0, true, 'bottom');
  const bottomLeftPath = createPuzzlePath(0, pieceSize, false);

  const getPuzzleColor = (debt) => {
    if (debt >= 0) return '#4A90E2';
    if (debt >= -1) return '#5BA3F5';
    return '#6BB6FF';
  };

  return (
    <View style={styles.container}>
      <View style={styles.puzzleContainer}>
        <Svg width={puzzleSize + 20} height={puzzleSize + 20} viewBox={`-10 -10 ${puzzleSize + 20} ${puzzleSize + 20}`}>
          <Defs>
            <LinearGradient id="puzzleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={getPuzzleColor(sleepDebt)} stopOpacity="0.95" />
              <Stop offset="100%" stopColor={getPuzzleColor(sleepDebt)} stopOpacity="0.85" />
            </LinearGradient>
          </Defs>

          <G>
            <Path
              d={topLeftPath}
              fill="url(#puzzleGradient)"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1.5"
            />

            <Path
              d={topRightPath}
              fill="url(#puzzleGradient)"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1.5"
            />

            <Path
              d={bottomLeftPath}
              fill="url(#puzzleGradient)"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1.5"
            />

            <Path
              d={createPuzzlePath(pieceSize, pieceSize, false)}
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1.5"
              strokeDasharray="4,4"
              opacity="0.4"
            />
          </G>
        </Svg>
      </View>

      <Text style={styles.debtText}>
        睡眠负债：{Math.abs(sleepDebt)}小时
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  puzzleContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  debtText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.5,
  },
});
