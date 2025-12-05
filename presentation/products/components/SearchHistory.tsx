import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSearch } from '../hooks/useFilters';

interface SearchHistoryProps {
  onSelectSearch: (termino: string) => void;
  maxItems?: number;
}

export const SearchHistory: React.FC<SearchHistoryProps> = ({
  onSelectSearch,
  maxItems = 5,
}) => {
  const { searchHistory, historyLoading, clearHistory } = useSearch();

  if (historyLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  }

  if (!searchHistory || searchHistory.length === 0) {
    return null;
  }

  const displayHistory = searchHistory.slice(0, maxItems);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="time-outline" size={18} color="#666" />
          <Text style={styles.headerTitle}>Búsquedas Recientes</Text>
        </View>
        <TouchableOpacity onPress={() => clearHistory()}>
          <Text style={styles.clearButton}>Limpiar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.historyList}
      >
        {displayHistory.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.historyItem}
            onPress={() => onSelectSearch(item.termino)}
            activeOpacity={0.7}
          >
            <Ionicons name="search-outline" size={16} color="#666" />
            <Text style={styles.historyText} numberOfLines={1}>
              {item.termino}
            </Text>
            {item.resultados > 0 && (
              <View style={styles.resultBadge}>
                <Text style={styles.resultText}>{item.resultados}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  clearButton: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3B30',
  },
  historyList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    gap: 6,
    maxWidth: 200,
  },
  historyText: {
    fontSize: 14,
    color: '#333',
    maxWidth: 120,
  },
  resultBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
});

