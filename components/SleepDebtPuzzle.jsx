import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';

export default function SleepDebtPuzzle({ sleepDebt = -2 }) {
  const puzzleWidth = 140;
  const puzzleHeight = 80;
  const pieceWidth = puzzleWidth / 4;
  const pieceHeight = puzzleHeight / 2;
  const cornerRadius = 4;

  const createPuzzlePiece = (col, row) => {
    const x = col * pieceWidth;
    const y = row * pieceHeight;
    const isTopLeft = col === 0 && row === 0;
    const isTopRight = col === 3 && row === 0;
    const isBottomLeft = col === 0 && row === 1;
    const isBottomRight = col === 3 && row === 1;

    let path = '';

    if (isTopLeft) {
      path = `M ${x + cornerRadius} ${y}`;
    } else {
      path = `M ${x} ${y}`;
    }

    if (isTopRight) {
      path += ` L ${x + pieceWidth - cornerRadius} ${y}`;
      path += ` Q ${x + pieceWidth} ${y} ${x + pieceWidth} ${y + cornerRadius}`;
    } else {
      path += ` L ${x + pieceWidth} ${y}`;
    }

    if (isBottomRight) {
      path += ` L ${x + pieceWidth} ${y + pieceHeight - cornerRadius}`;
      path += ` Q ${x + pieceWidth} ${y + pieceHeight} ${x + pieceWidth - cornerRadius} ${y + pieceHeight}`;
    } else {
      path += ` L ${x + pieceWidth} ${y + pieceHeight}`;
    }

    if (isBottomLeft) {
      path += ` L ${x + cornerRadius} ${y + pieceHeight}`;
      path += ` Q ${x} ${y + pieceHeight} ${x} ${y + pieceHeight - cornerRadius}`;
    } else {
      path += ` L ${x} ${y + pieceHeight}`;
    }

    if (isTopLeft) {
      path += ` L ${x} ${y + cornerRadius}`;
      path += ` Q ${x} ${y} ${x + cornerRadius} ${y}`;
    } else {
      path += ` L ${x} ${y}`;
    }

    path += ' Z';
    return path;
  };

  const pieces = [
    { col: 0, row: 0 },
    { col: 1, row: 0 },
    { col: 2, row: 0 },
    { col: 3, row: 0 },
    { col: 0, row: 1 },
    { col: 1, row: 1 },
    { col: 2, row: 1 },
    { col: 3, row: 1 },
  ];

  const missingPieceIndex = 3;

  return (
    <View style={styles.container}>
      <View style={styles.puzzleArea}>
        <View style={styles.mainPuzzle}>
          <Svg width={puzzleWidth} height={puzzleHeight} viewBox={`0 0 ${puzzleWidth} ${puzzleHeight}`}>
            <Defs>
              <LinearGradient id="puzzleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#5A9FD4" stopOpacity="1" />
                <Stop offset="100%" stopColor="#4A8FC4" stopOpacity="1" />
              </LinearGradient>
            </Defs>

            {pieces.map((piece, idx) => {
              if (idx === missingPieceIndex) {
                return (
                  <Path
                    key={idx}
                    d={createPuzzlePiece(piece.col, piece.row)}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeWidth="2"
                    strokeDasharray="6,6"
                  />
                );
              }

              return (
                <G key={idx}>
                  <Path
                    d={createPuzzlePiece(piece.col, piece.row)}
                    fill="url(#puzzleGradient)"
                  />
                  <Path
                    d={createPuzzlePiece(piece.col, piece.row)}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.4)"
                    strokeWidth="1.5"
                  />
                  <Path
                    d={createPuzzlePiece(piece.col, piece.row)}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="3"
                    style={{ filter: 'blur(2px)' }}
                  />
                </G>
              );
            })}
          </Svg>
        </View>
      </View>

      <Text style={styles.debtText}>
        Sleep Debt: {sleepDebt}h
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  puzzleArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPuzzle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderRadius: 16,
    overflow: 'hidden',
  },
  debtText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
    marginTop: 6,
  },
});
