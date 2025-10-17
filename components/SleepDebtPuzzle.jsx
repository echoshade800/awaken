import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G, Defs, LinearGradient, Stop, Text as SvgText, ClipPath, Rect } from 'react-native-svg';

export default function SleepDebtPuzzle({ sleepDebt = -2 }) {
  const puzzleWidth = 280;
  const puzzleHeight = 140;
  const pieceWidth = puzzleWidth / 4;
  const pieceHeight = puzzleHeight / 2;
  const tabSize = 12;
  const borderRadius = 16;

  const createPuzzlePiece = (col, row, hasRightTab, hasBottomTab, hasLeftSocket, hasTopSocket) => {
    const x = col * pieceWidth;
    const y = row * pieceHeight;
    const cornerRadius = 8;
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

    if (hasTopSocket) {
      path += ` L ${x + pieceWidth / 2 - tabSize} ${y}`;
      path += ` Q ${x + pieceWidth / 2} ${y - tabSize} ${x + pieceWidth / 2 + tabSize} ${y}`;
    }

    if (isTopRight) {
      path += ` L ${x + pieceWidth - cornerRadius} ${y}`;
      path += ` Q ${x + pieceWidth} ${y} ${x + pieceWidth} ${y + cornerRadius}`;
    } else {
      path += ` L ${x + pieceWidth} ${y}`;
    }

    if (hasRightTab) {
      path += ` L ${x + pieceWidth} ${y + pieceHeight / 2 - tabSize}`;
      path += ` Q ${x + pieceWidth + tabSize} ${y + pieceHeight / 2} ${x + pieceWidth} ${y + pieceHeight / 2 + tabSize}`;
    }

    if (isBottomRight) {
      path += ` L ${x + pieceWidth} ${y + pieceHeight - cornerRadius}`;
      path += ` Q ${x + pieceWidth} ${y + pieceHeight} ${x + pieceWidth - cornerRadius} ${y + pieceHeight}`;
    } else {
      path += ` L ${x + pieceWidth} ${y + pieceHeight}`;
    }

    if (hasBottomTab) {
      path += ` L ${x + pieceWidth / 2 + tabSize} ${y + pieceHeight}`;
      path += ` Q ${x + pieceWidth / 2} ${y + pieceHeight + tabSize} ${x + pieceWidth / 2 - tabSize} ${y + pieceHeight}`;
    }

    if (isBottomLeft) {
      path += ` L ${x + cornerRadius} ${y + pieceHeight}`;
      path += ` Q ${x} ${y + pieceHeight} ${x} ${y + pieceHeight - cornerRadius}`;
    } else {
      path += ` L ${x} ${y + pieceHeight}`;
    }

    if (hasLeftSocket) {
      path += ` L ${x} ${y + pieceHeight / 2 + tabSize}`;
      path += ` Q ${x - tabSize} ${y + pieceHeight / 2} ${x} ${y + pieceHeight / 2 - tabSize}`;
    }

    if (isTopLeft) {
      path += ` L ${x} ${y + cornerRadius}`;
      path += ` Q ${x} ${y} ${x + cornerRadius} ${y}`;
    } else {
      path += ` L ${x} ${y}`;
    }

    return path;
  };

  const pieces = [
    { col: 0, row: 0, rightTab: true, bottomTab: false, leftSocket: false, topSocket: false },
    { col: 1, row: 0, rightTab: false, bottomTab: true, leftSocket: true, topSocket: false },
    { col: 2, row: 0, rightTab: true, bottomTab: false, leftSocket: false, topSocket: false },
    { col: 3, row: 0, rightTab: false, bottomTab: true, leftSocket: true, topSocket: false },
    { col: 0, row: 1, rightTab: false, bottomTab: false, leftSocket: false, topSocket: false },
    { col: 1, row: 1, rightTab: true, bottomTab: false, leftSocket: false, topSocket: true },
    { col: 2, row: 1, rightTab: false, bottomTab: false, leftSocket: false, topSocket: false },
    { col: 3, row: 1, rightTab: false, bottomTab: false, leftSocket: false, topSocket: true },
  ];

  const missingPieceIndex = 3;

  return (
    <View style={styles.container}>
      <View style={styles.puzzleArea}>
        <View style={styles.mainPuzzle}>
          <Svg width={puzzleWidth + 40} height={puzzleHeight + 40} viewBox={`-20 -20 ${puzzleWidth + 40} ${puzzleHeight + 40}`}>
            <Defs>
              <LinearGradient id="puzzleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#5A9FD4" stopOpacity="1" />
                <Stop offset="100%" stopColor="#4A8FC4" stopOpacity="1" />
              </LinearGradient>

              <ClipPath id="textClip">
                {pieces.map((piece, idx) => {
                  if (idx === missingPieceIndex) return null;
                  return (
                    <Path
                      key={idx}
                      d={createPuzzlePiece(
                        piece.col,
                        piece.row,
                        piece.rightTab,
                        piece.bottomTab,
                        piece.leftSocket,
                        piece.topSocket
                      )}
                    />
                  );
                })}
              </ClipPath>
            </Defs>

            {pieces.map((piece, idx) => {
              if (idx === missingPieceIndex) {
                return (
                  <Path
                    key={idx}
                    d={createPuzzlePiece(
                      piece.col,
                      piece.row,
                      piece.rightTab,
                      piece.bottomTab,
                      piece.leftSocket,
                      piece.topSocket
                    )}
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
                    d={createPuzzlePiece(
                      piece.col,
                      piece.row,
                      piece.rightTab,
                      piece.bottomTab,
                      piece.leftSocket,
                      piece.topSocket
                    )}
                    fill="url(#puzzleGradient)"
                  />
                  <Path
                    d={createPuzzlePiece(
                      piece.col,
                      piece.row,
                      piece.rightTab,
                      piece.bottomTab,
                      piece.leftSocket,
                      piece.topSocket
                    )}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.4)"
                    strokeWidth="1.5"
                  />
                  <Path
                    d={createPuzzlePiece(
                      piece.col,
                      piece.row,
                      piece.rightTab,
                      piece.bottomTab,
                      piece.leftSocket,
                      piece.topSocket
                    )}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="3"
                    style={{ filter: 'blur(2px)' }}
                  />
                </G>
              );
            })}

            <SvgText
              x={puzzleWidth / 2}
              y={puzzleHeight / 2 + 18}
              fontSize="56"
              fontWeight="700"
              fill="rgba(220, 240, 255, 0.98)"
              textAnchor="middle"
              clipPath="url(#textClip)"
              transform={`rotate(-3, ${puzzleWidth / 2}, ${puzzleHeight / 2})`}
              letterSpacing="2"
            >
              SLEEP
            </SvgText>
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
    paddingVertical: 24,
  },
  puzzleArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPuzzle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  debtText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(200, 230, 255, 0.95)',
    letterSpacing: 0.5,
    marginTop: 8,
  },
});
