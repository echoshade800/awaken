import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { getRecommendedGames, getMoreGames } from '../lib/interactionOptions';

export default function GameSelector({ selectedValue, onSelect }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const recommendedGames = getRecommendedGames();
  const moreGames = getMoreGames();

  const renderGame = (game) => {
    const isSelected = selectedValue === game.value;
    return (
      <TouchableOpacity
        key={game.value}
        style={[styles.gameCard, isSelected && styles.gameCardSelected]}
        onPress={() => onSelect(game.value)}
      >
        <View style={styles.gameContent}>
          <Text style={styles.gameIcon}>{game.icon}</Text>
          <View style={styles.gameTextContainer}>
            <Text style={[styles.gameLabel, isSelected && styles.gameLabelSelected]}>
              {game.label}
            </Text>
            <Text style={[styles.gameDescription, isSelected && styles.gameDescriptionSelected]}>
              {game.description}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {recommendedGames.map(renderGame)}

      {isExpanded && moreGames.map(renderGame)}

      <TouchableOpacity
        style={styles.expandButton}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.expandButtonText}>
          {isExpanded ? '收起' : `查看更多游戏（+${moreGames.length}）`}
        </Text>
        {isExpanded ? (
          <ChevronUp size={18} color="#007AFF" />
        ) : (
          <ChevronDown size={18} color="#007AFF" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 8,
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  gameCard: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  gameCardSelected: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  gameContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gameIcon: {
    fontSize: 22,
  },
  gameTextContainer: {
    flexDirection: 'column',
    gap: 2,
    flex: 1,
  },
  gameLabel: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  gameLabelSelected: {
    color: '#FFF',
  },
  gameDescription: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '400',
  },
  gameDescriptionSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  expandButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});
